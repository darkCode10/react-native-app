// ============================================
// UNSEEN CHATS COUNT HOOK (TEMPORARILY DISABLED)
// This hook is disabled while chat functionality is being migrated
// to the new Freelansync database. It currently returns 0.
// ============================================

// import { useQuery } from '@tanstack/react-query';
// import { getUnseenChatsCount } from '@/api/chat-functions';
// import { userAuthStore } from '@/store/user-auth-store';

/**
 * Hook to get unseen chats count
 * Currently returns 0 as chat is disabled during Freelansync DB migration
 * Will be re-enabled when Freelansync adds chat tables
 */
export function useUnseenChatsCount(): number {
    // const { user } = userAuthStore();

    // Temporarily return 0 until chat is re-enabled
    return 0;

    /* Original implementation - will be restored when chat is re-enabled:
    const { data: unseenCount = 0 } = useQuery({
        queryKey: ['unseenChatsCount', user?.userId, user?.role],
        queryFn: () => getUnseenChatsCount({
            userId: user!.userId,
            userRole: user!.role,
        }),
        enabled: !!user?.userId && !!user?.role,
        placeholderData: 0,
        refetchInterval: 15000,
        staleTime: 10000,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        gcTime: 300000,
        retry: 1,
    });

    return unseenCount;
    */
}



