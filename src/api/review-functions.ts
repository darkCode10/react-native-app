import { supabaseClient } from '@/config/supabase';

export interface FreelancerReview {
    id: string;
    comment: string;
    stars: number;
    created_at: string;
    client: {
        id: string;
        username: string;
        profile_pic: string;
    };
}

/**
 * Create a new review for a freelancer on a specific project
 * Client can only create ONE review per project per freelancer
 */
export async function createReview(params: {
    freelancerId: string;
    clientId: string;
    stars: number;
    comment: string;
    projectId: string;
}): Promise<void> {
    console.log('[createReview] Creating review with params:', params);
    
    const { error } = await supabaseClient.from('freelancer_reviews').insert([
        {
            client: params.clientId,
            freelancer: params.freelancerId,
            comment: params.comment,
            stars: params.stars,
            project: params.projectId,
        },
    ]);
    
    if (error) {
        console.error('[createReview] Error creating review:', error);
        throw new Error(error.message || 'Failed to create review');
    }
    
    console.log('[createReview] Review created successfully');
}

/**
 * Get all reviews for a specific freelancer
 * Returns reviews with client details, ordered by most recent first
 */
export async function getAllReviewsForFreelancer(
    freelancerId: string
): Promise<FreelancerReview[]> {
    console.log('[getAllReviewsForFreelancer] Fetching reviews for freelancer:', freelancerId);
    
    const { data, error } = await supabaseClient
        .from('freelancer_reviews')
        .select('id, created_at, comment, stars, client(id, username, profile_pic)')
        .eq('freelancer', freelancerId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('[getAllReviewsForFreelancer] Error fetching reviews:', error);
        throw new Error(error.message || 'Failed to fetch reviews');
    }
    
    console.log('[getAllReviewsForFreelancer] Fetched', data?.length || 0, 'reviews');
    return data as unknown as FreelancerReview[];
}

/**
 * Check if a review already exists for a specific client-freelancer-project combination
 * Returns false if no review exists, or the review data if it does exist
 */
export async function checkReviewExistence(params: {
    freelancerId: string;
    clientId: string;
    projectId: string;
}): Promise<false | { id: string; comment: string; stars: number }> {
    console.log('[checkReviewExistence] Checking review existence:', params);
    
    const { data, error } = await supabaseClient
        .from('freelancer_reviews')
        .select('id, comment, stars')
        .eq('freelancer', params.freelancerId)
        .eq('client', params.clientId)
        .eq('project', params.projectId);
    
    if (error) {
        console.error('[checkReviewExistence] Error checking review existence:', error);
        throw new Error(error.message || 'Failed to check review existence');
    }
    
    if (!data || data.length === 0) {
        console.log('[checkReviewExistence] No existing review found');
        return false;
    }
    
    console.log('[checkReviewExistence] Existing review found:', data[0].id);
    return data[0];
}

/**
 * Get average rating and review count for a freelancer
 * Returns { averageRating: number, reviewCount: number }
 */
export async function getFreelancerAverageRating(
    freelancerId: string
): Promise<{ averageRating: number; reviewCount: number }> {
    const { data, error } = await supabaseClient
        .from('freelancer_reviews')
        .select('stars')
        .eq('freelancer', freelancerId);

    if (error) {
        console.error('[getFreelancerAverageRating] Error:', error.message);
        return { averageRating: 0, reviewCount: 0 };
    }

    if (!data || data.length === 0) {
        return { averageRating: 0, reviewCount: 0 };
    }

    const totalStars = data.reduce((sum, review) => sum + review.stars, 0);
    const averageRating = totalStars / data.length;

    return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: data.length,
    };
}

