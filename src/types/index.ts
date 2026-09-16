// ============================================
// CORE TYPES (Matching Freelansync Database)
// ============================================

export type UserRoleType = "client" | "freelancer";

export type UserType = {
    userId: string;
    username: string;
    email: string;
    role: UserRoleType;
    wallet_amount: number;
    profile_pic: string;
};

export type UserAuthStoreType = {
    user: UserType | null;
    userExists: boolean;
    setUser: (user: UserType) => void;
    reset: () => void;
};

// ============================================
// SIGNUP & LOGIN TYPES (From Freelansync)
// ============================================

export type SignupParamsType = {
    username: string;
    email: string;
    password: string;
    description?: string;
    skills?: string[];
    domains?: string[];
    role: "freelancer" | "client";
};

export type SignupResponseType = {
    id: string;
    username: string;
    email: string;
    role: "freelancer" | "client";
    profile_pic: string;
};

export type LoginResponseType = {
    id: string;
    username: string;
    email: string;
    role: "freelancer" | "client";
    profile_pic: string;
};

// ============================================
// CLIENT TYPES (From Freelansync)
// ============================================

export type ClientProfileOwnFromBackendType = {
    id: string;
    username: string;
    email: string;
    role: string;
    profile_pic: string;
    wallet_amount: number;
    created_at: string;
};

export type ClientDetailsForFreelancerFromBackendType = {
    id: string;
    username: string;
    email: string;
    role: string;
    profile_pic: string;
    created_at: string;
};

// ============================================
// FREELANCER TYPES (From Freelansync)
// ============================================

export type FreelancerProfileOwnFromBackendType = {
    id: string;
    username: string;
    description: string;
    skills: string[];
    profile_pic: string;
    role: string;
    wallet_amount: number;
    created_at: string;
    email: string;
    domains: string[];
    experience?: string | number;
};

export type FreelancerFromBackendType = {
    id: string;
    username: string;
    description: string;
    profile_pic: string;
    role: string;
    email: string;
    domains: string[];
    skills: string[];
    created_at: string;
    experience?: string | number;
};

// ============================================
// REVIEW TYPES (From Freelansync)
// ============================================

export type FreelancerReviewFromBackendType = {
    id: string;
    comment: string;
    stars: number;
    created_at: string;
    client: {
        id: string;
        username: string;
        profile_pic: string;
    };
};

// ============================================
// PROJECT TYPES (From Freelansync)
// ============================================

export type CreateProjectParamsType = {
    title: string;
    description: string;
    budget: number;
    skills: string[];
    domains: string[];
    clientId: string;
};

export type ProjectFromBackendType = {
    id: string;
    title: string;
    description: string;
    budget: number;
    original_budget: number;
    skills: string[];
    domains: string[];
    client: string; // client ID
    status: "DRAFT" | "OPEN" | "ACTIVE" | "COMPLETED" | "DISPUTED";
    created_at: string;
};

export type ProjectDetailsByIdFromBackendType = {
    id: string;
    title: string;
    description: string;
    created_at: string;
    domains: string[];
    skills: string[];
    status: "DRAFT" | "OPEN" | "ACTIVE" | "COMPLETED" | "DISPUTED";
    budget: number;
    original_budget: number;

    client: {
        id: string;
        username: string;
        email: string;
        profile_pic: string;
        role: string;
    };

    project_and_freelancer_link: {
        freelancer: {
            id: string;
            username: string;
            description: string;
            profile_pic: string;
            role: string;
            email: string;
            domains: string[];
            skills: string[];
            created_at: string;
        };
    }[];
};

export type AllProjectsForFreelancerFromBackendType = {
    project: ProjectFromBackendType;
};

// ============================================
// INVITATION TYPES (From Freelansync)
// ============================================

export type InvitationsForProjectFromBackendType = {
    id: string;
    created_at: string;
    project: string;
    freelancer: {
        id: string;
        username: string;
        profile_pic: string;
        role: string;
        email: string;
        domains: string[];
    };
};

export type InvitationsForFreelancerFromBackendType = {
    id: string;
    created_at: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    client: {
        id: string;
        username: string;
        email: string;
        profile_pic: string;
        role: string;
    };
    project: {
        id: string;
        title: string;
        description: string;
        created_at: string;
        domains: string[];
        skills: string[];
        budget: number;
    };
};

// ============================================
// CHAT TYPES (DISABLED - For Future Use)
// These types are kept for when chat functionality
// is re-enabled with the new database
// ============================================

export type ChatsStoreType = {
    chatsDataArray: ChatFromBackendType[];
    setChatsDataArray: (chats: ChatFromBackendType[]) => void;
    activeChat: ChatFromBackendType | null;
    setActiveChat: (chat: ChatFromBackendType | null) => void;
    unreadChatsIds: string[];
    addChatIdToUnreadChatsIds: (chatId: string) => void;
    removeChatIdFromUnreadChatsIds: (chatId: string) => void;
    clearUnreadChatsIds: () => void;
};

export type ChatFromBackendType = {
    id: string;
    created_at: string;
    freelancer_id: string;
    client_id: string;
    last_read_message_id_client: number | null;
    last_read_message_id_freelancer: number | null;
    latest_message_id: number | null;
    userDetails?: {
        id: string;
        username: string;
        profile_pic: string;
    };
    latestMessage?: {
        message_text: string;
        sender_role: "freelancer" | "client";
        created_at: string;
    };
    unseenCount?: number;
};

export type MessageFromBackendType = {
    id: number;
    created_at: string;
    chat_id: string;
    sender_id: string;
    sender_role: "freelancer" | "client";
    message_text: string;
    file_type: string | null;
};

export type ProjectMessageFromBackendType = {
    id: number;
    created_at: string;
    project: string;
    sender: string;
    sender_username: string;
    message_text: string;
    sender_profile_pic?: string | null;
    file_type?: string | null;
};

// ============================================
// NOTIFICATION TYPES (From Freelansync)
// ============================================

export type NotificationsFromBackendType = {
    id: number;
    read: boolean;
    title: string;
    content: string;
    to_user_id: string;
    created_at: string;
    project_id?: string;
    type:
        | "Invitation_Accepted"
        | "Invitation_Rejected"
        | "Invitation_Recieved"
        | "Milestone_Assigned"
        | "Dispute_Raised";
};

// ============================================
// MILESTONE TYPES
// ============================================

export type MilestoneStatusType = "LOCKED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "DISPUTED";

export type MilestonesFromBackendType = {
    id: string;
    title: string;
    description?: string;
    amount: number;
    status: MilestoneStatusType;
    project: {
        id: string;
        title: string;
    };
    client?: string;
    freelancer?: {
        id: string;
        username: string;
        profile_pic: string;
    };
    created_at: string;
    submission_description?: string;
    file?: string;
};

export type MilestoneDetailesFromBackendType = {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: MilestoneStatusType;
    created_at: string;
    submission_description?: string;
    file?: string;
    
    project: {
        id: string;
        title: string;
        description: string;
        budget: number;
        domains: string[];
        status: string;
    };
    client: {
        id: string;
        username: string;
        email: string;
        profile_pic: string;
        role: string;
    };
    freelancer: {
        id: string;
        username: string;
        profile_pic: string;
        domains: string[];
        email: string;
    };
};
