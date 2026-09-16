// ============================================
// PROJECT API FUNCTIONS (Adapted from Freelansync)
// ============================================

import { supabaseClient } from "@/config/supabase";
import type {
    ProjectFromBackendType,
    CreateProjectParamsType,
    ProjectDetailsByIdFromBackendType,
    AllProjectsForFreelancerFromBackendType,
} from "@/types";
import { errorMessageMaker } from "./error-message-maker";

export async function createProject(params: CreateProjectParamsType): Promise<string> {
    // Step 1: Check if client has enough funds in wallet
    const { error: walletError, data: walletData } = await supabaseClient
        .from("clients")
        .select("wallet_amount")
        .eq("id", params.clientId)
        .single();
    
    if (walletError) {
        console.error('[createProject] Wallet check error:', walletError.message);
        throw new Error(errorMessageMaker(walletError.message));
    }

    if (walletData.wallet_amount < params.budget) {
        throw new Error("You do not have enough funds for this project!");
    }

    // Step 2: Create the project with original_budget field
    const { data, error } = await supabaseClient
        .from("projects")
        .insert([
            {
                client: params.clientId,
                title: params.title,
                description: params.description,
                skills: params.skills,
                domains: params.domains,
                budget: params.budget,
                original_budget: params.budget, // Required field
            },
        ])
        .select("id, budget")
        .single();
    
    if (error) {
        console.error('[createProject] Insert error:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }

    // Step 3: Deduct budget from client's wallet
    const newWalletAmount = walletData.wallet_amount - data.budget;

    const { error: updateError } = await supabaseClient
        .from("clients")
        .update({ wallet_amount: newWalletAmount })
        .eq("id", params.clientId)
        .select("wallet_amount")
        .single();
    
    if (updateError) {
        console.error('[createProject] Wallet update error:', updateError.message);
        throw new Error(errorMessageMaker(updateError.message));
    }

    console.log('[createProject] Project created successfully:', data.id);
    return data.id;
}

export async function getAllProjectsForClient(
    clientId: string
): Promise<ProjectFromBackendType[]> {
    const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("client", clientId)
        .order("created_at", { ascending: false });
    if (error) {
        console.error(error.message);
        throw new Error();
    }
    return data;
}

export async function getProjectDetailsById(
    projectId: string
): Promise<ProjectDetailsByIdFromBackendType> {
    const { data, error } = await supabaseClient
        .from("projects")
        .select(
            "*, client(id, username, email, profile_pic, role), project_and_freelancer_link(freelancer(id, username, description, email, profile_pic, role, skills, domains, created_at))"
        )
        .eq("id", projectId)
        .single();
    if (error) {
        console.error(error.message);
        throw new Error();
    }
    return data;
}

export async function getAllProjectsForFreelancer(
    freelancerId: string
): Promise<AllProjectsForFreelancerFromBackendType[]> {
    console.log('[API] Fetching projects for freelancer:', freelancerId);
    const { error, data } = await supabaseClient
        .from("project_and_freelancer_link")
        .select("project(*)")
        .eq("freelancer", freelancerId);
    
    console.log('[API] Raw query result:', { error: error?.message, dataLength: data?.length, data: JSON.stringify(data, null, 2) });
    
    if (error) {
        console.error('[API] Error fetching projects:', error.message);
        throw new Error(errorMessageMaker(error.message));
    }
    
    if (!data || data.length === 0) {
        console.log('[API] No projects found for freelancer');
        return [];
    }
    
    return data as unknown as AllProjectsForFreelancerFromBackendType[];
}

/**
 * Mark a project as completed
 * Only succeeds if ALL milestones are COMPLETED
 * @param projectId - ID of the project to mark as completed
 * @returns true if successful, false if there are incomplete milestones
 */
export async function markProjectAsCompleted(params: {
    projectId: string;
}): Promise<boolean> {
    console.log('========== MARK PROJECT AS COMPLETED ==========');
    console.log('[markProjectAsCompleted] Project ID:', params.projectId);
    
    // Step 1: Check if all milestones are completed
    const { data: milestones, error: fetchError } = await supabaseClient
        .from("milestones")
        .select("id, title, status")
        .eq("project", params.projectId);
    
    if (fetchError) {
        console.error('[markProjectAsCompleted] ❌ Error fetching milestones:', fetchError.message);
        throw new Error(errorMessageMaker(fetchError.message));
    }

    console.log('[markProjectAsCompleted] ✅ Milestones found:', milestones?.length);
    
    // Log each milestone status
    milestones?.forEach((m, idx) => {
        console.log(`[markProjectAsCompleted] Milestone ${idx + 1}: "${m.title}" - Status: "${m.status}"`);
    });
    
    // Check if any milestone is not completed
    const completedCount = milestones?.filter((item) => item.status === "COMPLETED").length || 0;
    const anyNonCompleted = milestones?.some((item) => item.status !== "COMPLETED");
    
    console.log('[markProjectAsCompleted] Completed milestones:', completedCount, '/', milestones?.length);
    console.log('[markProjectAsCompleted] Any non-completed?', anyNonCompleted);
    
    if (anyNonCompleted) {
        console.log('[markProjectAsCompleted] ❌ Cannot complete: Some milestones are not completed');
        const nonCompleted = milestones?.filter((item) => item.status !== "COMPLETED");
        nonCompleted?.forEach((m) => {
            console.log(`[markProjectAsCompleted]   - "${m.title}" is ${m.status}`);
        });
        return false;
    }

    // Step 2: Handle Budget Refund
    console.log('[markProjectAsCompleted] 🔄 All milestones completed. Checking for remaining budget...');
    
    const { data: projectData, error: projectError } = await supabaseClient
        .from("projects")
        .select("budget, client")
        .eq("id", params.projectId)
        .single();

    if (projectError) {
        console.error('[markProjectAsCompleted] ❌ Error fetching project details:', projectError.message);
        throw new Error(errorMessageMaker(projectError.message));
    }

    if (projectData.budget > 0) {
        const refundAmount = projectData.budget;
        console.log(`[markProjectAsCompleted] 💰 Remaining budget found: ${refundAmount}. Initiating refund...`);

        // 2a. Set project budget to 0 FIRST (Locking funds to prevent double-spend)
        const { error: clearBudgetError } = await supabaseClient
            .from("projects")
            .update({ budget: 0 })
            .eq("id", params.projectId);
        
        if (clearBudgetError) {
            console.error('[markProjectAsCompleted] ❌ Error clearing project budget:', clearBudgetError.message);
            throw new Error(errorMessageMaker(clearBudgetError.message));
        }

        try {
            // 2b. Add to client wallet
            const { data: clientData, error: clientFetchError } = await supabaseClient
                .from("clients")
                .select("wallet_amount")
                .eq("id", projectData.client)
                .single();
            
            if (clientFetchError) throw clientFetchError;

            const { error: walletUpdateError } = await supabaseClient
                .from("clients")
                .update({ wallet_amount: clientData.wallet_amount + refundAmount })
                .eq("id", projectData.client);

            if (walletUpdateError) throw walletUpdateError;
            
            console.log('[markProjectAsCompleted] ✅ Refund successful. Client wallet updated.');

        } catch (error: any) {
            console.error('[markProjectAsCompleted] ❌ Wallet update failed, reverting project budget...', error);
            // Attempt to revert project budget
            await supabaseClient
                .from("projects")
                .update({ budget: refundAmount })
                .eq("id", params.projectId);
            
            throw new Error(`Failed to process refund: ${error.message || 'Unknown error'}`);
        }
    } else {
        console.log('[markProjectAsCompleted] ℹ️ No remaining budget to refund.');
    }

    // Step 3: Update project status to COMPLETED
    console.log('[markProjectAsCompleted] 🔄 Updating project status to COMPLETED...');
    const { error: updateError } = await supabaseClient
        .from("projects")
        .update({ status: "COMPLETED" })
        .eq("id", params.projectId);
    
    if (updateError) {
        console.error('[markProjectAsCompleted] ❌ Error updating project status:', updateError.message);
        throw new Error(errorMessageMaker(updateError.message));
    }
    
    console.log('[markProjectAsCompleted] ✅ Project marked as completed successfully!');
    console.log('===============================================');
    return true;
}

/**
 * Delete a project (only allowed if status is DRAFT)
 * Refunds the project budget back to client's wallet
 * @param projectId - ID of the project to delete
 * @param clientId - ID of the client who owns the project
 * @returns true if successful
 */
export async function deleteProject(params: {
    projectId: string;
    clientId: string;
}): Promise<boolean> {
    console.log('[deleteProject] Starting project deletion:', params.projectId);
    
    // Step 1: Get project details and check status
    const { data: projectData, error: projectError } = await supabaseClient
        .from("projects")
        .select("status, budget, client")
        .eq("id", params.projectId)
        .single();
    
    if (projectError) {
        console.error('[deleteProject] Error fetching project:', projectError.message);
        throw new Error(errorMessageMaker(projectError.message));
    }
    
    // Step 2: Verify ownership
    if (projectData.client !== params.clientId) {
        console.error('[deleteProject] Unauthorized: User is not the project owner');
        throw new Error("You are not authorized to delete this project");
    }
    
    // Step 3: Check if status is DRAFT
    if (projectData.status !== "DRAFT") {
        console.error('[deleteProject] Cannot delete: Project status is not DRAFT');
        throw new Error("Only projects in DRAFT status can be deleted");
    }
    
    // Step 4: Refund the budget to client's wallet
    const { data: clientData, error: clientError } = await supabaseClient
        .from("clients")
        .select("wallet_amount")
        .eq("id", params.clientId)
        .single();
    
    if (clientError) {
        console.error('[deleteProject] Error fetching client wallet:', clientError.message);
        throw new Error(errorMessageMaker(clientError.message));
    }
    
    const newWalletAmount = clientData.wallet_amount + projectData.budget;
    
    const { error: updateWalletError } = await supabaseClient
        .from("clients")
        .update({ wallet_amount: newWalletAmount })
        .eq("id", params.clientId);
    
    if (updateWalletError) {
        console.error('[deleteProject] Error updating wallet:', updateWalletError.message);
        throw new Error(errorMessageMaker(updateWalletError.message));
    }
    
    // Step 5: Delete the project
    const { error: deleteError } = await supabaseClient
        .from("projects")
        .delete()
        .eq("id", params.projectId);
    
    if (deleteError) {
        console.error('[deleteProject] Error deleting project:', deleteError.message);
        throw new Error(errorMessageMaker(deleteError.message));
    }
    
    console.log('[deleteProject] ✅ Project deleted successfully and budget refunded');
    return true;
}
