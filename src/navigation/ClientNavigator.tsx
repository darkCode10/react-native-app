import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { CustomHeader } from '../components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import { useUnseenChatsCount } from '../hooks/useUnseenChatsCount';
import { useUnreadNotificationsCount } from '../hooks/useUnreadNotificationsCount';
import { ClientStackParamList } from './types';

// Import screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import CreateProjectScreen from '../screens/client/CreateProjectScreen';
import AllProjectsScreen from '../screens/client/AllProjectsScreen';
import ProjectDetailsScreen from '../screens/client/ProjectDetailsScreen';
import CreateMilestoneScreen from '../screens/client/CreateMilestoneScreen';
import PendingInvitationsScreen from '../screens/client/PendingInvitationsScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';
import ViewFreelancersScreen from '../screens/client/ViewFreelancersScreen';
import FreelancerDetailsScreen from '../screens/client/FreelancerDetailsScreen';
import MilestoneDetailsScreen from '../screens/shared/MilestoneDetailsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
// Chat screens enabled with polling approach
import ProjectChatScreen from '../screens/chat/ProjectChatScreen';
import ChatsScreen from '../screens/chat/ChatsScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<ClientStackParamList>();

// Chats Screen Wrapper with Search State
function ChatsScreenWrapper() {
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
                    hideNotificationIcon={true}
                    showSearchBar={true}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search conversations..."
                />
            ),
        });
    }, [navigation, unseenChatsCount, searchQuery]);

    return <ChatsScreen searchQuery={searchQuery} />;
}

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
                    hideNotificationIcon={true}
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
                    hideNotificationIcon={true}
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
                header: () => <CustomHeader title="Dashboard" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                animation: 'fade_from_bottom',
            }}
        >
            <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
            <Stack.Screen
                name="ProjectDetails"
                component={ProjectDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="CreateMilestone"
                component={CreateMilestoneScreen}
                options={{
                    header: () => <CustomHeader title="Create Milestone" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="MilestoneDetails"
                component={MilestoneDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Milestone Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="PendingInvitations"
                component={PendingInvitationsScreen}
                options={{
                    header: () => <CustomHeader title="Pending Invitations" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen 
                name="ViewFreelancers" 
                component={ViewFreelancersScreenWrapper}
            />
            <Stack.Screen 
                name="FreelancerDetails" 
                component={FreelancerDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Freelancer Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
        </Stack.Navigator>
    );
}

// Stack Navigator for Create Project
function CreateProjectStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                header: () => <CustomHeader title="Create Project" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
                name="Chats"
                component={ChatsScreenWrapper}
            />
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
            <Stack.Screen name="AllProjects" component={AllProjectsScreenWrapper} />
            <Stack.Screen 
                name="ProjectDetails" 
                component={ProjectDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="CreateMilestone"
                component={CreateMilestoneScreen}
                options={{
                    header: () => <CustomHeader title="Create Milestone" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="MilestoneDetails"
                component={MilestoneDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Milestone Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="PendingInvitations"
                component={PendingInvitationsScreen}
                options={{
                    header: () => <CustomHeader title="Pending Invitations" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen 
                name="FreelancerDetails" 
                component={FreelancerDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Freelancer Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
        </Stack.Navigator>
    );
}

// Stack Navigator for Notifications
function NotificationsStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="NotificationsMain" 
                component={NotificationsScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="ProjectDetails" 
                component={ProjectDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="Chats"
                component={ChatsScreenWrapper}
            />
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
            <Stack.Screen name="ViewFreelancers" component={ViewFreelancersScreenWrapper} />
            <Stack.Screen 
                name="FreelancerDetails" 
                component={FreelancerDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Freelancer Details" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="client" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
                name="Chats"
                component={ChatsScreenWrapper}
            />
            <Stack.Screen 
                name="IndividualChat" 
                component={IndividualChatScreen}
            />
        </Stack.Navigator>
    );
}

// Custom Tab Bar Icon
const TabIcon = ({ 
    iconOutline, 
    iconFilled, 
    label, 
    focused,
    badgeCount 
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
            {badgeCount !== undefined && badgeCount > 0 && (
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
    const unreadNotificationsCount = useUnreadNotificationsCount();
    
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
                        // Reset to the first route when tab is pressed
                        navigation.navigate('Dashboard', { screen: 'DashboardMain' });
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
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        navigation.navigate('CreateProject', { screen: 'CreateProjectMain' });
                    },
                })}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'NotificationsMain';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="notifications-outline" 
                                iconFilled="notifications" 
                                label="Alerts" 
                                focused={focused && routeName === 'NotificationsMain'} 
                                badgeCount={unreadNotificationsCount}
                            />
                        ),
                    };
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        navigation.navigate('Notifications', { screen: 'NotificationsMain' });
                    },
                })}
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
                        navigation.navigate('AllProjects', { screen: 'AllProjectsMain' });
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
                        navigation.navigate('ViewFreelancers', { screen: 'ViewFreelancersMain' });
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
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
});
