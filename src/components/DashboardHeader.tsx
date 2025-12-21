import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';

interface DashboardHeaderProps {
    role: 'client' | 'freelancer';
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ role }) => {
    const searchPlaceholder = role === 'client' ? 'Search Freelancers' : 'Search Projects';

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#999"
                />
            </View>

            {/* Notification Bell */}
            <Pressable style={styles.notificationButton}>
                <Text style={styles.bellIcon}>🔔</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F4F7',
        borderRadius: 1,
        paddingHorizontal: 8,
        paddingVertical: 12,
        gap: 8,
    },
    searchIcon: {
        fontSize: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#000',
        padding: 0,
    },
    notificationButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bellIcon: {
        fontSize: 20,
    },
});






