import React, { useMemo } from 'react';
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAuthStore } from '@/store/user-auth-store';
import {
    getAllNotificationsForUser,
    setAllNotificationsToRead,
    setNotificationAsRead,
    deleteAllNotifications,
} from '@/api/notifications-functions';
import type { NotificationsFromBackendType } from '@/types';
import { toast } from '@/utils/toast';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<any>;

export default function NotificationsScreen({ navigation }: Props) {
    const { user } = userAuthStore();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['get-all-notifications-for-user', user?.userId],
        queryFn: () => getAllNotificationsForUser(user!.userId),
        enabled: !!user?.userId,
        refetchInterval: 20* 1000,
        refetchIntervalInBackground: true,
    });

    const markAsReadMutation = useMutation({
        mutationFn: setAllNotificationsToRead,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['get-all-notifications-for-user'],
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to update: ${error.message}`);
        },
    });

    const deleteAllMutation = useMutation({
        mutationFn: deleteAllNotifications,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['get-all-notifications-for-user'],
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete: ${error.message}`);
        },
    });

    const groupedNotifications = useMemo(() => {
        if (!notifications) return [];
        
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const groups: { title: string; data: NotificationsFromBackendType[] }[] = [
            { title: 'Today', data: [] },
            { title: 'Yesterday', data: [] },
            { title: 'Earlier', data: [] },
        ];

        notifications.forEach((item) => {
            const date = new Date(item.created_at);
            if (date.toDateString() === today.toDateString()) {
                groups[0].data.push(item);
            } else if (date.toDateString() === yesterday.toDateString()) {
                groups[1].data.push(item);
            } else {
                groups[2].data.push(item);
            }
        });

        return groups.filter((group) => group.data.length > 0);
    }, [notifications]);

    const handleNotificationPress = async (notification: NotificationsFromBackendType) => {
        // Mark notification as read if it's unread
        if (!notification.read) {
            try {
                await setNotificationAsRead(notification.id);
                // Refresh notifications list to update UI
                queryClient.invalidateQueries({
                    queryKey: ['get-all-notifications-for-user'],
                });
            } catch (error) {
                // Continue with navigation even if marking as read fails
            }
        }

        // Navigate based on notification type and user role
        if (user?.role === 'client') {
            if (notification.type === 'Invitation_Accepted' && notification.project_id) {
                queryClient.invalidateQueries({
                    queryKey: ['project', notification.project_id],
                });
                navigation.navigate('ProjectDetails', {
                    projectId: notification.project_id,
                });
            }
        } else {
            // Freelancer
            if (notification.type === 'Invitation_Recieved') {
                queryClient.invalidateQueries({
                    queryKey: ['freelancerInvitations'],
                });
                navigation.navigate('Invitations');
            } else if (notification.type === 'Milestone_Assigned' && notification.project_id) {
                queryClient.invalidateQueries({
                    queryKey: ['project', notification.project_id],
                });
                navigation.navigate('ProjectDetails', {
                    projectId: notification.project_id,
                });
            }
        }
    };

    const getNotificationIcon = (type: NotificationsFromBackendType['type']) => {
        switch (type) {
            case 'Invitation_Accepted':
                return 'checkmark-circle';
            case 'Invitation_Rejected':
                return 'close-circle';
            case 'Invitation_Recieved':
                return 'mail';
            case 'Milestone_Assigned':
                return 'flag';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: NotificationsFromBackendType['type']) => {
        switch (type) {
            case 'Invitation_Accepted':
                return '#10B981';
            case 'Invitation_Rejected':
                return '#EF4444';
            case 'Invitation_Recieved':
                return '#3B82F6';
            case 'Milestone_Assigned':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const renderNotification = ({ item }: { item: NotificationsFromBackendType }) => (
        <Pressable
            style={({ pressed }) => [
                styles.notificationCard,
                !item.read && styles.unreadCard,
                pressed && styles.cardPressed,
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '15' }]}>
                <Ionicons
                    name={getNotificationIcon(item.type) as any}
                    size={22}
                    color={getNotificationColor(item.type)}
                />
            </View>

            <View style={styles.notificationContent}>
                <View style={styles.cardHeaderRow}>
                    <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.notificationTime}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={[styles.notificationBody, !item.read && styles.unreadBody]} numberOfLines={2}>
                    {item.content}
                </Text>
            </View>
        </Pressable>
    );

    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </Pressable>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Action Buttons */}
            {notifications && notifications.length > 0 && (
                <View style={styles.actionsContainer}>
                    <Pressable
                        style={({pressed}) => [styles.actionButton, pressed && styles.buttonPressed]}
                        onPress={() => markAsReadMutation.mutate(user!.userId)}
                        disabled={markAsReadMutation.isPending}
                    >
                        {markAsReadMutation.isPending ? (
                            <ActivityIndicator size="small" color="#4B5563" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-done-outline" size={16} color="#4B5563" />
                                <Text style={styles.actionButtonText}>Mark all read</Text>
                            </>
                        )}
                    </Pressable>

                    <View style={styles.dividerVertical} />

                    <Pressable
                        style={({pressed}) => [styles.actionButton, styles.clearButton, pressed && styles.buttonPressed]}
                        onPress={() => deleteAllMutation.mutate(user!.userId)}
                        disabled={deleteAllMutation.isPending}
                    >
                        {deleteAllMutation.isPending ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                <Text style={[styles.actionButtonText, styles.clearButtonText]}>
                                    Clear all
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}

            {/* Notifications List */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0532A9" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : notifications && notifications.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptyText}>
                        We'll let you know when something important happens
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={groupedNotifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderNotification}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeaderText}>{title}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={refetch}
                            colors={['#0532A9']}
                            tintColor="#0532A9"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
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
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerRightPlaceholder: {
        width: 40,
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    unreadBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        elevation: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    dividerVertical: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E7EB',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    clearButton: {},
    clearButtonText: {
        color: '#EF4444',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    sectionHeader: {
        paddingVertical: 12,
        marginTop: 8,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        elevation: 2,
        marginBottom: 4,
    },
    unreadCard: {
        backgroundColor: '#FFF',
        borderLeftWidth: 4,
        borderLeftColor: '#0532A9',
    },
    cardPressed: {
        backgroundColor: '#F9FAFB',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationContent: {
        flex: 1,
        gap: 4,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        color: '#111827',
        fontWeight: '700',
    },
    notificationBody: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    unreadBody: {
        color: '#4B5563',
    },
    notificationTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});

