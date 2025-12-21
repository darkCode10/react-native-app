import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
    Landing: undefined;
    Login: undefined;
    Signup: undefined;
    ClientTabs: NavigatorScreenParams<ClientTabsParamList>;
    FreelancerTabs: NavigatorScreenParams<FreelancerTabsParamList>;
};

// Client Tab Navigator
export type ClientTabsParamList = {
    ClientStack: NavigatorScreenParams<ClientStackParamList>;
    ClientChats: undefined;
};

// Client Stack Navigator
export type ClientStackParamList = {
    ClientDashboard: undefined;
    CreateProject: undefined;
    AllProjects: undefined;
    ProjectDetails: { projectId: string };
    PendingInvitations: { projectId: string };
    ClientProfile: undefined;
    ViewFreelancers: undefined;
    FreelancerDetails: { freelancerId: string };
    ProjectChat: { projectId: string };
    Chats: undefined;
    IndividualChat: {
        chatId: string;
        freelancerId: string;
        clientId: string;
        otherUserName: string;
        otherUserProfilePic: string | null;
    };
};

// Freelancer Tab Navigator
export type FreelancerTabsParamList = {
    FreelancerStack: NavigatorScreenParams<FreelancerStackParamList>;
    FreelancerChats: undefined;
};

// Freelancer Stack Navigator
export type FreelancerStackParamList = {
    FreelancerDashboard: undefined;
    FreelancerProfile: undefined;
    FreelancerInvites: undefined;
    FreelancerProjects: undefined;
    ProjectDetails: { projectId: string };
    FreelancerDetailsPage: { freelancerId: string };
    ClientProfile: { clientId: string };
    ProjectChat: { projectId: string };
    Chats: undefined;
    IndividualChat: {
        chatId: string;
        freelancerId: string;
        clientId: string;
        otherUserName: string;
        otherUserProfilePic: string | null;
    };
};




