import { supabaseClient, supabaseURL, supabaseApiKey } from '../config/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import type {
    MilestoneDetailesFromBackendType,
    MilestonesFromBackendType,
    MilestoneStatusType,
} from '../types';

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
}): Promise<{ id: string }> {
    console.log('[createMilestone] Creating milestone with amount:', amount);
    
    // Step 1: Create the milestone
    const { data, error } = await supabaseClient
        .from('milestones')
        .insert([
            {
                title: title,
                description: description,
                amount: amount,
                project: projectId,
                client: clientId,
                freelancer: freelancerId,
                status: 'LOCKED',
            },
        ])
        .select('id, amount')
        .single();

    if (error) {
        console.error('[createMilestone] Error creating milestone:', error.message);
        throw new Error(error.message);
    }

    console.log('[createMilestone] ✅ Milestone created with ID:', data.id);

    // Step 2: Get current project budget
    const { data: projectData, error: projectFetchError } = await supabaseClient
        .from('projects')
        .select('budget')
        .eq('id', projectId)
        .single();

    if (projectFetchError) {
        console.error('[createMilestone] Error fetching project budget:', projectFetchError.message);
        throw new Error(projectFetchError.message);
    }

    console.log('[createMilestone] Current project budget:', projectData.budget);
    console.log('[createMilestone] Type of budget:', typeof projectData.budget);

    // Verify budget field exists
    if (projectData.budget === null || projectData.budget === undefined) {
        const errorMsg = 'Project budget field is missing or null!';
        console.error('[createMilestone]', errorMsg);
        throw new Error(errorMsg);
    }

    // Step 3: Deduct milestone amount from project budget and set status to ACTIVE
    const updatedBudget = projectData.budget - data.amount;
    console.log('[createMilestone] New project budget after deduction:', updatedBudget);
    console.log('[createMilestone] Milestone amount:', data.amount);
    console.log('[createMilestone] Calculation:', `${projectData.budget} - ${data.amount} = ${updatedBudget}`);

    // Update without the status condition to ensure it always updates
    const { data: updateResult, error: projectUpdateError } = await supabaseClient
        .from('projects')
        .update({ 
            budget: updatedBudget,
            status: 'ACTIVE' 
        })
        .eq('id', projectId)
        .select('budget, original_budget, status');

    if (projectUpdateError) {
        console.error('[createMilestone] ❌ Error updating project budget:', projectUpdateError);
        console.error('[createMilestone] ❌ Error details:', JSON.stringify(projectUpdateError));
        throw new Error(projectUpdateError.message);
    }

    console.log('[createMilestone] ✅ Project budget updated!');
    console.log('[createMilestone] ✅ Updated project data:', updateResult);
    
    if (updateResult && updateResult.length > 0) {
        console.log('[createMilestone] ✅ New budget in DB:', updateResult[0].budget);
        console.log('[createMilestone] ✅ Original budget in DB:', updateResult[0].original_budget);
        console.log('[createMilestone] ✅ Project status:', updateResult[0].status);
    } else {
        console.warn('[createMilestone] ⚠️ No rows updated - check project ID and conditions');
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
                milestone_id: data.id,
            },
        ]);

    if (notificationError) {
        console.error('[createMilestone] Notification error:', notificationError.message);
        throw new Error(notificationError.message);
    }

    console.log('[createMilestone] ✅ Milestone created successfully');
    return data;
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
): Promise<MilestoneDetailesFromBackendType> {
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
    console.log('[updateMilestoneStatus] Updating milestone:', milestoneId, 'to status:', status);

    // If status is COMPLETED, transfer money to freelancer
    if (status === 'COMPLETED') {
        // Step 1: Get milestone details (amount and freelancer ID)
        const { data: milestoneData, error: milestoneError } = await supabaseClient
            .from('milestones')
            .select('amount, freelancer')
            .eq('id', milestoneId)
            .single();

        if (milestoneError) {
            console.error('[updateMilestoneStatus] Error fetching milestone:', milestoneError.message);
            throw new Error(milestoneError.message);
        }

        console.log('[updateMilestoneStatus] Milestone amount:', milestoneData.amount);
        console.log('[updateMilestoneStatus] Freelancer ID:', milestoneData.freelancer);

        // Step 2: Get freelancer's current wallet amount
        const { data: freelancerData, error: freelancerFetchError } = await supabaseClient
            .from('freelancers')
            .select('wallet_amount')
            .eq('id', milestoneData.freelancer)
            .single();

        if (freelancerFetchError) {
            console.error('[updateMilestoneStatus] Error fetching freelancer wallet:', freelancerFetchError.message);
            throw new Error(freelancerFetchError.message);
        }

        console.log('[updateMilestoneStatus] Current freelancer wallet:', freelancerData.wallet_amount);

        // Step 3: Add milestone amount to freelancer's wallet
        const updatedWalletAmount = freelancerData.wallet_amount + milestoneData.amount;
        console.log('[updateMilestoneStatus] New freelancer wallet:', updatedWalletAmount);

        const { error: freelancerUpdateError } = await supabaseClient
            .from('freelancers')
            .update({ wallet_amount: updatedWalletAmount })
            .eq('id', milestoneData.freelancer);

        if (freelancerUpdateError) {
            console.error('[updateMilestoneStatus] Error updating freelancer wallet:', freelancerUpdateError.message);
            throw new Error(freelancerUpdateError.message);
        }

        console.log('[updateMilestoneStatus] ✅ Freelancer wallet updated successfully');

        // Step 4: Update milestone status to COMPLETED
        const { error: statusUpdateError } = await supabaseClient
            .from('milestones')
            .update({ status: 'COMPLETED' })
            .eq('id', milestoneId);

        if (statusUpdateError) {
            console.error('[updateMilestoneStatus] Error updating milestone status:', statusUpdateError.message);
            throw new Error(statusUpdateError.message);
        }

        console.log('[updateMilestoneStatus] ✅ Milestone marked as COMPLETED and payment transferred');
    } else {
        // For other statuses, just update the status
        const { error } = await supabaseClient
            .from('milestones')
            .update({ status: status })
            .eq('id', milestoneId);

        if (error) {
            console.error('[updateMilestoneStatus] Error updating status:', error.message);
            throw new Error(error.message);
        }

        console.log('[updateMilestoneStatus] ✅ Milestone status updated to:', status);
    }
}

