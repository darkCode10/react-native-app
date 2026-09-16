import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getProjectDetailsById } from '@/api/project-functions';
import { getAllMilestonesForProject } from '@/api/milestone-functions';
import { Spinner, Button, Avatar } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'ProjectDetails'>;

export default function ProjectDetailsScreen({ route, navigation }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const [activeTab, setActiveTab] = useState<'info' | 'milestones'>('info');

    const { data: project, isLoading, isError } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectDetailsById(projectId),
    });

    // Fetch milestones for this project
    const { data: milestones, isLoading: milestonesLoading } = useQuery({
        queryKey: ['get-all-milestones-for-project', projectId],
        queryFn: () => getAllMilestonesForProject(projectId),
        enabled: activeTab === 'milestones',
        refetchInterval: 5000,
    });

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

    const formattedDate = new Date(project.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const isProjectCompleted = project.status === 'COMPLETED';
    const isProjectDisputed = project.status === 'DISPUTED';

    // Filter milestones for the current freelancer
    const myMilestones = milestones?.filter(m => m.freelancer?.id === user?.userId) || [];

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
                            
                            {/* Removed Invite Stat for Freelancer as they don't manage invites */}
                        </View>

                        {/* Project Chat Button */}
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
                    </View>
                </LinearGradient>

                <View style={styles.mainContent}>
                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
                        {['Info', 'Milestones'].map((tab) => {
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
                                    {/* Freelancer viewing client profile */}
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
                                    </View>
                                ) : (
                                    <View style={styles.freelancersList}>
                                        {project.project_and_freelancer_link.map((item) => (
                                            <FreelancerCard
                                                key={item.freelancer.id}
                                                freelancer={item.freelancer}
                                                navigation={navigation}
                                                user={user}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
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
                                        <Text style={styles.summaryValue}>{myMilestones.length || 0}</Text>
                                        <Text style={styles.summaryLabel}>Total</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryCard}>
                                    <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3C7' }]}>
                                        <Ionicons name="time" size={20} color="#D97706" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryValue}>
                                            {myMilestones.filter(m => m.status === 'IN_PROGRESS').length || 0}
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
                                            {myMilestones.filter(m => m.status === 'COMPLETED').length || 0}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Completed</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Status Badge if Disputed or Completed */}
                            <View style={styles.actionButtonsContainer}>
                                {isProjectDisputed && (
                                    <View style={[styles.completedBadge, { backgroundColor: '#FEF2F2' }]}>
                                        <Ionicons name="alert-circle" size={24} color="#DC2626" />
                                        <Text style={[styles.completedBadgeText, { color: '#DC2626' }]}>Project Disputed</Text>
                                    </View>
                                )}

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
                                <Text style={styles.sectionTitle}>My Milestones</Text>
                            </View>

                            {milestonesLoading ? (
                                <Spinner />
                            ) : myMilestones.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="flag-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyStateText}>
                                        No milestones assigned to you yet.
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.milestonesList}>
                                    {myMilestones.map((milestone) => (
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
        </View>
    );
}

// Simple Freelancer Card for displaying hired freelancers
function FreelancerCard({ freelancer, navigation, user }: { freelancer: any, navigation: any, user: any }) {
    return (
        <Pressable 
            style={styles.cardContainer}
            onPress={() => {
                if (user?.userId === freelancer.id) {
                    navigation.navigate('Profile', { screen: 'ProfileMain' });
                } else {
                    // Freelancer viewing another freelancer (optional, maybe disable or show basic info)
                }
            }}
        >
            <View style={styles.cardMain}>
                <View style={styles.accentLine} />
                <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                        <View style={styles.avatarContainer}>
                            <Avatar source={freelancer.profile_pic} fallback={freelancer.username} size={54} />
                        </View>
                        <View style={styles.headerInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name} numberOfLines={1}>{freelancer.username}</Text>
                            </View>
                            <Text style={styles.role}>Professional Freelancer</Text>
                        </View>
                    </View>
                    
                    {freelancer.skills && freelancer.skills.length > 0 && (
                        <View style={styles.footerRow}>
                            <View style={styles.skillsContainer}>
                                {freelancer.skills.slice(0, 3).map((skill: string, idx: number) => (
                                    <View key={idx} style={styles.skillChip}>
                                        <Text style={styles.skillText} numberOfLines={1}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
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
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
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
    freelancersList: {
        gap: 12,
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
    // Freelancer Card Styles
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
        marginRight: 12,
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
        letterSpacing: -0.3,
    },
    role: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    footerRow: {
        marginTop: 4,
    },
});
