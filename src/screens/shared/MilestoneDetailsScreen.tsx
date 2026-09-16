import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    TextInput,
    Alert,
    Modal,
    Platform,
    StatusBar,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAuthStore } from '@/store/user-auth-store';
import {
    getMilestoneDetailsById,
    updateMilestoneStatus,
    submitMilestone,
    deleteMilestoneSubmission,
    deleteMilestone,
} from '@/api/milestone-functions';
import { createDispute, deleteDispute } from '@/api/dispute-functions';
import { toast } from '@/utils/toast';
import { Button, Empty } from '@/components/ui';
import { MilestoneStatusType } from '@/types';

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
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store actual File object for web
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<MilestoneStatusType>('LOCKED');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeDescription, setDisputeDescription] = useState('');

    const createDisputeMutation = useMutation({
        mutationFn: createDispute,
        onSuccess: () => {
            toast.success('Dispute raised successfully');
            setShowDisputeModal(false);
            setDisputeDescription('');
            queryClient.invalidateQueries({ queryKey: ['get-milestone-details-by-id', milestoneId] });
            if (data?.project?.id) {
                queryClient.invalidateQueries({ queryKey: ['get-all-milestones-for-project', data.project.id] });
                queryClient.invalidateQueries({ queryKey: ['project', data.project.id] });
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deleteDisputeMutation = useMutation({
        mutationFn: deleteDispute,
        onSuccess: () => {
            toast.success('Dispute deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['get-milestone-details-by-id', milestoneId] });
            if (data?.project?.id) {
                queryClient.invalidateQueries({ queryKey: ['get-all-milestones-for-project', data.project.id] });
                queryClient.invalidateQueries({ queryKey: ['project', data.project.id] });
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const { data, isLoading, isError } = useQuery({
        queryFn: () => getMilestoneDetailsById(milestoneId),
        queryKey: ['get-milestone-details-by-id', milestoneId],
        refetchInterval: 5000, // Refetch every 5 seconds to catch changes from other users
        refetchIntervalInBackground: false,
        staleTime: 3000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: updateMilestoneStatus,
        onSuccess: () => {
            toast.success('Status updated successfully');
            queryClient.invalidateQueries({
                queryKey: ['get-milestone-details-by-id', milestoneId],
            });
            // Also invalidate the project's milestones list and project details
            if (data?.project?.id) {
                queryClient.invalidateQueries({
                    queryKey: ['get-all-milestones-for-project', data.project.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ['project', data.project.id],
                });
            }
            // Invalidate dashboard queries
            if (user?.userId) {
                queryClient.invalidateQueries({
                    queryKey: ['clientMilestones', user.userId],
                });
                queryClient.invalidateQueries({
                    queryKey: ['freelancerMilestones', user.userId],
                });
            }
            setStatusModalVisible(false);
        },
        onError: (error: Error) => {
            setStatusModalVisible(false);
            setTimeout(() => toast.error(`Failed to update status: ${error.message}`), 300);
        },
    });

    const submitMutation = useMutation({
        mutationFn: submitMilestone,
        onSuccess: () => {
            console.log('✅ [MilestoneDetails] Milestone submitted successfully!');
            toast.success('Milestone submitted successfully!');
            queryClient.invalidateQueries({
                queryKey: ['get-milestone-details-by-id', milestoneId],
            });
            // Also invalidate the project's milestones list and project details
            if (data?.project?.id) {
                queryClient.invalidateQueries({
                    queryKey: ['get-all-milestones-for-project', data.project.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ['project', data.project.id],
                });
            }
            // Invalidate dashboard queries
            if (user?.userId) {
                queryClient.invalidateQueries({
                    queryKey: ['clientMilestones', user.userId],
                });
                queryClient.invalidateQueries({
                    queryKey: ['freelancerMilestones', user.userId],
                });
            }
            setSubmissionDescription('');
            setSelectedFileUri(null);
            setSelectedFileName(null);
        },
        onError: (error: any) => {
            console.error('❌ [MilestoneDetails] Submit error:', error);
            toast.error(error?.message || 'Failed to submit milestone');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMilestoneSubmission,
        onSuccess: () => {
            console.log('✅ [MilestoneDetails] Submission deleted successfully');
            toast.success('Submission deleted successfully');
            queryClient.invalidateQueries({
                queryKey: ['get-milestone-details-by-id', milestoneId],
            });
            // Also invalidate the project's milestones list and project details
            if (data?.project?.id) {
                queryClient.invalidateQueries({
                    queryKey: ['get-all-milestones-for-project', data.project.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ['project', data.project.id],
                });
            }
            // Invalidate dashboard queries
            if (user?.userId) {
                queryClient.invalidateQueries({
                    queryKey: ['clientMilestones', user.userId],
                });
                queryClient.invalidateQueries({
                    queryKey: ['freelancerMilestones', user.userId],
                });
            }
            setSubmissionDescription('');
            setSelectedFileUri(null);
            setSelectedFileName(null);
        },
        onError: (error: Error) => {
            console.error('❌ [MilestoneDetails] Delete submission error:', error);
            toast.error(`Failed to delete submission: ${error.message}`);
        },
    });

    const deleteMilestoneMutation = useMutation({
        mutationFn: async (params: { milestoneId: string; milestoneAmount: number; projectId: string }) => {
            console.log('🗑️ [Mutation] mutationFn called with params:', params);
            await deleteMilestone(params);
            console.log('🗑️ [Mutation] deleteMilestone completed');
        },
        onSuccess: () => {
            console.log('🗑️ [Mutation] ✅ onSuccess called');
            toast.success('Milestone deleted successfully');
            // Invalidate project queries to update budget
            if (data?.project?.id) {
                queryClient.invalidateQueries({
                    queryKey: ['get-all-milestones-for-project', data.project.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ['project', data.project.id],
                });
            }
            // Invalidate dashboard queries
            if (user?.userId) {
                queryClient.invalidateQueries({
                    queryKey: ['clientMilestones', user.userId],
                });
                queryClient.invalidateQueries({
                    queryKey: ['clientProjects', user.userId],
                });
            }
            // Navigate back after successful deletion
            console.log('🗑️ [Mutation] Navigating back...');
            navigation.goBack();
        },
        onError: (error: Error) => {
            console.error('🗑️ [Mutation] ❌ onError called:', error);
            console.error('🗑️ [Mutation] Error message:', error.message);
            toast.error(`Failed to delete milestone: ${error.message}`);
        },
    });

    const handleSubmit = () => {
        console.log('==========================================');
        console.log('[MilestoneDetails] SUBMIT BUTTON CLICKED!');
        console.log('==========================================');
        
        if (!submissionDescription.trim()) {
            console.log('[MilestoneDetails] Validation failed: No description');
            toast.error('Submission description is required');
            return;
        }

        if (!data) {
            console.error('[MilestoneDetails] Validation failed: No milestone data');
            toast.error('Milestone data not loaded');
            return;
        }

        console.log('[MilestoneDetails] Validation passed');
        console.log('[MilestoneDetails] Params:', {
            milestoneId,
            description: submissionDescription,
            hasFile: !!selectedFileUri,
            clientId: data.client.id,
            projectTitle: data.project.title,
            projectId: data.project.id,
            freelancerUsername: user?.username,
        });
        
        // DIRECT SUBMISSION - NO ALERT (for testing)
        console.log('[MilestoneDetails] Calling mutation directly...');
        submitMutation.mutate({
            milestoneId: milestoneId,
            description: submissionDescription,
            fileUri: selectedFileUri,
            file: selectedFile, // Pass actual File object for web
            clientId: data.client.id,
            projectTitle: data.project.title,
            projectId: data.project.id,
            freelancerUsername: user!.username,
        });
    };

    const handleDeleteSubmission = () => {
        console.log('🗑️ [handleDeleteSubmission] Delete button pressed for milestone:', milestoneId);
        console.log('🗑️ [handleDeleteSubmission] isFreelancer:', isFreelancer);
        console.log('🗑️ [handleDeleteSubmission] data.status:', data?.status);
        
        Alert.alert(
            'Delete Submission',
            'Are you sure you want to delete this submission? You can resubmit later.',
            [
                { 
                    text: 'Cancel', 
                    style: 'cancel',
                    onPress: () => {
                        console.log('🗑️ [handleDeleteSubmission] User cancelled');
                    }
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        console.log('🗑️ [handleDeleteSubmission] User confirmed, calling mutation...');
                        deleteMutation.mutate(milestoneId);
                    },
                },
            ]
        );
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFileUri(file.uri);
                setSelectedFileName(file.name);
                // On web, DocumentPicker may provide the actual File object
                if ((file as any).file) {
                    setSelectedFile((file as any).file);
                }
                toast.success('File selected successfully');
            }
        } catch (error) {
            console.error('Error picking document:', error);
            toast.error('Failed to pick document');
        }
    };

    const handleRemoveFile = () => {
        setSelectedFileUri(null);
        setSelectedFileName(null);
    };

    const handleDownloadFile = async () => {
        if (!data?.file) return;

        try {
            // Force download behavior by appending ?download parameter
            // This tells Supabase/Browser to treat it as an attachment
            const downloadUrl = data.file.includes('?') 
                ? `${data.file}&download` 
                : `${data.file}?download`;
            
            console.log('🔗 [handleDownloadFile] Opening URL:', downloadUrl);
            
            const supported = await Linking.canOpenURL(downloadUrl);
            if (supported) {
                await Linking.openURL(downloadUrl);
            } else {
                toast.error('Cannot open file URL');
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to open file');
        }
    };

    const handleDeleteMilestone = () => {
        console.log('🗑️ [handleDeleteMilestone] Function called');
        console.log('🗑️ [handleDeleteMilestone] Data:', data ? 'exists' : 'null');
        console.log('🗑️ [handleDeleteMilestone] Status:', data?.status);
        
        if (!data) {
            console.log('🗑️ [handleDeleteMilestone] No data, returning');
            return;
        }

        // Only allow deletion if milestone is LOCKED
        if (data.status !== 'LOCKED') {
            console.log('🗑️ [handleDeleteMilestone] Status is not LOCKED, showing error');
            toast.error('Only locked milestones can be deleted');
            return;
        }

        console.log('🗑️ [handleDeleteMilestone] Showing confirmation modal');
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        console.log('🗑️🗑️🗑️ [confirmDelete] DELETE CONFIRMED! 🗑️🗑️🗑️');
        console.log('🗑️ Milestone ID:', milestoneId);
        console.log('🗑️ Milestone amount:', data?.amount);
        console.log('🗑️ Project ID:', data?.project?.id);
        
        setShowDeleteConfirm(false);
        
        if (data) {
            console.log('🗑️ Calling deleteMilestoneMutation.mutate...');
            deleteMilestoneMutation.mutate({
                milestoneId: milestoneId,
                milestoneAmount: data.amount,
                projectId: data.project.id,
            });
            console.log('🗑️ Mutation called successfully');
        }
    };

    const handleUpdateStatus = () => {
        // Validation: Check if the status transition is valid
        if (!data) return;

        const currentStatus = data.status;
        
        // Rule 1: Can't go directly from LOCKED to COMPLETED (must go through IN_PROGRESS)
        if (currentStatus === 'LOCKED' && selectedStatus === 'COMPLETED') {
            setStatusModalVisible(false);
            setTimeout(() => toast.error('Cannot complete a locked milestone. Please unlock it first.'), 300);
            return;
        }

        // Rule 2: Can't go backwards from IN_PROGRESS to LOCKED
        if (currentStatus === 'IN_PROGRESS' && selectedStatus === 'LOCKED') {
            setStatusModalVisible(false);
            setTimeout(() => toast.error('Cannot lock a milestone that is already in progress.'), 300);
            return;
        }

        // Rule 3: Can't go backwards from SUBMITTED
        if (currentStatus === 'SUBMITTED' && (selectedStatus === 'LOCKED' || selectedStatus === 'IN_PROGRESS')) {
            setStatusModalVisible(false);
            setTimeout(() => toast.error('Cannot change status backwards from submitted. Please delete the submission first.'), 300);
            return;
        }

        // Rule 4: Can't go backwards from COMPLETED
        if (currentStatus === 'COMPLETED') {
            setStatusModalVisible(false);
            setTimeout(() => toast.error('Cannot change status of a completed milestone.'), 300);
            return;
        }

        // Rule 5: Cannot complete milestone without submitted work
        if (selectedStatus === 'COMPLETED' && !data.submission_description && !data.file) {
            setStatusModalVisible(false);
            setTimeout(() => toast.error('Cannot complete milestone. No work has been submitted yet.'), 300);
            return;
        }

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

    const getValidStatusOptions = (currentStatus: MilestoneStatusType): MilestoneStatusType[] => {
        switch (currentStatus) {
            case 'LOCKED':
                // From LOCKED, can only go to IN_PROGRESS
                return ['LOCKED', 'IN_PROGRESS'];
            case 'IN_PROGRESS':
                // From IN_PROGRESS, can go to COMPLETED (or stay IN_PROGRESS)
                return ['IN_PROGRESS', 'COMPLETED'];
            case 'SUBMITTED':
                // From SUBMITTED, can only go to COMPLETED (or stay SUBMITTED)
                return ['SUBMITTED', 'COMPLETED'];
            case 'COMPLETED':
                // COMPLETED is final, cannot change
                return ['COMPLETED'];
            default:
                return ['LOCKED', 'IN_PROGRESS', 'COMPLETED'];
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
                <View style={styles.errorState}>
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Error Loading Milestone</Text>
                    <Text style={styles.errorMessage}>Unable to load milestone details. Please try again.</Text>
                </View>
            </View>
        );
    }

    const statusSteps: MilestoneStatusType[] = ['LOCKED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED'];
    const currentStepIndex = statusSteps.indexOf(data.status);
    
    // Re-adding the missing isClient and isFreelancer definitions
    const isClient = user?.role === 'client' && user?.userId === data.client.id;
    const isFreelancer = user?.role === 'freelancer' && user?.userId === data.freelancer.id;
    const statusColors = getStatusColor(data.status);

    console.log('[MilestoneDetails] User role:', user?.role);
    console.log('[MilestoneDetails] User ID:', user?.userId);
    console.log('[MilestoneDetails] Freelancer ID:', data.freelancer.id);
    console.log('[MilestoneDetails] Client ID:', data.client.id);
    console.log('[MilestoneDetails] isFreelancer:', isFreelancer);
    console.log('[MilestoneDetails] isClient:', isClient);
    console.log('[MilestoneDetails] Milestone status:', data.status);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                
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
                        (data.status === 'COMPLETED' || data.status === 'DISPUTED') ? (
                            <View style={[styles.statusActionButton, { backgroundColor: '#D1D5DB', opacity: 0.6 }]}>
                                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                                <Text style={styles.statusActionText}>Locked</Text>
                            </View>
                        ) : (
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
                        )
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
                            {data.status === 'DISPUTED' && (
                                <View style={[styles.lockedContainer, { backgroundColor: '#FEF2F2' }]}>
                                    <View style={[styles.lockedIconBg, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="alert-circle" size={24} color="#DC2626" />
                                    </View>
                                    <Text style={[styles.lockedTitle, { color: '#DC2626' }]}>Dispute Raised</Text>
                                    <Text style={styles.lockedText}>
                                        This milestone is currently under dispute. Admins have been notified.
                                    </Text>
                                    <Button
                                        title="Delete Dispute"
                                        onPress={() => {
                                            console.log('🗑️ [Delete Dispute] Button pressed - calling mutation directly');
                                            deleteDisputeMutation.mutate({
                                                milestoneId,
                                                projectId: data.project.id
                                            });
                                        }}
                                        style={{ marginTop: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DC2626' }}
                                        textStyle={{ color: '#DC2626', fontWeight: '600' }}
                                        loading={deleteDisputeMutation.isPending}
                                    />
                                </View>
                            )}

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
                                <View style={styles.submissionFormCard}>
                                    <View style={[styles.submissionFormHeader, { backgroundColor: '#EFF6FF', borderBottomWidth: 0, paddingVertical: 20 }]}>
                                        <View style={[styles.formIconCircle, { backgroundColor: '#FFFFFF', width: 48, height: 48 }]}>
                                            <Ionicons name="cloud-upload" size={24} color="#2563EB" />
                                        </View>
                                        <View style={{flex: 1}}>
                                            <Text style={[styles.formTitle, { fontSize: 18, color: '#1E3A8A' }]}>Submit Your Work</Text>
                                            <Text style={styles.formSubtitle}>Upload files and describe your progress to complete this milestone.</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.formContent}>
                                        <Text style={styles.inputLabel}>Work Description <Text style={{color: '#EF4444'}}>*</Text></Text>
                                        <TextInput
                                            style={[styles.textArea, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, shadowOffset: {width: 0, height: 1}, elevation: 1 }]}
                                            value={submissionDescription}
                                            onChangeText={setSubmissionDescription}
                                            placeholder="Describe the work you've completed for this milestone..."
                                            placeholderTextColor="#94A3B8"
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                        />

                                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Attach File (Optional)</Text>
                                        
                                        {selectedFileName ? (
                                            <View style={[styles.selectedFileContainer, { backgroundColor: '#F0F9FF', borderColor: '#BFDBFE' }]}>
                                                <View style={[styles.fileIconBg, { backgroundColor: '#FFFFFF' }]}>
                                                    <Ionicons name="document-text" size={24} color="#2563EB" />
                                                </View>
                                                <View style={{flex: 1}}>
                                                    <Text style={[styles.selectedFileName, { color: '#1E3A8A' }]} numberOfLines={1}>
                                                        {selectedFileName}
                                                    </Text>
                                                    <Text style={styles.fileType}>Ready to upload</Text>
                                                </View>
                                                <Pressable onPress={handleRemoveFile} style={styles.removeFileButton}>
                                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                                </Pressable>
                                            </View>
                                        ) : (
                                            <Pressable style={[styles.filePickerButton, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]} onPress={handlePickDocument}>
                                                <View style={[styles.uploadIconContainer, { backgroundColor: '#EFF6FF' }]}>
                                                    <Ionicons name="cloud-upload-outline" size={28} color="#3B82F6" />
                                                </View>
                                                <Text style={[styles.filePickerText, { color: '#334155' }]}>Tap to choose a file</Text>
                                                <Text style={styles.filePickerSubtext}>Supports all standard file formats</Text>
                                            </Pressable>
                                        )}

                                        <Pressable
                                            onPress={handleSubmit}
                                            disabled={submitMutation.isPending}
                                            style={({ pressed }) => [
                                                {
                                                    marginTop: 24,
                                                    backgroundColor: pressed ? '#1E40AF' : '#2563EB',
                                                    paddingVertical: 16,
                                                    paddingHorizontal: 24,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minHeight: 56,
                                                    opacity: submitMutation.isPending ? 0.6 : 1,
                                                    elevation: 4,
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 3.84,
                                                }
                                            ]}
                                        >
                                            {submitMutation.isPending ? (
                                                <ActivityIndicator color="#FFF" size="small" />
                                            ) : (
                                                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>Submit Work</Text>
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {(data.status === 'SUBMITTED' || data.status === 'COMPLETED') && (
                                <View style={styles.submissionDisplay}>
                                    <View style={styles.trackerContainer}>
                                        <View style={styles.trackerLineBase} />
                                        <View 
                                            style={[
                                                styles.trackerLineProgress, 
                                                data.status === 'COMPLETED' ? { right: 40 } : { right: '50%' }
                                            ]} 
                                        />
                                        <View style={styles.stepsRow}>
                                            <View style={styles.stepItem}>
                                                <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                                                    <Ionicons name="checkmark" size={14} color="#FFF" />
                                                </View>
                                                <Text style={styles.stepLabelActive}>Submitted</Text>
                                            </View>
                                            <View style={styles.stepItem}>
                                                <View style={[styles.stepCircle, data.status === 'COMPLETED' ? styles.stepCircleCompleted : styles.stepCircleActive]}>
                                                    {data.status === 'COMPLETED' ? (
                                                        <Ionicons name="checkmark" size={14} color="#FFF" />
                                                    ) : (
                                                        <View style={styles.stepDot} />
                                                    )}
                                                </View>
                                                <Text style={data.status === 'COMPLETED' ? styles.stepLabelActive : styles.stepLabelPending}>Approved</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.submissionContent}>
                                        <Text style={styles.submissionLabel}>Submission Description</Text>
                                        <View style={styles.submissionTextBox}>
                                            <Text style={styles.submissionText}>
                                                {data.submission_description || 'No description provided.'}
                                            </Text>
                                        </View>

                                        {data.file && (
                                            <>
                                                <Text style={[styles.submissionLabel, { marginTop: 16 }]}>Attached File</Text>
                                                <TouchableOpacity 
                                                    style={styles.fileContainer}
                                                    onPress={handleDownloadFile}
                                                >
                                                    <View style={styles.fileIconBg}>
                                                        <Ionicons name="document-text" size={24} color="#0532A9" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.fileName}>{data.file.split('/').pop()}</Text>
                                                        <Text style={styles.fileType}>Click to download</Text>
                                                    </View>
                                                    <Ionicons name="cloud-download-outline" size={20} color="#6B7280" />
                                                </TouchableOpacity>
                                            </>
                                        )}

                                        {data.status === 'SUBMITTED' && (
                                            <View style={{ marginTop: 24, gap: 12 }}>
                                                <Button
                                                    title="Raise Dispute"
                                                    onPress={() => setShowDisputeModal(true)}
                                                    style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#DC2626' }}
                                                    textStyle={{ color: '#DC2626', fontWeight: '600' }}
                                                />
                                                <Button
                                                    title="Delete Submission"
                                                    onPress={handleDeleteSubmission}
                                                    style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECACA' }}
                                                    textStyle={{ color: '#DC2626', fontWeight: '600' }}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </View>
                                        )}
                                    </View>
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
                            {data.status === 'DISPUTED' && (
                                <View style={[styles.lockedContainer, { backgroundColor: '#FEF2F2' }]}>
                                    <View style={[styles.lockedIconBg, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="alert-circle" size={24} color="#DC2626" />
                                    </View>
                                    <Text style={[styles.lockedTitle, { color: '#DC2626' }]}>Dispute Raised</Text>
                                    <Text style={styles.lockedText}>
                                        This milestone is currently under dispute. Admins have been notified.
                                    </Text>
                                </View>
                            )}

                            {data.status === 'LOCKED' && (
                                <View style={styles.lockedContainer}>
                                    <View style={styles.lockedIconBg}>
                                        <Ionicons name="lock-closed" size={24} color="#6B7280" />
                                    </View>
                                    <Text style={styles.lockedTitle}>Milestone Locked</Text>
                                    <Text style={styles.lockedText}>
                                        Unlock this milestone to allow the freelancer to start working.
                                    </Text>
                                    <View style={styles.lockedButtonsContainer}>
                                        <Button
                                            title="Unlock Milestone"
                                            onPress={() => {
                                                Alert.alert(
                                                    'Unlock Milestone',
                                                    'Are you sure you want to unlock this milestone? The freelancer will be notified and can start working.',
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        {
                                                            text: 'Unlock',
                                                            onPress: () => {
                                                                console.log('Unlock confirmed');
                                                                updateStatusMutation.mutate({ milestoneId, status: 'IN_PROGRESS' });
                                                            }
                                                        }
                                                    ]
                                                );
                                            }}
                                            style={styles.unlockButton}
                                            textStyle={{ fontWeight: '700', fontSize: 13 }}
                                        />
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => {
                                                console.log('🗑️🗑️🗑️ DELETE BUTTON PRESSED! 🗑️🗑️🗑️');
                                                handleDeleteMilestone();
                                            }}
                                            disabled={deleteMilestoneMutation.isPending}
                                            activeOpacity={0.7}
                                        >
                                            {deleteMilestoneMutation.isPending ? (
                                                <ActivityIndicator size="small" color="#DC2626" />
                                            ) : (
                                                <>
                                                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
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
                                    <View style={styles.trackerContainer}>
                                        <View style={styles.trackerLineBase} />
                                        <View 
                                            style={[
                                                styles.trackerLineProgress, 
                                                data.status === 'COMPLETED' ? { right: 40 } : { right: '50%' }
                                            ]} 
                                        />
                                        <View style={styles.stepsRow}>
                                            <View style={styles.stepItem}>
                                                <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                                                    <Ionicons name="checkmark" size={14} color="#FFF" />
                                                </View>
                                                <Text style={styles.stepLabelActive}>Submitted</Text>
                                            </View>
                                            <View style={styles.stepItem}>
                                                <View style={[styles.stepCircle, data.status === 'COMPLETED' ? styles.stepCircleCompleted : styles.stepCircleActive]}>
                                                    {data.status === 'COMPLETED' ? (
                                                        <Ionicons name="checkmark" size={14} color="#FFF" />
                                                    ) : (
                                                        <View style={styles.stepDot} />
                                                    )}
                                                </View>
                                                <Text style={data.status === 'COMPLETED' ? styles.stepLabelActive : styles.stepLabelPending}>Approved</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.submissionContent}>
                                        <Text style={styles.submissionLabel}>Submission Description</Text>
                                        <View style={styles.submissionTextBox}>
                                            <Text style={styles.submissionText}>
                                                {data.submission_description || 'No description provided.'}
                                            </Text>
                                        </View>
                                        
                                        {data.file && (
                                            <>
                                                <Text style={[styles.submissionLabel, { marginTop: 16 }]}>Attached File</Text>
                                                <TouchableOpacity 
                                                    style={styles.fileContainer}
                                                    onPress={handleDownloadFile}
                                                >
                                                    <View style={styles.fileIconBg}>
                                                        <Ionicons name="document-text" size={24} color="#0532A9" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.fileName}>{data.file.split('/').pop()}</Text>
                                                        <Text style={styles.fileType}>Click to download</Text>
                                                    </View>
                                                    <Ionicons name="cloud-download-outline" size={20} color="#6B7280" />
                                                </TouchableOpacity>
                                            </>
                                        )}

                                        {data.status === 'SUBMITTED' && (
                                            <View style={styles.approvalActions}>
                                                <Button
                                                    title="Approve"
                                                    onPress={() => updateStatusMutation.mutate({ milestoneId, status: 'COMPLETED' })}
                                                    style={styles.approveButton}
                                                    size="lg"
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Dispute Modal */}
            <Modal
                visible={showDisputeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDisputeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Raise Dispute</Text>
                        <Text style={styles.modalDescription}>
                            Please describe the issue. Raising a dispute will lock the project and notify the admins.
                        </Text>

                        <TextInput
                            style={[styles.submissionTextBox, { height: 120, textAlignVertical: 'top' }]}
                            multiline
                            numberOfLines={4}
                            placeholder="Describe your issue..."
                            value={disputeDescription}
                            onChangeText={setDisputeDescription}
                        />

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                onPress={() => setShowDisputeModal(false)}
                                style={styles.modalCancelButton}
                                textStyle={styles.modalCancelButtonText}
                            />
                            <Button
                                title="Submit Dispute"
                                onPress={() => {
                                    if (!disputeDescription.trim()) {
                                        toast.error('Please enter a description');
                                        return;
                                    }
                                    createDisputeMutation.mutate({
                                        projectId: data.project.id,
                                        milestoneId: milestoneId,
                                        clientId: data.client.id,
                                        freelancerId: user!.userId,
                                        disputeDescription: disputeDescription,
                                        freelancerUsername: user!.username,
                                        projectTitle: data.project.title,
                                    });
                                }}
                                loading={createDisputeMutation.isPending}
                                style={styles.modalUpdateButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

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
                            Select a new status for this milestone. Only valid transitions are shown based on the current status.
                        </Text>

                        <View style={styles.statusOptions}>
                            {getValidStatusOptions(data.status).map(
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

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteConfirm(false)}
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={styles.deleteModalContent}>
                        <View style={styles.deleteModalHeader}>
                            <View style={styles.deleteIconContainer}>
                                <Ionicons name="warning" size={32} color="#DC2626" />
                            </View>
                            <Text style={styles.deleteModalTitle}>Delete Milestone?</Text>
                            <Text style={styles.deleteModalMessage}>
                                Are you sure you want to delete this milestone? The milestone amount will be returned to the project budget.
                            </Text>
                        </View>

                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={styles.deleteCancelButton}
                                onPress={() => {
                                    console.log('🗑️ Cancel pressed');
                                    setShowDeleteConfirm(false);
                                }}
                            >
                                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteConfirmButton}
                                onPress={confirmDelete}
                                disabled={deleteMilestoneMutation.isPending}
                            >
                                {deleteMilestoneMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                                )}
                            </TouchableOpacity>
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
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    submissionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
    },
    submissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeSubmitted: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    badgeCompleted: {
        backgroundColor: '#ECFDF5',
        borderColor: '#D1FAE5',
    },
    submissionBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    deleteButtonSimple: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
    },
    submissionContent: {
        padding: 16,
    },
    submissionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    submissionTextBox: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    submissionText: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 24,
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F0F9FF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 2,
    },
    fileIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    fileType: {
        fontSize: 12,
        color: '#60A5FA',
    },
    approvalActions: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    approveButton: {
        backgroundColor: '#059669',
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
    lockedButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        width: '100%',
        paddingHorizontal: 20,
    },
    unlockButton: {
        flex: 1,
        backgroundColor: '#10B981', // Green color for positive action
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#DC2626',
        backgroundColor: '#FEF2F2',
        minWidth: 110,
        minHeight: 44, // Ensure minimum touch target
    },
    deleteButtonPressed: {
        opacity: 0.7,
        backgroundColor: '#FEE2E2',
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626',
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
        marginTop: 24,
    },
    // Freelancer Submission Form Styles
    submissionFormCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    submissionFormHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
    },
    formIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    formSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    formContent: {
        padding: 16,
    },
    uploadIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    filePickerButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        marginTop: 8,
    },
    filePickerText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0532A9',
        marginBottom: 4,
    },
    filePickerSubtext: {
        fontSize: 13,
        color: '#6B7280',
    },
    selectedFileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 12,
        padding: 12,
        gap: 12,
        marginTop: 8,
    },
    selectedFileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 2,
    },
    removeFileButton: {
        padding: 4,
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
        position: 'relative', // Added for absolute positioning of children
    },
    deleteButtonFloating: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
        zIndex: 10,
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
    stepLabelPending: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        textAlign: 'center',
    },
    stepLabelActive: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0532A9',
        textAlign: 'center',
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
    // Delete Modal Styles
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    deleteModalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    deleteIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    deleteModalMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteCancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    deleteConfirmButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    deleteConfirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

