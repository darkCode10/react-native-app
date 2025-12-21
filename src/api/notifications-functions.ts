import { supabaseClient } from "@/config/supabase";
import type { NotificationsFromBackendType } from "@/types";
import { errorMessageMaker } from "./error-message-maker";

export async function getAllNotificationsForUser(
    userId: string
): Promise<NotificationsFromBackendType[]> {
    console.log('[Notifications API] Fetching notifications for user:', userId);
    
    const { data, error } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error('[Notifications API] Error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }

    console.log('[Notifications API] Fetched notifications:', data?.length || 0);
    return data || [];
}

export async function setNotificationAsRead(notificationId: number): Promise<void> {
    console.log('[Notifications API] Marking notification as read:', notificationId);
    
    const { error } = await supabaseClient
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("read", false);
        
    if (error) {
        console.error('[Notifications API] Error marking notification as read:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
}

export async function setAllNotificationsToRead(userId: string): Promise<void> {
    console.log('[Notifications API] Marking all as read for user:', userId);
    
    const { error } = await supabaseClient
        .from("notifications")
        .update({ read: true })
        .eq("to_user_id", userId)
        .eq("read", false);
        
    if (error) {
        console.error('[Notifications API] Error marking as read:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
}

export async function deleteAllNotifications(userId: string): Promise<void> {
    console.log('[Notifications API] Deleting all notifications for user:', userId);
    
    const { error } = await supabaseClient
        .from("notifications")
        .delete()
        .eq("to_user_id", userId);
        
    if (error) {
        console.error('[Notifications API] Error deleting notifications:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
}

