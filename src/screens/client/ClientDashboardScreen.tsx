import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions, Easing } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ClientStackParamList } from '@/navigation/types';
import { userAuthStore } from '@/store/user-auth-store';
import { Card, Spinner, Avatar } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { getAllProjectsForClient } from '@/api/project-functions';
import { getAllMilestonesForClient } from '@/api/milestone-functions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

// Wrapper to filter out 'collapsable' prop which causes warnings on SVG elements
const WrappedCircle = React.forwardRef((props: any, ref: any) => {
    const { collapsable, ...otherProps } = props;
    return <Circle {...otherProps} ref={ref} />;
});

const AnimatedCircle = Animated.createAnimatedComponent(WrappedCircle);
const AnimatedText = Animated.createAnimatedComponent(Text);

type Props = NativeStackScreenProps<ClientStackParamList, 'ClientDashboard'>;

const { width } = Dimensions.get('window');

export default function ClientDashboardScreen({ navigation }: Props) {
    const { user } = userAuthStore();
    const scrollY = useRef(new Animated.Value(0)).current;

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const chartAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            // Reset animations
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            chartAnim.setValue(0);

            // Start animations
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(chartAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: false,
                }),
            ]).start();
        }, [])
    );

    // Fetch real projects
    const { data: projects, isLoading, error, refetch: refetchProjects } = useQuery({
        queryKey: ['clientProjects', user?.userId],
        queryFn: () => getAllProjectsForClient(user?.userId || ''),
        enabled: !!user?.userId,
    });

    // Fetch milestones to calculate project status
    const { data: allMilestones, refetch: refetchMilestones } = useQuery({
        queryKey: ['clientMilestones', user?.userId],
        queryFn: () => getAllMilestonesForClient(user?.userId || ''),
        enabled: !!user?.userId,
    });

    useFocusEffect(
        useCallback(() => {
            refetchProjects();
            refetchMilestones();
        }, [refetchProjects, refetchMilestones])
    );

    // Calculate stats based on real data
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'ACTIVE') || [];
    const completedProjects = projects?.filter(p => p.status === 'COMPLETED').length || 0;
    const activeProjectsList = activeProjects.slice(0, 3);
    
    const totalSpent = projects?.reduce((acc, p) => acc + parseFloat(p.budget.toString()), 0) || 0;

    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // Get active milestones (IN_PROGRESS or SUBMITTED)
    const activeMilestones = allMilestones?.filter(m => 
        m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED'
    ).slice(0, 5) || [];

    // Map projects to budget ranges (like web version)
    const mapProjectsToBudgetRanges = () => {
        const bins: Record<string, number> = {
            "5k-20k": 0,
            "20k-50k": 0,
            "50k-100k": 0,
            "100k+": 0,
        };

        projects?.forEach((p) => {
            const budget = p.original_budget || p.budget;

            if (budget <= 20000) bins["5k-20k"]++;
            else if (budget <= 50000) bins["20k-50k"]++;
            else if (budget <= 100000) bins["50k-100k"]++;
            else bins["100k+"]++;
        });

        return Object.entries(bins).map(([range, count]) => ({
            range,
            count,
        }));
    };

    const budgetRangeData = mapProjectsToBudgetRanges();
    const maxCount = Math.max(...budgetRangeData.map(d => d.count), 1);

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
            >
                {/* Header Section as part of ScrollView */}
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
                            <Text style={styles.usernameText}>{user?.username || 'Client'}</Text>
                        </View>
                    </View>

                    {/* Key Stats Row - Glassmorphism */}
                    <View style={styles.statsOverviewRow}>
                        <View style={styles.glassStatCard}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(79, 70, 229, 0.2)' }]}>
                                <Ionicons name="briefcase" size={18} color="#A5B4FC" />
                            </View>
                            <Text style={styles.statValue}>{totalProjects}</Text>
                            <Text style={styles.statLabel}>Total Projects</Text>
                        </View>
                        
                        <View style={styles.glassStatCard}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <Ionicons name="pulse" size={18} color="#6EE7B7" />
                            </View>
                            <Text style={styles.statValue}>{activeProjects.length}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>

                        <View style={styles.glassStatCard}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                <Ionicons name="cash" size={18} color="#FCD34D" />
                            </View>
                            <Text style={styles.statValue}>${totalSpent > 1000 ? (totalSpent/1000).toFixed(1) + 'k' : totalSpent}</Text>
                            <Text style={styles.statLabel}>Spent</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Main Content Body */}
                <View style={styles.mainBody}>
                    {/* Charts Section */}
                    <Text style={styles.sectionTitle}>Analytics</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartsScroll}>
                        
                        {/* Project Status Donut Chart */}
                        <View style={styles.chartCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Project Status</Text>
                                <Ionicons name="pie-chart-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.donutContainer}>
                                {totalProjects === 0 ? (
                                    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                                        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No projects yet</Text>
                                    </View>
                                ) : (
                                    <>
                                        <DonutChart 
                                            completed={completedProjects} 
                                            active={activeProjects.length} 
                                            percentage={completionRate} 
                                            animValue={chartAnim}
                                        />
                                        <View style={styles.donutLegend}>
                                            <View style={styles.legendItem}>
                                                <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
                                                <Text style={styles.legendText}>Completed ({completedProjects})</Text>
                                            </View>
                                            <View style={styles.legendItem}>
                                                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                                                <Text style={styles.legendText}>Active ({activeProjects.length})</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Projects Budget Distribution Bar Chart */}
                        <View style={styles.chartCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Projects Budget Distribution</Text>
                                <Ionicons name="bar-chart-outline" size={20} color="#6B7280" />
                            </View>
                            <Text style={styles.chartSubtitle}>
                                Distribution of projects across budget ranges
                            </Text>
                            {totalProjects === 0 ? (
                                <View style={styles.emptyChartState}>
                                    <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyChartText}>No Projects Yet</Text>
                                    <Text style={styles.emptyChartSubtext}>
                                        Create your first project to see distribution
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.barChartContainer}>
                                        {budgetRangeData.map((item, index) => {
                                            const heightPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                            const finalHeight = Math.max(heightPercentage, 5);
                                            const animatedHeight = chartAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', `${finalHeight}%`]
                                            });

                                            return (
                                                <View key={index} style={styles.barColumn}>
                                                    <View style={styles.barValueContainer}>
                                                        {item.count > 0 && (
                                                            <Text style={styles.barValue}>{item.count}</Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.barTrack}>
                                                        {item.count > 0 && (
                                                            <Animated.View style={[styles.barFill, { height: animatedHeight, overflow: 'hidden' }]}>
                                                                <LinearGradient
                                                                    colors={['#0532A9', '#4F46E5']}
                                                                    style={{ flex: 1 }}
                                                                    start={{ x: 0, y: 1 }}
                                                                    end={{ x: 0, y: 0 }}
                                                                />
                                                            </Animated.View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.chartLabel}>
                                                        {item.range}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                    <View style={styles.chartFooter}>
                                        <View style={styles.chartFooterRow}>
                                            <Ionicons name="trending-up" size={16} color="#0532A9" />
                                            <Text style={styles.chartFooterText}>
                                                Total projects: {totalProjects}
                                            </Text>
                                        </View>
                                        <Text style={styles.chartFooterSubtext}>
                                            Showing distribution across budget ranges
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </ScrollView>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsRow}>
                        <Pressable onPress={() => navigation.navigate('CreateProject')} style={styles.actionButton}>
                            <LinearGradient colors={['#0532A9', '#0645C9']} style={styles.actionGradient}>
                                <Ionicons name="add-circle" size={24} color="#fff" />
                                <Text style={styles.actionText}>New Project</Text>
                            </LinearGradient>
                        </Pressable>
                        <Pressable onPress={() => navigation.navigate('ViewFreelancers')} style={styles.actionButton}>
                            <LinearGradient colors={['#fff', '#fff']} style={[styles.actionGradient, styles.secondaryAction]}>
                                <Ionicons name="search" size={24} color="#0532A9" />
                                <Text style={[styles.actionText, { color: '#0532A9' }]}>Find Talent</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* Active Projects List */}
                    <View style={styles.listSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Projects</Text>
                            <Pressable onPress={() => navigation.navigate('AllProjects')}>
                                <Text style={styles.viewAllText}>View All</Text>
                            </Pressable>
                        </View>
                        
                        {isLoading ? (
                            <Spinner />
                        ) : activeProjectsList.length > 0 ? (
                            activeProjectsList.map((project) => (
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
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No active projects</Text>
                            </View>
                        )}
                    </View>

                    {/* Active Milestones */}
                    <View style={styles.listSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Milestones</Text>
                            <Pressable onPress={() => navigation.navigate('AllProjects')}>
                                <Text style={[styles.viewAllText, { color: '#0532A9' }]}>View All</Text>
                            </Pressable>
                        </View>

                        {activeMilestones.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="flag-outline" size={40} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>No active milestones</Text>
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
function DonutChart({ completed, active, percentage, animValue }: { completed: number; active: number; percentage: number; animValue: Animated.Value }) {
    const size = 140; // Increased size
    const strokeWidth = 14; // Thicker stroke
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const total = completed + active;
    const completedPercentage = total > 0 ? (completed / total) * 100 : 0;
    const targetOffset = circumference - (completedPercentage / 100) * circumference;

    const strokeDashoffset = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, targetOffset],
    });

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#F3F4F6"
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
                    <AnimatedCircle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#A855F7"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </G>
                <SvgText
                    x={center}
                    y={center}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="24"
                    fontWeight="800"
                    fill="#1F2937"
                    letterSpacing="-1"
                >
                    {percentage}%
                </SvgText>
                <SvgText
                    x={center}
                    y={center + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="500"
                    fill="#6B7280"
                >
                    Complete
                </SvgText>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingTop: 0, // No top padding needed as header is inside
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
        paddingLeft: 10,// Add padding only to end of scroll
        paddingBottom: 24, // More space for shadow
        gap: 16,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 16,
        width: width * 0.85,
        height: 280,
        elevation: 6,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
    },
    // Donut Styles
    donutContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    donutWrapper: {
        width: 140,
        height: 140,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ... (keep existing donut circle styles if they are generic, or update if needed)
    donutLegend: {
        gap: 12,
        justifyContent: 'center',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    // Bar Chart Styles
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        height: 90,
        marginTop: 12,
        marginBottom: 8,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    barTrack: {
        width: 28,
        height: '100%', 
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    barFill: {
        width: '100%',
        borderRadius: 8,
        minHeight: 8,
    },
    chartLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 4,
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: -2,
        marginBottom: 16,
    },
    // ... (keep other styles)
    barValueContainer: {
        position: 'absolute',
        top: -16,
        width: '100%',
        alignItems: 'center',
        zIndex: 10,
    },
    barValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1F2937',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    chartFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 6,
    },
    chartFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    chartFooterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
    chartFooterSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionButton: {
        flex: 1,
        elevation: 2,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    secondaryAction: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Lists
    listSection: {
        marginBottom: 32,
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
    projectListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 1,
    },
    projectListIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    projectListContent: {
        flex: 1,
    },
    projectListTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    projectListBudget: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    emptyStateText: {
        color: '#9CA3AF',
        fontSize: 14,
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
    emptyChartState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyChartText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 12,
    },
    emptyChartSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
});
