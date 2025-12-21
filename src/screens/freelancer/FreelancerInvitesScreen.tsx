import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { userAuthStore } from '@/store/user-auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllInvitationsForFreelancer, acceptInviteAndAddFreelancerToProject, rejectInvitation } from '@/api/project-invitations-functions';
import { Card, Spinner, Empty, Button, Avatar } from '@/components/ui';
import { toast } from '@/utils/toast';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'FreelancerInvites'>;

export default function FreelancerInvitesScreen({ navigation }: Props) {
    const { user } = userAuthStore();
    const queryClient = useQueryClient();

    const { data: invitations, isLoading } = useQuery({
        queryKey: ['freelancerInvitations', user?.userId],
        queryFn: () => getAllInvitationsForFreelancer(user!.userId),
        enabled: !!user?.userId,
    });

    const acceptMutation = useMutation({
        mutationFn: (data: { 
            projectId: string; 
            clientId: string; 
            invitationId: string;
            freelancerUsername: string;
            projectTitle: string;
        }) =>
            acceptInviteAndAddFreelancerToProject({
                projectId: data.projectId,
                clientId: data.clientId,
                freelancerId: user!.userId,
                invitationId: data.invitationId,
                freelancerUsername: data.freelancerUsername,
                projectTitle: data.projectTitle,
            }),
        onSuccess: () => {
            toast.success('Invitation accepted!');
            queryClient.invalidateQueries({ queryKey: ['freelancerInvitations'] });
            queryClient.invalidateQueries({ queryKey: ['freelancerProjects'] });
        },
        onError: () => {
            toast.error('Failed to accept invitation');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (data: {
            invitationId: string;
            freelancerUsername: string;
            projectTitle: string;
            clientId: string;
            projectId: string;
        }) =>
            rejectInvitation({
                invitationId: data.invitationId,
                freelancerUsername: data.freelancerUsername,
                projectTitle: data.projectTitle,
                clientId: data.clientId,
                projectId: data.projectId,
            }),
        onSuccess: () => {
            toast.success('Invitation rejected');
            queryClient.invalidateQueries({ queryKey: ['freelancerInvitations'] });
        },
        onError: () => {
            toast.error('Failed to reject invitation');
        },
    });

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (!invitations || invitations.length === 0) {
        return <Empty title="No invitations" description="You have no pending invitations" />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={invitations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.invitationCard}>
                            <Avatar
                                source={item.client.profile_pic}
                                fallback={item.client.username}
                                size={50}
                            />
                            <View style={styles.info}>
                                <Text style={styles.clientName}>{item.client.username}</Text>
                                <Text style={styles.projectTitle}>{item.project.title}</Text>
                                <Text style={styles.projectDescription} numberOfLines={2}>
                                    {item.project.description}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <Button
                                title="Accept"
                                onPress={() =>
                                    acceptMutation.mutate({
                                        projectId: item.project.id,
                                        clientId: item.client.id,
                                        invitationId: item.id,
                                        freelancerUsername: user?.username || 'Freelancer',
                                        projectTitle: item.project.title,
                                    })
                                }
                                loading={acceptMutation.isPending}
                                style={styles.button}
                            />
                            <Button
                                title="Reject"
                                variant="outline"
                                onPress={() =>
                                    rejectMutation.mutate({
                                        invitationId: item.id,
                                        freelancerUsername: user?.username || 'Freelancer',
                                        projectTitle: item.project.title,
                                        clientId: item.client.id,
                                        projectId: item.project.id,
                                    })
                                }
                                loading={rejectMutation.isPending}
                                style={styles.button}
                            />
                        </View>
                        <View style={styles.actions}>
                            <Button
                                title="View Details"
                                variant="outline"
                                onPress={() =>
                                    navigation.navigate('ProjectDetails', {
                                        projectId: item.project.id,
                                    })
                                }
                                style={styles.detailsButton}
                            />
                        </View>
                    </Card>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 20,
    },
    invitationCard: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    info: {
        flex: 1,
    },
    clientName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    projectDescription: {
        fontSize: 14,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    button: {
        flex: 1,
    },
    detailsButton: {
        width: '100%',
    },
});




