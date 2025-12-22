import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getProjectDetailsById } from '@/api/project-functions';
import { getAllMilestonesForProject } from '@/api/milestone-functions';
import { Spinner, Card, Button, Empty } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { Ionicons } from '@expo/vector-icons';
import type { MilestoneStatusType } from '@/types';

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
    });

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (isError || !project) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error in getting project details data</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Project Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{project.title}</Text>
                    
                    {/* Tab Selector */}
                    <View style={styles.tabContainer}>
                        <Pressable
                            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                            onPress={() => setActiveTab('info')}
                        >
                            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                                Info
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.tab, activeTab === 'milestones' && styles.activeTab]}
                            onPress={() => setActiveTab('milestones')}
                        >
                            <Text style={[styles.tabText, activeTab === 'milestones' && styles.activeTabText]}>
                                Milestones
                            </Text>
                        </Pressable>
                    </View>

                    {/* Project Meta Info */}
                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>📅</Text>
                            <Text style={styles.metaText}>
                                {new Date(project.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>💰</Text>
                            <Text style={styles.metaBoldText}>Rs {project.budget.toLocaleString()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>🧠</Text>
                            <Text style={styles.metaText}>{project.skills.length} skills required</Text>
                        </View>
                    </View>

                    <Button
                        title="💬 Open Chat"
                        onPress={() => navigation.navigate('ProjectChat', { projectId })}
                        style={styles.chatButton}
                    />
                </View>

                {/* Info Tab */}
                {activeTab === 'info' && (
                    <View>
                        {/* Project Description */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Project Description</Text>
                            <Text style={styles.description}>{project.description}</Text>
                        </View>

                        {/* Required Skills */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {project.skills.map((skill, index) => (
                                    <View key={index} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Project Client */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Project Client</Text>
                            <Card style={styles.clientCard}>
                                <Image
                                    source={{ uri: project.client.profile_pic }}
                                    style={styles.clientAvatar}
                                />
                                <Text style={styles.clientName}>{project.client.username}</Text>
                                <Text style={styles.clientRole}>Client</Text>
                                <View style={styles.divider} />
                                <Button
                                    title={
                                        user?.userId === project.client.id
                                            ? 'View my profile'
                                            : 'View Profile'
                                    }
                                    onPress={() => {
                                        if (user?.userId === project.client.id) {
                                            // This shouldn't happen for freelancers, but just in case
                                            console.log('View client profile');
                                        } else {
                                            // Navigate to client profile details
                                            console.log('Navigate to client profile:', project.client.id);
                                        }
                                    }}
                                />
                            </Card>
                        </View>
                    </View>
                )}

                {/* Milestones Tab */}
                {activeTab === 'milestones' && (
                    <View style={styles.section}>
                        {/* Summary Stats */}
                        {milestones && milestones.filter(m => m.freelancer.id === user?.userId).length > 0 && (
                            <View style={styles.milestoneSummaryContainer}>
                                <View style={styles.summaryCard}>
                                    <View style={styles.summaryIconContainer}>
                                        <Ionicons name="flag" size={20} color="#0532A9" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabel}>Total</Text>
                                        <Text style={styles.summaryValue}>
                                            {milestones.filter(m => m.freelancer.id === user?.userId).length}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.summaryCard}>
                                    <View style={[styles.summaryIconContainer, { backgroundColor: '#DBEAFE' }]}>
                                        <Ionicons name="time" size={20} color="#1E40AF" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabel}>Active</Text>
                                        <Text style={styles.summaryValue}>
                                            {milestones.filter(m => m.freelancer.id === user?.userId && (m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED')).length}
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
                                            {milestones.filter(m => m.freelancer.id === user?.userId && m.status === 'COMPLETED').length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>Timeline</Text>
                        {milestonesLoading ? (
                            <Spinner />
                        ) : !milestones || milestones.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyStateIconContainer}>
                                    <Ionicons name="flag" size={32} color="#9CA3AF" />
                                </View>
                                <Text style={styles.emptyStateTitle}>No Milestones Yet</Text>
                                <Text style={styles.emptyStateText}>
                                    The client hasn't created any milestones for this project.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.milestonesList}>
                                {milestones
                                    .filter((m) => m.freelancer.id === user?.userId)
                                    .map((milestone, index, arr) => (
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
                                                {index !== arr.length - 1 && <View style={styles.timelineLine} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <MilestoneCard
                                                    milestone={milestone}
                                                    navigation={navigation}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                {milestones.filter((m) => m.freelancer.id === user?.userId).length === 0 && (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyStateIconContainer}>
                                            <Ionicons name="briefcase" size={32} color="#9CA3AF" />
                                        </View>
                                        <Text style={styles.emptyStateTitle}>No Assigned Milestones</Text>
                                        <Text style={styles.emptyStateText}>
                                            You haven't been assigned any milestones yet.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </ScrollView>
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
                    <Text style={styles.milestoneDate}>
                        {new Date(milestone.created_at).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.milestoneArrow}>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    },
    content: {
        padding: 16,
    },
    header: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#0532A9',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaIcon: {
        fontSize: 16,
    },
    metaText: {
        fontSize: 14,
        color: '#666',
    },
    metaBoldText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    chatButton: {
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    skillText: {
        color: '#1E40AF',
        fontSize: 14,
        fontWeight: '500',
    },
    clientCard: {
        alignItems: 'center',
        padding: 24,
    },
    clientAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: '#0532A9',
        marginBottom: 16,
    },
    clientName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    clientRole: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 16,
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
    milestoneDate: {
        fontSize: 13,
        color: '#6B7280',
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
        marginBottom: 24,
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
    emptyStateText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});
