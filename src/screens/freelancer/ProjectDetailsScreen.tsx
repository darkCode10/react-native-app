import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getProjectDetailsById } from '@/api/project-functions';
import { Spinner, Card, Button } from '@/components/ui';
import { userAuthStore } from '@/store/user-auth-store';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'ProjectDetails'>;

export default function ProjectDetailsScreen({ route, navigation }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const [activeTab, setActiveTab] = useState<'info' | 'milestones'>('info');

    const { data: project, isLoading, isError } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectDetailsById(projectId),
    });

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (isError || !project) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error in getting project details data</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Project Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{project.title}</Text>
                    
                    {/* Tab Selector */}
                    <View style={styles.tabContainer}>
                        <Pressable
                            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                            onPress={() => setActiveTab('info')}
                        >
                            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                                Info
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.tab, activeTab === 'milestones' && styles.activeTab]}
                            onPress={() => setActiveTab('milestones')}
                        >
                            <Text style={[styles.tabText, activeTab === 'milestones' && styles.activeTabText]}>
                                Milestones
                            </Text>
                        </Pressable>
                    </View>

                    {/* Project Meta Info */}
                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>📅</Text>
                            <Text style={styles.metaText}>
                                {new Date(project.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>💰</Text>
                            <Text style={styles.metaBoldText}>Rs {project.budget.toLocaleString()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>🧠</Text>
                            <Text style={styles.metaText}>{project.skills.length} skills required</Text>
                        </View>
                    </View>

                    <Button
                        title="💬 Open Chat"
                        onPress={() => navigation.navigate('ProjectChat', { projectId })}
                        style={styles.chatButton}
                    />
                </View>

                {/* Info Tab */}
                {activeTab === 'info' && (
                    <View>
                        {/* Project Description */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Project Description</Text>
                            <Text style={styles.description}>{project.description}</Text>
                        </View>

                        {/* Required Skills */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {project.skills.map((skill, index) => (
                                    <View key={index} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Project Client */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Project Client</Text>
                            <Card style={styles.clientCard}>
                                <Image
                                    source={{ uri: project.client.profile_pic }}
                                    style={styles.clientAvatar}
                                />
                                <Text style={styles.clientName}>{project.client.username}</Text>
                                <Text style={styles.clientRole}>Client</Text>
                                <View style={styles.divider} />
                                <Button
                                    title={
                                        user?.userId === project.client.id
                                            ? 'View my profile'
                                            : 'View Profile'
                                    }
                                    onPress={() => {
                                        if (user?.userId === project.client.id) {
                                            // This shouldn't happen for freelancers, but just in case
                                            console.log('View client profile');
                                        } else {
                                            // Navigate to client profile details
                                            console.log('Navigate to client profile:', project.client.id);
                                        }
                                    }}
                                />
                            </Card>
                        </View>
                    </View>
                )}

                {/* Milestones Tab */}
                {activeTab === 'milestones' && (
                    <View style={styles.section}>
                        <Text style={styles.noDataText}>Milestones feature coming soon...</Text>
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
    header: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#0532A9',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaIcon: {
        fontSize: 16,
    },
    metaText: {
        fontSize: 14,
        color: '#666',
    },
    metaBoldText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    chatButton: {
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    skillText: {
        color: '#1E40AF',
        fontSize: 14,
        fontWeight: '500',
    },
    clientCard: {
        alignItems: 'center',
        padding: 24,
    },
    clientAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: '#0532A9',
        marginBottom: 16,
    },
    clientName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    clientRole: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 16,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 12,
    },
});
