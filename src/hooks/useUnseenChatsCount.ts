// UNSEEN CHATS COUNT HOOK (Using Polling Approach)

import { useQuery } from '@tanstack/react-query';
import { getAllChatsForUser } from '@/api/chat-functions';
import { userAuthStore } from '@/store/user-auth-store';

/**
 * Hook to get unseen chats count
 * Calculates count from chat list with unseen messages
 */
export function useUnseenChatsCount(): number {
    const { user } = userAuthStore();

    const { data: chats } = useQuery({
        queryKey: ['chats', user?.userId, user?.role],
        queryFn: () => getAllChatsForUser({ userRole: user!.role, userId: user!.userId }),
        enabled: !!user?.userId && !!user?.role,
        placeholderData: [],
        refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes (same as chat list)
        refetchIntervalInBackground: true,
        staleTime: 30 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        gcTime: 300000,
        retry: 1,
    });

    // Calculate unseen count from chats with unseenCount > 0
    const unseenCount = chats?.filter(chat => (chat.unseenCount || 0) > 0).length || 0;

    return unseenCount;
}



