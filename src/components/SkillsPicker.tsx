import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, TextInput } from 'react-native';

const SKILL_OPTIONS = [
    'React',
    'Java',
    'Python',
    'Node.js',
    'Nest.js',
    'Angular.js',
    'C#',
    'Agentic Ai',
    'JavaScript',
    'TypeScript',
    'React Native',
    'Flutter',
    'iOS',
    'Android',
];

interface SkillsPickerProps {
    value: string[];
    onChange: (skills: string[]) => void;
}

export const SkillsPicker: React.FC<SkillsPickerProps> = ({ value, onChange }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const filteredSkills = SKILL_OPTIONS.filter((skill) =>
        skill.toLowerCase().includes(searchText.toLowerCase())
    );

    const toggleSkill = (skill: string) => {
        if (value.includes(skill)) {
            onChange(value.filter((s) => s !== skill));
        } else {
            onChange([...value, skill]);
        }
    };

    const addCustomSkill = () => {
        if (searchText.trim() && !value.includes(searchText.trim())) {
            onChange([...value, searchText.trim()]);
            setSearchText('');
        }
    };

    const removeSkill = (skill: string) => {
        onChange(value.filter((s) => s !== skill));
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>
                    {value.length === 0 ? 'Select Skills...' : `${value.length} skills selected`}
                </Text>
            </Pressable>

            {value.length > 0 && (
                <View style={styles.selectedSkills}>
                    {value.map((skill) => (
                        <Pressable
                            key={skill}
                            style={styles.skillChip}
                            onPress={() => removeSkill(skill)}
                        >
                            <Text style={styles.skillChipText}>{skill}</Text>
                            <Text style={styles.removeIcon}>×</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Skills</Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search or add custom skill..."
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor="#999"
                        />

                        {searchText.trim() && !SKILL_OPTIONS.includes(searchText.trim()) && (
                            <Pressable
                                style={styles.addCustomButton}
                                onPress={addCustomSkill}
                            >
                                <Text style={styles.addCustomText}>
                                    + Add "{searchText}"
                                </Text>
                            </Pressable>
                        )}

                        <FlatList
                            data={filteredSkills}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[
                                        styles.skillOption,
                                        value.includes(item) && styles.skillOptionSelected,
                                    ]}
                                    onPress={() => toggleSkill(item)}
                                >
                                    <Text
                                        style={[
                                            styles.skillOptionText,
                                            value.includes(item) && styles.skillOptionTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {value.includes(item) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </Pressable>
                            )}
                        />

                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    selector: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    selectorText: {
        color: '#666',
        fontSize: 16,
    },
    selectedSkills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    skillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    skillChipText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: '500',
    },
    removeIcon: {
        color: '#0532A9',
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    addCustomButton: {
        padding: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 8,
    },
    addCustomText: {
        color: '#0532A9',
        fontWeight: '500',
    },
    skillOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    skillOptionSelected: {
        backgroundColor: '#e0e7ff',
    },
    skillOptionText: {
        fontSize: 16,
        color: '#000',
    },
    skillOptionTextSelected: {
        color: '#0532A9',
        fontWeight: '500',
    },
    checkmark: {
        color: '#0532A9',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: '#0532A9',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});




