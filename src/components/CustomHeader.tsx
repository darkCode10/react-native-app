import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Platform,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { userAuthStore } from '@/store/user-auth-store';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getAllNotificationsForUser } from '@/api/notifications-functions';

interface CustomHeaderProps {
    title: string;
    role: 'client' | 'freelancer';
    showBackButton?: boolean;
    onBackPress?: () => void;
    subtitle?: string;
    projectBudget?: number;
    projectStatus?: string;
    otherUserProfilePic?: string | null;
    unseenChatsCount?: number;
    hideChatIcon?: boolean;
    showSearchBar?: boolean;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    searchPlaceholder?: string;
    hideNotificationIcon?: boolean;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ 
    title, 
    role, 
    showBackButton = false,
    onBackPress,
    subtitle,
    projectBudget,
    projectStatus,
    otherUserProfilePic,
    unseenChatsCount = 0,
    hideChatIcon = false,
    showSearchBar = false,
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    hideNotificationIcon = false,
}) => {
    const navigation = useNavigation();
    const { user, reset } = userAuthStore();

    const handleProfilePress = () => {
        if (role === 'client') {
            // Navigate to ClientProfile within current stack
            (navigation as any).navigate('ClientProfile');
        } else {
            // Navigate to FreelancerProfile within current stack
            (navigation as any).navigate('FreelancerProfile');
        }
    };


    const handleLogout = () => {
        reset();
    };

    const handleChatPress = () => {
        // Navigate to Chats screen within current stack
        (navigation as any).navigate('Chats');
    };

    const handleNotificationPress = () => {
        // Navigate to Notifications tab
        (navigation as any).navigate('Notifications', { screen: 'NotificationsMain' });
    };

    // Fetch notifications to get unread count
    const { data: notifications } = useQuery({
        queryKey: ['get-all-notifications-for-user', user?.userId],
        queryFn: () => getAllNotificationsForUser(user!.userId),
        enabled: !!user?.userId,
        refetchInterval: 20 * 1000, // Refetch every 20 seconds
        refetchIntervalInBackground: true,
    });

    const unreadNotificationCount = notifications?.filter((n) => !n.read).length || 0;

    return (
        <>
            {showBackButton ? (
                /* Chat Screen Header with Gradient Background */
                <LinearGradient
                    colors={['#0532A9', '#0758D9', '#0645C9', '#0532A9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    locations={[0, 0.3, 0.7, 1]}
                    style={styles.chatHeaderGradient}
                >
                    {/* Decorative Pattern Overlay */}
                    <View style={styles.patternOverlay}>
                        <View style={styles.decorativeCircle1} />
                        <View style={styles.decorativeCircle2} />
                        <View style={styles.decorativeCircle3} />
                        <View style={styles.decorativeCircle4} />
                        <View style={styles.decorativeWave1} />
                        <View style={styles.decorativeWave2} />
                    </View>

                    <View style={styles.chatHeaderContent}>
                        {/* Back Button */}
                        <Pressable onPress={onBackPress} style={styles.backButtonChat}>
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </Pressable>

                        {/* Profile Picture (for individual chat) */}
                        {otherUserProfilePic !== undefined && (
                            <View style={styles.chatAvatarContainer}>
                                {otherUserProfilePic ? (
                                    <Image
                                        source={{ uri: otherUserProfilePic }}
                                        style={styles.chatAvatar}
                                    />
                                ) : (
                                    <View style={styles.chatAvatarPlaceholder}>
                                        <Text style={styles.chatAvatarText}>
                                            {title.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Project Details */}
                        <View style={styles.chatTitleContainer}>
                            <Text style={styles.chatProjectTitle} numberOfLines={1}>
                                {title}
                            </Text>
                            {subtitle && (
                                <Text style={styles.chatSubtitle} numberOfLines={1}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>

                        {/* Empty space for alignment */}
                        <View style={styles.rightSpace} />
                    </View>
                </LinearGradient>
            ) : showSearchBar ? (
                /* Header with Search Bar */
                <View style={styles.searchHeader}>
                    <View style={styles.searchHeaderTop}>
                        <Pressable onPress={handleProfilePress} style={styles.profileButton}>
                            {user?.profile_pic ? (
                                <Image
                                    source={{ uri: user.profile_pic }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profilePlaceholder}>
                                    <Text style={styles.profilePlaceholderText}>
                                        {user?.username?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                        </Pressable>

                        {/* Search Bar - Main Content */}
                        <View style={styles.headerSearchBar}>
                            <Ionicons name="search" size={20} color="#0532A9" style={styles.headerSearchIcon} />
                            <TextInput
                                style={styles.headerSearchInput}
                                placeholder={searchPlaceholder}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={onSearchChange}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => onSearchChange?.('')} style={styles.headerClearButton}>
                                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                                </Pressable>
                            )}
                        </View>
                        
                        {/* Right Icons - Notifications and Chat */}
                        <View style={styles.headerIconsContainer}>
                            {/* Notification Bell */}
                            {!hideNotificationIcon && (
                                <Pressable onPress={handleNotificationPress} style={styles.notificationButton}>
                                    <Ionicons name="notifications" size={26} color="#0532A9" />
                                    {unreadNotificationCount > 0 && (
                                        <View style={styles.notificationBadge}>
                                            <Text style={styles.notificationBadgeText}>
                                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            )}

                            {/* Chat Icon - Show unless hideChatIcon is true */}
                            {!hideChatIcon && (
                                <Pressable onPress={handleChatPress} style={styles.chatButton}>
                                    <Ionicons name="chatbubbles" size={26} color="#0532A9" />
                                    {unseenChatsCount > 0 && (
                                        <View style={styles.chatBadge}>
                                            <Text style={styles.chatBadgeText}>
                                                {unseenChatsCount > 4 ? '4+' : unseenChatsCount}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            ) : (
                /* Regular Header */
                <View style={styles.header}>
                    <Pressable onPress={handleProfilePress} style={styles.profileButton}>
                        {user?.profile_pic ? (
                            <Image
                                source={{ uri: user.profile_pic }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Text style={styles.profilePlaceholderText}>
                                    {user?.username?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    </View>

                    {/* Right Icons - Notifications and Chat */}
                    <View style={styles.headerIconsContainer}>
                        {/* Notification Bell */}
                        {!hideNotificationIcon && (
                            <Pressable onPress={handleNotificationPress} style={styles.notificationButton}>
                                <Ionicons name="notifications" size={26} color="#0532A9" />
                                {unreadNotificationCount > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        )}

                        {/* Chat Icon - Hidden on Chats screen */}
                        {!hideChatIcon && (
                            <Pressable onPress={handleChatPress} style={styles.chatButton}>
                                <Ionicons name="chatbubbles" size={26} color="#0532A9" />
                                {unseenChatsCount > 0 && (
                                    <View style={styles.chatBadge}>
                                        <Text style={styles.chatBadgeText}>
                                            {unseenChatsCount > 4 ? '4+' : unseenChatsCount}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        )}
                    </View>
                </View>
            )}

        </>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 4,
    },
    chatHeader: {
        paddingVertical: 12,
        paddingBottom: 12,
    },
    // Chat Header Gradient Styles
    chatHeaderGradient: {
        paddingTop: 45,
        paddingBottom: 10,
        paddingHorizontal: 12,
        elevation: 10,
        overflow: 'hidden',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    patternOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 1,
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        top: -50,
        right: -30,
        opacity: 0.15,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFFFFF',
        bottom: -30,
        left: -20,
        opacity: 0.12,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        top: 20,
        left: '30%',
        opacity: 0.08,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        bottom: 10,
        right: '25%',
        opacity: 0.1,
    },
    decorativeWave1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: -80,
        left: '40%',
        transform: [{ scaleX: 1.5 }],
    },
    decorativeWave2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        bottom: -60,
        right: '30%',
        transform: [{ scaleY: 1.3 }],
    },
    chatHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
        zIndex: 1,
    },
    backButtonChat: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        elevation: 3,
    },
    chatAvatarContainer: {
        marginLeft: 4,
    },
    chatAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        elevation: 4,
    },
    chatAvatarPlaceholder: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        elevation: 4,
    },
    chatAvatarText: {
        color: '#0532A9',
        fontSize: 16,
        fontWeight: 'bold',
    },
    chatTitleContainer: {
        flex: 1,
    },
    chatProjectTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
        letterSpacing: 0.3,
    },
    chatSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    chatProjectMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    chatMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    chatMetaText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    chatStatusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    chatStatusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0532A9',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rightSpace: {
        width: 36,
    },
    titleContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    profileButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    profilePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8EFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    profilePlaceholderText: {
        color: '#0532A9',
        fontSize: 18,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
        flex: 1,
        textAlign: 'center',
        lineHeight: 40,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        textAlign: 'left',
        lineHeight: 24,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'left',
        marginBottom: 6,
    },
    projectMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0532A9',
    },
    statusBadge: {
        backgroundColor: '#E8EFFF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0532A9',
        textTransform: 'uppercase',
    },
    chatButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    chatBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
    },
    chatBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
    },
    headerIconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    notificationButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
    },
    searchHeader: {
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12, // Added gap for spacing
    },
    searchHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        textAlign: 'center',
        display: 'none', // Hide title
    },
    headerSearchBar: {
        flex: 1, // Make search bar take remaining space
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 22, // More rounded
        paddingHorizontal: 12,
        height: 40, // Slightly smaller height
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    headerSearchIcon: {
        marginRight: 10,
    },
    headerSearchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
        paddingVertical: 0,
        fontWeight: '500',
    },
    headerClearButton: {
        padding: 4,
        marginLeft: 4,
    },
});

