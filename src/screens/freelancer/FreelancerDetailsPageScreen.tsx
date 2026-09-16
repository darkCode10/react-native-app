import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getFreelancerDetails } from '@/api/freelancer-functions';
import { getAllReviewsForFreelancer } from '@/api/review-functions';
import { Spinner, Card, Avatar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'FreelancerDetailsPage'>;

export default function FreelancerDetailsPageScreen({ route }: Props) {
    const { freelancerId } = route.params;

    const { data: freelancer, isLoading } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: () => getFreelancerDetails(freelancerId),
    });

    const { data: reviews, isLoading: reviewsLoading } = useQuery({
        queryKey: ['freelancer-reviews', freelancerId],
        queryFn: () => getAllReviewsForFreelancer(freelancerId),
    });

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (!freelancer) {
        return (
            <View style={styles.container}>
                <Text>Freelancer not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Avatar source={freelancer.profile_pic} fallback={freelancer.username} size={100} />
                    <Text style={styles.name}>{freelancer.username}</Text>
                </View>

                <Card>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>{freelancer.description}</Text>
                </Card>

                <Card>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                        {freelancer.skills.map((skill, index) => (
                            <View key={index} style={styles.skillChip}>
                                <Text style={styles.skillText}>{skill}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Reviews Section */}
                <Card>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviewsLoading ? (
                        <Spinner />
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
                                                size={36} 
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
                                                <Ionicons key={i} name="star" size={14} color="#F59E0B" />
                                            ))}
                                        </View>
                                    </View>
                                    
                                    {/* Review Comment */}
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyReviews}>
                            <Ionicons name="star-outline" size={40} color="#D1D5DB" />
                            <Text style={styles.emptyReviewsText}>No reviews yet</Text>
                        </View>
                    )}
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    skillText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: '500',
    },
    reviewsContainer: {
        gap: 12,
        marginTop: 8,
    },
    reviewCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    reviewerDetails: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
    },
    emptyReviews: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyReviewsText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 8,
    },
});




