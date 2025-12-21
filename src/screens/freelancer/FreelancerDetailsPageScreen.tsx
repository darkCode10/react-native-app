import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { getFreelancerDetails } from '@/api/freelancer-functions';
import { Spinner, Card, Avatar } from '@/components/ui';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'FreelancerDetailsPage'>;

export default function FreelancerDetailsPageScreen({ route }: Props) {
    const { freelancerId } = route.params;

    const { data: freelancer, isLoading } = useQuery({
        queryKey: ['freelancer', freelancerId],
        queryFn: () => getFreelancerDetails(freelancerId),
    });

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (!freelancer) {
        return (
            <View style={styles.container}>
                <Text>Freelancer not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Avatar source={freelancer.profile_pic} fallback={freelancer.username} size={100} />
                    <Text style={styles.name}>{freelancer.username}</Text>
                </View>

                <Card>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>{freelancer.description}</Text>
                </Card>

                <Card>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                        {freelancer.skills.map((skill, index) => (
                            <View key={index} style={styles.skillChip}>
                                <Text style={styles.skillText}>{skill}</Text>
                            </View>
                        ))}
                    </View>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    skillText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: '500',
    },
});




