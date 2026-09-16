import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable, FlatList, StatusBar, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFreelancerDetailsForClient } from '@/api/freelancer-functions';
import { getAllProjectsForClient, getAllProjectsForFreelancer } from '@/api/project-functions';
import { createInvitation, getAllInvitationsForFreelancer } from '@/api/project-invitations-functions';
import { getAllReviewsForFreelancer } from '@/api/review-functions';
import { Spinner, Avatar } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<ClientStackParamList, 'FreelancerDetails'>;
const { width } = Dimensions.get('window');

export default function FreelancerDetailsScreen({ route, navigation }: Props) {
    const { freelancerId } = route.params;
    const { user } = userAuthStore();
    const queryClient = useQueryClient();
    const [showProjectModal, setShowProjectModal] = useState(false);

    const { data: freelancer, isLoading } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: () => getFreelancerDetailsForClient(freelancerId),
    });

    const { data: reviews, isLoading: reviewsLoading } = useQuery({
        queryKey: ['freelancer-reviews', freelancerId],
        queryFn: () => getAllReviewsForFreelancer(freelancerId),
    });

    const { data: clientProjects, isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
        queryKey: ['clientProjectsForInvite', user?.userId, freelancerId],
        queryFn: async () => {
            const projects = await getAllProjectsForClient(user!.userId);
            return projects;
        },
        enabled: !!user?.userId && showProjectModal,
        staleTime: 0,
        refetchOnMount: true,
    });

    const { data: freelancerProjects } = useQuery({
        queryKey: ['freelancerProjects', freelancerId],
        queryFn: () => getAllProjectsForFreelancer(freelancerId),
    });

    const { data: pendingInvitations } = useQuery({
        queryKey: ['freelancerInvitations', freelancerId],
        queryFn: () => getAllInvitationsForFreelancer(freelancerId),
        enabled: showProjectModal,
    });

    // Get list of project IDs where freelancer is already added
    const freelancerProjectIds = freelancerProjects?.map(item => item.project.id) || [];
    
    // Get list of project IDs where freelancer has pending invitations
    const pendingInvitationProjectIds = pendingInvitations?.map(item => item.project.id) || [];

    // Filter client projects to show status for each project
    const availableProjects = clientProjects?.map(project => {
        const isAdded = freelancerProjectIds.includes(project.id);
        const hasPendingInvitation = pendingInvitationProjectIds.includes(project.id);
        
        return {
            ...project,
            isFreelancerAdded: isAdded,
            hasPendingInvitation: hasPendingInvitation,
        };
    }) || [];

    // Refetch projects when modal opens
    useEffect(() => {
        if (showProjectModal && user?.userId) {
            refetchProjects();
        }
    }, [showProjectModal, user?.userId, refetchProjects]);

    // Debug logging
    useEffect(() => {
        if (showProjectModal) {
            
            if (availableProjects.length > 0) {
            }
        }
    }, [showProjectModal, clientProjects, freelancerProjects, pendingInvitations, availableProjects, projectsLoading, user]);

    // Chat temporarily disabled during Freelansync DB migration
    const inviteMutation = useMutation({
        mutationFn: createInvitation,
        onSuccess: (_, variables) => {
            toast.success('Invitation sent successfully!');
            setShowProjectModal(false);
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['clientProjectsForInvite', user?.userId, freelancerId] });
            queryClient.invalidateQueries({ queryKey: ['freelancerInvitations', freelancerId] });
            queryClient.invalidateQueries({ queryKey: ['projectInvitations', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
        },
        onError: (error: Error) => {
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                toast.warning('Invitation already sent to this freelancer');
            } else {
                toast.error('Failed to send invitation');
            }
        },
    });

    const handleSendMessage = async () => {
        if (!user?.userId) {
            toast.error('User not found');
            return;
        }

        try {
            // Navigate to IndividualChat screen with 'new' chatId
            // The IndividualChatScreen will check if chat already exists
            // and either open existing chat or create a new one
            navigation.navigate('IndividualChat', {
                chatId: 'new', // Will be resolved to actual chat ID in IndividualChatScreen
                freelancerId: freelancerId,
                clientId: user.userId,
                otherUserName: freelancer?.username || 'Freelancer',
                otherUserProfilePic: freelancer?.profile_pic || null,
            });
        } catch (error: any) {
            toast.error(error?.message || 'Failed to open chat');
        }
    };

    const handleInviteToProject = (projectId: string) => {
        if (!user?.userId) {
            toast.error('User not found');
            return;
        }

        inviteMutation.mutate({
            clientId: user.userId,
            projectId: projectId,
            freelancerId: freelancerId,
            clientUsername: user.username || 'Client',
        });
    };

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (!freelancer) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Freelancer not found</Text>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    // Calculate real statistics
    const averageRating = reviews && reviews.length > 0 
        ? (reviews.reduce((sum, review) => sum + (review.stars || 0), 0) / reviews.length).toFixed(1)
        : '0.0';
    
    const reviewsCount = reviews?.length || 0;
    const projectsCount = freelancerProjects?.length || 0;
    
    // Use real experience from database and format it
    const formatExperience = () => {
        const exp = freelancer.experience;
        
        // Handle null or undefined
        if (exp === null || exp === undefined) return 'N/A';
        
        // If it's a number, add "years" or "year"
        if (typeof exp === 'number') {
            return exp === 1 ? '1 Year' : `${exp} Years`;
        }
        
        // If it's a string
        if (typeof exp === 'string') {
            const trimmed = exp.trim();
            if (!trimmed) return 'N/A';
            
            // If experience already contains "year" or "years", return as is
            if (trimmed.toLowerCase().includes('year')) return trimmed;
            
            // Try to parse as number
            const num = parseFloat(trimmed);
            if (!isNaN(num)) {
                return num === 1 ? '1 Year' : `${trimmed} Years`;
            }
            
            // Otherwise return as is
            return trimmed;
        }
        
        return 'N/A';
    };
    
    const experience = formatExperience();
    

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Header Profile Section */}
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={['#0532A9', '#03206B']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                         <View style={[styles.decorativeCircle, { top: -60, right: -60, width: 240, height: 240, opacity: 0.1 }]} />
                         <View style={[styles.decorativeCircle, { bottom: 20, left: -40, width: 140, height: 140, opacity: 0.05 }]} />
                        
                        {/* Back Button */}
                        <Pressable style={styles.headerBackButton} onPress={() => navigation.goBack()}>
                             <Ionicons name="arrow-back" size={24} color="#fff" />
                        </Pressable>
                        
                        <View style={styles.profileSection}>
                            <View style={styles.avatarContainer}>
                                <Avatar 
                                    source={freelancer.profile_pic} 
                                    fallback={freelancer.username} 
                                    size={100} 
                                    style={styles.avatar}
                                />
                            </View>
                            <Text style={styles.name}>{freelancer.username}</Text>
                            <Text style={styles.role}>Freelancer</Text>
                            
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="star" size={16} color="#FBBF24" />
                                    <Text style={styles.statText}>{averageRating} ({reviewsCount})</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Ionicons name="briefcase-outline" size={16} color="#E0E7FF" />
                                    <Text style={styles.statText}>{projectsCount} {projectsCount === 1 ? 'Project' : 'Projects'}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Ionicons name="ribbon-outline" size={16} color="#E0E7FF" />
                                    <Text style={styles.statText}>Exp: {experience}</Text>
                                </View>
                            </View>

                            <View style={styles.headerActions}>
                                <Pressable 
                                    style={[styles.headerActionButton, styles.headerMessageButton]}
                                    onPress={handleSendMessage}
                                >
                                    <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                                    <Text style={styles.headerActionText}>Message</Text>
                                </Pressable>

                                <Pressable 
                                    style={[styles.headerActionButton, styles.headerInviteButton]}
                                    onPress={() => setShowProjectModal(true)}
                                >
                                    <Ionicons name="person-add-outline" size={18} color="#0532A9" />
                                    <Text style={[styles.headerActionText, { color: '#0532A9' }]}>Invite</Text>
                                </Pressable>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    
                    {/* About Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-outline" size={20} color="#0532A9" />
                            <Text style={styles.sectionTitle}>About</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.description}>
                                {freelancer.description || "No description provided."}
                            </Text>
                        </View>
                    </View>

                    {/* Domains Section */}
                    {freelancer.domains && freelancer.domains.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="grid-outline" size={20} color="#0532A9" />
                                <Text style={styles.sectionTitle}>Domains</Text>
                            </View>
                            <View style={styles.card}>
                                <View style={styles.domainsContainer}>
                                    {freelancer.domains.map((domain, index) => (
                                        <View key={index} style={styles.domainChip}>
                                            <Text style={styles.domainText}>{domain}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Skills Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="flash-outline" size={20} color="#0532A9" />
                            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
                        </View>
                        <View style={styles.card}>
                            <View style={styles.skillsContainer}>
                                {freelancer.skills && freelancer.skills.length > 0 ? (
                                    freelancer.skills.map((skill, index) => (
                                        <View key={index} style={styles.skillChip}>
                                            <Text style={styles.skillText}>{skill}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No skills listed</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Reviews Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="star-outline" size={20} color="#0532A9" />
                            <Text style={styles.sectionTitle}>Reviews</Text>
                        </View>
                        
                        {reviewsLoading ? (
                            <View style={styles.card}>
                                <Spinner />
                            </View>
                        ) : reviews && reviews.length > 0 ? (
                            <View style={styles.reviewsContainer}>
                                {reviews.filter(review => review && review.client && review.comment).map((review) => (
                                    <View key={review.id} style={styles.reviewCard}>
                                        {/* Review Header */}
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.reviewerInfo}>
                                                <Avatar 
                                                    source={review.client?.profile_pic} 
                                                    fallback={review.client?.username || 'User'} 
                                                    size={40} 
                                                />
                                                <View style={styles.reviewerDetails}>
                                                    <Text style={styles.reviewerName}>{review.client?.username || 'Anonymous'}</Text>
                                                    <Text style={styles.reviewDate}>
                                                        {new Date(review.created_at).toLocaleDateString('en-US', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            {/* Star Rating */}
                                            <View style={styles.starsRow}>
                                                {[...Array(review.stars || 0)].map((_, i) => (
                                                    <Ionicons key={i} name="star" size={16} color="#F59E0B" />
                                                ))}
                                                {[...Array(Math.max(0, 5 - (review.stars || 0)))].map((_, i) => (
                                                    <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#D1D5DB" />
                                                ))}
                                            </View>
                                        </View>
                                        
                                        {/* Review Comment */}
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.card}>
                                <View style={styles.emptyReviews}>
                                    <Ionicons name="star-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyReviewsTitle}>No Reviews Yet</Text>
                                    <Text style={styles.emptyReviewsText}>
                                        This freelancer hasn't received any reviews yet.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* Project Selection Modal */}
            <Modal
                visible={showProjectModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProjectModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select a Project</Text>
                            <Pressable onPress={() => setShowProjectModal(false)}>
                                <Ionicons name="close-circle" size={28} color="#6B7280" />
                            </Pressable>
                        </View>

                        {projectsLoading ? (
                            <View style={styles.loadingContainer}>
                                <Spinner />
                                <Text style={styles.loadingText}>Loading projects...</Text>
                            </View>
                        ) : !clientProjects || clientProjects.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No projects available</Text>
                                <Text style={styles.emptySubtext}>Create a project first to invite freelancers</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={availableProjects}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.projectList}
                                showsVerticalScrollIndicator={true}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                                        <Text style={styles.emptyText}>No projects found</Text>
                                    </View>
                                )}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={[
                                            styles.projectCard,
                                            (item.isFreelancerAdded || item.hasPendingInvitation || item.status === 'COMPLETED' || item.status === 'DISPUTED') && styles.projectCardDisabled
                                        ]}
                                        onPress={() => 
                                            !item.isFreelancerAdded && 
                                            !item.hasPendingInvitation && 
                                            item.status !== 'COMPLETED' && 
                                            item.status !== 'DISPUTED' && 
                                            handleInviteToProject(item.id)
                                        }
                                        disabled={
                                            item.isFreelancerAdded || 
                                            item.hasPendingInvitation || 
                                            item.status === 'COMPLETED' || 
                                            item.status === 'DISPUTED' || 
                                            inviteMutation.isPending
                                        }
                                    >
                                        <View style={styles.projectHeader}>
                                            <View style={[
                                                styles.projectIcon,
                                                (item.status === 'COMPLETED' || item.status === 'DISPUTED') && { backgroundColor: '#F3F4F6' }
                                            ]}>
                                                <Ionicons 
                                                    name={
                                                        item.status === 'COMPLETED' ? "checkmark-done-circle" :
                                                        item.status === 'DISPUTED' ? "alert-circle" :
                                                        item.isFreelancerAdded ? "checkmark-circle" : 
                                                        item.hasPendingInvitation ? "time-outline" : 
                                                        "briefcase-outline"
                                                    } 
                                                    size={24} 
                                                    color={
                                                        item.status === 'COMPLETED' ? "#9CA3AF" :
                                                        item.status === 'DISPUTED' ? "#EF4444" :
                                                        item.isFreelancerAdded ? "#10B981" : 
                                                        item.hasPendingInvitation ? "#F59E0B" : 
                                                        "#0532A9"
                                                    } 
                                                />
                                            </View>
                                            <View style={styles.projectInfo}>
                                                <Text style={[
                                                    styles.projectTitle,
                                                    (item.status === 'COMPLETED' || item.status === 'DISPUTED') && { color: '#6B7280' }
                                                ]} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.projectBudget}>
                                                    Rs {item.budget.toLocaleString()}
                                                </Text>
                                            </View>
                                            
                                            {/* Status Badges */}
                                            {item.status === 'COMPLETED' ? (
                                                <View style={[styles.addedBadge, { backgroundColor: '#F3F4F6' }]}>
                                                    <Text style={[styles.addedBadgeText, { color: '#6B7280' }]}>Completed</Text>
                                                </View>
                                            ) : item.status === 'DISPUTED' ? (
                                                <View style={[styles.addedBadge, { backgroundColor: '#FEF2F2' }]}>
                                                    <Text style={[styles.addedBadgeText, { color: '#EF4444' }]}>Disputed</Text>
                                                </View>
                                            ) : item.isFreelancerAdded ? (
                                                <View style={styles.addedBadge}>
                                                    <Text style={styles.addedBadgeText}>Added</Text>
                                                </View>
                                            ) : item.hasPendingInvitation ? (
                                                <View style={styles.pendingBadge}>
                                                    <Text style={styles.pendingBadgeText}>Pending</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </Pressable>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40, 
    },
    headerContainer: {
        marginBottom: 20,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        position: 'relative',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerBackButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 60,
    },
    avatar: {
        borderWidth: 2,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    role: {
        fontSize: 16,
        color: '#E0E7FF',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    headerActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    headerMessageButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerInviteButton: {
        backgroundColor: '#fff',
    },
    headerActionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    mainContent: {
        paddingHorizontal: 20,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    domainsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    domainChip: {
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    domainText: {
        color: '#6B21A8',
        fontSize: 14,
        fontWeight: '600',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    skillText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontStyle: 'italic',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    actionButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    messageButton: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    messageButtonText: {
        color: '#0532A9',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inviteButton: {
        backgroundColor: '#0532A9',
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    inviteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        height: '80%',
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    projectList: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    projectCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    projectCardDisabled: {
        opacity: 0.6,
        backgroundColor: '#F3F4F6',
    },
    projectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    projectIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    projectInfo: {
        flex: 1,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    projectBudget: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    addedBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    addedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#D97706',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#EF4444',
        marginVertical: 16,
        fontWeight: '600',
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    // Reviews Styles
    reviewsContainer: {
        gap: 12,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    reviewerDetails: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    emptyReviews: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyReviewsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyReviewsText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 250,
    },
});
