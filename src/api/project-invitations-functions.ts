// ============================================
// INVITATION API FUNCTIONS (Adapted from Freelansync)
// ============================================

import { supabaseClient } from "@/config/supabase";
import { errorMessageMaker } from "./error-message-maker";
import type {
    InvitationsForFreelancerFromBackendType,
    InvitationsForProjectFromBackendType,
} from "@/types";

export async function createInvitation(params: {
    clientId: string;
    freelancerId: string;
    projectId: string;
    clientUsername: string;
}): Promise<void> {
    console.log('[createInvitation] Creating invitation with params:', params);
    const { data, error } = await supabaseClient.from("invitations").insert([
        {
            client: params.clientId,
            freelancer: params.freelancerId,
            project: params.projectId,
        },
    ]).select();
    if (error) {
        console.error('[createInvitation] Error creating invitation:', error);
        throw new Error(errorMessageMaker(error.message));
    }
    console.log('[createInvitation] Invitation created successfully:', data);

    // Create notification for freelancer
    const { error: notificationError } = await supabaseClient
        .from("notifications")
        .insert([
            {
                to_user_id: params.freelancerId,
                title: "New Invitation",
                content: `Client ${params.clientUsername} has invited you in their project.`,
                type: "Invitation_Recieved",
                project_id: params.projectId,
            },
        ]);
    if (notificationError) {
        console.error('[createInvitation] Error creating notification:', notificationError);
        throw new Error(errorMessageMaker(notificationError.message));
    }
    console.log('[createInvitation] Notification created successfully');
}

export async function getAllInvitationsForProject(
    projectId: string
): Promise<InvitationsForProjectFromBackendType[]> {
    console.log('[getAllInvitationsForProject] Fetching invitations for project:', projectId);
    const { data, error } = await supabaseClient
        .from("invitations")
        .select("*, freelancer(id, profile_pic, username, email, domains, role)")
        .eq("project", projectId)
        .order("created_at", { ascending: false });
    if (error) {
        console.error('[getAllInvitationsForProject] Error:', error);
        throw new Error();
    }
    console.log('[getAllInvitationsForProject] Invitations fetched:', data?.length, data);
    return data;
}

export async function deleteInvitation(invitationId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("invitations")
        .delete()
        .eq("id", invitationId);
    if (error) {
        console.error(error);
        throw new Error(errorMessageMaker(error.message));
    }
}

export async function getAllInvitationsForFreelancer(
    freelancerId: string
): Promise<InvitationsForFreelancerFromBackendType[]> {
    const { data, error } = await supabaseClient
        .from("invitations")
        .select(
            "*, client(id, email, username, profile_pic, role), project(id, title, description, domains, skills, budget, created_at)"
        )
        .eq("freelancer", freelancerId)
        .order("created_at", { ascending: false });
    if (error) {
        console.error(error);
        throw new Error();
    }
    return data;
}

export async function acceptInviteAndAddFreelancerToProject({
    invitationId,
    clientId,
    freelancerId,
    projectId,
    freelancerUsername,
    projectTitle,
}: {
    invitationId: string;
    clientId: string;
    freelancerId: string;
    projectId: string;
    freelancerUsername: string;
    projectTitle: string;
}): Promise<void> {
    const { error } = await supabaseClient
        .from("project_and_freelancer_link")
        .insert([{ client: clientId, project: projectId, freelancer: freelancerId }]);
    if (error) {
        console.error('[acceptInvitation] Error adding freelancer to project:', error);
        throw new Error(errorMessageMaker(error.message));
    }

    const { error: secondError } = await supabaseClient
        .from("invitations")
        .delete()
        .eq("id", invitationId);
    if (secondError) {
        console.error('[acceptInvitation] Error deleting invitation:', secondError);
        throw new Error(errorMessageMaker(secondError.message));
    }

    // Create notification for client
    const { error: notificationError } = await supabaseClient
        .from("notifications")
        .insert([
            {
                to_user_id: clientId,
                title: "Invitation Accepted",
                content: `Freelancer ${freelancerUsername} has accepted your invitation for ${projectTitle} project`,
                type: "Invitation_Accepted",
                project_id: projectId,
            },
        ]);
    if (notificationError) {
        console.error('[acceptInvitation] Error creating notification:', notificationError);
        throw new Error(errorMessageMaker(notificationError.message));
    }
    console.log('[acceptInvitation] Invitation accepted and notification created successfully');
}

export async function rejectInvitation({
    invitationId,
    freelancerUsername,
    projectTitle,
    clientId,
    projectId,
}: {
    invitationId: string;
    freelancerUsername: string;
    projectTitle: string;
    clientId: string;
    projectId: string;
}): Promise<void> {
    const { error } = await supabaseClient
        .from("invitations")
        .delete()
        .eq("id", invitationId);
    if (error) {
        console.error('[rejectInvitation] Error deleting invitation:', error);
        throw new Error(errorMessageMaker(error.message));
    }

    // Create notification for client
    const { error: notificationError } = await supabaseClient
        .from("notifications")
        .insert([
            {
                to_user_id: clientId,
                title: "Invitation Rejected",
                content: `Freelancer ${freelancerUsername} has rejected your invitation for ${projectTitle} project`,
                type: "Invitation_Rejected",
                project_id: projectId,
            },
        ]);
    if (notificationError) {
        console.error('[rejectInvitation] Error creating notification:', notificationError);
        throw new Error(errorMessageMaker(notificationError.message));
    }
    console.log('[rejectInvitation] Invitation rejected and notification created successfully');
}
