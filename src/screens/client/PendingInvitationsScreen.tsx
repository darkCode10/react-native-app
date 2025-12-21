import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllInvitationsForProject, deleteInvitation } from '@/api/project-invitations-functions';
import { getProjectDetailsById } from '@/api/project-functions';
import { Spinner, Card, Button, Empty } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';
import { toast } from '@/utils/toast';

type Props = NativeStackScreenProps<ClientStackParamList, 'PendingInvitations'>;

export default function PendingInvitationsScreen({ route, navigation }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const queryClient = useQueryClient();

    // Fetch project details to get current members
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectDetailsById(projectId),
    });

    const { data: pendingInvitations, isLoading, isError } = useQuery({
        queryKey: ['projectInvitations', projectId],
        queryFn: () => getAllInvitationsForProject(projectId),
    });

    // Filter out freelancers who are already members
    const memberFreelancerIds = project?.project_and_freelancer_link.map(
        (item) => item.freelancer.id
    ) || [];
    
    const filteredInvitations = pendingInvitations?.filter(
        (invitation) => !memberFreelancerIds.includes(invitation.freelancer.id)
    ) || [];

    const { mutate: cancelInvite, isPending: cancelPending } = useMutation({
        mutationFn: deleteInvitation,
        onSuccess: () => {
            toast.success('Invitation cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projectInvitations', projectId] });
            queryClient.invalidateQueries({ queryKey: ['allFreelancers'] });
        },
        onError: (error: Error) => {
            console.log('Error cancelling invitation:', error.message);
            toast.error('Failed to cancel invitation');
        },
    });

    const handleCancelInvite = (invitationId: string, freelancerName: string) => {
        Alert.alert(
            'Cancel Invitation',
            `Do you want to cancel the invitation for ${freelancerName}?`,
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => {
                        console.log('[CancelInvitation] Cancelling invitation:', invitationId);
                        cancelInvite(invitationId);
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (isError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading invitations</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {filteredInvitations.length === 0 ? (
                    <Empty
                        title="No Pending Invitations"
                        description="You haven't sent any invitations for this project yet."
                        icon="📭"
                    />
                ) : (
                    <View style={styles.invitationsGrid}>
                        {filteredInvitations.map((invitation) => (
                            <Card key={invitation.id} style={styles.invitationCard}>
                                <View style={styles.cardHeader}>
                                    <Image
                                        source={{ uri: invitation.freelancer.profile_pic }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.nameContainer}>
                                        <Text style={styles.name}>{invitation.freelancer.username}</Text>
                                        <Text style={styles.statusBadge}>⏳ Pending</Text>
                                    </View>
                                </View>

                                <Text style={styles.description} numberOfLines={3}>
                                    {invitation.freelancer.description || 'No description available'}
                                </Text>

                                <View style={styles.skillsContainer}>
                                    {(invitation.freelancer.domains || []).slice(0, 4).map((domain: string, index: number) => (
                                        <View key={index} style={styles.skillChip}>
                                            <Text style={styles.skillText}>{domain}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.invitationDate}>
                                    <Text style={styles.dateLabel}>Invited on:</Text>
                                    <Text style={styles.dateText}>
                                        {new Date(invitation.created_at).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                </View>

                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="View Profile"
                                        onPress={() => {
                                            if (user?.userId === invitation.freelancer.id) {
                                                navigation.navigate('FreelancerProfile');
                                            } else {
                                                navigation.navigate('FreelancerDetails', { 
                                                    freelancerId: invitation.freelancer.id 
                                                });
                                            }
                                        }}
                                        variant="outline"
                                        style={styles.viewButton}
                                    />
                                    <Button
                                        title="Cancel Invite"
                                        onPress={() => handleCancelInvite(invitation.id, invitation.freelancer.username)}
                                        loading={cancelPending}
                                        disabled={cancelPending}
                                        style={styles.cancelButton}
                                    />
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        padding: 16,
    },
    invitationsGrid: {
        gap: 16,
    },
    invitationCard: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#0532A9',
    },
    nameContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    statusBadge: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    skillChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    skillText: {
        color: '#0532A9',
        fontSize: 12,
        fontWeight: '500',
    },
    invitationDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginBottom: 12,
    },
    dateLabel: {
        fontSize: 12,
        color: '#666',
    },
    dateText: {
        fontSize: 12,
        color: '#111',
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    viewButton: {
        flex: 1,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#EF4444',
    },
});

