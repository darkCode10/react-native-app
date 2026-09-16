import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMilestone } from '@/api/milestone-functions';
import { getProjectDetailsById } from '@/api/project-functions';
import { Button, Spinner } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<ClientStackParamList, 'CreateMilestone'>;

export default function CreateMilestoneScreen({ route, navigation }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectDetailsById(projectId),
    });

    const { mutate: createMilestoneMutation, isPending } = useMutation({
        mutationFn: createMilestone,
        onSuccess: () => {
            toast.success('Milestone created successfully');
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['get-all-milestones-for-project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['clientMilestones', user?.userId] });
            queryClient.invalidateQueries({ queryKey: ['clientProjects', user?.userId] });
            navigation.goBack();
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create milestone');
        },
    });

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error('Please enter a milestone title');
            return;
        }
        if (!description.trim()) {
            toast.error('Please enter a description');
            return;
        }
        if (!budget || parseFloat(budget) <= 0) {
            toast.error('Please enter a valid budget');
            return;
        }
        if (!assignedTo) {
            toast.error('Please select a freelancer');
            return;
        }

        if (!project) {
            toast.error('Project not found');
            return;
        }

        // Check if milestone budget exceeds project's available budget
        if (parseFloat(budget) > project.budget) {
            toast.error(`Milestone budget ($${parseFloat(budget)}) exceeds available project budget ($${project.budget})`);
            return;
        }

        const milestoneObj = {
            projectId,
            title: title.trim(),
            description: description.trim(),
            amount: parseFloat(budget),
            freelancerId: assignedTo,
            clientId: user!.userId,
            clientUsername: user!.username,
            projectTitle: project.title,
        };

        createMilestoneMutation(milestoneObj);
    };

    if (projectLoading) {
        return <Spinner fullScreen />;
    }

    if (!project) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Project not found</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="flag-outline" size={32} color="#0532A9" />
                        <Text style={styles.headerTitle}>Create Milestone</Text>
                        <Text style={styles.headerSubtitle}>
                            Add a new milestone for {project.title}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Title Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Milestone Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g., Complete Homepage Design"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe what needs to be completed..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Budget Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Budget ($) *</Text>
                                <Text style={styles.availableBudget}>
                                    Available: ${project.budget?.toLocaleString() || '0'}
                                </Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={budget}
                                onChangeText={setBudget}
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="decimal-pad"
                            />
                        </View>

                        {/* Assign To */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Assign To *</Text>
                            {project.project_and_freelancer_link.length === 0 ? (
                                <View style={styles.noFreelancers}>
                                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                                    <Text style={styles.noFreelancersText}>
                                        No freelancers hired yet
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.freelancerList}>
                                    {project.project_and_freelancer_link.map((link) => (
                                        <Pressable
                                            key={link.freelancer.id}
                                            style={[
                                                styles.freelancerOption,
                                                assignedTo === link.freelancer.id && styles.freelancerOptionSelected,
                                            ]}
                                            onPress={() => setAssignedTo(link.freelancer.id)}
                                        >
                                            <View style={styles.radioButton}>
                                                {assignedTo === link.freelancer.id && (
                                                    <View style={styles.radioButtonInner} />
                                                )}
                                            </View>
                                            <Text style={styles.freelancerName}>
                                                {link.freelancer.username}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Submit Button */}
                        <View style={styles.actions}>
                            <Button
                                title="Cancel"
                                onPress={() => navigation.goBack()}
                                variant="outline"
                                style={styles.cancelButton}
                            />
                            <Button
                                title="Create Milestone"
                                onPress={handleSubmit}
                                loading={isPending}
                                disabled={isPending || project.project_and_freelancer_link.length === 0}
                                style={styles.submitButton}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    availableBudget: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111827',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    noFreelancers: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        gap: 8,
    },
    noFreelancersText: {
        fontSize: 14,
        color: '#6B7280',
    },
    freelancerList: {
        gap: 12,
    },
    freelancerOption: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
    },
    freelancerOptionSelected: {
        borderColor: '#0532A9',
        backgroundColor: '#EFF6FF',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#0532A9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0532A9',
    },
    freelancerName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    cancelButton: {
        flex: 1,
    },
    submitButton: {
        flex: 1,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 32,
    },
});

