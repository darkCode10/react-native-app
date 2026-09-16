// ============================================
// CHAT API FUNCTIONS (Adapted from Freelansync with Polling)
// ============================================

import { supabaseClient } from "@/config/supabase";
import { errorMessageMaker } from "./error-message-maker";
import type {
    ChatFromBackendType,
    MessageFromBackendType,
} from "@/types";

/**
 * Check if a chat already exists with a freelancer
 */
export async function checkChatExistence(freelancerId: string): Promise<{ id: string }[]> {
    const { data, error } = await supabaseClient
        .from("chats")
        .select("id")
        .eq("freelancer", freelancerId);

    if (error) {
        console.error('[checkChatExistence] Error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
    return data || [];
}

/**
 * Create a new chat between client and freelancer with an initial message
 */
export async function createNewChatByClient({
    clientId,
    freelancerId,
    message,
}: {
    clientId: string;
    freelancerId: string;
    message: string;
}): Promise<void> {
    console.log('[createNewChatByClient] Creating chat:', { clientId, freelancerId });
    
    // First, check if chat already exists
    const { data: existingChats, error: checkError } = await supabaseClient
        .from("chats")
        .select("id")
        .eq("client", clientId)
        .eq("freelancer", freelancerId);
    
    if (checkError) {
        console.error('[createNewChatByClient] Check error:', checkError.message);
        throw new Error(errorMessageMaker(checkError.message));
    }
    
    // If chat already exists, throw a specific error
    if (existingChats && existingChats.length > 0) {
        throw new Error('Chat already exists with this freelancer');
    }
    
    const { error, data } = await supabaseClient
        .from("chats")
        .insert([
            {
                client: clientId,
                freelancer: freelancerId,
                last_updated_by: clientId,
            },
        ])
        .select("id")
        .single();
    
    if (error) {
        console.error('[createNewChatByClient] Error:', error.message);
        // Handle duplicate key error gracefully
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            throw new Error('Chat already exists with this freelancer');
        }
        throw new Error(errorMessageMaker(error.message));
    }

    const { error: messageError, data: messageResponse } = await supabaseClient
        .from("messages")
        .insert([
            {
                chat_id: data.id,
                sender_role: "client",
                sender_id: clientId,
                message_text: message,
            },
        ])
        .select("id")
        .single();
    
    if (messageError) {
        console.error('[createNewChatByClient] Message error:', messageError.message);
        throw new Error(errorMessageMaker(messageError.message));
    }

    const newMessageId = messageResponse.id;
    const { error: chatUpdateError } = await supabaseClient
        .from("chats")
        .update({
            latest_message_id: newMessageId,
            message_id_read_by_client: newMessageId,
        })
        .eq("id", data.id);

    if (chatUpdateError) {
        console.error('[createNewChatByClient] Update error:', chatUpdateError.message);
        throw new Error(chatUpdateError.message);
    }
}

/**
 * Get all chats for a user (client or freelancer) with enriched data
 */
export async function getAllChatsForUser({
    userRole,
    userId,
}: {
    userRole: "client" | "freelancer";
    userId?: string;
}): Promise<any[]> {
    console.log('[getAllChatsForUser] Fetching chats for:', userRole, userId);
    
    let chatsData: any[];
    
    if (userRole === "client") {
        let query = supabaseClient
            .from("chats")
            .select(
                "id, created_at, client, freelancer, latest_message_id, last_updated_by, message_id_read_by_client, message_id_read_by_freelancer, freelancer!inner(id, username, profile_pic)"
            );
        
        // Filter by client if userId is provided
        if (userId) {
            query = query.eq("client", userId);
        }
        
        const { data, error } = await query.order("created_at", { ascending: false });
        
        if (error) {
            console.error('[getAllChatsForUser] Client error:', error);
            throw new Error(`Failed to fetch chats: ${error.message}`);
        }
        chatsData = data || [];
    } else {
        let query = supabaseClient
            .from("chats")
            .select(
                "id, created_at, client, freelancer, latest_message_id, last_updated_by, message_id_read_by_client, message_id_read_by_freelancer, client!inner(id, username, profile_pic)"
            );
        
        // Filter by freelancer if userId is provided
        if (userId) {
            query = query.eq("freelancer", userId);
        }
        
        const { data, error } = await query.order("created_at", { ascending: false });
        
        if (error) {
            console.error('[getAllChatsForUser] Freelancer error:', error);
            throw new Error(`Failed to fetch chats: ${error.message}`);
        }
        chatsData = data || [];
    }

    // Enrich chats with latest message and unseen count
    try {
        const enrichedChats = await Promise.all(
            chatsData.map(async (chat) => {
                try {
                    // Get latest message if exists
                    let latestMessage = null;
                    if (chat.latest_message_id) {
                        const { data: messageData, error: msgError } = await supabaseClient
                            .from("messages")
                            .select("*")
                            .eq("id", chat.latest_message_id)
                            .single();
                        
                        if (msgError) {
                            console.warn('[getAllChatsForUser] Failed to fetch latest message:', msgError.message);
                        }
                        latestMessage = messageData;
                    }

                    // Calculate unseen count
                    const readColumn = userRole === "client" ? "message_id_read_by_client" : "message_id_read_by_freelancer";
                    const lastReadId = chat[readColumn] || 0;
                    
                    const { count: unseenCount, error: countError } = await supabaseClient
                        .from("messages")
                        .select("*", { count: "exact", head: true })
                        .eq("chat_id", chat.id)
                        .gt("id", lastReadId);
                    
                    if (countError) {
                        console.warn('[getAllChatsForUser] Failed to count unseen messages:', countError.message);
                    }

                    // Transform to match expected structure
                    return {
                        ...chat,
                        // Map to expected field names for consistency
                        freelancer_id: chat.freelancer?.id || chat.freelancer,
                        client_id: chat.client?.id || chat.client,
                        // For client users, show freelancer details. For freelancer users, show client details
                        userDetails: userRole === "client" ? chat.freelancer : chat.client,
                        latestMessage,
                        unseenCount: unseenCount || 0,
                    };
                } catch (enrichError: any) {
                    console.error('[getAllChatsForUser] Error enriching chat:', chat.id, enrichError);
                    // Return chat without enrichment if error occurs
                    return {
                        ...chat,
                        freelancer_id: chat.freelancer?.id || chat.freelancer,
                        client_id: chat.client?.id || chat.client,
                        // For client users, show freelancer details. For freelancer users, show client details
                        userDetails: userRole === "client" ? chat.freelancer : chat.client,
                        latestMessage: null,
                        unseenCount: 0,
                    };
                }
            })
        );

        console.log('[getAllChatsForUser] Successfully fetched', enrichedChats.length, 'chats');
        return enrichedChats;
    } catch (error: any) {
        console.error('[getAllChatsForUser] Error enriching chats:', error);
        throw new Error(`Failed to enrich chats: ${error.message}`);
    }
}

/**
 * Get all messages for a specific chat
 */
export async function getMessagesForChat(
    chatId: string
): Promise<MessageFromBackendType[]> {
    console.log('[getMessagesForChat] Fetching messages for chat:', chatId);
    
    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
    
    if (error) {
        console.error('[getMessagesForChat] Error:', error.message);
        throw new Error();
    }
    return data;
}

/**
 * Send a message in a chat
 */
export async function sendMessage({
    chatId,
    messageText,
    senderId,
    senderRole,
}: {
    chatId: string;
    senderId: string;
    senderRole: "client" | "freelancer";
    messageText: string;
}): Promise<void> {
    console.log('[sendMessage] Sending message:', { chatId, senderRole });
    
    const { error, data } = await supabaseClient
        .from("messages")
        .insert([
            {
                chat_id: chatId,
                sender_id: senderId,
                sender_role: senderRole,
                message_text: messageText,
            },
        ])
        .select("id")
        .single();
    
    if (error) {
        console.error('[sendMessage] Error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }

    let targetCol = "message_id_read_by_client";
    if (senderRole === "freelancer") targetCol = "message_id_read_by_freelancer";

    const { error: chatUpdateError } = await supabaseClient
        .from("chats")
        .update({
            latest_message_id: data.id,
            last_updated_by: senderId,
            [targetCol]: data.id,
        })
        .eq("id", chatId);

    if (chatUpdateError) {
        console.error('[sendMessage] Update error:', chatUpdateError.message);
        throw new Error(errorMessageMaker(chatUpdateError.message));
    }
}

/**
 * Update last read message for a chat
 */
export async function updateLastReadMessageCol({
    chatId,
    latestMessageId,
    userRole,
}: {
    chatId: string;
    userRole: "client" | "freelancer";
    latestMessageId: number;
}): Promise<void> {
    console.log('[updateLastReadMessageCol] Updating last read for chat:', chatId);
    
    const column =
        userRole === "client"
            ? "message_id_read_by_client"
            : "message_id_read_by_freelancer";

    const { error } = await supabaseClient
        .from("chats")
        .update({ [column]: latestMessageId })
        .eq("id", chatId);
    
    if (error) {
        console.error('[updateLastReadMessageCol] Error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
}

/**
 * Upload media file to chat
 */
export async function uploadChatMedia({
    fileUri,
    fileName,
    fileType,
    senderId,
    senderRole,
    chatId,
}: {
    fileUri: string;
    fileName: string;
    fileType: string;
    senderId: string;
    senderRole: "client" | "freelancer";
    chatId: string;
}): Promise<void> {
    console.log('[uploadChatMedia] Uploading media:', { fileName, fileType });
    
    const newFileName = `${Date.now()}_${senderId}_${fileName}`;

    // Fetch the file as blob (React Native)
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabaseClient.storage
        .from("freelansync-media")
        .upload(`chat-media/${newFileName}`, blob, {
            upsert: false,
            cacheControl: "3600",
            contentType: fileType,
        });
    
    if (error) {
        console.error('[uploadChatMedia] Upload error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }

    const { data: fileData } = supabaseClient.storage
        .from("freelansync-media")
        .getPublicUrl(`chat-media/${newFileName}`);
    
    if (!fileData.publicUrl) {
        console.error('[uploadChatMedia] Failed to get public URL');
        throw new Error(errorMessageMaker("Failed to upload file, Failed to get public url"));
    }
    
    const ext = fileName.split(".").pop()?.toLowerCase() || "file";

    const { error: messageError, data } = await supabaseClient
        .from("messages")
        .insert([
            {
                chat_id: chatId,
                sender_id: senderId,
                sender_role: senderRole,
                message_text: fileData.publicUrl,
                file_type: ext,
            },
        ])
        .select("id")
        .single();
    
    if (messageError) {
        console.error('[uploadChatMedia] Message error:', messageError.message);
        throw new Error(errorMessageMaker(messageError.message));
    }

    let targetCol = "message_id_read_by_client";
    if (senderRole === "freelancer") targetCol = "message_id_read_by_freelancer";

    const { error: chatUpdateError } = await supabaseClient
        .from("chats")
        .update({
            latest_message_id: data.id,
            last_updated_by: senderId,
            [targetCol]: data.id,
        })
        .eq("id", chatId);

    if (chatUpdateError) {
        console.error('[uploadChatMedia] Chat update error:', chatUpdateError.message);
        throw new Error(errorMessageMaker(chatUpdateError.message));
    }
}

/**
 * Get all messages for a project chat (group chat)
 */
export async function getMessagesForProject(projectId: string): Promise<any[]> {
    console.log('[getMessagesForProject] Fetching messages for project:', projectId);
    
    const { data, error } = await supabaseClient
        .from("project_messages")
        .select("*")
        .eq("project", projectId)
        .order("created_at", { ascending: true });
    
    if (error) {
        console.error('[getMessagesForProject] Error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }

    // Fetch sender details for each message
    const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg: any) => {
            try {
                // Try clients first
                const { data: clientData } = await supabaseClient
                    .from("clients")
                    .select("profile_pic")
                    .eq("id", msg.sender)
                    .maybeSingle();
                
                if (clientData) {
                    return {
                        ...msg,
                        sender_profile_pic: clientData.profile_pic || null,
                    };
                }
                
                // Then try freelancers
                const { data: freelancerData } = await supabaseClient
                    .from("freelancers")
                    .select("profile_pic")
                    .eq("id", msg.sender)
                    .maybeSingle();
                
                return {
                    ...msg,
                    sender_profile_pic: freelancerData?.profile_pic || null,
                };
            } catch (err) {
                console.warn('[getMessagesForProject] Failed to fetch profile pic:', err);
                return {
                    ...msg,
                    sender_profile_pic: null,
                };
            }
        })
    );

    return messagesWithProfiles;
}

/**
 * Send a message in a project chat (group chat)
 */
export async function sendProjectChatMessage(
    projectId: string,
    senderId: string,
    senderUsername: string,
    messageText: string
): Promise<void> {
    console.log('[sendProjectChatMessage] Sending to project:', projectId);
    
    const { error } = await supabaseClient.from("project_messages").insert([
        {
            project: projectId,
            sender: senderId,
            sender_username: senderUsername,
            message_text: messageText,
        },
    ]);

    if (error) {
        console.error('[sendProjectChatMessage] Error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
}

