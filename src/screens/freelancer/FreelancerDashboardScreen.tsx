import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { userAuthStore } from '@/store/user-auth-store';
import { Card } from '@/components/ui';

export default function FreelancerDashboardScreen() {
    const { user } = userAuthStore();

    return (
            <ScrollView style={styles.container}>
                {/* Welcome Section */}
            <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.username}>{user?.username}!</Text>
                <Text style={styles.subtitle}>
                    Track your projects and manage invitations
                </Text>
            </View>

            {/* Dashboard Content - Placeholder for future stats/widgets */}
            <View style={styles.content}>
                <Card>
                    <Text style={styles.sectionTitle}>Quick Stats</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Active Projects</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Pending Invites</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Completed Tasks</Text>
                        </View>
                    </View>
                </Card>

                <Card style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        Use the menu (☰) to navigate through the app
                    </Text>
                </Card>
            </View>
            </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    welcomeSection: {
        padding: 24,
        backgroundColor: '#34C759',
    },
    welcomeText: {
        fontSize: 18,
        color: '#fff',
        opacity: 0.9,
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#34C759',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    infoCard: {
        marginTop: 16,
        backgroundColor: '#fff9e6',
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    infoText: {
        fontSize: 14,
        color: '#856404',
        textAlign: 'center',
    },
});