export async function submitMilestone({
    milestoneId,
    description,
    fileUri,
    file,
    clientId,
    projectTitle,
    projectId,
    freelancerUsername,
}: {
    milestoneId: string;
    description: string;
    fileUri: string | null;
    file?: File | null; // Actual File object on web
    clientId: string;
    projectTitle: string;
    projectId: string;
    freelancerUsername: string;
}): Promise<void> {
    console.log('🚀 [submitMilestone] Starting submission...', {
        milestoneId,
        hasFile: !!fileUri || !!file,
        hasActualFile: !!file,
        descriptionLength: description.length,
    });
    
    let uploadedFileUrl: string | null = null;

    // Try to upload file if provided
    if (file || fileUri) {
        try {
            console.log('📤 [submitMilestone] Attempting to upload file:', file ? 'Using File object' : fileUri);
            
            let uploadError = null;
            let filePath = '';

            // WEB with actual File object (original working method)
            if (file && Platform.OS === 'web') {
                console.log('🌐 [submitMilestone] Web platform - using File object directly');
                // Sanitize file name to avoid "Invalid key" errors with special characters
                const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${Date.now()}-${sanitizedFileName}`;
                filePath = `milestones-media/${fileName}`;
                
                const uploadResult = await supabaseClient.storage
                    .from('freelansync-media')
                    .upload(filePath, file, {
                        upsert: false,
                        cacheControl: '3600',
                        contentType: file.type,
                    });
                uploadError = uploadResult.error;
            } 
            // Fallback: Use URI for mobile or when File object not available
            else if (fileUri) {
                console.log('📱 [submitMilestone] Using fileUri...');
                
                // Get file extension from URI
                const fileExtension = fileUri.split('.').pop();
                const fileName = `${Date.now()}-${milestoneId}.${fileExtension}`;
                filePath = `milestones-media/${fileName}`;

                // Determine content type from file extension
                let contentType = 'application/octet-stream';
                const ext = fileExtension?.toLowerCase();
                if (ext === 'pdf') contentType = 'application/pdf';
                else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
                else if (ext === 'png') contentType = 'image/png';
                else if (ext === 'doc') contentType = 'application/msword';
                else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                else if (ext === 'txt') contentType = 'text/plain';

                if (Platform.OS === 'web') {
                    // WEB without File object: Fetch the URI
                    console.log('🌐 [submitMilestone] Web platform - fetching blob from URI');
                    const response = await fetch(fileUri);
                    const blob = await response.blob();
                    
                    const uploadResult = await supabaseClient.storage
                        .from('freelansync-media')
                        .upload(filePath, blob, {
                            upsert: false,
                            cacheControl: '3600',
                            contentType: contentType,
                        });
                    uploadError = uploadResult.error;
                } else {
                    // MOBILE: Read as base64 and convert
                    console.log('📱 [submitMilestone] Mobile platform - reading file as base64');
                    const base64 = await FileSystem.readAsStringAsync(fileUri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    
                    const response = await fetch(`data:${contentType};base64,${base64}`);
                    const blob = await response.blob();
                    
                    const uploadResult = await supabaseClient.storage
                        .from('freelansync-media')
                        .upload(filePath, blob, {
                            upsert: false,
                            cacheControl: '3600',
                            contentType: contentType,
                        });
                    uploadError = uploadResult.error;
                }
            }

            if (uploadError) {
                console.error('❌ [submitMilestone] File upload error:', uploadError);
                console.warn('⚠️ [submitMilestone] Continuing submission without file...');
                // Don't throw, just continue without file
            } else {
                console.log('✅ [submitMilestone] File uploaded successfully');

                const { data: fileData } = supabaseClient.storage
                    .from('freelansync-media')
                    .getPublicUrl(filePath);

                if (fileData.publicUrl) {
                    uploadedFileUrl = fileData.publicUrl;
                    console.log('✅ [submitMilestone] Got public URL:', uploadedFileUrl);
                } else {
                    console.warn('⚠️ [submitMilestone] Failed to get file public URL');
                }
            }
        } catch (fileError: any) {
            console.error('❌ [submitMilestone] File upload exception:', fileError);
            console.warn('⚠️ [submitMilestone] Continuing submission without file...');
            // Don't throw, just continue without file
        }
    } else {
        console.log('📝 [submitMilestone] No file attached');
    }

    // Update milestone with or without file
    console.log('💾 [submitMilestone] Updating milestone in database...');
    const updateData: any = {
        submission_description: description,
        status: 'SUBMITTED',
    };

    if (uploadedFileUrl) {
        updateData.file = uploadedFileUrl;
    }

    const { error: updateError } = await supabaseClient
        .from('milestones')
        .update(updateData)
        .eq('id', milestoneId);

    if (updateError) {
        console.error('❌ [submitMilestone] Database update error:', updateError.message);
        throw new Error(updateError.message);
    }

    console.log('✅ [submitMilestone] Milestone updated in database', uploadedFileUrl ? '(with file)' : '(without file)');

    console.log('📬 [submitMilestone] Creating notification for client...');

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
        console.error('❌ [submitMilestone] Notification error:', notificationError);
        throw new Error(notificationError.message);
    }

    console.log('🎉 [submitMilestone] SUBMISSION COMPLETE!');
}

export async function deleteMilestoneSubmission(milestoneId: string): Promise<void> {
    console.log('🗑️ [deleteMilestoneSubmission] Starting deletion for milestone:', milestoneId);
    
    // First, check if the milestone exists and its current status
    const { data: checkData, error: checkError } = await supabaseClient
        .from('milestones')
        .select('id, status, submission_description, file, freelancer')
        .eq('id', milestoneId)
        .single();
    
    if (checkError) {
        console.error('❌ [deleteMilestoneSubmission] Error checking milestone:', checkError);
        throw new Error(`Cannot find milestone: ${checkError.message}`);
    }
    
    console.log('📋 [deleteMilestoneSubmission] Current milestone:', checkData);
    
    // Now try to update it
    const { data, error } = await supabaseClient
        .from('milestones')
        .update({ 
            status: 'IN_PROGRESS', 
            submission_description: null, 
            file: null 
        })
        .eq('id', milestoneId)
        .select();
    
    if (error) {
        console.error('❌ [deleteMilestoneSubmission] Error:', error);
        console.error('❌ [deleteMilestoneSubmission] Error code:', error.code);
        console.error('❌ [deleteMilestoneSubmission] Error hint:', error.hint);
        console.error('❌ [deleteMilestoneSubmission] Error details:', error.details);
        throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
        console.warn('⚠️ [deleteMilestoneSubmission] No rows updated - you may lack permission');
        console.warn('⚠️ [deleteMilestoneSubmission] This could be an RLS policy issue');
        throw new Error('Failed to delete submission - no rows updated. Check permissions.');
    }
    
    console.log('✅ [deleteMilestoneSubmission] Submission deleted successfully:', data);
}

export async function getRecentMilestonesForUser({
    userId,
    userRole,
}: {
    userId: string;
    userRole: 'client' | 'freelancer';
}): Promise<MilestonesFromBackendType[]> {
    const { data, error } = await supabaseClient
        .from('milestones')
        .select('*, freelancer(id, username, profile_pic)')
        .eq(userRole, userId)
        .order('created_at', { ascending: false })
        .limit(3);
    if (error) {
        console.error(error.message);
        throw new Error(error.message);
    }
    return data;
}

export async function getAllMilestonesForClient(clientId: string): Promise<MilestonesFromBackendType[]> {
    const { data, error } = await supabaseClient
        .from('milestones')
        .select('id, title, amount, status, created_at, project!inner(id, title)')
        .eq('client', clientId);

    if (error) {
        console.error('[getAllMilestonesForClient] Error:', error.message);
        throw new Error(error.message);
    }

    // Transform the data to match expected type (project as object, not array)
    return data.map(milestone => ({
        ...milestone,
        project: Array.isArray(milestone.project) ? milestone.project[0] : milestone.project
    })) as MilestonesFromBackendType[];
}

export async function getAllMilestonesForFreelancer(freelancerId: string): Promise<MilestonesFromBackendType[]> {
    const { data, error } = await supabaseClient
        .from('milestones')
        .select('id, title, amount, status, created_at, project!inner(id, title)')
        .eq('freelancer', freelancerId);

    if (error) {
        console.error('[getAllMilestonesForFreelancer] Error:', error.message);
        throw new Error(error.message);
    }

    // Transform the data to match expected type (project as object, not array)
    return data.map(milestone => ({
        ...milestone,
        project: Array.isArray(milestone.project) ? milestone.project[0] : milestone.project
    })) as MilestonesFromBackendType[];
}

/**
 * Delete a milestone and return its amount back to the project budget
 * This should only be called for milestones that are not COMPLETED
 */
export async function deleteMilestone(params: {
    milestoneId: string;
    milestoneAmount: number;
    projectId: string;
}): Promise<void> {
    console.log('[deleteMilestone] Deleting milestone:', params.milestoneId);
    console.log('[deleteMilestone] Milestone amount to return:', params.milestoneAmount);

    // Step 1: Get current project budget
    const { data: projectData, error: projectFetchError } = await supabaseClient
        .from('projects')
        .select('budget')
        .eq('id', params.projectId)
        .single();

    if (projectFetchError) {
        console.error('[deleteMilestone] Error fetching project budget:', projectFetchError.message);
        throw new Error(projectFetchError.message);
    }

    console.log('[deleteMilestone] Current project budget:', projectData.budget);

    // Step 2: Return milestone amount back to project budget
    const newBudget = projectData.budget + params.milestoneAmount;
    console.log('[deleteMilestone] New project budget after returning amount:', newBudget);

    const { error: projectUpdateError } = await supabaseClient
        .from('projects')
        .update({ budget: newBudget })
        .eq('id', params.projectId);

    if (projectUpdateError) {
        console.error('[deleteMilestone] Error updating project budget:', projectUpdateError.message);
        throw new Error(projectUpdateError.message);
    }

    console.log('[deleteMilestone] ✅ Project budget updated');

    // Step 3: Delete the milestone
    const { error: deleteError } = await supabaseClient
        .from('milestones')
        .delete()
        .eq('id', params.milestoneId);

    if (deleteError) {
        console.error('[deleteMilestone] Error deleting milestone:', deleteError.message);
        throw new Error(deleteError.message);
    }

    console.log('[deleteMilestone] ✅ Milestone deleted successfully');
}








