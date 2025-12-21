import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface EmptyProps {
    title?: string;
    description?: string;
    style?: ViewStyle;
}

export const Empty: React.FC<EmptyProps> = ({
    title = 'No data',
    description,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});




