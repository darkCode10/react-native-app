import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getClientDetailsForFreelancer } from '@/api/client-functions';
import { Spinner, Card, Avatar } from '@/components/ui';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'ClientProfile'>;

export default function ClientProfileScreen({ route }: Props) {
    const { clientId } = route.params;

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', clientId],
        queryFn: () => getClientDetailsForFreelancer(clientId),
    });

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (!client) {
        return (
            <View style={styles.container}>
                <Text>Client not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Avatar source={client.profile_pic} fallback={client.username} size={100} />
                    <Text style={styles.name}>{client.username}</Text>
                    <Text style={styles.role}>{client.role}</Text>
                </View>

                <Card>
                    <Text style={styles.sectionTitle}>Profile Information</Text>
                    <Text style={styles.info}>
                        This client is using FreelanceSync to find and hire talented freelancers.
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
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    role: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    info: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});




