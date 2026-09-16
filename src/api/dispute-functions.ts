import { supabaseClient } from '../config/supabase';
import { errorMessageMaker } from './error-message-maker';

export async function createDispute(params: {
    projectId: string;
    milestoneId: string;
    clientId: string;
    freelancerId: string;
    disputeDescription: string;
    freelancerUsername: string;
    projectTitle: string;
}): Promise<void> {
    const { error } = await supabaseClient.from('disputes').insert([
        {
            project: params.projectId,
            milestone: params.milestoneId,
            freelancer: params.freelancerId,
            client: params.clientId,
            dispute_description: params.disputeDescription,
        },
    ]);
    if (error) {
        console.error(error.message);
        throw new Error(errorMessageMaker(error.message));
    }

    const { error: projectError } = await supabaseClient
        .from('projects')
        .update({ status: 'DISPUTED' })
        .eq('id', params.projectId);
    if (projectError) {
        console.error(projectError.message);
        throw new Error(errorMessageMaker(projectError.message));
    }

    const { error: milestoneError } = await supabaseClient
        .from('milestones')
        .update({ status: 'DISPUTED' })
        .eq('id', params.milestoneId);
    if (milestoneError) {
        console.error(milestoneError.message);
        throw new Error(errorMessageMaker(milestoneError.message));
    }

    const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert([
            {
                to_user_id: params.clientId,
                title: 'Dispute Raised',
                content: `Freelancer ${params.freelancerUsername} has raised a dispute in your ${params.projectTitle} project.`,
                type: 'Dispute_Raised',
                project_id: params.projectId,
            },
        ]);
    if (notificationError) {
        console.error(notificationError.message);
        throw new Error(errorMessageMaker(notificationError.message));
    }
}

export async function deleteDispute(params: {
    milestoneId: string;
    projectId: string;
}): Promise<void> {
    console.log('🗑️ [deleteDispute] Starting deletion for project:', params.projectId, 'milestone:', params.milestoneId);

    // 1. Delete the dispute
    const { error, count } = await supabaseClient
        .from('disputes')
        .delete({ count: 'exact' })
        .eq('project', params.projectId)
        .eq('milestone', params.milestoneId); // Also match milestone to be safe

    if (error) {
        console.error('❌ [deleteDispute] Error deleting dispute:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
    
    console.log('✅ [deleteDispute] Dispute deleted. Rows affected:', count);

    // 2. Unlock the project (Set back to ACTIVE)
    const { error: projectError } = await supabaseClient
        .from('projects')
        .update({ status: 'ACTIVE' })
        .eq('id', params.projectId);

    if (projectError) {
        console.error('❌ [deleteDispute] Error unlocking project:', projectError.message);
        throw new Error(errorMessageMaker(projectError.message));
    }
    console.log('✅ [deleteDispute] Project unlocked (ACTIVE)');

    // 3. Revert milestone status (Set back to SUBMITTED)
    const { error: milestoneError } = await supabaseClient
        .from('milestones')
        .update({ status: 'SUBMITTED' })
        .eq('id', params.milestoneId);

    if (milestoneError) {
        console.error('❌ [deleteDispute] Error reverting milestone:', milestoneError.message);
        throw new Error(errorMessageMaker(milestoneError.message));
    }
    console.log('✅ [deleteDispute] Milestone reverted (SUBMITTED)');
}

