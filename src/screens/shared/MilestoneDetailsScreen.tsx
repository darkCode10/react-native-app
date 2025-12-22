import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Image,
    TextInput,
    Alert,
    Modal,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAuthStore } from '@/store/user-auth-store';
import {
    getMilestoneDetailsById,
    updateMilestoneStatus,
    submitMilestone,
    deleteMilestoneSubmission,
} from '@/api/milestone-functions';
import type { MilestoneStatusType } from '@/types';
import { toast } from '@/utils/toast';
import { Button, Empty } from '@/components/ui';

type Props = {
    navigation: any;
    route: {
        params: {
            milestoneId: string;
        };
    };
};

export default function MilestoneDetailsScreen({ navigation, route }: Props) {
    const { milestoneId } = route.params;
    const { user } = userAuthStore();
    const queryClient = useQueryClient();

    const [submissionDescription, setSubmissionDescription] = useState('');
    const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<MilestoneStatusType>('LOCKED');

    const { data, isLoading, isError } = useQuery({
        queryFn: () => getMilestoneDetailsById(milestoneId),
        queryKey: ['get-milestone-details-by-id', milestoneId],
    });

    const updateStatusMutation = useMutation({
        mutationFn: updateMilestoneStatus,
        onSuccess: () => {
            toast.success('Status updated successfully');
            queryClient.invalidateQueries({
                queryKey: ['get-milestone-details-by-id', milestoneId],
            });
            setStatusModalVisible(false);
        },
        onError: (error: Error) => {
            toast.error(`Failed to update status: ${error.message}`);
        },
    });

    const submitMutation = useMutation({
        mutationFn: submitMilestone,
        onSuccess: () => {
            toast.success('Milestone submitted successfully!');
            queryClient.invalidateQueries({
                queryKey: ['get-milestone-details-by-id', milestoneId],
            });
            setSubmissionDescription('');
            setSelectedFileUri(null);
        },
        onError: (error: Error) => {
            toast.error(`Failed to submit milestone: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMilestoneSubmission,
        onSuccess: () => {
            toast.success('Submission deleted successfully');
            queryClient.invalidateQueries({
                queryKey: ['get-milestone-details-by-id', milestoneId],
            });
            setSubmissionDescription('');
            setSelectedFileUri(null);
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete submission: ${error.message}`);
        },
    });

    const handleSubmit = () => {
        if (!submissionDescription.trim()) {
            toast.error('Submission description is required');
            return;
        }

        if (!data) return;

        Alert.alert(
            'Submit Milestone',
            'Do you really want to submit this milestone?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: () => {
                        submitMutation.mutate({
                            milestoneId: milestoneId,
                            description: submissionDescription,
                            fileUri: selectedFileUri,
                            clientId: data.client.id,
                            projectTitle: data.project.title,
                            projectId: data.project.id,
                            freelancerUsername: user!.username,
                        });
                    },
                },
            ]
        );
    };

    const handleDeleteSubmission = () => {
        Alert.alert(
            'Delete Submission',
            'Do you really want to delete this submission?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteMutation.mutate(milestoneId);
                    },
                },
            ]
        );
    };

    const handleUpdateStatus = () => {
        updateStatusMutation.mutate({
            milestoneId: milestoneId,
            status: selectedStatus,
        });
    };

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

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0532A9" />
                <Text style={styles.loadingText}>Loading milestone details...</Text>
            </View>
        );
    }

    if (isError || !data) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Milestone Details</Text>
                    <View style={styles.placeholder} />
                </View>
                <Empty
                    icon="alert-circle-outline"
                    title="Error Loading Milestone"
                    message="Unable to load milestone details. Please try again."
                />
            </View>
        );
    }

    const statusSteps: MilestoneStatusType[] = ['LOCKED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED'];
    const currentStepIndex = statusSteps.indexOf(data.status);
    
    // Re-adding the missing isClient and isFreelancer definitions
    const isClient = user?.role === 'client' && user?.userId === data.client.id;
    const isFreelancer = user?.role === 'freelancer' && user?.userId === data.freelancer.id;
    const statusColors = getStatusColor(data.status);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </Pressable>
                <Text style={styles.headerTitle}>Milestone Details</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                
                {/* Status Header Card */}
                <View style={[styles.statusHeaderCard, { backgroundColor: statusColors.bg }]}>
                    <View style={styles.statusHeaderContent}>
                        <View style={styles.statusTextContainer}>
                            <Text style={[styles.statusLabel, { color: statusColors.text }]}>CURRENT STATUS</Text>
                            <Text style={[styles.statusValue, { color: statusColors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                                {data.status.replace('_', ' ')}
                            </Text>
                        </View>
                        <View style={[styles.statusIconContainer, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                            <Ionicons 
                                name={data.status === 'COMPLETED' ? 'checkmark-circle' : 'time'} 
                                size={24} 
                                color={statusColors.text} 
                            />
                        </View>
                    </View>
                    {isClient && (
                        <Pressable
                            style={[styles.statusActionButton, { backgroundColor: statusColors.text }]}
                            onPress={() => {
                                setSelectedStatus(data.status);
                                setStatusModalVisible(true);
                            }}
                        >
                            <Text style={styles.statusActionText}>Change Status</Text>
                            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                        </Pressable>
                    )}
                </View>

                {/* Main Info Card */}
                <View style={styles.card}>
                    <View style={styles.mainInfoHeader}>
                        <Text style={styles.amountLabel}>Milestone Value</Text>
                        <Text style={styles.amountValue}>Rs {data.amount.toLocaleString()}</Text>
                    </View>
                    
                    <Text style={styles.title}>{data.title}</Text>
                    <Text style={styles.description}>{data.description}</Text>

                    <View style={styles.divider} />

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text style={styles.metaText}>{new Date(data.created_at).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Project Context */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderTitle}>Project Context</Text>
                    <View style={styles.projectCard}>
                        <View style={styles.projectHeaderRow}>
                            <View style={styles.projectIconBg}>
                                <Ionicons name="briefcase" size={20} color="#0532A9" />
                            </View>
                            <View style={styles.projectHeaderText}>
                                <Text style={styles.projectTitle} numberOfLines={1}>{data.project.title}</Text>
                                <Text style={styles.projectBudget}>
                                    Budget: <Text style={styles.projectBudgetValue}>Rs {data.project.budget.toLocaleString()}</Text>
                                </Text>
                            </View>
                        </View>
                        
                        {data.project.description && (
                            <View style={styles.descriptionContainer}>
                                <Text style={styles.projectDescription} numberOfLines={3}>
                                    {data.project.description}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* People */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderTitle}>Involved</Text>
                    <View style={styles.peopleRow}>
                        <Pressable 
                            style={styles.personCardNew}
                            onPress={() => isFreelancer ? navigation.navigate('FreelancerProfile') : navigation.navigate('FreelancerDetails', { freelancerId: data.freelancer.id })}
                        >
                            <Image source={{ uri: data.freelancer.profile_pic }} style={styles.personAvatarNew} />
                            <View style={styles.personContent}>
                                <Text style={styles.personRoleNew}>FREELANCER</Text>
                                <Text style={styles.personNameNew} numberOfLines={1}>{data.freelancer.username}</Text>
                            </View>
                        </Pressable>

                        <Pressable 
                            style={styles.personCardNew}
                            onPress={() => isClient ? navigation.navigate('ClientProfile') : navigation.navigate('ClientProfile', { clientId: data.client.id })}
                        >
                            <Image source={{ uri: data.client.profile_pic }} style={styles.personAvatarNew} />
                            <View style={styles.personContent}>
                                <Text style={styles.personRoleNew}>CLIENT</Text>
                                <Text style={styles.personNameNew} numberOfLines={1}>{data.client.username}</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Freelancer Submission Section */}
                {isFreelancer && (
                    <View style={styles.submissionSection}>
                        <Text style={styles.peopleTitle}>Submission</Text>
                        <View style={styles.card}>
                            {data.status === 'LOCKED' && (
                                <View style={styles.lockedContainer}>
                                    <View style={styles.lockedIconBg}>
                                        <Ionicons name="lock-closed" size={24} color="#6B7280" />
                                    </View>
                                    <Text style={styles.lockedTitle}>Milestone Locked</Text>
                                    <Text style={styles.lockedText}>
                                        This milestone is currently locked by the client. You can start working once it's unlocked.
                                    </Text>
                                </View>
                            )}

                            {data.status === 'IN_PROGRESS' && (
                                <View>
                                    <Text style={styles.inputLabel}>Work Description</Text>
                                    <TextInput
                                        style={styles.textArea}
                                        value={submissionDescription}
                                        onChangeText={setSubmissionDescription}
                                        placeholder="Describe the work you've completed..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />

                                    <Button
                                        title="Submit Work"
                                        onPress={handleSubmit}
                                        loading={submitMutation.isPending}
                                        style={styles.submitButton}
                                        icon="send"
                                    />
                                </View>
                            )}

                            {(data.status === 'SUBMITTED' || data.status === 'COMPLETED') && (
                                <View style={styles.submissionDisplay}>
                                    <View style={styles.submissionHeader}>
                                        <View style={styles.submissionBadge}>
                                            <Ionicons name="checkmark-done" size={14} color="#059669" />
                                            <Text style={styles.submissionBadgeText}>Submitted</Text>
                                        </View>
                                        {data.status === 'SUBMITTED' && (
                                            <Pressable
                                                onPress={handleDeleteSubmission}
                                                style={styles.deleteButtonSimple}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                            </Pressable>
                                        )}
                                    </View>
                                    
                                    {data.submission_description && (
                                        <Text style={styles.submissionText}>{data.submission_description}</Text>
                                    )}
                                    
                                    {data.file && (
                                        <View style={styles.fileContainer}>
                                            <View style={styles.fileIconBg}>
                                                <Ionicons name="document-text" size={20} color="#0532A9" />
                                            </View>
                                            <Text style={styles.fileName}>{data.file.split('/').pop()}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Client Submission View */}
                {isClient && (
                    <View style={styles.submissionSection}>
                        <Text style={styles.peopleTitle}>Submission Status</Text>
                        <View style={styles.card}>
                            {data.status === 'LOCKED' && (
                                <View style={styles.lockedContainer}>
                                    <View style={styles.lockedIconBg}>
                                        <Ionicons name="lock-closed" size={24} color="#6B7280" />
                                    </View>
                                    <Text style={styles.lockedTitle}>Milestone Locked</Text>
                                    <Text style={styles.lockedText}>
                                        Unlock this milestone to allow the freelancer to start working.
                                    </Text>
                                    <Button
                                        title="Unlock Milestone"
                                        onPress={() => updateStatusMutation.mutate({ milestoneId, status: 'IN_PROGRESS' })}
                                        style={{ marginTop: 16 }}
                                        size="sm"
                                    />
                                </View>
                            )}

                            {data.status === 'IN_PROGRESS' && (
                                <View style={styles.lockedContainer}>
                                    <View style={[styles.lockedIconBg, { backgroundColor: '#E0E7FF' }]}>
                                        <Ionicons name="time" size={24} color="#0532A9" />
                                    </View>
                                    <Text style={[styles.lockedTitle, { color: '#0532A9' }]}>Work in Progress</Text>
                                    <Text style={styles.lockedText}>
                                        The freelancer is currently working on this milestone. You'll be notified when they submit.
                                    </Text>
                                </View>
                            )}

                            {(data.status === 'SUBMITTED' || data.status === 'COMPLETED') && (
                                <View style={styles.submissionDisplay}>
                                    <View style={styles.submissionHeader}>
                                        <View style={styles.submissionBadge}>
                                            <Ionicons name="checkmark-done" size={14} color="#059669" />
                                            <Text style={styles.submissionBadgeText}>
                                                {data.status === 'COMPLETED' ? 'Approved & Completed' : 'Ready for Review'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {data.submission_description && (
                                        <Text style={styles.submissionText}>{data.submission_description}</Text>
                                    )}
                                    
                                    {data.file && (
                                        <View style={styles.fileContainer}>
                                            <View style={styles.fileIconBg}>
                                                <Ionicons name="document-text" size={20} color="#0532A9" />
                                            </View>
                                            <Text style={styles.fileName}>{data.file.split('/').pop()}</Text>
                                        </View>
                                    )}

                                    {data.status === 'SUBMITTED' && (
                                        <Button
                                            title="Approve & Complete"
                                            onPress={() => updateStatusMutation.mutate({ milestoneId, status: 'COMPLETED' })}
                                            style={{ marginTop: 16, backgroundColor: '#059669' }}
                                            icon="checkmark-circle"
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Status Update Modal */}
            <Modal
                visible={statusModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Update Milestone Status</Text>
                        <Text style={styles.modalDescription}>
                            Change the current status of your milestone. This will affect the
                            freelancer's ability to work on it.
                        </Text>

                        <View style={styles.statusOptions}>
                            {(['LOCKED', 'IN_PROGRESS', 'COMPLETED'] as MilestoneStatusType[]).map(
                                (status) => (
                                    <Pressable
                                        key={status}
                                        style={[
                                            styles.statusOption,
                                            selectedStatus === status && styles.statusOptionSelected,
                                        ]}
                                        onPress={() => setSelectedStatus(status)}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                selectedStatus === status &&
                                                    styles.statusOptionTextSelected,
                                            ]}
                                        >
                                            {status.replace('_', ' ')}
                                        </Text>
                                    </Pressable>
                                )
                            )}
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                onPress={() => setStatusModalVisible(false)}
                                style={styles.modalCancelButton}
                                textStyle={styles.modalCancelButtonText}
                            />
                            <Button
                                title="Update"
                                onPress={handleUpdateStatus}
                                loading={updateStatusMutation.isPending}
                                style={styles.modalUpdateButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'ios' ? 50 : 10,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 16,
    },
    statusHeaderCard: {
        margin: 16,
        padding: 20,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    statusHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1, // Allow this section to take available space
        marginRight: 8,
    },
    statusTextContainer: {
        flex: 1, // Allow text to shrink if needed
    },
    statusIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0, // Prevent icon from shrinking
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
        opacity: 0.8,
    },
    statusValue: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusActionButton: {
        paddingHorizontal: 12, // Reduced slightly to save space
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0, // Prevent button from shrinking
    },
    statusActionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    metaGrid: {
        flexDirection: 'row',
        gap: 24,
    },
    metaItem: {
        gap: 4,
    },
    metaLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    metaValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '600',
    },
    peopleSection: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    peopleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        marginLeft: 4,
    },
    personInfo: {
        flex: 1,
        marginLeft: 12,
    },
    submissionSection: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    submissionDisplay: {
        gap: 16,
    },
    submissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    submissionBadgeText: {
        color: '#059669',
        fontSize: 13,
        fontWeight: '600',
    },
    deleteButtonSimple: {
        padding: 8,
    },
    fileIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    lockedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    projectBadgeLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginRight: 4,
    },
    updateButton: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0532A9',
        marginBottom: 12,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    projectDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    projectBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    projectBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    projectBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    peopleContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    personCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    personImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#0532A9',
        marginBottom: 12,
    },
    personName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    personRole: {
        fontSize: 12,
        color: '#6B7280',
    },
    lockedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    lockedText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        minHeight: 100,
        marginBottom: 16,
    },
    submitButton: {
        marginTop: 8,
    },
    submissionContainer: {
        marginTop: 8,
    },
    submissionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    submissionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    deleteText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#DC2626',
    },
    submissionBox: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    submissionText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fileName: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    modalDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    statusOptions: {
        gap: 8,
        marginBottom: 20,
    },
    statusOption: {
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    statusOptionSelected: {
        backgroundColor: '#E8EFFF',
        borderColor: '#0532A9',
    },
    statusOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    statusOptionTextSelected: {
        color: '#0532A9',
    },
    // New Styles for Redesign
    trackerContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    trackerLineBase: {
        position: 'absolute',
        top: 36, // Adjust based on circle size/padding
        left: 40,
        right: 40,
        height: 3,
        backgroundColor: '#F3F4F6',
        zIndex: 0,
    },
    trackerLineProgress: {
        position: 'absolute',
        top: 36,
        left: 40,
        height: 3,
        backgroundColor: '#0532A9',
        zIndex: 1,
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    stepItem: {
        alignItems: 'center',
        width: 60,
    },
    stepCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepCircleActive: {
        borderColor: '#0532A9',
        backgroundColor: '#FFFFFF',
    },
    stepCircleCompleted: {
        backgroundColor: '#0532A9',
        borderColor: '#0532A9',
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#0532A9',
        fontWeight: '700',
    },
    stepLabelCompleted: {
        color: '#0532A9',
        fontWeight: '700',
    },
    mainInfoHeader: {
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    amountLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    editStatusButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    editStatusText: {
        fontSize: 12,
        color: '#0532A9',
        fontWeight: '600',
    },
    sectionContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeaderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    projectCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    projectHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    projectIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    projectHeaderText: {
        flex: 1,
        gap: 4,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        lineHeight: 24,
    },
    projectBudget: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    projectBudgetValue: {
        color: '#0532A9',
        fontWeight: '700',
    },
    descriptionContainer: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 16,
    },
    projectDescription: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    peopleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    personCardNew: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    personAvatarNew: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    personContent: {
        flex: 1,
        gap: 2,
    },
    personRoleNew: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    personNameNew: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
    },
    fileIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fileInfo: {
        flex: 1,
    },
    fileType: {
        fontSize: 12,
        color: '#6B7280',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    modalCancelButtonText: {
        color: '#374151',
    },
    modalUpdateButton: {
        flex: 1,
    },
});

