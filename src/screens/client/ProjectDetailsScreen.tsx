import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Dimensions, Platform, Modal, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectDetailsById } from '@/api/project-functions';
import { getAllFreelancers } from '@/api/freelancer-functions';
import { createInvitation, getAllInvitationsForProject, deleteInvitation } from '@/api/project-invitations-functions';
import { getAllMilestonesForProject, createMilestone } from '@/api/milestone-functions';
import { Spinner, Card, Button, Avatar, Empty } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { toast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { MilestoneStatusType } from '@/types';

type Props = NativeStackScreenProps<ClientStackParamList, 'ProjectDetails'>;

export default function ProjectDetailsScreen({ route, navigation }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const [activeTab, setActiveTab] = useState<'info' | 'freelancers' | 'milestones'>('info');
    const [createMilestoneModalVisible, setCreateMilestoneModalVisible] = useState(false);
    const queryClient = useQueryClient();

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
        queryFn: () => getAllMilestonesForProject(projectId),
        enabled: activeTab === 'milestones',
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
                                <View>
                                    <Text style={styles.statLabel}>Budget</Text>
                                    <Text style={styles.statValue}>${project.budget.toLocaleString()}</Text>
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
                                            showInviteButton={true}
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
                            {/* Summary Stats */}
                            {milestones && milestones.length > 0 && (
                                <View style={styles.milestoneSummaryContainer}>
                                    <View style={styles.summaryCard}>
                                        <View style={styles.summaryIconContainer}>
                                            <Ionicons name="flag" size={20} color="#0532A9" />
                                        </View>
                                        <View>
                                            <Text style={styles.summaryLabel}>Total</Text>
                                            <Text style={styles.summaryValue}>{milestones.length}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.summaryCard}>
                                        <View style={[styles.summaryIconContainer, { backgroundColor: '#DBEAFE' }]}>
                                            <Ionicons name="time" size={20} color="#1E40AF" />
                                        </View>
                                        <View>
                                            <Text style={styles.summaryLabel}>Active</Text>
                                            <Text style={styles.summaryValue}>
                                                {milestones.filter(m => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED').length}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.summaryCard}>
                                        <View style={[styles.summaryIconContainer, { backgroundColor: '#ECFDF5' }]}>
                                            <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                        </View>
                                        <View>
                                            <Text style={styles.summaryLabel}>Done</Text>
                                            <Text style={styles.summaryValue}>
                                                {milestones.filter(m => m.status === 'COMPLETED').length}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            <View style={styles.milestoneHeader}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="layers-outline" size={20} color="#0532A9" />
                                    <Text style={styles.sectionTitle}>Timeline</Text>
                                </View>
                                {project.project_and_freelancer_link.length > 0 && (
                                    <Button
                                        title="New Milestone"
                                        onPress={() => setCreateMilestoneModalVisible(true)}
                                        size="sm"
                                        icon="add"
                                        style={{ backgroundColor: '#0532A9', borderRadius: 20, paddingHorizontal: 12, height: 36, marginTop: -10 }}
                                        textStyle={{ fontSize: 12, fontWeight: '600' }}
                                    />
                                )}
                            </View>

                            {project.project_and_freelancer_link.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyStateIconContainer}>
                                        <Ionicons name="people" size={32} color="#9CA3AF" />
                                    </View>
                                    <Text style={styles.emptyStateTitle}>Hire Freelancers First</Text>
                                    <Text style={styles.emptyStateText}>
                                        You need to hire freelancers before you can create and assign milestones.
                                    </Text>
                                    <Button 
                                        title="Find Freelancers"
                                        onPress={() => setActiveTab('freelancers')}
                                        variant="outline"
                                        style={{ marginTop: 16 }}
                                    />
                                </View>
                            ) : milestonesLoading ? (
                                <Spinner />
                            ) : !milestones || milestones.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyStateIconContainer}>
                                        <Ionicons name="flag" size={32} color="#9CA3AF" />
                                    </View>
                                    <Text style={styles.emptyStateTitle}>No Milestones Yet</Text>
                                    <Text style={styles.emptyStateText}>
                                        Break down your project into smaller, manageable milestones to track progress effectively.
                                    </Text>
                                    <Button 
                                        title="Create First Milestone"
                                        onPress={() => setCreateMilestoneModalVisible(true)}
                                        style={{ marginTop: 16 }}
                                    />
                                </View>
                            ) : (
                                <View style={styles.milestonesList}>
                                    {milestones.map((milestone, index) => (
                                        <View key={milestone.id} style={styles.timelineItem}>
                                            <View style={styles.timelineLeft}>
                                                <View style={[
                                                    styles.timelineDot, 
                                                    milestone.status === 'COMPLETED' && styles.timelineDotCompleted
                                                ]}>
                                                    {milestone.status === 'COMPLETED' && (
                                                        <Ionicons name="checkmark" size={10} color="#FFF" />
                                                    )}
                                                </View>
                                                {index !== milestones.length - 1 && <View style={styles.timelineLine} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <MilestoneCard
                                                    milestone={milestone}
                                                    navigation={navigation}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                    
                    {/* Create Milestone Modal */}
                    {createMilestoneModalVisible && (
                        <CreateMilestoneModal
                            visible={createMilestoneModalVisible}
                            onClose={() => setCreateMilestoneModalVisible(false)}
                            freelancers={project.project_and_freelancer_link}
                            projectId={projectId}
                            projectTitle={project.title}
                            clientId={user!.userId}
                            clientUsername={user!.username}
                            queryClient={queryClient}
                        />
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
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
};

function FreelancerCard({ freelancer, navigation, user, showInviteButton, projectId, invitationId }: FreelancerCardProps) {
    const queryClient = useQueryClient();

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
        if (!projectId) return;
        Alert.alert(
            'Invite Freelancer',
            `Send an invitation to ${freelancer.username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => sendInvite({
                        projectId: projectId,
                        clientId: user?.userId || '',
                        freelancerId: freelancer.id,
                        clientUsername: user?.username || 'Client',
                    }),
                },
            ]
        );
    };

    const handleCancelInvite = () => {
        if (!invitationId) return;
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
                                    <Text style={styles.ratingText}>5.0</Text>
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
                            style={[styles.actionBtn, { flex: 1 }]}
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
                                    style={[styles.actionBtn, { borderColor: '#DC2626', flex: 1 }]}
                                    textStyle={{ color: '#DC2626', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingBottom: 2 }}
                                />
                            ) : (
                                <Button
                                    title="Invite"
                                    onPress={(e) => { e.stopPropagation(); handleInvite(); }}
                                    loading={invitePending}
                                    disabled={invitePending}
                                    size="sm"
                                    style={[styles.actionBtn, { flex: 1 }]}
                                    textStyle={{ fontSize: 13, textAlign: 'center', lineHeight: 20, paddingBottom: 2 }}
                                />
                            )
                        )}
            </View>
                </View>
            </View>
        </Pressable>
    );
}

// Milestone Card Component
type MilestoneCardProps = {
    milestone: any;
    navigation: any;
};

function MilestoneCard({ milestone, navigation }: MilestoneCardProps) {
    const getStatusColor = (status: MilestoneStatusType) => {
        switch (status) {
            case 'LOCKED':
                return { bg: '#FEE2E2', text: '#991B1B' };
            case 'IN_PROGRESS':
                return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'SUBMITTED':
                return { bg: '#FEF3C7', text: '#92400E' };
            case 'COMPLETED':
                return { bg: '#D1FAE5', text: '#065F46' };
            default:
                return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const statusColors = getStatusColor(milestone.status);

    return (
        <Pressable
            style={styles.milestoneCard}
            onPress={() => navigation.navigate('MilestoneDetails', { milestoneId: milestone.id })}
        >
            <View style={styles.milestoneHeaderRow}>
                <Text style={styles.milestoneTitle} numberOfLines={1}>
                    {milestone.title}
                </Text>
                <View style={[styles.milestoneStatusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.milestoneStatusText, { color: statusColors.text }]}>
                        {milestone.status.replace('_', ' ')}
                    </Text>
                </View>
            </View>

            <Text style={styles.milestoneDescription} numberOfLines={2}>
                {milestone.description}
            </Text>

            <View style={styles.milestoneDetailsRow}>
                <View style={styles.milestoneMetaItem}>
                    <Ionicons name="cash-outline" size={16} color="#0532A9" />
                    <Text style={styles.milestoneAmountText}>Rs {milestone.amount.toLocaleString()}</Text>
                </View>
                
                <View style={styles.milestoneMetaItem}>
                    <Image source={{ uri: milestone.freelancer.profile_pic }} style={styles.milestoneAvatar} />
                    <Text style={styles.milestoneFreelancerName} numberOfLines={1}>
                        {milestone.freelancer.username}
                    </Text>
                </View>

                <View style={styles.milestoneArrow}>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </View>
            </View>
        </Pressable>
    );
}

// Create Milestone Modal Component
type CreateMilestoneModalProps = {
    visible: boolean;
    onClose: () => void;
    freelancers: any[];
    projectId: string;
    projectTitle: string;
    clientId: string;
    clientUsername: string;
    queryClient: any;
};

function CreateMilestoneModal({
    visible,
    onClose,
    freelancers,
    projectId,
    projectTitle,
    clientId,
    clientUsername,
    queryClient,
}: CreateMilestoneModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedFreelancerId, setSelectedFreelancerId] = useState('');
    const [showFreelancerPicker, setShowFreelancerPicker] = useState(false);

    const { mutate, isPending } = useMutation({
        mutationFn: createMilestone,
        onSuccess: () => {
            toast.success('Milestone created successfully');
            queryClient.invalidateQueries({
                queryKey: ['get-all-milestones-for-project', projectId],
            });
            onClose();
            setTitle('');
            setDescription('');
            setAmount('');
            setSelectedFreelancerId('');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create milestone: ${error.message}`);
        },
    });

    const handleCreate = () => {
        if (!title.trim()) {
            toast.error('Milestone title is required');
            return;
        }
        if (!description.trim()) {
            toast.error('Milestone description is required');
            return;
        }
        if (!selectedFreelancerId) {
            toast.error('Please select a freelancer');
            return;
        }
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Please enter a valid amount greater than 0');
            return;
        }

        mutate({
            title: title.trim(),
            amount: amountNum,
            clientId,
            description: description.trim(),
            freelancerId: selectedFreelancerId,
            projectId,
            clientUsername,
            projectTitle,
        });
    };

    const selectedFreelancer = freelancers.find((f) => f.freelancer.id === selectedFreelancerId);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create Milestone</Text>
                        <Pressable onPress={onClose} style={styles.modalCloseButton}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalDescription}>
                            Create a milestone for your project. Assign it to a freelancer and track progress.
                        </Text>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Title *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. Add to Cart API"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Description *</Text>
                            <TextInput
                                style={[styles.modalInput, styles.modalTextArea]}
                                placeholder="Describe your milestone..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Pick Freelancer *</Text>
                            <Pressable
                                style={styles.modalPickerButton}
                                onPress={() => setShowFreelancerPicker(true)}
                            >
                                <Text
                                    style={[
                                        styles.modalPickerText,
                                        !selectedFreelancer && styles.modalPickerPlaceholder,
                                    ]}
                                >
                                    {selectedFreelancer
                                        ? selectedFreelancer.freelancer.username
                                        : 'Select a freelancer'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </Pressable>
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Amount (Rs) *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="0"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                onPress={onClose}
                                variant="outline"
                                style={{ flex: 1 }}
                                disabled={isPending}
                            />
                            <Button
                                title="Create"
                                onPress={handleCreate}
                                style={{ flex: 1 }}
                                loading={isPending}
                            />
                        </View>
                    </ScrollView>

                    {/* Freelancer Picker Modal */}
                    <Modal
                        visible={showFreelancerPicker}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowFreelancerPicker(false)}
                    >
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Select Freelancer</Text>
                                    <Pressable
                                        onPress={() => setShowFreelancerPicker(false)}
                                        style={styles.pickerCloseButton}
                                    >
                                        <Ionicons name="close" size={24} color="#6B7280" />
                                    </Pressable>
                                </View>
                                <ScrollView>
                                    {freelancers.map((item) => (
                                        <Pressable
                                            key={item.freelancer.id}
                                            style={[
                                                styles.pickerOption,
                                                selectedFreelancerId === item.freelancer.id &&
                                                    styles.pickerOptionSelected,
                                            ]}
                                            onPress={() => {
                                                setSelectedFreelancerId(item.freelancer.id);
                                                setShowFreelancerPicker(false);
                                            }}
                                        >
                                            <Image
                                                source={{ uri: item.freelancer.profile_pic }}
                                                style={styles.pickerOptionImage}
                                            />
                                            <Text style={styles.pickerOptionText}>
                                                {item.freelancer.username}
                                            </Text>
                                            {selectedFreelancerId === item.freelancer.id && (
                                                <Ionicons name="checkmark-circle" size={24} color="#0532A9" />
                                            )}
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                </View>
            </View>
        </Modal>
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
    verticalDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
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
    emptyStateSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    milestoneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Changed from flex-start to center for better alignment
        marginBottom: 16,
    },
    milestonesGrid: {
        gap: 16,
    },
    milestoneCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 4,
    },
    milestoneHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    milestoneTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    milestoneStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    milestoneStatusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    milestoneDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    milestoneDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    milestoneMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    milestoneAmountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    milestoneAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    milestoneFreelancerName: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    milestoneArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // New Styles for Timeline Layout
    milestoneSummaryContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    summaryIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    milestonesList: {
        paddingLeft: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        gap: 16,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 20,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        marginTop: 18,
    },
    timelineDotCompleted: {
        backgroundColor: '#10B981',
        width: 18,
        height: 18,
        borderRadius: 9,
        marginTop: 16,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: -2,
        marginBottom: -2,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 16,
    },
    emptyStateIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 20,
    },
    modalDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    modalInputGroup: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#111827',
    },
    modalTextArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalPickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
    },
    modalPickerText: {
        fontSize: 14,
        color: '#111827',
    },
    modalPickerPlaceholder: {
        color: '#9CA3AF',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxHeight: '70%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    pickerCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pickerOptionSelected: {
        backgroundColor: '#F0F7FF',
    },
    pickerOptionImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    pickerOptionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
    },
});




