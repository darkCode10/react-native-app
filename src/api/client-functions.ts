// ============================================
// CLIENT API FUNCTIONS (Adapted from Freelansync)
// ============================================

import { supabaseClient } from "@/config/supabase";
import type {
    ClientDetailsForFreelancerFromBackendType,
    ClientProfileOwnFromBackendType,
} from "@/types";
import { errorMessageMaker } from "./error-message-maker";

export async function getClientProfileOwnDataById(
    clientId: string
): Promise<ClientProfileOwnFromBackendType> {
    const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
    if (error) {
        console.error(error.message);
        throw new Error();
    }

    return data;
}

export async function updateClientProfileImage({
    clientId,
    file,
}: {
    clientId: string;
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
        .from("clients")
        .update({ profile_pic: imageData.publicUrl })
        .eq("id", clientId);

    if (updateImageError) {
        console.error(updateImageError.message);
        throw new Error(errorMessageMaker(updateImageError.message));
    }

    return imageData.publicUrl;
}

export async function getClientDetailsForFreelancer(
    clientId: string
): Promise<ClientDetailsForFreelancerFromBackendType> {
    const { data, error } = await supabaseClient
        .from("clients")
        .select("id, username, email, profile_pic, role, created_at")
        .eq("id", clientId)
        .single();

    if (error) {
        console.error(error.message);
        throw new Error();
    }

    return data;
}
