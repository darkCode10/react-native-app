import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AISearchModalProps {
    visible: boolean;
    onClose: () => void;
    projectSkills: string[];
    onSearch: (skills: string[], numFreelancers: number) => void;
    isLoading: boolean;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({
    visible,
    onClose,
    projectSkills,
    onSearch,
    isLoading,
}) => {
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState('');
    const [numFreelancers, setNumFreelancers] = useState('5');
    
    // AI animation
    const sparkleAnim = new Animated.Value(0);
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        if (visible) {
            setSelectedSkills(projectSkills);
            setNumFreelancers('5');
            setCustomSkill('');
        }
    }, [visible, projectSkills]);

    useEffect(() => {
        if (isLoading) {
            // Sparkle animation
            Animated.loop(
                Animated.timing(sparkleAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isLoading]);

    const toggleSkill = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const addCustomSkill = () => {
        if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
            setSelectedSkills((prev) => [...prev, customSkill.trim()]);
            setCustomSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setSelectedSkills((prev) => prev.filter((s) => s !== skill));
    };

    const handleSearch = () => {
        const num = parseInt(numFreelancers, 10);
        if (selectedSkills.length === 0) {
            return;
        }
        if (isNaN(num) || num < 1 || num > 50) {
            return;
        }
        onSearch(selectedSkills, num);
    };

    const spin = sparkleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <LinearGradient
                        colors={['#667EEA', '#764BA2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <View style={styles.headerContent}>
                            <View style={styles.headerLeft}>
                                <View style={styles.aiIconContainer}>
                                    <Ionicons name="sparkles" size={24} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={styles.modalTitle}>AI Search</Text>
                                    <Text style={styles.modalSubtitle}>Find perfect freelancers</Text>
                                </View>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </Pressable>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Loading State */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <Animated.View
                                    style={[
                                        styles.aiLoadingIcon,
                                        {
                                            transform: [
                                                { rotate: spin },
                                                { scale: pulseAnim },
                                            ],
                                        },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#667EEA', '#764BA2', '#F093FB']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.aiLoadingGradient}
                                    >
                                        <Ionicons name="sparkles" size={40} color="#FFF" />
                                    </LinearGradient>
                                </Animated.View>
                                <Text style={styles.loadingText}>AI is analyzing...</Text>
                                <Text style={styles.loadingSubtext}>Finding the best matches for you</Text>
                                <ActivityIndicator size="small" color="#667EEA" style={{ marginTop: 12 }} />
                            </View>
                        )}

                        {/* Form */}
                        {!isLoading && (
                            <>
                                {/* Skills Section */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="ribbon" size={20} color="#667EEA" />
                                        <Text style={styles.sectionTitle}>Required Skills</Text>
                                        <Text style={styles.requiredBadge}>Required</Text>
                                    </View>
                                    <Text style={styles.sectionDescription}>
                                        Select or add skills that freelancers should have
                                    </Text>

                                    {/* Project Skills */}
                                    {projectSkills.length > 0 && (
                                        <View style={styles.skillsWrapper}>
                                            <Text style={styles.skillsLabel}>From Project:</Text>
                                            <View style={styles.skillsContainer}>
                                                {projectSkills.map((skill) => (
                                                    <Pressable
                                                        key={skill}
                                                        onPress={() => toggleSkill(skill)}
                                                        style={[
                                                            styles.skillChip,
                                                            selectedSkills.includes(skill) && styles.skillChipSelected,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.skillText,
                                                                selectedSkills.includes(skill) && styles.skillTextSelected,
                                                            ]}
                                                        >
                                                            {skill}
                                                        </Text>
                                                        {selectedSkills.includes(skill) && (
                                                            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                                                        )}
                                                    </Pressable>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Selected Skills */}
                                    {selectedSkills.length > 0 && (
                                        <View style={styles.skillsWrapper}>
                                            <Text style={styles.skillsLabel}>Selected ({selectedSkills.length}):</Text>
                                            <View style={styles.skillsContainer}>
                                                {selectedSkills.map((skill) => (
                                                    <View key={skill} style={styles.selectedSkillChip}>
                                                        <Text style={styles.selectedSkillText}>{skill}</Text>
                                                        <Pressable onPress={() => removeSkill(skill)}>
                                                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                                                        </Pressable>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Add Custom Skill */}
                                    <View style={styles.customSkillContainer}>
                                        <TextInput
                                            style={styles.customSkillInput}
                                            value={customSkill}
                                            onChangeText={setCustomSkill}
                                            placeholder="Add custom skill..."
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <Pressable
                                            onPress={addCustomSkill}
                                            style={styles.addSkillButton}
                                            disabled={!customSkill.trim()}
                                        >
                                            <Ionicons
                                                name="add-circle"
                                                size={28}
                                                color={customSkill.trim() ? '#667EEA' : '#D1D5DB'}
                                            />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Number of Freelancers */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="people" size={20} color="#667EEA" />
                                        <Text style={styles.sectionTitle}>Number of Recommendations</Text>
                                    </View>
                                    <Text style={styles.sectionDescription}>
                                        How many freelancers would you like to see? (1-50)
                                    </Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={numFreelancers}
                                        onChangeText={setNumFreelancers}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                </View>

                                {/* Search Button */}
                                <Pressable
                                    onPress={handleSearch}
                                    disabled={selectedSkills.length === 0 || !numFreelancers}
                                    style={({ pressed }) => [
                                        styles.searchButton,
                                        (selectedSkills.length === 0 || !numFreelancers) &&
                                            styles.searchButtonDisabled,
                                        pressed && styles.searchButtonPressed,
                                    ]}
                                >
                                    <LinearGradient
                                        colors={
                                            selectedSkills.length === 0 || !numFreelancers
                                                ? ['#D1D5DB', '#9CA3AF']
                                                : ['#667EEA', '#764BA2']
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.searchButtonGradient}
                                    >
                                        <Ionicons name="sparkles" size={20} color="#FFF" />
                                        <Text style={styles.searchButtonText}>Search with AI</Text>
                                    </LinearGradient>
                                </Pressable>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        overflow: 'hidden',
    },
    modalHeader: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingTop: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    modalSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        padding: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    aiLoadingIcon: {
        marginBottom: 24,
    },
    aiLoadingGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    requiredBadge: {
        fontSize: 11,
        fontWeight: '600',
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    sectionDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
    },
    skillsWrapper: {
        marginBottom: 12,
    },
    skillsLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    skillChipSelected: {
        backgroundColor: '#667EEA',
        borderColor: '#667EEA',
    },
    skillText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    skillTextSelected: {
        color: '#FFF',
    },
    selectedSkillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    selectedSkillText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4338CA',
    },
    customSkillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    customSkillInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#1F2937',
    },
    addSkillButton: {
        padding: 4,
    },
    numberInput: {
        height: 50,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
    },
    searchButton: {
        marginTop: 8,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchButtonDisabled: {
        opacity: 0.6,
    },
    searchButtonPressed: {
        opacity: 0.8,
    },
    searchButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});

