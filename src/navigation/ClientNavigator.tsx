import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { CustomHeader } from '../components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import { useUnseenChatsCount } from '../hooks/useUnseenChatsCount';
import { getAllNotificationsForUser } from '@/api/notifications-functions';
import { useQuery } from '@tanstack/react-query';
import { userAuthStore } from '@/store/user-auth-store';

// Import screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import CreateProjectScreen from '../screens/client/CreateProjectScreen';
import AllProjectsScreen from '../screens/client/AllProjectsScreen';
import ProjectDetailsScreen from '../screens/client/ProjectDetailsScreen';
import PendingInvitationsScreen from '../screens/client/PendingInvitationsScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';
import ViewFreelancersScreen from '../screens/client/ViewFreelancersScreen';
import FreelancerDetailsScreen from '../screens/client/FreelancerDetailsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import MilestoneDetailsScreen from '../screens/shared/MilestoneDetailsScreen';
// Chat screens temporarily disabled during Freelansync DB migration
// import ProjectChatScreen from '../screens/chat/ProjectChatScreen';
// import ChatsScreen from '../screens/chat/ChatsScreen';
// import IndividualChatScreen from '../screens/chat/IndividualChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Chats Screen Wrapper with Search State - DISABLED
/* function ChatsScreenWrapper() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const unseenChatsCount = useUnseenChatsCount();
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <CustomHeader 
                    title="Chats" 
                    role="client" 
                    unseenChatsCount={unseenChatsCount}
                    hideChatIcon={true}
                    showSearchBar={true}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search conversations..."
                />
            ),
        });
    }, [navigation, unseenChatsCount, searchQuery]);

    return <ChatsScreen searchQuery={searchQuery} />;
} */

// All Projects Screen Wrapper with Search State
function AllProjectsScreenWrapper() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const unseenChatsCount = useUnseenChatsCount();
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <CustomHeader 
                    title="My Projects" 
                    role="client" 
                    unseenChatsCount={unseenChatsCount}
                    showSearchBar={true}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search projects..."
                />
            ),
        });
    }, [navigation, unseenChatsCount, searchQuery]);

    return <AllProjectsScreen navigation={navigation as any} route={{ params: {} } as any} searchQuery={searchQuery} />;
}

// View Freelancers Screen Wrapper with Search State
function ViewFreelancersScreenWrapper() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const unseenChatsCount = useUnseenChatsCount();
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <CustomHeader 
                    title="Find Freelancers" 
                    role="client" 
                    unseenChatsCount={unseenChatsCount}
                    showSearchBar={true}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search freelancers..."
                />
            ),
        });
    }, [navigation, unseenChatsCount, searchQuery]);

    return <ViewFreelancersScreen navigation={navigation as any} route={{ params: {} } as any} searchQuery={searchQuery} />;
}

// Stack Navigator for Dashboard
function DashboardStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                header: () => <CustomHeader title="Dashboard" role="client" unseenChatsCount={unseenChatsCount} />,
                animation: 'fade_from_bottom',
            }}
        >
            <Stack.Screen name="DashboardMain" component={ClientDashboardScreen} />
            <Stack.Screen
                name="ProjectDetails"
                component={ProjectDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen
                name="PendingInvitations"
                component={PendingInvitationsScreen}
                options={{
                    header: () => <CustomHeader title="Pending Invitations" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen 
                name="FreelancerDetails" 
                component={FreelancerDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Freelancer Details" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MilestoneDetails"
                component={MilestoneDetailsScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/* Chat functionality temporarily disabled - will be re-enabled with new DB
            <Stack.Screen
                name="Chats"
                component={ChatsScreenWrapper}
            />
            <Stack.Screen 
                name="ProjectChat" 
                component={ProjectChatScreen}
            />
            <Stack.Screen 
                name="IndividualChat" 
                component={IndividualChatScreen}
            />
            */}
        </Stack.Navigator>
    );
}

// Stack Navigator for Create Project
function CreateProjectStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                header: () => <CustomHeader title="Create Project" role="client" unseenChatsCount={unseenChatsCount} />,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="CreateProjectMain" component={CreateProjectScreen} />
        </Stack.Navigator>
    );
}

// Stack Navigator for My Projects
function MyProjectsStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                animation: 'slide_from_left',
            }}
        >
            <Stack.Screen name="AllProjectsMain" component={AllProjectsScreenWrapper} />
            <Stack.Screen 
                name="ProjectDetails" 
                component={ProjectDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen
                name="PendingInvitations"
                component={PendingInvitationsScreen}
                options={{
                    header: () => <CustomHeader title="Pending Invitations" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen 
                name="FreelancerDetails" 
                component={FreelancerDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Freelancer Details" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            <Stack.Screen
                name="MilestoneDetails"
                component={MilestoneDetailsScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/* Chat functionality temporarily disabled - will be re-enabled with new DB
            <Stack.Screen 
                name="ProjectChat" 
                component={ProjectChatScreen}
            />
            <Stack.Screen 
                name="Chats" 
                component={ChatsScreenWrapper}
            />
            <Stack.Screen 
                name="IndividualChat" 
                component={IndividualChatScreen}
            />
            */}
        </Stack.Navigator>
    );
}

// Stack Navigator for Find Freelancers
function FindFreelancersStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                animation: 'fade',
            }}
        >
            <Stack.Screen name="ViewFreelancersMain" component={ViewFreelancersScreenWrapper} />
            <Stack.Screen 
                name="FreelancerDetails" 
                component={FreelancerDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Freelancer Details" role="client" unseenChatsCount={unseenChatsCount} />,
                }}
            />
            {/* Chat functionality temporarily disabled - will be re-enabled with new DB
            <Stack.Screen 
                name="IndividualChat" 
                component={IndividualChatScreen}
            />
            */}
        </Stack.Navigator>
    );
}

