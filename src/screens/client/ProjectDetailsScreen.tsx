import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Dimensions, Platform, Modal, TextInput, ActivityIndicator, Animated, KeyboardAvoidingView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectDetailsById, markProjectAsCompleted, deleteProject } from '@/api/project-functions';
import { getAllFreelancers } from '@/api/freelancer-functions';
import { createInvitation, getAllInvitationsForProject, deleteInvitation } from '@/api/project-invitations-functions';
import { getAllMilestonesForProject } from '@/api/milestone-functions';
import { getFreelancerRecommendations, type RecommendedFreelancer } from '@/api/recommendation-functions';
import { getFreelancerAverageRating } from '@/api/review-functions';
import { Spinner, Card, Button, Avatar, Empty } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { toast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ReviewModal } from '@/components/ReviewModal';
import { supabaseClient } from '@/config/supabase';

type Props = NativeStackScreenProps<ClientStackParamList, 'ProjectDetails'>;

export default function ProjectDetailsScreen({ route, navigation }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'info' | 'freelancers' | 'milestones'>('info');
    
    // AI Recommendation states
    const [showAIModal, setShowAIModal] = useState(false);
    const [numRecommendations, setNumRecommendations] = useState('5');
    const [isSearching, setIsSearching] = useState(false);
    const [recommendedFreelancers, setRecommendedFreelancers] = useState<RecommendedFreelancer[]>([]);

    const { data: project, isLoading, isError } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectDetailsById(projectId),
    });

    const { data: allFreelancers, isLoading: freelancersLoading } = useQuery({
        queryKey: ['allFreelancers'],
        queryFn: getAllFreelancers,
        enabled: activeTab === 'freelancers',
    });

    // Fetch pending invitations for this project
    const { data: pendingInvitations, isLoading: invitationsLoading } = useQuery({
        queryKey: ['projectInvitations', projectId],
        queryFn: () => getAllInvitationsForProject(projectId),
        enabled: activeTab === 'freelancers',
    });

    // Fetch milestones for this project
    const { data: milestones, isLoading: milestonesLoading } = useQuery({
        queryKey: ['get-all-milestones-for-project', projectId],
        queryFn: async () => {
            const result = await getAllMilestonesForProject(projectId);
            console.log('[ProjectDetails] Milestones fetched:', result);
            return result;
        },
        enabled: activeTab === 'milestones',
        refetchInterval: 5000, // Poll every 5s for updates
    });

    // Complete Project Mutation - MUST BE BEFORE EARLY RETURNS
    const completeProjectMutation = useMutation({
        mutationFn: markProjectAsCompleted,
        onSuccess: (success) => {
            console.log('[Complete Project] Mutation success, result:', success);
            if (!success) {
                toast.warning('Cannot mark project as completed. Some milestones are not completed yet.');
            } else {
                toast.success('Project marked as completed successfully!');
                
                // Invalidate project details
                queryClient.invalidateQueries({
                    queryKey: ['project', projectId],
                });
                
                // Invalidate client profile to update wallet balance (for refund)
                if (user?.userId) {
                    queryClient.invalidateQueries({
                        queryKey: ['clientProfile', user.userId],
                    });
                }
            }
        },
        onError: (error: Error) => {
            console.error('[Complete Project] Mutation error:', error);
            toast.error(`Failed to complete project: ${error.message}`);
        },
    });

    // Delete Project Mutation - MUST BE BEFORE EARLY RETURNS
    const deleteProjectMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            console.log('[Delete Project] Mutation success');
            toast.success('Project deleted successfully! Budget refunded to your wallet.');
            
            // Invalidate queries
            if (user?.userId) {
                queryClient.invalidateQueries({
                    queryKey: ['clientProjects', user.userId],
                });
                queryClient.invalidateQueries({
                    queryKey: ['clientProfile', user.userId],
                });
            }
            
            // Navigate back to dashboard
            navigation.goBack();
        },
        onError: (error: Error) => {
            console.error('[Delete Project] Mutation error:', error);
            toast.error(`Failed to delete project: ${error.message}`);
        },
    });

    // Realtime subscription for hired freelancers and invitation changes
    useEffect(() => {
        if (!projectId) return;

        console.log('[ProjectDetails] Setting up realtime subscription for project freelancers:', projectId);

        const channel = supabaseClient
            .channel(`project_updates_${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'project_and_freelancer_link',
                    filter: `project=eq.${projectId}`,
                },
                (payload) => {
                    console.log('[ProjectDetails] New freelancer hired:', payload);
                    // Invalidate project query to refetch with new freelancer
                    queryClient.invalidateQueries({
                        queryKey: ['project', projectId],
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'invitations',
                    filter: `project=eq.${projectId}`,
                },
                (payload) => {
                    console.log('[ProjectDetails] Invitation deleted (accepted or rejected):', payload);
                    // Invalidate invitations query to update the list
                    queryClient.invalidateQueries({
                        queryKey: ['projectInvitations', projectId],
                    });
                }
            )
            .subscribe((status) => {
                console.log('[ProjectDetails] Subscription status:', status);
            });

        // Cleanup function
        return () => {
            console.log('[ProjectDetails] Cleaning up realtime subscription');
            supabaseClient.removeChannel(channel);
        };
    }, [projectId, queryClient]);

    // Early returns AFTER all hooks
    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (isError || !project) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
                <Text style={styles.errorText}>Error in getting project detailed data</Text>
            </View>
        );
    }

    // Filter out already added freelancers
    const addedFreelancerIds = project.project_and_freelancer_link.map(
        (item) => item.freelancer.id
    );
    
    // Get IDs of freelancers with pending invitations
    const pendingInvitationIds = pendingInvitations?.map((inv) => inv.freelancer.id) || [];
    
    // Filter out both added freelancers and those with pending invitations
    const availableFreelancers = allFreelancers?.filter(
        (freelancer) => !addedFreelancerIds.includes(freelancer.id) && 
                        !pendingInvitationIds.includes(freelancer.id)
    ) || [];

    // Create a map of freelancer ID to invitation ID for quick lookup
    const invitationMap = new Map(
        pendingInvitations?.map((inv) => [inv.freelancer.id, inv.id]) || []
    );

    const formattedDate = new Date(project.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const handleCompleteProject = () => {
        console.log('[Complete Project] Button clicked, projectId:', projectId);
        console.log('[Complete Project] isProjectCompleted:', isProjectCompleted);
        console.log('[Complete Project] Milestones count:', milestones?.length);
        
        // TEMPORARY: Call API directly without alert for testing
        console.log('[Complete Project] Calling mutation directly (no alert)...');
        completeProjectMutation.mutate({ projectId });
    };

    const handleDeleteProject = () => {
        Alert.alert(
            'Delete Project',
            'Are you sure you want to delete this project? The budget will be refunded to your wallet. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        console.log('[Delete Project] User confirmed, calling mutation...');
                        deleteProjectMutation.mutate({ 
                            projectId, 
                            clientId: user?.userId || '' 
                        });
                    },
                },
            ]
        );
    };

    const isProjectCompleted = project.status === 'COMPLETED';
    const isProjectDisputed = project.status === 'DISPUTED';
    const isProjectDraft = project.status === 'DRAFT';
    
    // Debug logging - only when milestones tab is active
    if (activeTab === 'milestones') {
        console.log('============= PROJECT COMPLETION DEBUG =============');
        console.log('[ProjectDetails] Project ID:', projectId);
        console.log('[ProjectDetails] Project status:', project.status);
        console.log('[ProjectDetails] isProjectCompleted:', isProjectCompleted);
        console.log('[ProjectDetails] Total Milestones:', milestones?.length);
        console.log('[ProjectDetails] Completed Milestones:', milestones?.filter(m => m.status === 'COMPLETED').length);
        console.log('[ProjectDetails] All milestone statuses:', milestones?.map(m => m.status).join(', '));
        console.log('[ProjectDetails] Should show complete button:', !isProjectCompleted && milestones && milestones.length > 0);
        console.log('====================================================');
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <LinearGradient
                    colors={['#0532A9', '#03206B']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.patternOverlay}>
                        <View style={styles.decorativeCircle1} />
                        <View style={styles.decorativeCircle2} />
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{project.title}</Text>
                        
                        <View style={styles.headerMetaRow}>
                            <View style={styles.headerMetaItem}>
                                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.headerMetaText}>Posted {formattedDate}</Text>
                            </View>
                            <View style={styles.headerDivider} />
                            <View style={styles.headerMetaItem}>
                                <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.headerMetaText}>{project.project_and_freelancer_link.length} Hired</Text>
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="wallet-outline" size={20} color="#0532A9" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.statLabel}>Budget</Text>
                                    <Text style={styles.statValue}>${project.budget?.toLocaleString() || '0'}</Text>
                                    <Text style={[styles.statLabel, { fontSize: 10, marginTop: 2 }]}>
                                        Original: ${project.original_budget?.toLocaleString() || '0'}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.verticalDivider} />
                            
                            <Pressable 
                                style={styles.statItem}
                                onPress={() => navigation.navigate('PendingInvitations', { projectId })}
                            >
                                <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                                    <Ionicons name="mail-unread-outline" size={20} color="#0532A9" />
                                </View>
                                <View>
                                    <Text style={styles.statLabel}>Invites</Text>
                                    <Text style={styles.statValue}>View All</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{marginLeft: 4}} />
                            </Pressable>
                        </View>

                        {/* Project Chat Button - Only show if project has freelancers */}
                        {project.project_and_freelancer_link.length > 0 && (
                            <Pressable 
                                style={styles.chatButton}
                                onPress={() => navigation.navigate('ProjectChat', { projectId })}
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#EFF6FF']}
                                    style={styles.chatButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="chatbubbles" size={20} color="#0532A9" />
                                    <Text style={[styles.chatButtonText, { color: '#0532A9' }]}>Open Project Chat</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#0532A9" />
                                </LinearGradient>
                            </Pressable>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.mainContent}>
                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
                        {['Info', 'Freelancers', 'Milestones'].map((tab) => {
                            const tabKey = tab.toLowerCase() as typeof activeTab;
                            const isActive = activeTab === tabKey;
                            return (
                                <Pressable
                                    key={tab}
                                    style={[styles.tab, isActive && styles.activeTab]}
                                    onPress={() => setActiveTab(tabKey)}
                                >
                                    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                        {tab}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <View style={styles.tabContent}>
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="document-text-outline" size={20} color="#0532A9" />
                                    <Text style={styles.sectionTitle}>Description</Text>
                                </View>
                                <Text style={styles.description}>{project.description}</Text>
                            </View>

                            {project.domains && project.domains.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="grid-outline" size={20} color="#0532A9" />
                                        <Text style={styles.sectionTitle}>Project Domains</Text>
                                    </View>
                                    <View style={styles.domainsContainer}>
                                        {project.domains.map((domain, index) => (
                                            <View key={index} style={styles.domainChipLarge}>
                                                <Text style={styles.domainTextLarge}>{domain}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="ribbon-outline" size={20} color="#0532A9" />
                                    <Text style={styles.sectionTitle}>Required Skills</Text>
                                </View>
                                <View style={styles.skillsContainer}>
                                    {project.skills.map((skill, index) => (
                                        <View key={index} style={styles.skillChip}>
                                            <Text style={styles.skillText}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="person-outline" size={20} color="#0532A9" />
                                    <Text style={styles.sectionTitle}>Project Client</Text>
                                </View>
                                <View style={styles.clientCard}>
                                    <View style={styles.clientInfo}>
                                        <Avatar 
                                            source={project.client.profile_pic} 
                                            fallback={project.client.username} 
                                            size={50} 
                                        />
                                        <View style={styles.clientDetails}>
                                            <Text style={styles.clientName}>{project.client.username}</Text>
                                            <Text style={styles.clientRole}>Client • Owner</Text>
                                        </View>
                                    </View>
                                    <Button
                                        title={user?.userId === project.client.id ? 'Me' : 'View'}
                                        onPress={() => {
                                            if (user?.userId === project.client.id) {
                                                navigation.navigate('ClientProfile');
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        style={{ minWidth: 70 }}
                                    />
                                </View>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="people-outline" size={20} color="#0532A9" />
                                    <Text style={styles.sectionTitle}>Hired Freelancers</Text>
                                </View>
                                {project.project_and_freelancer_link.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyStateText}>No freelancers hired yet.</Text>
                                        <Pressable onPress={() => setActiveTab('freelancers')}>
                                            <Text style={styles.emptyStateAction}>Browse Freelancers</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <View style={styles.freelancersList}>
                                        {project.project_and_freelancer_link.map((item) => (
                                            <FreelancerCard
                                                key={item.freelancer.id}
                                                freelancer={item.freelancer}
                                                navigation={navigation}
                                                user={user}
                                                showInviteButton={false}
                                                showReviewButton={true}
                                                projectId={projectId}
                                                projectTitle={project.title}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Freelancers Tab */}
                    {activeTab === 'freelancers' && (
                        <View style={styles.tabContent}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="search-outline" size={20} color="#0532A9" />
                                <Text style={styles.sectionTitle}>Find Talent</Text>
                            </View>
                            
                            {/* AI Search Button */}
                            <Pressable
                                style={styles.aiSearchButton}
                                onPress={() => {
                                    console.log('[AI Button] Opening AI modal...');
                                    setShowAIModal(true);
                                }}
                            >
                                <LinearGradient
                                    colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.aiButtonGradient}
                                >
                                    <View style={styles.aiButtonContent}>
                                        <View style={styles.aiIconContainer}>
                                            <Ionicons name="sparkles" size={22} color="#FFFFFF" />
                                        </View>
                                        <View style={styles.aiButtonTextContainer}>
                                            <Text style={styles.aiButtonTitle}>Search with AI</Text>
                                            <Text style={styles.aiButtonSubtitle}>Get smart recommendations</Text>
                                        </View>
                                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                    </View>
                                </LinearGradient>
                            </Pressable>
                            
                            {freelancersLoading || invitationsLoading ? (
                                <Spinner />
                            ) : availableFreelancers.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="sad-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyStateText}>No new freelancers found.</Text>
                                </View>
                            ) : (
                                <View style={styles.freelancersList}>
                                    {availableFreelancers.map((freelancer) => (
                                        <FreelancerCard
                                            key={freelancer.id}
                                            freelancer={freelancer}
                                            navigation={navigation}
                                            user={user}
                                            showInviteButton={!isProjectCompleted && !isProjectDisputed}
                                            projectId={projectId}
                                            invitationId={invitationMap.get(freelancer.id)}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Milestones Tab */}
                    {activeTab === 'milestones' && (
                        <View style={styles.tabContent}>
                            {/* Summary Cards */}
                            <View style={styles.milestonesSummaryContainer}>
                                <View style={styles.summaryCard}>
                                    <View style={[styles.summaryIconContainer, { backgroundColor: '#DBEAFE' }]}>
                                        <Ionicons name="file-tray-full" size={20} color="#2563EB" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryValue}>{milestones?.length || 0}</Text>
                                        <Text style={styles.summaryLabel}>Total</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryCard}>
                                    <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3C7' }]}>
                                        <Ionicons name="time" size={20} color="#D97706" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryValue}>
                                            {milestones?.filter(m => m.status === 'IN_PROGRESS').length || 0}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Active</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryCard}>
                                    <View style={[styles.summaryIconContainer, { backgroundColor: '#D1FAE5' }]}>
                                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryValue}>
                                            {milestones?.filter(m => m.status === 'COMPLETED').length || 0}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Completed</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionButtonsContainer}>
                                {isProjectDisputed && (
                                    <View style={[styles.completedBadge, { backgroundColor: '#FEF2F2' }]}>
                                        <Ionicons name="alert-circle" size={24} color="#DC2626" />
                                        <Text style={[styles.completedBadgeText, { color: '#DC2626' }]}>Project Disputed - Actions Locked</Text>
                                    </View>
                                )}

                                {/* Delete Project Button - Only for DRAFT status */}
                                {isProjectDraft && (
                                    <Button
                                        title="Delete Project"
                                        onPress={handleDeleteProject}
                                        loading={deleteProjectMutation.isPending}
                                        style={styles.deleteProjectButton}
                                        textStyle={{ fontWeight: '600' }}
                                    />
                                )}

                                {/* Create Milestone Button */}
                                {project.project_and_freelancer_link.length > 0 && !isProjectCompleted && !isProjectDisputed && !isProjectDraft && (
                                    <Button
                                        title="Create Milestone"
                                        onPress={() => navigation.navigate('CreateMilestone', { projectId })}
                                        style={styles.createMilestoneButton}
                                        textStyle={{ fontWeight: '600' }}
                                    />
                                )}

                                {/* Complete Project Button */}
                                {!isProjectCompleted && !isProjectDisputed && !isProjectDraft && milestones && milestones.length > 0 && (
                                    <Button
                                        title="Mark Project as Completed"
                                        onPress={handleCompleteProject}
                                        loading={completeProjectMutation.isPending}
                                        style={styles.completeProjectButton}
                                        textStyle={{ fontWeight: '600' }}
                                    />
                                )}

                                {/* Project Completed Badge */}
                                {isProjectCompleted && (
                                    <View style={styles.completedBadge}>
                                        <Ionicons name="checkmark-circle" size={24} color="#059669" />
                                        <Text style={styles.completedBadgeText}>Project Completed</Text>
                                    </View>
                                )}
                            </View>

                            {/* Milestones List */}
                            <View style={styles.sectionHeader}>
                                <Ionicons name="flag-outline" size={20} color="#0532A9" />
                                <Text style={styles.sectionTitle}>All Milestones</Text>
                            </View>

                            {milestonesLoading ? (
                                <Spinner />
                            ) : !milestones || milestones.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="flag-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyStateText}>
                                        {project.project_and_freelancer_link.length === 0
                                            ? 'Hire freelancers first to create milestones.'
                                            : 'No milestones created yet.'}
                                    </Text>
                                    {project.project_and_freelancer_link.length > 0 && (
                                        <Pressable onPress={() => navigation.navigate('CreateMilestone', { projectId })}>
                                            <Text style={styles.emptyStateAction}>Create First Milestone</Text>
                                        </Pressable>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.milestonesList}>
                                    {milestones.map((milestone) => (
                                        <Pressable
                                            key={milestone.id}
                                            style={styles.milestoneCard}
                                            onPress={() => navigation.navigate('MilestoneDetails', { milestoneId: milestone.id })}
                                        >
                                            <View style={styles.milestoneHeader}>
                                                <View style={styles.milestoneInfo}>
                                                    <Text style={styles.milestoneTitle} numberOfLines={1}>
                                                        {milestone.title}
                                                    </Text>
                                                    <Text style={styles.milestoneAmount}>${milestone.amount}</Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.milestoneStatusBadge,
                                                        milestone.status === 'LOCKED' && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                                                        milestone.status === 'IN_PROGRESS' && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                                                        milestone.status === 'SUBMITTED' && { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' },
                                                        milestone.status === 'COMPLETED' && { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
                                                        milestone.status === 'DISPUTED' && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
                                                    ]}
                                                >
                                                    <Ionicons 
                                                        name={
                                                            milestone.status === 'LOCKED' ? 'lock-closed' :
                                                            milestone.status === 'IN_PROGRESS' ? 'time' :
                                                            milestone.status === 'SUBMITTED' ? 'cloud-upload' :
                                                            milestone.status === 'COMPLETED' ? 'checkmark-circle' :
                                                            'alert-circle'
                                                        }
                                                        size={12}
                                                        color={
                                                            milestone.status === 'LOCKED' ? '#DC2626' :
                                                            milestone.status === 'IN_PROGRESS' ? '#D97706' :
                                                            milestone.status === 'SUBMITTED' ? '#2563EB' :
                                                            milestone.status === 'COMPLETED' ? '#059669' :
                                                            '#DC2626'
                                                        }
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.milestoneStatusText,
                                                            milestone.status === 'LOCKED' && { color: '#DC2626' },
                                                            milestone.status === 'IN_PROGRESS' && { color: '#D97706' },
                                                            milestone.status === 'SUBMITTED' && { color: '#2563EB' },
                                                            milestone.status === 'COMPLETED' && { color: '#059669' },
                                                            milestone.status === 'DISPUTED' && { color: '#DC2626' },
                                                        ]}
                                                    >
                                                        {milestone.status === 'LOCKED' && 'LOCKED'}
                                                        {milestone.status === 'IN_PROGRESS' && 'IN PROGRESS'}
                                                        {milestone.status === 'SUBMITTED' && 'SUBMITTED'}
                                                        {milestone.status === 'COMPLETED' && 'COMPLETED'}
                                                        {milestone.status === 'DISPUTED' && 'DISPUTED'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.milestoneFooter}>
                                                <View style={styles.freelancerInfo}>
                                                    <Avatar
                                                        source={milestone.freelancer?.profile_pic}
                                                        fallback={milestone.freelancer?.username || 'N/A'}
                                                        size={24}
                                                    />
                                                    <Text style={styles.freelancerName}>{milestone.freelancer?.username || 'Unassigned'}</Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* AI Recommendation Modal */}
            {showAIModal && project && (
                <AIRecommendationModal
                    visible={showAIModal}
                    onClose={() => {
                        setShowAIModal(false);
                        setRecommendedFreelancers([]);
                        setIsSearching(false);
                        setNumRecommendations('5');
                    }}
                    projectSkills={Array.isArray(project.skills) ? project.skills : []}
                    numRecommendations={numRecommendations}
                    setNumRecommendations={setNumRecommendations}
                    isSearching={isSearching}
                    recommendedFreelancers={recommendedFreelancers}
                    onSearch={async () => {
                        const numValue = parseInt(numRecommendations);
                        if (!numRecommendations || isNaN(numValue) || numValue < 1) {
                            toast.error('Please enter a valid number (minimum 1)');
                            return;
                        }

                        try {
                            setIsSearching(true);
                            setRecommendedFreelancers([]);
                            
                            const skills = project?.skills || [];
                            if (skills.length === 0) {
                                toast.warning('No skills defined for this project');
                                setIsSearching(false);
                                return;
                            }

                            console.log('[AI Search] Starting with skills:', skills, 'count:', numValue);
                            
                            const response = await getFreelancerRecommendations(skills, numValue);
                            
                            console.log('[AI Search] Response:', response);
                            
                            setRecommendedFreelancers(response.recommended_freelancers || []);
                            
                            if (!response.recommended_freelancers || response.recommended_freelancers.length === 0) {
                                toast.info('No matching freelancers found');
                            } else {
                                toast.success(`Found ${response.recommended_freelancers.length} freelancer${response.recommended_freelancers.length > 1 ? 's' : ''}!`);
                            }
                        } catch (error: any) {
                            console.error('[AI Search] Error:', error);
                            const errorMessage = error?.message || 'Failed to get recommendations';
                            toast.error(errorMessage);
                        } finally {
                            setIsSearching(false);
                        }
                    }}
                    navigation={navigation}
                    user={user}
                    projectId={projectId}
                />
            )}
        </View>
    );
}

// AI Recommendation Modal Component
type AIRecommendationModalProps = {
    visible: boolean;
    onClose: () => void;
    projectSkills: string[];
    numRecommendations: string;
    setNumRecommendations: (val: string) => void;
    isSearching: boolean;
    recommendedFreelancers: RecommendedFreelancer[];
    onSearch: () => void;
    navigation: any;
    user: any;
    projectId: string;
};

function AIRecommendationModal({
    visible,
    onClose,
    projectSkills,
    numRecommendations,
    setNumRecommendations,
    isSearching,
    recommendedFreelancers,
    onSearch,
    navigation,
    user,
    projectId,
}: AIRecommendationModalProps) {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (isSearching) {
            // Pulse animation
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();

            // Rotation animation
            const rotateAnimation = Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                })
            );
            rotateAnimation.start();

            return () => {
                pulseAnimation.stop();
                rotateAnimation.stop();
            };
        } else {
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [isSearching, pulseAnim, rotateAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <Pressable style={styles.modalOverlay} onPress={onClose}>
                    <Pressable style={styles.aiModalContainer} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <LinearGradient
                            colors={['#8B5CF6', '#6366F1']}
                            style={styles.aiModalHeader}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.aiModalHeaderContent}>
                                <View style={styles.aiModalTitleRow}>
                                    <Ionicons name="sparkles" size={28} color="#FFFFFF" />
                                    <Text style={styles.aiModalTitle}>AI Recommendation</Text>
                                </View>
                                <Pressable onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={28} color="#FFFFFF" />
                                </Pressable>
                            </View>
                            <Text style={styles.aiModalSubtitle}>
                                Get smart freelancer recommendations powered by AI
                            </Text>
                        </LinearGradient>

                        <ScrollView 
                            style={styles.aiModalContent} 
                            contentContainerStyle={styles.aiModalContentContainer}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                        >
                        {/* Project Skills Display */}
                        <View style={styles.skillsSection}>
                            <Text style={styles.skillsSectionTitle}>Project Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {projectSkills && projectSkills.length > 0 ? (
                                    projectSkills.map((skill, index) => (
                                        <View key={`skill-${index}-${skill}`} style={styles.skillChip}>
                                            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                                            <Text style={styles.skillChipText}>{skill}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noSkillsText}>No skills specified for this project</Text>
                                )}
                            </View>
                        </View>

                        {/* Number Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>
                                Number of Freelancers
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                                style={styles.numberInput}
                                value={numRecommendations}
                                onChangeText={setNumRecommendations}
                                keyboardType="number-pad"
                                placeholder="Enter number (e.g., 5)"
                                placeholderTextColor="#94A3B8"
                                editable={!isSearching}
                            />
                        </View>

                        {/* Search Button */}
                        <Pressable
                            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                            onPress={onSearch}
                            disabled={isSearching}
                        >
                            <LinearGradient
                                colors={isSearching ? ['#94A3B8', '#64748B'] : ['#8B5CF6', '#6366F1']}
                                style={styles.searchButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isSearching ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="search" size={20} color="#FFFFFF" />
                                        <Text style={styles.searchButtonText}>Search Now</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>

                        {/* AI Animation */}
                        {isSearching && (
                            <View style={styles.aiAnimationContainer}>
                                <Animated.View
                                    style={[
                                        styles.aiAnimationCircle,
                                        {
                                            transform: [{ scale: pulseAnim }, { rotate: spin }],
                                        },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                                        style={styles.aiGradientCircle}
                                    >
                                        <Ionicons name="sparkles" size={48} color="#FFFFFF" />
                                    </LinearGradient>
                                </Animated.View>
                                <Text style={styles.aiAnimationText}>Analyzing skills & matching freelancers...</Text>
                                <View style={styles.loadingDotsContainer}>
                                    <View style={[styles.loadingDot, styles.loadingDot1]} />
                                    <View style={[styles.loadingDot, styles.loadingDot2]} />
                                    <View style={[styles.loadingDot, styles.loadingDot3]} />
                                </View>
                            </View>
                        )}

                        {/* Results */}
                        {!isSearching && recommendedFreelancers.length > 0 && (
                            <View style={styles.resultsSection}>
                                <View style={styles.resultHeader}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                    <Text style={styles.resultHeaderText}>
                                        Found {recommendedFreelancers.length} Recommended Freelancers
                                    </Text>
                                </View>

                                {recommendedFreelancers.map((freelancer, index) => (
                                    <Pressable
                                        key={`rec-${freelancer.id}-${index}`}
                                        style={styles.recommendedCard}
                                        onPress={() => {
                                            onClose();
                                            navigation.navigate('FreelancerDetails', { freelancerId: freelancer.id });
                                        }}
                                    >
                                        <View style={styles.rankBadge}>
                                            <Text style={styles.rankText}>#{index + 1}</Text>
                                        </View>
                                        
                                        <View style={styles.recommendedCardContent}>
                                            <Avatar
                                                source={freelancer.profile_pic || undefined}
                                                fallback={freelancer.username}
                                                size={56}
                                            />
                                            <View style={styles.recommendedInfo}>
                                                <Text style={styles.recommendedName} numberOfLines={1}>
                                                    {freelancer.username}
                                                </Text>
                                                <Text style={styles.recommendedHeadline} numberOfLines={1}>
                                                    {freelancer.headline || 'Professional Freelancer'}
                                                </Text>
                                                <View style={styles.recommendedStats}>
                                                    <View style={styles.statItem}>
                                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                                        <Text style={styles.statText}>
                                                            {freelancer.rating?.toFixed(1) || 'N/A'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statItem}>
                                                        <Ionicons name="ribbon" size={14} color="#8B5CF6" />
                                                        <Text style={styles.statText}>
                                                            {(freelancer.similarity_score * 100).toFixed(0)}% Match
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Skills */}
                                        {freelancer.skills && Array.isArray(freelancer.skills) && freelancer.skills.length > 0 && (
                                            <View style={styles.recommendedSkills}>
                                                {freelancer.skills.slice(0, 3).map((skill, idx) => (
                                                    <View key={`${freelancer.id}-skill-${idx}-${skill}`} style={styles.miniSkillChip}>
                                                        <Text style={styles.miniSkillText}>{skill}</Text>
                                                    </View>
                                                ))}
                                                {freelancer.skills.length > 3 && (
                                                    <Text style={styles.moreSkillsText}>+{freelancer.skills.length - 3} more</Text>
                                                )}
                                            </View>
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        <View style={{ height: 20 }} />
                    </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Freelancer Card Component
type FreelancerCardProps = {
    freelancer: any;
    navigation: any;
    user: any;
    showInviteButton: boolean;
    projectId?: string;
    invitationId?: string;
    showReviewButton?: boolean;
    projectTitle?: string;
};

function FreelancerCard({ freelancer, navigation, user, showInviteButton, projectId, invitationId, showReviewButton = false, projectTitle = '' }: FreelancerCardProps) {
    const queryClient = useQueryClient();
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Fetch average rating for this freelancer
    const { data: ratingData } = useQuery({
        queryKey: ['freelancerRating', freelancer.id],
        queryFn: () => getFreelancerAverageRating(freelancer.id),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const { mutate: sendInvite, isPending: invitePending } = useMutation({
        mutationFn: createInvitation,
        onSuccess: () => {
            toast.success('Invitation sent successfully');
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projectInvitations', projectId] });
            queryClient.invalidateQueries({ queryKey: ['allFreelancers'] });
        },
        onError: (error: Error) => {
            console.error('Error sending invitation:', error.message);
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                toast.warning('Freelancer is already invited');
            } else {
                toast.error('Failed to send invitation');
            }
        },
    });

    const { mutate: cancelInvite, isPending: cancelPending } = useMutation({
        mutationFn: deleteInvitation,
        onSuccess: () => {
            toast.success('Invitation cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projectInvitations', projectId] });
            queryClient.invalidateQueries({ queryKey: ['allFreelancers'] });
        },
        onError: (error: Error) => {
            console.error('Error cancelling invitation:', error.message);
            toast.error('Failed to cancel invitation');
        },
    });

    const handleInvite = () => {
        console.log('[Invite] Button clicked for freelancer:', freelancer.username);
        if (!projectId) {
            console.log('[Invite] No projectId found');
            return;
        }
        
        // Call invite directly for now (remove alert temporarily for testing)
        console.log('[Invite] Sending invite...');
        sendInvite({
            projectId: projectId,
            clientId: user?.userId || '',
            freelancerId: freelancer.id,
            clientUsername: user?.username || 'Client',
        });
        
    };

    const handleCancelInvite = () => {
        console.log('[Cancel Invite] Button clicked for freelancer:', freelancer.username);
        if (!invitationId) {
            console.log('[Cancel Invite] No invitationId found');
            return;
        }
        
        // Call cancel directly for now (remove alert temporarily for testing)
        console.log('[Cancel Invite] Cancelling invitation...');
        cancelInvite(invitationId);
        
        /* ORIGINAL WITH ALERT:
        Alert.alert(
            'Cancel Invitation',
            `Cancel invitation for ${freelancer.username}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => cancelInvite(invitationId),
                },
            ]
        );
        */
    };

    // Logic to calculate visible skills - match logic in ViewFreelancersScreen
    const MAX_CHARS = 35; 
    let currentChars = 0;
    let visibleSkillsCount = 0;

    if (freelancer.skills) {
        for (let i = 0; i < freelancer.skills.length; i++) {
            const skillLen = freelancer.skills[i].length;
            const cost = skillLen + 4; 
            
            if (currentChars + cost <= MAX_CHARS) {
                currentChars += cost;
                visibleSkillsCount++;
            } else {
                break;
            }
        }
        if (visibleSkillsCount === 0 && freelancer.skills.length > 0) visibleSkillsCount = 1;
        if (visibleSkillsCount > 3) visibleSkillsCount = 3;
    }

    return (
        <Pressable 
            style={styles.cardContainer}
            onPress={() => {
                if (user?.userId === freelancer.id) {
                    navigation.navigate('FreelancerProfile');
                } else {
                    navigation.navigate('FreelancerDetails', { freelancerId: freelancer.id });
                }
            }}
        >
            <View style={styles.cardMain}>
                {/* Left Accent Line */}
                <View style={styles.accentLine} />
                
                <View style={styles.cardContent}>
                    {/* Header: Avatar + Info */}
                    <View style={styles.headerRow}>
                        <View style={styles.avatarContainer}>
                            <Avatar source={freelancer.profile_pic} fallback={freelancer.username} size={54} />
                        </View>
                        
                        <View style={styles.headerInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name} numberOfLines={1}>{freelancer.username}</Text>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={11} color="#F59E0B" />
                                    <Text style={styles.ratingText}>
                                        {ratingData && ratingData.reviewCount > 0 
                                            ? ratingData.averageRating.toFixed(1) 
                                            : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.role}>Professional Freelancer</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.description} numberOfLines={2}>
                        {freelancer.description || 'No description available.'}
                    </Text>

                    {/* Domains (if available) */}
                    {freelancer.domains && freelancer.domains.length > 0 && (
                        <View style={styles.domainsRow}>
                            {freelancer.domains.slice(0, 2).map((domain: string, idx: number) => (
                                <View key={idx} style={styles.domainChip}>
                                    <Ionicons name="grid-outline" size={10} color="#6B21A8" />
                                    <Text style={styles.domainText} numberOfLines={1}>{domain}</Text>
                                </View>
                            ))}
                            {freelancer.domains.length > 2 && (
                                <View style={[styles.domainChip, styles.moreDomainChip]}>
                                    <Text style={styles.moreDomainText}>+{freelancer.domains.length - 2}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Skills */}
                    <View style={styles.footerRow}>
                        <View style={styles.skillsContainer}>
                            {freelancer.skills?.slice(0, visibleSkillsCount).map((skill: string, idx: number) => (
                                <View key={idx} style={styles.skillChip}>
                                    <Text style={styles.skillText} numberOfLines={1}>{skill}</Text>
                                </View>
                            ))}
                            {freelancer.skills?.length > visibleSkillsCount && (
                                <View style={[styles.skillChip, styles.moreSkillChip]}>
                                    <Text style={[styles.skillText, styles.moreSkillText]}>+{freelancer.skills.length - visibleSkillsCount}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
            <View style={styles.cardActions}>
                        <Button
                            title={user?.userId === freelancer.id ? 'View Profile' : 'View Profile'}
                            onPress={(e) => {
                                e.stopPropagation();
                                if (user?.userId === freelancer.id) {
                                    navigation.navigate('FreelancerProfile');
                                } else {
                                    navigation.navigate('FreelancerDetails', { freelancerId: freelancer.id });
                                }
                            }}
                            variant="outline"
                            size="sm"
                            style={{ ...styles.actionBtn, flex: 1 }}
                            textStyle={{ fontSize: 13, textAlign: 'center', lineHeight: 20, paddingBottom: 2 }}
                        />

                        {showInviteButton && (
                            invitationId ? (
                                <Button
                                    title="Cancel"
                                    onPress={(e) => { e.stopPropagation(); handleCancelInvite(); }}
                                    loading={cancelPending}
                                    disabled={cancelPending}
                                    variant="outline"
                                    size="sm"
                                    style={{ ...styles.actionBtn, borderColor: '#DC2626', flex: 1 }}
                                    textStyle={{ color: '#DC2626', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingBottom: 2 }}
                                />
                            ) : (
                                <Button
                                    title="Invite"
                                    onPress={(e) => { e.stopPropagation(); handleInvite(); }}
                                    loading={invitePending}
                                    disabled={invitePending}
                                    size="sm"
                                    style={{ ...styles.actionBtn, flex: 1 }}
                                    textStyle={{ fontSize: 13, textAlign: 'center', lineHeight: 20, paddingBottom: 2 }}
                                />
                            )
                        )}

                        {showReviewButton && user?.userId !== freelancer.id && (
                            <Button
                                title="Give Review"
                                onPress={(e) => { 
                                    e.stopPropagation(); 
                                    setShowReviewModal(true); 
                                }}
                                variant="outline"
                                size="sm"
                                style={{ ...styles.actionBtn, borderColor: '#3B82F6', flex: 1 }}
                                textStyle={{ color: '#3B82F6', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingBottom: 2 }}
                            />
                        )}
            </View>
                </View>
            </View>

            {/* Review Modal */}
            {showReviewButton && projectId && user?.userId && (
                <ReviewModal
                    visible={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    freelancerId={freelancer.id}
                    freelancerName={freelancer.username}
                    clientId={user.userId}
                    projectId={projectId}
                    projectTitle={projectTitle}
                />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -50,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#fff',
        opacity: 0.15,
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        opacity: 0.1,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerMetaText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
    },
    headerDivider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 12,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    verticalDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    chatButton: {
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    chatButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 10,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    mainContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#fff',
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#0532A9',
    },
    tabContent: {
        gap: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 12,
    },
    domainsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    domainChipLarge: {
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    domainTextLarge: {
        color: '#6B21A8',
        fontSize: 13,
        fontWeight: '600',
    },
    domainChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    domainText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B21A8',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    domainsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    moreDomainChip: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    moreDomainText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    skillChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    skillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 16,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    clientDetails: {
        gap: 2,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    clientRole: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emptyStateText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 15,
        textAlign: 'center',
    },
    emptyStateAction: {
        marginTop: 8,
        color: '#0532A9',
        fontWeight: '600',
        fontSize: 14,
    },
    freelancersList: {
        gap: 12,
    },
    // New Card Styles based on ViewFreelancersScreen
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardMain: {
        flexDirection: 'row',
    },
    accentLine: {
        width: 4,
        backgroundColor: '#0532A9',
    },
    cardContent: {
        flex: 1,
        padding: 16,
        paddingLeft: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginRight: 8,
        flex: 1,
        letterSpacing: -0.3,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B45309',
    },
    role: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    // description: { ... } -> reusing existing description style but updating
    // Updating styles to match new components
    footerRow: {
        marginTop: 4,
    },
    // skillsContainer: { ... } -> reusing existing
    // skillChip: { ... } -> reusing existing but updating
    moreSkillChip: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        flexShrink: 0,
    },
    moreSkillText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
    },
    cardActions: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        minHeight: 40,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Milestone Styles
    milestonesSummaryContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 0,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        marginBottom: 20,
    },
    createMilestoneButton: {
        backgroundColor: '#0532A9',
        borderRadius: 12,
        marginBottom: 12,
    },
    completeProjectButton: {
        backgroundColor: '#059669',
        borderRadius: 12,
        marginBottom: 12,
    },
    deleteProjectButton: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        marginBottom: 12,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D1FAE5',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    completedBadgeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#059669',
    },
    milestonesList: {
        gap: 12,
    },
    milestoneCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    milestoneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    milestoneInfo: {
        flex: 1,
        marginRight: 12,
    },
    milestoneTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    milestoneAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    milestoneStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    milestoneStatusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    milestoneFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    freelancerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    freelancerName: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    // AI Recommendation Styles
    aiSearchButton: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    aiButtonGradient: {
        padding: 18,
        borderRadius: 16,
    },
    aiButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    aiIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiButtonTextContainer: {
        flex: 1,
    },
    aiButtonTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    aiButtonSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    aiModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: Dimensions.get('window').height * 0.9,
        maxHeight: Dimensions.get('window').height * 0.9,
    },
    aiModalHeader: {
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    aiModalHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    aiModalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    aiModalSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    aiModalContent: {
        flex: 1,
    },
    aiModalContentContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    skillsSection: {
        marginBottom: 24,
    },
    skillsSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    skillChipText: {
        fontSize: 13,
        color: '#7C3AED',
        fontWeight: '600',
    },
    noSkillsText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    numberInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#111827',
    },
    searchButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    searchButtonDisabled: {
        opacity: 0.7,
    },
    searchButtonGradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    aiAnimationContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    aiAnimationCircle: {
        width: 120,
        height: 120,
        marginBottom: 24,
    },
    aiGradientCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiAnimationText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 16,
    },
    loadingDotsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    loadingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#8B5CF6',
    },
    loadingDot1: {
        opacity: 0.3,
    },
    loadingDot2: {
        opacity: 0.6,
    },
    loadingDot3: {
        opacity: 1,
    },
    resultsSection: {
        marginTop: 8,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
    },
    resultHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
    },
    recommendedCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    rankBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rankText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    recommendedCardContent: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 12,
    },
    recommendedInfo: {
        flex: 1,
    },
    recommendedName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    recommendedHeadline: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    recommendedStats: {
        flexDirection: 'row',
        gap: 16,
    },
    statText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    recommendedSkills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
    },
    miniSkillChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    miniSkillText: {
        fontSize: 11,
        color: '#4B5563',
        fontWeight: '600',
    },
    moreSkillsText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
});




