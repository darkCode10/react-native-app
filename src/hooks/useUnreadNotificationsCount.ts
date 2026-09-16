// UNREAD NOTIFICATIONS COUNT HOOK

import { useQuery } from '@tanstack/react-query';
import { getAllNotificationsForUser } from '@/api/notifications-functions';
import { userAuthStore } from '@/store/user-auth-store';

/**
 * Hook to get unread notifications count
 * Calculates count from notifications that are not read
 */
export function useUnreadNotificationsCount(): number {
    const { user } = userAuthStore();

    const { data: notifications } = useQuery({
        queryKey: ['get-all-notifications-for-user', user?.userId],
        queryFn: () => getAllNotificationsForUser(user!.userId),
        enabled: !!user?.userId,
        placeholderData: [],
        refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
        refetchIntervalInBackground: true,
        staleTime: 30 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        gcTime: 300000,
        retry: 1,
    });

    // Calculate unread count from notifications where read is false
    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    return unreadCount;
}









