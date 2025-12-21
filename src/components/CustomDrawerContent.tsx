import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import {
    DrawerContentScrollView,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { userAuthStore } from '@/store/user-auth-store';

interface DrawerItem {
    label: string;
    onPress: () => void;
    icon?: string;
}

interface CustomDrawerContentProps extends DrawerContentComponentProps {
    items: DrawerItem[];
}

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = ({
    items,
    navigation,
}) => {
    const { user, reset } = userAuthStore();

    const handleLogout = () => {
        reset();
        navigation.closeDrawer();
    };

    return (
        <DrawerContentScrollView style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                </View>
                <Text style={styles.username}>{user?.username || 'User'}</Text>
                <Text style={styles.role}>
                    {user?.role === 'client' ? 'Client' : 'Freelancer'}
                </Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                {items.map((item, index) => (
                    <Pressable
                        key={index}
                        style={({ pressed }) => [
                            styles.menuItem,
                            pressed && styles.menuItemPressed,
                        ]}
                        onPress={() => {
                            item.onPress();
                            navigation.closeDrawer();
                        }}
                    >
                        <Text style={styles.menuItemText}>{item.label}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Logout Button */}
            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.logoutButton,
                        pressed && styles.logoutButtonPressed,
                    ]}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </Pressable>
            </View>
        </DrawerContentScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0532A9',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        backgroundColor: '#0645C9',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    username: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: '#aaa',
        textTransform: 'capitalize',
    },
    menuSection: {
        paddingTop: 10,
    },
    menuItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    menuItemPressed: {
        backgroundColor: '#1a1a1a',
    },
    menuItemText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        marginTop: 'auto',
    },
    logoutButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonPressed: {
        opacity: 0.8,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

