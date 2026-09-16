import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { CustomHeader } from '../components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import { useUnseenChatsCount } from '../hooks/useUnseenChatsCount';
import { useUnreadNotificationsCount } from '../hooks/useUnreadNotificationsCount';
import { FreelancerStackParamList } from './types';

// Import screens
import FreelancerDashboardScreen from '../screens/freelancer/FreelancerDashboardScreen';
import FreelancerProfileScreen from '../screens/freelancer/FreelancerProfileScreen';
import FreelancerInvitesScreen from '../screens/freelancer/FreelancerInvitesScreen';
import FreelancerProjectsScreen from '../screens/freelancer/FreelancerProjectsScreen';
import ProjectDetailsFreelancerScreen from '../screens/freelancer/ProjectDetailsScreen';
import FreelancerDetailsPageScreen from '../screens/freelancer/FreelancerDetailsPageScreen';
import ClientProfileFreelancerScreen from '../screens/freelancer/ClientProfileScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import MilestoneDetailsScreen from '../screens/shared/MilestoneDetailsScreen';
// Chat screens enabled with polling approach
import ProjectChatScreen from '../screens/chat/ProjectChatScreen';
import ChatsScreen from '../screens/chat/ChatsScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<FreelancerStackParamList>();

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
                    role="freelancer" 
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

// Freelancer Projects Screen Wrapper with Search State
function FreelancerProjectsScreenWrapper() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const unseenChatsCount = useUnseenChatsCount();
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <CustomHeader 
                    title="My Projects" 
                    role="freelancer" 
                    unseenChatsCount={unseenChatsCount}
                    hideNotificationIcon={true}
                    showSearchBar={true}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search projects..."
                />
            ),
        });
    }, [navigation, unseenChatsCount, searchQuery]);

    return <FreelancerProjectsScreen navigation={navigation as any} route={{ params: {} } as any} searchQuery={searchQuery} />;
}

// Stack Navigator for Dashboard
function DashboardStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                header: () => <CustomHeader title="Dashboard" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                animation: 'fade_from_bottom',
            }}
        >
            <Stack.Screen name="FreelancerDashboard" component={FreelancerDashboardScreen} />
            <Stack.Screen 
                name="ProjectDetails" 
                component={ProjectDetailsFreelancerScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen 
                name="MilestoneDetails" 
                component={MilestoneDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Milestone Details" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
                name="ClientProfile" 
                component={ClientProfileFreelancerScreen}
                options={{
                    header: () => <CustomHeader title="Client Profile" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
                name="IndividualChat" 
                component={IndividualChatScreen}
            />
            <Stack.Screen 
                name="FreelancerProfile" 
                component={FreelancerProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
        </Stack.Navigator>
    );
}

// Stack Navigator for Invitations
function InvitationsStack() {
    const unseenChatsCount = useUnseenChatsCount();
    
    return (
        <Stack.Navigator
            screenOptions={{
                header: () => <CustomHeader title="Invitations" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="FreelancerInvites" component={FreelancerInvitesScreen} />
            <Stack.Screen 
                name="ProjectDetails" 
                component={ProjectDetailsFreelancerScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
            <Stack.Screen 
                name="FreelancerProfile" 
                component={FreelancerProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
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
            <Stack.Screen name="FreelancerProjects" component={FreelancerProjectsScreenWrapper} />
            <Stack.Screen 
                name="ProjectDetails" 
                component={ProjectDetailsFreelancerScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen 
                name="MilestoneDetails" 
                component={MilestoneDetailsScreen}
                options={{
                    header: () => <CustomHeader title="Milestone Details" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
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
            <Stack.Screen 
                name="FreelancerProfile" 
                component={FreelancerProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
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
                component={ProjectDetailsFreelancerScreen}
                options={{
                    header: () => <CustomHeader title="Project Details" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
            />
            <Stack.Screen 
                name="FreelancerProfile" 
                component={FreelancerProfileScreen}
                options={{
                    header: () => <CustomHeader title="My Profile" role="freelancer" unseenChatsCount={unseenChatsCount} hideNotificationIcon={true} />,
                }}
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

export default function FreelancerNavigator() {
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
                        navigation.navigate('Dashboard', { screen: 'DashboardMain' });
                    },
                })}
            />
            <Tab.Screen
                name="Invitations"
                component={InvitationsStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'InvitationsMain';
                    const hideTabBar = routeName === 'Chats' || routeName === 'ProjectChat' || routeName === 'IndividualChat';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="mail-outline" 
                                iconFilled="mail" 
                                label="Invites" 
                                focused={focused && routeName === 'InvitationsMain'} 
                            />
                        ),
                        tabBarStyle: hideTabBar ? { display: 'none' } : styles.tabBar,
                    };
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        navigation.navigate('Invitations', { screen: 'InvitationsMain' });
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
                name="Projects"
                component={MyProjectsStack}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProjectsMain';
                    const hideTabBar = routeName === 'Chats' || routeName === 'ProjectChat' || routeName === 'IndividualChat';
                    return {
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                iconOutline="folder-outline" 
                                iconFilled="folder" 
                                label="Projects" 
                                focused={focused && routeName === 'ProjectsMain'} 
                            />
                        ),
                        tabBarStyle: hideTabBar ? { display: 'none' } : styles.tabBar,
                    };
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        navigation.navigate('Projects', { screen: 'ProjectsMain' });
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
