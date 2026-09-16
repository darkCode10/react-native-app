import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientStackParamList } from '@/navigation/types';
import { Button, Input } from '@/components/ui';
import { SkillsPicker } from '@/components/SkillsPicker';
import { DomainPicker } from '@/components/DomainPicker';
import { createProject } from '@/api/project-functions';
import { userAuthStore } from '@/store/user-auth-store';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<ClientStackParamList, 'CreateProject'>;

export default function CreateProjectScreen({ navigation }: Props) {
    const { user, setUser } = userAuthStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [domains, setDomains] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Run animation only once on first mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []); // Empty dependency array = runs only once

    const handleSubmit = async () => {
        if (!title || !description || !budget || domains.length === 0 || skills.length === 0) {
            toast.warning('Please fill all fields including domains and skills');
            return;
        }

        if (!user?.userId) {
            toast.error('User not found');
            return;
        }

        setLoading(true);
        try {
            const projectId = await createProject({
                title: title,
                description: description,
                budget: parseFloat(budget),
                skills: skills,
                domains: domains,
                clientId: user.userId,
            });
            
            // Update user's wallet amount locally
            if (user) {
                const newWalletAmount = user.wallet_amount - parseFloat(budget);
                setUser({ ...user, wallet_amount: newWalletAmount });
            }
            
            toast.success('Project created successfully');
            navigation.navigate('ProjectDetails', { projectId });
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to create project';
            toast.error(errorMessage);
            console.error('[CreateProject] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section - Compact */}
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={['#0532A9', '#0645C9']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerContentRow}>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="rocket" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Launch Project</Text>
                                <Text style={styles.headerSubtitle}>Define your requirements</Text>
                            </View>
                        </View>
                        
                        <View style={[styles.decorativeCircle, { top: -20, right: -20, width: 80, height: 80 }]} />
                        <View style={[styles.decorativeCircle, { bottom: -10, left: -10, width: 40, height: 40, opacity: 0.1 }]} />
                    </LinearGradient>
                </View>

                {/* Animated Form Section */}
                <Animated.View 
                    style={[
                        styles.formContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    
                    {/* Project Title Section */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="briefcase-outline" size={18} color="#0532A9" />
                        <Text style={styles.sectionTitle}>Project Title</Text>
                    </View>
                    <View style={styles.inputBox}>
                        <Input
                            label=""
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Mobile App Development"
                            style={styles.seamlessInput}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Description Section */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text-outline" size={18} color="#0532A9" />
                        <Text style={styles.sectionTitle}>Description</Text>
                    </View>
                    <View style={styles.inputBox}>
                        <Input
                            label=""
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe the project goals, requirements, and deliverables..."
                            multiline
                            numberOfLines={5}
                            style={styles.seamlessTextArea}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Budget Section */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cash-outline" size={18} color="#0532A9" />
                        <Text style={styles.sectionTitle}>Budget</Text>
                    </View>
                    <View style={styles.inputBox}>
                        <Input
                            label=""
                            value={budget}
                            onChangeText={setBudget}
                            placeholder="Estimated budget (USD)"
                            keyboardType="numeric"
                            style={styles.seamlessInput}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Domains Section */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="grid-outline" size={18} color="#0532A9" />
                        <Text style={styles.sectionTitle}>Project Domains</Text>
                    </View>
                    <View style={[styles.inputBox, styles.skillsBox]}>
                        <DomainPicker value={domains} onChange={setDomains} />
                    </View>

                    {/* Skills Section */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="code-slash-outline" size={18} color="#0532A9" />
                        <Text style={styles.sectionTitle}>Required Skills</Text>
                    </View>
                    <View style={[styles.inputBox, styles.skillsBox]}>
                        <SkillsPicker value={skills} onChange={setSkills} />
                    </View>

                    <Button
                        title="Create Project"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.submitButton}
                        textStyle={styles.submitButtonText}
                    />
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 24,
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: '#fff', // Fix shadow rendering
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden', // Ensure gradient clips
    },
    headerGradient: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingTop: 50, // For status bar
        position: 'relative',
    },
    headerContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 4,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4B5563',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F9FAFB',
        overflow: 'hidden',
    },
    skillsBox: {
        padding: 12,
    },
    seamlessInput: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    seamlessTextArea: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 16,
        color: '#1F2937',
        height: 120,
        textAlignVertical: 'top',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    submitButton: {
        marginTop: 12,
        backgroundColor: '#0532A9',
        height: 56,
        borderRadius: 28,
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
