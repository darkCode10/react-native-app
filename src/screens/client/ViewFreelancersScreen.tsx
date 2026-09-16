import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getAllFreelancers } from '@/api/freelancer-functions';
import { getFreelancerAverageRating } from '@/api/review-functions';
import { Spinner, Empty, Avatar, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<ClientStackParamList, 'ViewFreelancers'> & {
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

// Freelancer Card Content with Rating
const FreelancerCardContent = ({ item, visibleSkillsCount }: { item: any, visibleSkillsCount: number }) => {
    const { data: ratingData } = useQuery({
        queryKey: ['freelancerRating', item.id],
        queryFn: () => getFreelancerAverageRating(item.id),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return (
        <View style={styles.cardMain}>
            {/* Left Accent Line - Refined */}
            <View style={styles.accentLine} />
            
            <View style={styles.cardContent}>
                {/* Header: Avatar + Info */}
                <View style={styles.headerRow}>
                    <View style={styles.avatarContainer}>
                        <Avatar source={item.profile_pic} fallback={item.username} size={54} />
                    </View>
                    
                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>{item.username}</Text>
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
                    {item.description}
                </Text>

                {/* Domains (if available) */}
                {item.domains && item.domains.length > 0 && (
                    <View style={styles.domainsRow}>
                        {item.domains.slice(0, 2).map((domain: string, idx: number) => (
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

                {/* Skills & Action */}
                <View style={styles.footerRow}>
                    <View style={styles.skillsContainer}>
                        {item.skills.slice(0, visibleSkillsCount).map((skill: string, idx: number) => (
                            <View key={idx} style={styles.skillChip}>
                                <Text style={styles.skillText} numberOfLines={1}>{skill}</Text>
                            </View>
                        ))}
                        {item.skills.length > visibleSkillsCount && (
                            <View style={[styles.skillChip, styles.moreSkillChip]}>
                                <Text style={[styles.skillText, styles.moreSkillText]}>+{item.skills.length - visibleSkillsCount}</Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.viewProfileButton}>
                        <Ionicons name="arrow-forward" size={18} color="#0532A9" />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function ViewFreelancersScreen({ navigation, searchQuery = '' }: Props) {
    const { data: freelancers, isLoading } = useQuery({
        queryKey: ['freelancers'],
        queryFn: getAllFreelancers,
    });

    // Filter freelancers based on search query
    const filteredFreelancers = useMemo(() => {
        if (!freelancers) return [];
        if (!searchQuery.trim()) return freelancers;
        
        const query = searchQuery.toLowerCase();
        return freelancers.filter((freelancer) => {
            const username = freelancer.username?.toLowerCase() || '';
            const description = freelancer.description?.toLowerCase() || '';
            const skills = freelancer.skills?.join(' ').toLowerCase() || '';
            return username.includes(query) || description.includes(query) || skills.includes(query);
        });
    }, [freelancers, searchQuery]);

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (!freelancers || freelancers.length === 0) {
        return (
            <View style={styles.container}>
                <Empty title="No freelancers" description="No freelancers available at the moment" />
            </View>
        );
    }

    const renderHeader = () => {
        if (searchQuery.trim()) return null;
        
        // Mock data for the header stats
        const totalFreelancers = freelancers.length;
        const newThisWeek = Math.ceil(totalFreelancers * 0.3); // Mock 30% are new
        const topRated = Math.ceil(totalFreelancers * 0.6); // Mock 60% are top rated

        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>Discover Talent</Text>
                    <Ionicons name="people" size={24} color="#0532A9" />
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.statsScroll}
                >
                    {/* Card 1: Total Talent */}
                    <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.statIconContainer}>
                            <Ionicons name="people" size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{totalFreelancers}</Text>
                        <Text style={styles.statLabel}>Total Experts</Text>
                        <View style={[styles.decorativeCircle, { top: -20, right: -20, width: 60, height: 60 }]} />
                        <View style={[styles.decorativeCircle, { bottom: -10, left: -10, width: 30, height: 30, opacity: 0.1 }]} />
                    </LinearGradient>

                    {/* Card 2: Top Rated */}
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="star" size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{topRated}</Text>
                        <Text style={styles.statLabel}>Top Rated</Text>
                        <View style={[styles.decorativeCircle, { bottom: -20, right: -10, width: 50, height: 50 }]} />
                    </LinearGradient>

                    {/* Card 3: New Joiners */}
                    <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="flash" size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{newThisWeek}</Text>
                        <Text style={styles.statLabel}>New Joiners</Text>
                        <View style={[styles.decorativeCircle, { top: 10, left: -20, width: 40, height: 40 }]} />
                    </LinearGradient>
                </ScrollView>
            </View>
        );
    };

    if (filteredFreelancers.length === 0 && searchQuery.trim()) {
        return (
            <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptySearchTitle}>No matches found</Text>
                <Text style={styles.emptySearchDescription}>
                    We couldn't find any freelancers matching "{searchQuery}"
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredFreelancers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                    // Logic to calculate visible skills based on available width estimation
                    // Assuming ~35 chars fit in the available space for skills
                    const MAX_CHARS = 35; 
                    let currentChars = 0;
                    let visibleSkillsCount = 0;

                    for (let i = 0; i < item.skills.length; i++) {
                        const skillLen = item.skills[i].length;
                        const cost = skillLen + 4; // text length + padding(3) + gap(1) estimate
                        
                        if (currentChars + cost <= MAX_CHARS) {
                            currentChars += cost;
                            visibleSkillsCount++;
                        } else {
                            break;
                        }
                    }
                    // Always show at least 1 skill if available
                    if (visibleSkillsCount === 0 && item.skills.length > 0) visibleSkillsCount = 1;
                    
                    // Cap at 3 skills max to maintain layout
                    if (visibleSkillsCount > 3) visibleSkillsCount = 3;

                    return (
                    <AnimatedCard 
                        index={index} 
                        onPress={() => navigation.navigate('FreelancerDetails', { freelancerId: item.id })}
                    >
                        <FreelancerCardContent item={item} visibleSkillsCount={visibleSkillsCount} />
                    </AnimatedCard>
                );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Slightly darker background for better card contrast
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
    description: {
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
        gap: 12,
        marginTop: 4,
    },
    skillsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    skillChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        flexShrink: 1,
    },
    moreSkillChip: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        flexShrink: 0,
    },
    skillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },
    moreSkillText: {
        color: '#6B7280',
    },
    viewProfileButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
