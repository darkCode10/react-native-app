import { supabaseClient } from '@/config/supabase';
import type {
    MilestoneDetailsFromBackendType,
    MilestonesFromBackendType,
    MilestoneStatusType,
} from '@/types';

export async function createMilestone({
    title,
    amount,
    clientId,
    description,
    freelancerId,
    projectId,
    clientUsername,
    projectTitle,
}: {
    projectId: string;
    clientId: string;
    freelancerId: string;
    title: string;
    description: string;
    amount: number;
    clientUsername: string;
    projectTitle: string;
}): Promise<void> {
    const { error } = await supabaseClient.from('milestones').insert([
        {
            title: title,
            description: description,
            amount: amount,
            project: projectId,
            client: clientId,
            freelancer: freelancerId,
            status: 'LOCKED',
        },
    ]);
    if (error) {
        console.error(error.message);
        throw new Error(error.message);
    }

    const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert([
            {
                to_user_id: freelancerId,
                title: 'Milestone Assigned',
                content: `Client ${clientUsername} has assigned a milestone to you in their ${projectTitle} project.`,
                type: 'Milestone_Assigned',
                project_id: projectId,
            },
        ]);
    if (notificationError) {
        console.error(notificationError);
        throw new Error(notificationError.message);
    }
}

export async function getAllMilestonesForProject(
    projectId: string
): Promise<MilestonesFromBackendType[]> {
    const { error, data } = await supabaseClient
        .from('milestones')
        .select('*, freelancer(id, username, profile_pic)')
        .eq('project', projectId);
    if (error) {
        console.error(error.message);
        throw new Error(error.message);
    }
    return data;
}

export async function getMilestoneDetailsById(
    milestoneId: string
): Promise<MilestoneDetailsFromBackendType> {
    const { data, error } = await supabaseClient
        .from('milestones')
        .select(
            '*, freelancer(id, username, profile_pic, domains, email), client(id, username, email, profile_pic), project(id, title, description, budget, domains, status)'
        )
        .eq('id', milestoneId)
        .single();
    if (error) {
        console.error(error.message);
        throw new Error(error.message);
    }
    return data;
}

export async function updateMilestoneStatus({
    milestoneId,
    status,
}: {
    milestoneId: string;
    status: MilestoneStatusType;
}): Promise<void> {
    const { error } = await supabaseClient
        .from('milestones')
        .update({ status: status })
        .eq('id', milestoneId);
    if (error) {
        console.error(error.message);
        throw new Error(error.message);
    }
}

export async function submitMilestone({
    milestoneId,
    description,
    fileUri,
    clientId,
    projectTitle,
    projectId,
    freelancerUsername,
}: {
    milestoneId: string;
    description: string;
    fileUri: string | null;
    clientId: string;
    projectTitle: string;
    projectId: string;
    freelancerUsername: string;
}): Promise<void> {
    if (fileUri) {
        // Extract file name and create a unique name
        const fileName = `${Date.now()}-${fileUri.split('/').pop()}`;
        
        // For React Native, we need to create a FormData or use different approach
        // For now, we'll just store the file URI (you may need to implement file upload separately)
        const { error: updateError } = await supabaseClient
            .from('milestones')
            .update({
                submission_description: description,
                file: fileUri, // Store the URI temporarily
                status: 'SUBMITTED',
            })
            .eq('id', milestoneId);
        if (updateError) {
            console.error(updateError.message);
            throw new Error(updateError.message);
        }
    } else {
        const { error: updateError } = await supabaseClient
            .from('milestones')
            .update({
                submission_description: description,
                status: 'SUBMITTED',
            })
            .eq('id', milestoneId);
        if (updateError) {
            console.error(updateError.message);
            throw new Error(updateError.message);
        }
    }

    const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert([
            {
                to_user_id: clientId,
                title: 'Milestone Submitted',
                content: `Freelancer ${freelancerUsername} has submitted a milestone in your ${projectTitle} project.`,
                type: 'Milestone_Submitted',
                project_id: projectId,
                milestone_id: milestoneId,
            },
        ]);
    if (notificationError) {
        console.error(notificationError);
        throw new Error(notificationError.message);
    }
}

export async function deleteMilestoneSubmission(milestoneId: string): Promise<void> {
    const { error } = await supabaseClient
        .from('milestones')
        .update({ status: 'IN_PROGRESS', submission_description: null, file: null })
        .eq('id', milestoneId);
    if (error) {
        console.error(error.message);
        throw new Error(error.message);
    }
}

