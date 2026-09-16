import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Pressable,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReview, checkReviewExistence } from '@/api/review-functions';
import { toast } from '@/utils/toast';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    freelancerId: string;
    freelancerName: string;
    clientId: string;
    projectId: string;
    projectTitle: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    visible,
    onClose,
    freelancerId,
    freelancerName,
    clientId,
    projectId,
    projectTitle,
}) => {
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');
    const [starsCount, setStarsCount] = useState(1);

    // Check if review already exists
    const { data: existingReview, isLoading, isError } = useQuery({
        queryKey: ['check-review-existence', clientId, freelancerId, projectId],
        queryFn: () => checkReviewExistence({ clientId, freelancerId, projectId }),
        enabled: visible, // Only fetch when modal is visible
    });

    // Create review mutation
    const { isPending, mutate } = useMutation({
        mutationFn: createReview,
        onSuccess: () => {
            toast.success('Review created successfully');
            onClose();
            setComment('');
            setStarsCount(1);
            
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: ['freelancer-reviews', freelancerId],
            });
            queryClient.invalidateQueries({
                queryKey: ['check-review-existence', clientId, freelancerId, projectId],
            });
        },
        onError: (error: any) => {
            if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
                toast.error('You have already submitted a review for this project.');
                // Refresh the state to show the existing review
                queryClient.invalidateQueries({
                    queryKey: ['check-review-existence', clientId, freelancerId, projectId],
                });
            } else {
                toast.error(error.message || 'Failed to create review');
            }
        },
    });

    const handleSubmitReview = () => {
        if (!comment.trim()) {
            toast.error('Please write a comment');
            return;
        }

        mutate({
            clientId,
            freelancerId,
            stars: starsCount,
            comment: comment.trim(),
            projectId,
        });
    };

    const renderStars = (count: number, interactive: boolean = false) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => interactive && setStarsCount(star)}
                        disabled={!interactive}
                    >
                        <Ionicons
                            name={star <= count ? 'star' : 'star-outline'}
                            size={24}
                            color="#3B82F6"
                        />
                    </Pressable>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Ionicons name="star" size={24} color="#3B82F6" />
                                <Text style={styles.headerTitle}>
                                    Give Review for {freelancerName}
                                </Text>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </Pressable>
                        </View>

                        {/* Subtitle */}
                        <Text style={styles.subtitle}>
                            Tell about your working experience with {freelancerName} and rate it by
                            giving stars.
                        </Text>

                        {/* Project Info */}
                        <View style={styles.projectInfo}>
                            <Text style={styles.projectInfoText}>
                                Review for project: {projectTitle}
                            </Text>
                        </View>

                        {/* Loading State */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        )}

                        {/* Error State */}
                        {isError && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>Failed to check review status</Text>
                            </View>
                        )}

                        {/* New Review Form */}
                        {!isLoading && !isError && existingReview === false && (
                            <View style={styles.formContainer}>
                                {/* Comment Input */}
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Type your review..."
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />

                                {/* Stars Rating */}
                                <View style={styles.starsSection}>
                                    <Text style={styles.starsLabel}>
                                        How many stars would you give?
                                    </Text>
                                    {renderStars(starsCount, true)}
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.buttonContainer}>
                                    <Pressable
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={() => {
                                            setComment('');
                                            setStarsCount(1);
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </Pressable>

                                    <Pressable
                                        style={[
                                            styles.button,
                                            styles.submitButton,
                                            (isPending || !comment.trim()) && styles.disabledButton,
                                        ]}
                                        onPress={handleSubmitReview}
                                        disabled={isPending || !comment.trim()}
                                    >
                                        {isPending ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={18} color="#FFF" />
                                                <Text style={styles.submitButtonText}>Submit</Text>
                                            </>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        {/* Existing Review Display */}
                        {!isLoading && !isError && existingReview !== false && existingReview && (
                            <View style={styles.existingReviewContainer}>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoText}>
                                        You have already submitted a review for this project
                                    </Text>
                                </View>

                                {/* Comment Display */}
                                {existingReview.comment && (
                                    <View style={styles.commentDisplay}>
                                        <Text style={styles.commentDisplayTitle}>Your comment</Text>
                                        <Text style={styles.commentDisplayText}>
                                            {existingReview.comment}
                                        </Text>
                                    </View>
                                )}

                                {/* Stars Display */}
                                {existingReview.stars && (
                                    <View style={styles.starsDisplayContainer}>
                                        {renderStars(existingReview.stars, false)}
                                        <Text style={styles.starsDisplayText}>
                                            {existingReview.stars}/5 stars
                                        </Text>
                                    </View>
                                )}

                                {/* Close Button */}
                                <Pressable
                                    style={[styles.button, styles.cancelButton, styles.fullWidthButton]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>Close</Text>
                                </Pressable>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3B82F6',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    projectInfo: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    projectInfoText: {
        fontSize: 14,
        color: '#1F2937',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    errorContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
    },
    formContainer: {
        gap: 16,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 120,
        backgroundColor: '#FFF',
    },
    starsSection: {
        gap: 8,
    },
    starsLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
    existingReviewContainer: {
        gap: 16,
    },
    infoBox: {
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    commentDisplay: {
        gap: 4,
    },
    commentDisplayTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    commentDisplayText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 20,
    },
    starsDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    starsDisplayText: {
        fontSize: 12,
        color: '#6B7280',
    },
    fullWidthButton: {
        marginTop: 8,
    },
});

