import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProjectsForFreelancer } from '@/api/project-functions';
import { getAllInvitationsForFreelancer } from '@/api/project-invitations-functions';
import { getAllMilestonesForFreelancer } from '@/api/milestone-functions';
import { userAuthStore } from '@/store/user-auth-store';
import { Spinner } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<FreelancerStackParamList, 'FreelancerDashboard'>;

export default function FreelancerDashboardScreen({ navigation }: Props) {
    const { user } = userAuthStore();

    const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
        queryKey: ['freelancerProjects', user?.userId],
        queryFn: () => getAllProjectsForFreelancer(user?.userId || ''),
        enabled: !!user?.userId,
    });

    const { data: invitations, isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery({
        queryKey: ['freelancerInvitations', user?.userId],
        queryFn: () => getAllInvitationsForFreelancer(user?.userId || ''),
        enabled: !!user?.userId,
    });

    const { data: allMilestones, refetch: refetchMilestones } = useQuery({
        queryKey: ['freelancerMilestones', user?.userId],
        queryFn: () => getAllMilestonesForFreelancer(user?.userId || ''),
        enabled: !!user?.userId,
    });

    useFocusEffect(
        React.useCallback(() => {
            refetchProjects();
            refetchInvitations();
            refetchMilestones();
        }, [refetchProjects, refetchInvitations, refetchMilestones])
    );

    const activeProjectsArray = projects?.filter(p => p.project?.status === 'ACTIVE') || [];
    const activeProjects = activeProjectsArray.length;
    const activeProjectsList = activeProjectsArray.slice(0, 3);
    const completedProjects = projects?.filter(p => p.project?.status === 'COMPLETED').length || 0;
    const pendingInvitations = invitations?.filter(i => i.status === 'PENDING').length || 0;

    const doneMilestones = allMilestones?.filter(m => m.status === 'COMPLETED').length || 0;
    const totalMilestones = allMilestones?.length || 0;
    const totalEarned = allMilestones
        ?.filter(m => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;

    const completionRate = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

    // Get active milestones (IN_PROGRESS or SUBMITTED)
    const activeMilestones = allMilestones?.filter(m => 
        m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED'
    ).slice(0, 5) || [];

    if (projectsLoading || invitationsLoading) {
        return <Spinner fullScreen />;
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={['#0532A9', '#03206B']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Decorative Background Pattern */}
                    <View style={[styles.decorativeCircle, { top: -30, right: -30, width: 140, height: 140 }]} />
                    <View style={[styles.decorativeCircle, { bottom: 20, left: -40, width: 100, height: 100, opacity: 0.08 }]} />
                    <View style={[styles.decorativeCircle, { top: 40, right: 60, width: 40, height: 40, opacity: 0.05 }]} />

                    <View style={styles.topBar}>
                        <View>
                            <Text style={styles.greetingText}>Welcome back,</Text>
                            <Text style={styles.usernameText}>{user?.username || 'Freelancer'}</Text>
                        </View>
                    </View>

                    {/* Key Stats Row - Glassmorphism */}
                    <View style={styles.statsOverviewRow}>
                        {/* Active Projects */}
                        <Pressable 
                            style={styles.glassStatCard}
                            onPress={() => navigation.navigate('FreelancerProjects')}
                        >
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(79, 70, 229, 0.2)' }]}>
                                <Ionicons name="briefcase" size={18} color="#A5B4FC" />
                            </View>
                            <Text style={styles.statValue}>{activeProjects}</Text>
                            <Text style={styles.statLabel}>Active Projects</Text>
                        </Pressable>
                        
                        {/* Pending Invites */}
                        <Pressable 
                            style={styles.glassStatCard}
                            onPress={() => navigation.navigate('FreelancerInvites')}
                        >
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                <Ionicons name="mail" size={18} color="#FCD34D" />
                            </View>
                            <Text style={styles.statValue}>{pendingInvitations}</Text>
                            <Text style={styles.statLabel}>Pending Invites</Text>
                        </Pressable>

                        {/* Total Earned */}
                        <View style={styles.glassStatCard}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <Ionicons name="cash" size={18} color="#6EE7B7" />
                            </View>
                            <Text style={styles.statValue}>${totalEarned > 1000 ? (totalEarned/1000).toFixed(1) + 'k' : totalEarned}</Text>
                            <Text style={styles.statLabel}>Total Earned</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Main Content Body */}
                <View style={styles.mainBody}>
                    {/* Charts Section */}
                    <Text style={styles.sectionTitle}>Analytics</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.chartsScroll}
                    >
                        {/* Project Status Chart */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>Work Progress</Text>
                                <Ionicons name="pie-chart-outline" size={20} color="#6B7280" />
                            </View>
                            <Text style={styles.chartSubtitle}>Your project completion overview</Text>
                            <View style={styles.chartContent}>
                                <DonutChart
                                    completed={completedProjects}
                                    active={activeProjects}
                                    percentage={completionRate}
                                />
                                <View style={styles.chartLegend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
                                        <Text style={styles.legendText}>Completed ({completedProjects})</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                                        <Text style={styles.legendText}>Active ({activeProjects})</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Earnings Trend Chart */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>Earnings Trend</Text>
                                <Ionicons name="trending-up-outline" size={20} color="#6B7280" />
                            </View>
                            <Text style={styles.chartSubtitle}>Last 6 months earnings from completed milestones</Text>
                            <View style={styles.earningsChartContent}>
                                <BarChart milestones={allMilestones || []} />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsSection}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.quickActionsGrid}>
                            <Pressable
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('FreelancerInvites')}
                            >
                                <LinearGradient
                                    colors={['#0532A9', '#03206B']}
                                    style={styles.actionGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="mail-outline" size={24} color="#fff" />
                                    <Text style={styles.actionText}>View Invitations</Text>
                                </LinearGradient>
                            </Pressable>

                            <Pressable
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('FreelancerProjects')}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.actionGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="briefcase-outline" size={24} color="#fff" />
                                    <Text style={styles.actionText}>My Projects</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>

                    {/* Active Projects List */}
                    <View style={styles.listSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Projects</Text>
                            <Pressable onPress={() => navigation.navigate('FreelancerProjects')}>
                                <Text style={[styles.viewAllText, { color: '#0532A9' }]}>View All</Text>
                            </Pressable>
                        </View>
                        
                        {projectsLoading ? (
                            <View style={{ paddingVertical: 20 }}>
                                <Text style={{ textAlign: 'center', color: '#6B7280' }}>Loading...</Text>
                            </View>
                        ) : activeProjectsList.length > 0 ? (
                            activeProjectsList.map((projectItem) => {
                                const project = projectItem.project;
                                if (!project) return null;
                                
                                return (
                                    <Pressable 
                                        key={project.id}
                                        onPress={() => navigation.navigate('ProjectDetails', { projectId: project.id })}
                                        style={({pressed}) => [styles.projectListItem, pressed && { opacity: 0.9 }]}
                                    >
                                        <View style={styles.projectListIcon}>
                                            <Ionicons name="briefcase" size={20} color="#0532A9" />
                                        </View>
                                        <View style={styles.projectListContent}>
                                            <Text style={styles.projectListTitle} numberOfLines={1}>{project.title}</Text>
                                            <Text style={styles.projectListBudget}>${project.budget} • {project.status}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                    </Pressable>
                                );
                            })
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="briefcase-outline" size={40} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>No active projects</Text>
                            </View>
                        )}
                    </View>

                    {/* Active Milestones */}
                    <View style={styles.activitySection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Milestones</Text>
                            <Pressable onPress={() => navigation.navigate('FreelancerProjects')}>
                                <Text style={[styles.viewAllText, { color: '#0532A9' }]}>View All</Text>
                            </Pressable>
                        </View>

                        {activeMilestones.length === 0 ? (
                            <View style={styles.emptyActivity}>
                                <Ionicons name="flag-outline" size={40} color="#D1D5DB" />
                                <Text style={styles.emptyActivityText}>No active milestones</Text>
                            </View>
                        ) : (
                            <View style={styles.activityList}>
                                {activeMilestones.map((milestone) => (
                                    <Pressable 
                                        key={milestone.id}
                                        style={({pressed}) => [styles.milestoneItem, pressed && { opacity: 0.7 }]}
                                        onPress={() => {
                                            const projectId = milestone.project?.id;
                                            if (projectId) {
                                                navigation.navigate('ProjectDetails', { projectId });
                                            }
                                        }}
                                    >
                                        <View style={[
                                            styles.milestoneIconContainer, 
                                            { backgroundColor: milestone.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
                                        ]}>
                                            <Ionicons 
                                                name={milestone.status === 'IN_PROGRESS' ? 'time-outline' : 'checkmark-done-outline'} 
                                                size={20} 
                                                color={milestone.status === 'IN_PROGRESS' ? '#3B82F6' : '#F59E0B'} 
                                            />
                                        </View>
                                        <View style={styles.milestoneContent}>
                                            <Text style={styles.milestoneTitle} numberOfLines={1}>{milestone.title}</Text>
                                            <Text style={styles.milestoneProject} numberOfLines={1}>
                                                {milestone.project?.title || 'Project'}
                                            </Text>
                                        </View>
                                        <View style={styles.milestoneRight}>
                                            <Text style={styles.milestoneAmount}>${milestone.amount}</Text>
                                            <View style={[
                                                styles.milestoneStatusBadge,
                                                { backgroundColor: milestone.status === 'IN_PROGRESS' ? '#EFF6FF' : '#FEF3C7' }
                                            ]}>
                                                <Text style={[
                                                    styles.milestoneStatusText,
                                                    { color: milestone.status === 'IN_PROGRESS' ? '#3B82F6' : '#F59E0B' }
                                                ]}>
                                                    {milestone.status === 'IN_PROGRESS' ? 'In Progress' : 'Submitted'}
                                                </Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </View>
    );
}

// Donut Chart Component
function DonutChart({ completed, active, percentage }: { completed: number; active: number; percentage: number }) {
    const size = 120;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const total = completed + active;
    const hasData = total > 0;

    if (!hasData) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No data yet</Text>
            </View>
        );
    }

    const completedPercentage = (completed / total) * 100;
    const completedOffset = circumference - (completedPercentage / 100) * circumference;
    
    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#E5E7EB"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#10B981"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                    />
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#A855F7"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={completedOffset}
                        strokeLinecap="round"
                    />
                </G>
                <SvgText
                    x={center}
                    y={center - 6}
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="bold"
                    fill="#111827"
                >
                    {percentage}%
                </SvgText>
                <SvgText
                    x={center}
                    y={center + 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6B7280"
                >
                    Complete
                </SvgText>
            </Svg>
        </View>
    );
}

// Bar Chart Component - Month-wise Earnings
function BarChart({ milestones }: { milestones: any[] }) {
    // Get last 6 months
    const getLastSixMonths = () => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                name: monthNames[date.getMonth()],
                year: date.getFullYear(),
                month: date.getMonth(),
            });
        }
        
        return months;
    };

    const lastSixMonths = getLastSixMonths();
    
    // Calculate earnings per month from completed milestones
    const earningsByMonth = lastSixMonths.map(monthData => {
        const monthlyEarnings = milestones
            ?.filter(m => {
                if (m.status !== 'COMPLETED' || !m.created_at) return false;
                
                const milestoneDate = new Date(m.created_at);
                return (
                    milestoneDate.getMonth() === monthData.month &&
                    milestoneDate.getFullYear() === monthData.year
                );
            })
            .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
        
        return {
            month: monthData.name,
            earnings: monthlyEarnings,
        };
    });

    const maxEarning = Math.max(...earningsByMonth.map(m => m.earnings), 100); // Min 100 for scale
    const hasData = earningsByMonth.some(m => m.earnings > 0);

    if (!hasData) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                <Ionicons name="bar-chart-outline" size={32} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>No earnings yet</Text>
            </View>
        );
    }

    return (
        <View style={{ width: '100%', paddingVertical: 10 }}>
            <View style={styles.barChartContainer}>
                {earningsByMonth.map((item, index) => {
                    const heightPercent = maxEarning > 0 ? (item.earnings / maxEarning) * 100 : 0;
                    const displayHeight = Math.max(heightPercent, 5); // Minimum 5% for visibility
                    
                    return (
                        <View key={index} style={styles.barColumn}>
                            {item.earnings > 0 && (
                                <Text style={styles.barValue}>${item.earnings > 1000 ? (item.earnings/1000).toFixed(1) + 'k' : item.earnings}</Text>
                            )}
                            <View style={styles.barWrapper}>
                                <View 
                                    style={[
                                        styles.bar, 
                                        { 
                                            height: `${displayHeight}%`, 
                                            backgroundColor: item.earnings > 0 ? '#0532A9' : '#E5E7EB' 
                                        }
                                    ]} 
                                />
                            </View>
                            <Text style={styles.barLabel}>{item.month}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    headerGradient: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: 20,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 0,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        zIndex: 1,
    },
    greetingText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    usernameText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statsOverviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    mainBody: {
        paddingHorizontal: 20,
    },
    glassStatCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    chartsScroll: {
        paddingRight: 10,
        paddingLeft: 10,
        paddingBottom: 24,
        gap: 16,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        width: width * 0.85,
        height: 280,
        elevation: 6,
        justifyContent: 'space-between',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
    },
    chartContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    earningsChartContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 0,
    },
    chartLegend: {
        marginTop: 0,
        gap: 12,
        justifyContent: 'center',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#4B5563',
    },
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
        width: '100%',
        paddingHorizontal: 8,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    barWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
    },
    bar: {
        width: 12,
        borderRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
        height: 16,
    },
    barValue: {
        fontSize: 10,
        color: '#0532A9',
        fontWeight: '600',
        marginBottom: 2,
        textAlign: 'center',
    },
    quickActionsSection: {
        marginBottom: 24,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionGradient: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    activitySection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 13,
        color: '#0532A9',
        fontWeight: '600',
    },
    emptyActivity: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyActivityText: {
        marginTop: 8,
        fontSize: 14,
        color: '#9CA3AF',
    },
    activityList: {
        gap: 12,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 8,
    },
    milestoneIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    milestoneContent: {
        flex: 1,
    },
    milestoneTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    milestoneProject: {
        fontSize: 12,
        color: '#6B7280',
    },
    milestoneRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    milestoneAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0532A9',
    },
    milestoneStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    milestoneStatusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
    },
    projectListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        gap: 12,
    },
    projectListIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectListContent: {
        flex: 1,
    },
    projectListTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    projectListBudget: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
});









