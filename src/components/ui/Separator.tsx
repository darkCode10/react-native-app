import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface SeparatorProps {
    vertical?: boolean;
    style?: ViewStyle;
}

export const Separator: React.FC<SeparatorProps> = ({ vertical = false, style }) => {
    return (
        <View
            style={[
                styles.separator,
                vertical ? styles.vertical : styles.horizontal,
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    separator: {
        backgroundColor: '#e5e5e5',
    },
    horizontal: {
        height: 1,
        width: '100%',
        marginVertical: 16,
    },
    vertical: {
        width: 1,
        height: '100%',
        marginHorizontal: 16,
    },
});




