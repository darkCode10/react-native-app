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
            },
        ])
        .select("id")
        .single();
    if (error) {
        console.error(error.message);
        throw new Error(errorMessageMaker(error.message));
    }

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




