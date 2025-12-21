import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, TextInput } from 'react-native';

const DOMAIN_OPTIONS = [
    'Web Development',
    'Mobile Development',
    'Ai Development',
    'Ui&Ux and Design',
    'Mathematics',
    'Cyber Security',
    'Clound Computing',
    'Agentic Ai',
];

interface DomainPickerProps {
    value: string[];
    onChange: (domains: string[]) => void;
}

export const DomainPicker: React.FC<DomainPickerProps> = ({ value, onChange }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const filteredDomains = DOMAIN_OPTIONS.filter((domain) =>
        domain.toLowerCase().includes(searchText.toLowerCase())
    );

    const toggleDomain = (domain: string) => {
        if (value.includes(domain)) {
            onChange(value.filter((d) => d !== domain));
        } else {
            onChange([...value, domain]);
        }
    };

    const addCustomDomain = () => {
        if (searchText.trim() && !value.includes(searchText.trim())) {
            onChange([...value, searchText.trim()]);
            setSearchText('');
        }
    };

    const removeDomain = (domain: string) => {
        onChange(value.filter((d) => d !== domain));
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>
                    {value.length === 0 ? 'Select Domains...' : `${value.length} domain${value.length > 1 ? 's' : ''} selected`}
                </Text>
            </Pressable>

            {value.length > 0 && (
                <View style={styles.selectedDomains}>
                    {value.map((domain) => (
                        <Pressable
                            key={domain}
                            style={styles.domainChip}
                            onPress={() => removeDomain(domain)}
                        >
                            <Text style={styles.domainChipText}>{domain}</Text>
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
                        <Text style={styles.modalTitle}>Select Domains</Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search or add custom domain..."
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor="#999"
                        />

                        {searchText.trim() && !DOMAIN_OPTIONS.includes(searchText.trim()) && (
                            <Pressable
                                style={styles.addCustomButton}
                                onPress={addCustomDomain}
                            >
                                <Text style={styles.addCustomText}>
                                    + Add "{searchText}"
                                </Text>
                            </Pressable>
                        )}

                        <FlatList
                            data={filteredDomains}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[
                                        styles.domainOption,
                                        value.includes(item) && styles.domainOptionSelected,
                                    ]}
                                    onPress={() => toggleDomain(item)}
                                >
                                    <Text
                                        style={[
                                            styles.domainOptionText,
                                            value.includes(item) && styles.domainOptionTextSelected,
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
    selectedDomains: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    domainChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    domainChipText: {
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
    domainOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    domainOptionSelected: {
        backgroundColor: '#e0e7ff',
    },
    domainOptionText: {
        fontSize: 16,
        color: '#000',
    },
    domainOptionTextSelected: {
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

