import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getAllProjectsForClient } from '@/api/project-functions';
import { Spinner, Empty } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<ClientStackParamList, 'AllProjects'> & {
    searchQuery?: string;
};

// Animated Card Component
const AnimatedCard = ({ children, index, onPress }: { children: React.ReactNode, index: number, onPress: () => void }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
        }}>
            <Pressable 
                style={({ pressed }) => [
                    styles.cardContainer,
                    pressed && styles.cardPressed
                ]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

export default function AllProjectsScreen({ navigation, searchQuery = '' }: Props) {
    const { user } = userAuthStore();
    
    const { data: projects, isLoading, error, refetch } = useQuery({
        queryKey: ['allClientProjects', user?.userId],
        queryFn: () => getAllProjectsForClient(user?.userId || ''),
        enabled: !!user?.userId,
    });

    // Refetch when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (user?.userId) {
                refetch();
            }
        }, [user?.userId, refetch])
    );

    // Filter projects based on search query
    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        if (!searchQuery.trim()) return projects;
        
        const query = searchQuery.toLowerCase();
        return projects.filter((project) => {
            const title = project.title?.toLowerCase() || '';
            const description = project.description?.toLowerCase() || '';
            const status = project.status?.toLowerCase() || '';
            return title.includes(query) || description.includes(query) || status.includes(query);
        });
    }, [projects, searchQuery]);

    const renderHeader = () => {
        if (searchQuery.trim() || !projects) return null;
        
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
        const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;

        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>My Projects</Text>
                    <Ionicons name="briefcase" size={18} color="#0532A9" />
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.statsScroll}
                >
                    {/* Card 1: Total Projects */}
                    <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.statIconContainer}>
                            <Ionicons name="folder-open" size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{totalProjects}</Text>
                        <Text style={styles.statLabel}>Total Projects</Text>
                        <View style={[styles.decorativeCircle, { top: -20, right: -20, width: 60, height: 60 }]} />
                        <View style={[styles.decorativeCircle, { bottom: -10, left: -10, width: 30, height: 30, opacity: 0.1 }]} />
                    </LinearGradient>

                    {/* Card 2: Active */}
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="pulse" size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{activeProjects}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                        <View style={[styles.decorativeCircle, { bottom: -20, right: -10, width: 50, height: 50 }]} />
                    </LinearGradient>

                    {/* Card 3: Completed */}
                    <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{completedProjects}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                        <View style={[styles.decorativeCircle, { top: 10, left: -20, width: 40, height: 40 }]} />
                    </LinearGradient>
                </ScrollView>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Spinner fullScreen />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Empty 
                    title="Error Loading Projects" 
                    description={error instanceof Error ? error.message : "Failed to load projects"} 
                />
            </View>
        );
    }

    if (!projects || projects.length === 0) {
        return (
            <View style={styles.container}>
                <Empty title="No projects" description="Create your first project to get started" />
            </View>
        );
    }

    if (filteredProjects.length === 0 && searchQuery.trim()) {
        return (
            <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptySearchTitle}>No projects found</Text>
                <Text style={styles.emptySearchDescription}>
                    Try searching with different keywords
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredProjects}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <AnimatedCard 
                        index={index} 
                        onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
                    >
                        <View style={styles.cardMain}>
                            {/* Left Accent Line - Status based color */}
                            <View style={[
                                styles.accentLine, 
                                { backgroundColor: '#0532A9' }
                            ]} />
                            
                            <View style={styles.cardContent}>
                                {/* Header: Title + Status */}
                                <View style={styles.headerRow}>
                                    <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: '#EFF6FF' }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: '#0532A9' }
                                        ]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Created At */}
                                <View style={styles.createdAtRow}>
                                    <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                                    <Text style={styles.createdAtText}>
                                        Created {new Date(item.created_at).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                </View>

                                {/* Description */}
                                <Text style={styles.projectDescription} numberOfLines={2}>
                                    {item.description || 'No description'}
                                </Text>

                                {/* Domains */}
                                {item.domains && item.domains.length > 0 && (
                                    <View style={styles.domainsRow}>
                                        {item.domains.slice(0, 2).map((domain, idx) => (
                                            <View key={idx} style={styles.domainChip}>
                                                <Ionicons name="grid-outline" size={10} color="#6B21A8" />
                                                <Text style={styles.domainText} numberOfLines={1}>{domain}</Text>
                                            </View>
                                        ))}
                                        {item.domains.length > 2 && (
                                            <View style={[styles.domainChip, styles.moreDomainChip]}>
                                                <Text style={styles.moreDomainText}>+{item.domains.length - 2}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Footer: Budget & Action */}
                                <View style={styles.footerRow}>
                                    <View style={styles.budgetContainer}>
                                        <Text style={styles.budgetLabel}>Budget</Text>
                                        <Text style={styles.budgetAmount}>Rs. {item.budget}</Text>
                                    </View>
                                    
                                    <View style={styles.viewDetailsButton}>
                                        <Ionicons name="arrow-forward" size={18} color="#0532A9" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </AnimatedCard>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    headerContainer: {
        marginBottom: 20,
        marginTop: 8,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
        marginBottom: 12,
        gap: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    statsScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    statCard: {
        width: 140,
        height: 110,
        borderRadius: 20,
        padding: 14,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptySearchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptySearchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySearchDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    list: {
        paddingVertical: 12,
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardPressed: {
        transform: [{ scale: 0.98 }],
        backgroundColor: '#FAFAFA',
    },
    cardMain: {
        flexDirection: 'row',
    },
    accentLine: {
        width: 4,
    },
    cardContent: {
        flex: 1,
        padding: 16,
        paddingLeft: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    projectTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 8,
        letterSpacing: -0.3,
    },
    createdAtRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 0,
        marginBottom: 8,
    },
    createdAtText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    projectDescription: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 12,
    },
    domainsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
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
    moreDomainChip: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    moreDomainText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    budgetContainer: {
        flexDirection: 'column',
    },
    budgetLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 2,
        fontWeight: '500',
    },
    budgetAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0532A9',
    },
    viewDetailsButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
});




