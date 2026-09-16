/**
 * AI-powered freelancer recommendation API functions
 */

const RECOMMENDATION_API_URL = 'https://freelancerrecommendation-production.up.railway.app/recommend';

export interface RecommendationRequest {
    skills: string[];
    num_recommendations: number;
}

export interface RecommendedFreelancer {
    id: string;
    username: string;
    email?: string;
    profile_pic?: string | null;
    headline?: string | null;
    skills: string[];
    rating: number | null;
    total_reviews?: number;
    similarity_score: number;
}

export interface RecommendationResponse {
    recommended_freelancers: RecommendedFreelancer[];
    total_found: number;
}

// API Response (from Railway)
interface APIFreelancer {
    id: string;
    name: string;
    skills: string; // comma-separated string
    rating: number;
    experience: number;
    completed_projects: number;
    match: number;
    score: number;
}

interface APIResponse {
    recommendations: APIFreelancer[];
    total: number;
    success: boolean;
}

/**
 * Get AI-powered freelancer recommendations based on required skills
 * @param skills - Array of required skills for the project
 * @param numRecommendations - Number of freelancers to recommend
 * @returns Promise with recommended freelancers
 */
export async function getFreelancerRecommendations(
    skills: string[],
    numRecommendations: number
): Promise<RecommendationResponse> {
    console.log('[AI Recommendation] 🤖 Fetching recommendations...');
    console.log('[AI Recommendation] Skills:', skills);
    console.log('[AI Recommendation] Count:', numRecommendations);

    try {
        const response = await fetch(RECOMMENDATION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                skills,
                num_recommendations: numRecommendations,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Recommendation] ❌ API Error:', response.status, errorText);
            throw new Error(`Recommendation API failed: ${response.status}`);
        }

        const apiData: APIResponse = await response.json();
        
        console.log('[AI Recommendation] ✅ Raw API Response:', apiData);
        console.log('[AI Recommendation] API returned:', apiData.recommendations.length, 'results');
        console.log('[AI Recommendation] User requested:', numRecommendations, 'results');
        
        // Transform API response to match our interface
        const allFreelancers = apiData.recommendations.map((freelancer) => ({
            id: freelancer.id,
            username: freelancer.name,
            email: '', // Not provided by API
            profile_pic: null, // Not provided by API
            headline: null, // Not provided by API
            skills: freelancer.skills.split(',').map(s => s.trim()),
            rating: freelancer.rating,
            total_reviews: 0, // Not provided by API
            similarity_score: freelancer.score,
        }));
        
        // Slice to match requested number (API ignores this parameter)
        const slicedFreelancers = allFreelancers.slice(0, numRecommendations);
        
        const transformedData: RecommendationResponse = {
            recommended_freelancers: slicedFreelancers,
            total_found: slicedFreelancers.length,
        };
        
        console.log('[AI Recommendation] ✅ Success!');
        console.log('[AI Recommendation] Returning:', transformedData.total_found, 'freelancers (sliced from', allFreelancers.length, ')');
        
        return transformedData;
    } catch (error) {
        console.error('[AI Recommendation] ❌ Error:', error);
        throw error;
    }
}

