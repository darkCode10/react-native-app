import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
    if (onPress) {
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.card_pressed,
                    style,
                ]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        );
    }

    return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        marginBottom: 16,
    },
    card_pressed: {
        opacity: 0.7,
    },
});