// Custom Tab Bar Icon
const TabIcon = ({ 
    iconOutline, 
    iconFilled, 
    label, 
    focused,
    badgeCount = 0
}: { 
    iconOutline: keyof typeof Ionicons.glyphMap; 
    iconFilled: keyof typeof Ionicons.glyphMap; 
    label: string; 
    focused: boolean;
    badgeCount?: number;
}) => (
    <View style={styles.tabItem}>
        <View>
            <Ionicons 
                name={focused ? iconFilled : iconOutline} 
                size={24} 
                color={focused ? '#0532A9' : '#999'} 
                style={focused && styles.tabIconFocused}
            />
            {badgeCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </Text>
                </View>
            )}
        </View>
        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
);

export default function ClientNavigator() {
    const { user } = userAuthStore();
    
    // Fetch notifications to get unread count
    const { data: notifications } = useQuery({
        queryKey: ['get-all-notifications-for-user', user?.userId],
        queryFn: () => getAllNotificationsForUser(user!.userId),
        enabled: !!user?.userId,
        refetchInterval: 20 * 1000,
        refetchIntervalInBackground: true,
    });

    const unreadNotificationCount = notifications?.filter((n) => !n.read).length || 0;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'DashboardMain';
                    const hideTabBar = routeName === 'Chats' || routeName === 'ProjectChat' || routeName === 'IndividualChat';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="home-outline" 
                                iconFilled="home" 
                                label="Dashboard" 
                                focused={focused && routeName === 'DashboardMain'} 
                            />
                        ),
                        tabBarStyle: hideTabBar ? { display: 'none' } : styles.tabBar,
                    };
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        const state = navigation.getState();
                        const routeIndex = state.routes.findIndex((r: any) => r.name === 'Dashboard');
                        if (routeIndex !== -1) {
                            const dashboardState = state.routes[routeIndex].state;
                            if (dashboardState && dashboardState.index > 0) {
                                e.preventDefault();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Dashboard' }],
                                });
                            }
                        }
                    },
                })}
            />
            <Tab.Screen
                name="CreateProject"
                component={CreateProjectStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'CreateProjectMain';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="add-circle-outline" 
                                iconFilled="add-circle" 
                                label="Create" 
                                focused={focused && routeName === 'CreateProjectMain'} 
                            />
                        ),
                    };
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon 
                            iconOutline="notifications-outline" 
                            iconFilled="notifications" 
                            label="Alerts" 
                            focused={focused} 
                            badgeCount={unreadNotificationCount}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="AllProjects"
                component={MyProjectsStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'AllProjectsMain';
                    const hideTabBar = routeName === 'Chats' || routeName === 'ProjectChat' || routeName === 'IndividualChat';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="folder-outline" 
                                iconFilled="folder" 
                                label="Projects" 
                                focused={focused && routeName === 'AllProjectsMain'} 
                            />
                        ),
                        tabBarStyle: hideTabBar ? { display: 'none' } : styles.tabBar,
                    };
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        const state = navigation.getState();
                        const routeIndex = state.routes.findIndex((r: any) => r.name === 'AllProjects');
                        if (routeIndex !== -1) {
                            const projectsState = state.routes[routeIndex].state;
                            if (projectsState && projectsState.index > 0) {
                                e.preventDefault();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'AllProjects' }],
                                });
                            }
                        }
                    },
                })}
            />
            <Tab.Screen
                name="ViewFreelancers"
                component={FindFreelancersStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'ViewFreelancersMain';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="search-outline" 
                                iconFilled="search" 
                                label="Find" 
                                focused={focused && routeName === 'ViewFreelancersMain'} 
                            />
                        ),
                    };
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        const state = navigation.getState();
                        const routeIndex = state.routes.findIndex((r: any) => r.name === 'ViewFreelancers');
                        if (routeIndex !== -1) {
                            const freelancersState = state.routes[routeIndex].state;
                            if (freelancersState && freelancersState.index > 0) {
                                e.preventDefault();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'ViewFreelancers' }],
                                });
                            }
                        }
                    },
                })}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    tabIconFocused: {
        transform: [{ scale: 1.1 }],
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    tabLabelFocused: {
        color: '#0532A9',
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
});
