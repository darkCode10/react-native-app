import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ClientStackParamList } from '@/navigation/types';
import { userAuthStore } from '@/store/user-auth-store';
import { Card, Spinner, Avatar } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { getAllProjectsForClient } from '@/api/project-functions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<ClientStackParamList, 'ClientDashboard'>;

const { width } = Dimensions.get('window');

const RECENT_ACTIVITY = [
    { id: 1, type: 'Milestone', date: 'Jan 22', title: 'Milestone Approved', desc: "Final testing for 'Mobile App MVP'", icon: 'flag' },
    { id: 2, type: 'Payment', date: 'Jan 18', title: 'Payment Sent', desc: 'Second installment released', icon: 'card' },
    { id: 3, type: 'Milestone', date: 'Jan 15', title: 'Milestone Submitted', desc: 'Development phase 2 ready for review', icon: 'time' },
];

export default function ClientDashboardScreen({ navigation }: Props) {
    const { user } = userAuthStore();
    const scrollY = useRef(new Animated.Value(0)).current;

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            // Reset animations
            fadeAnim.setValue(0);
            slideAnim.setValue(50);

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
            ]).start();
        }, [])
    );

    // Fetch real projects
    const { data: projects, isLoading, error } = useQuery({
        queryKey: ['clientProjects', user?.userId],
        queryFn: () => getAllProjectsForClient(user?.userId || ''),
        enabled: !!user?.userId,
    });

    // Calculate stats
    const totalProjects = projects?.length || 0;
    const completedProjects = 0; // Freelansync only has DRAFT status
    const activeProjects = projects?.slice(0, 3) || [];
    const ongoingProjects = activeProjects.length; 
    
    const totalSpent = projects?.reduce((acc, p) => acc + parseFloat(p.budget.toString()), 0) || 50000;

    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 70;

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
                            <Text style={styles.statValue}>${(totalSpent/1000).toFixed(1)}k</Text>
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
                                 <View style={styles.donutWrapper}>
                                    {/* Completed Segment (Base) */}
                                    <View style={[styles.donutCircle, { borderColor: '#4F46E5' }]} />
                                    {/* Active Segment (Overlay) */}
                                    <View style={[styles.donutCircle, { 
                                        borderColor: '#10B981', 
                                        transform: [{ rotate: '45deg' }],
                                        borderRightColor: 'transparent',
                                        borderBottomColor: 'transparent',
                                        position: 'absolute'
                                    }]} />
                                    <View style={styles.donutHole}>
                                        <Text style={styles.donutValue}>{completionRate.toFixed(0)}%</Text>
                                        <Text style={styles.donutLabel}>Done</Text>
                                    </View>
                                </View>
                                <View style={styles.donutLegend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#4F46E5' }]} />
                                        <Text style={styles.legendText}>Completed</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                                        <Text style={styles.legendText}>Active</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Spending Trend Bar Chart */}
                        <View style={styles.chartCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Spending Trend</Text>
                                <Ionicons name="bar-chart-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.barChartContainer}>
                                {[35, 60, 45, 80, 55, 90].map((value, index) => (
                                    <View key={index} style={styles.barColumn}>
                                        <View style={styles.barTrack}>
                                            <LinearGradient
                                                colors={['#0532A9', '#4F46E5']}
                                                style={[styles.barFill, { height: `${value}%` }]}
                                                start={{ x: 0, y: 1 }}
                                                end={{ x: 0, y: 0 }}
                                            />
                                        </View>
                                        <Text style={styles.chartLabel}>
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
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
                        ) : activeProjects.length > 0 ? (
                            activeProjects.map((project) => (
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

                    {/* Activity Feed */}
                    <View style={styles.listSection}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        {RECENT_ACTIVITY.map((item) => (
                            <View key={item.id} style={styles.activityItem}>
                                <View style={[styles.activityDot, { backgroundColor: item.type === 'Payment' ? '#10B981' : '#F59E0B' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activityTitle}>{item.title}</Text>
                                    <Text style={styles.activityDesc}>{item.desc}</Text>
                                </View>
                                <Text style={styles.activityDate}>{item.date}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        paddingRight: 20,
        paddingBottom: 20,
        gap: 16,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        width: width * 0.75, // Responsive width
        height: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Donut Styles
    donutContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    donutWrapper: {
        width: 120,
        height: 120,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 12,
        position: 'absolute',
    },
    donutHole: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    donutValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    donutLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    donutLegend: {
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
    // Bar Chart Styles
    barChartContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        height: 140, // Height for bars
    },
    barColumn: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
        gap: 8,
    },
    barTrack: {
        width: 8,
        height: 120, // Max height of bar area
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        borderRadius: 4,
    },
    chartLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionButton: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
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
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    activityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 16,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    activityDesc: {
        fontSize: 12,
        color: '#6B7280',
    },
    activityDate: {
        fontSize: 11,
        color: '#9CA3AF',
        marginLeft: 8,
    },
});
