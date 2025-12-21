// ============================================
// FREELANCER API FUNCTIONS (Adapted from Freelansync)
// ============================================

import { supabaseClient } from "@/config/supabase";
import type {
    FreelancerFromBackendType,
    FreelancerProfileOwnFromBackendType,
} from "@/types";
import { errorMessageMaker } from "./error-message-maker";

export async function getFreelancerProfileOwnDataById(
    freelancerId: string
): Promise<FreelancerProfileOwnFromBackendType> {
    const { data, error } = await supabaseClient
        .from("freelancers")
        .select("*")
        .eq("id", freelancerId)
        .single();
    if (error) {
        console.error(error.message);
        throw new Error();
    }
    return data;
}

export async function updateFreelancerProfileImage({
    freelancerId,
    file,
}: {
    freelancerId: string;
    file: any; // React Native file object with uri, name, type
}): Promise<string> {
    const fileName = `${Date.now()}-${file.name || 'profile.jpg'}`;
    
    // For React Native, we need to fetch the file as a blob
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const { error: uploadError } = await supabaseClient.storage
        .from("freelansync-media")
        .upload(`profile-pics/${fileName}`, blob, {
            upsert: false,
            cacheControl: "3600",
            contentType: file.type || 'image/jpeg',
        });
    if (uploadError) {
        console.error(uploadError.message);
        throw new Error(errorMessageMaker(uploadError.message));
    }

    const { data: imageData } = supabaseClient.storage
        .from("freelansync-media")
        .getPublicUrl(`profile-pics/${fileName}`);
    if (!imageData.publicUrl) {
        console.error("Error! Failed to get image public url");
        throw new Error(
            errorMessageMaker("Failed to upload image, Failed to get public url")
        );
    }

    const { error: updateImageError } = await supabaseClient
        .from("freelancers")
        .update({ profile_pic: imageData.publicUrl })
        .eq("id", freelancerId);

    if (updateImageError) {
        console.error(updateImageError.message);
        throw new Error(errorMessageMaker(updateImageError.message));
    }

    return imageData.publicUrl;
}

export async function getAllFreelancers(): Promise<FreelancerFromBackendType[]> {
    const { data, error } = await supabaseClient
        .from("freelancers")
        .select(
            "id, username, description, email, profile_pic, role, skills, domains, created_at"
        );

    if (error) {
        console.error(error.message);
        throw new Error();
    }
    return data;
}

export async function getFreelancersToRecommend(
    projectId: string
): Promise<FreelancerFromBackendType[]> {
    const { data: allFreelancers, error } = await supabaseClient
        .from("freelancers")
        .select(
            "id, username, description, email, profile_pic, role, skills, domains, created_at"
        );
    if (error) throw new Error(error.message);

    const { data: memberFreelancers, error: freelancerError } = await supabaseClient
        .from("project_and_freelancer_link")
        .select("freelancer")
        .eq("project", projectId);

    if (freelancerError) throw new Error(freelancerError.message);

    const memberFreelancersIds = memberFreelancers.map((f) => f.freelancer);
    const recommendedFreelancers = allFreelancers.filter(
        (freelancer) => !memberFreelancersIds.includes(freelancer.id)
    );

    return recommendedFreelancers;
}

export async function getFreelancerDetailsForClient(
    freelancerId: string
): Promise<FreelancerFromBackendType> {
    const { data, error } = await supabaseClient
        .from("freelancers")
        .select(
            "id, username, description, email, profile_pic, role, skills, domains, created_at"
        )
        .eq("id", freelancerId)
        .single();

    if (error) {
        console.error(error.message);
        throw new Error();
    }

    return data;
}

export async function getFreelancerDetails(
    freelancerId: string
): Promise<FreelancerFromBackendType> {
    const { data, error } = await supabaseClient
        .from("freelancers")
        .select(
            "id, username, description, email, profile_pic, role, skills, domains, created_at"
        )
        .eq("id", freelancerId)
        .single();

    if (error) {
        console.error(error.message);
        throw new Error();
    }
    return data;
}
