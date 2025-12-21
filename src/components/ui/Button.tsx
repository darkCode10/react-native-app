import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    onPress?: () => void;
    title?: string;
    children?: React.ReactNode;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    children,
    variant = 'default',
    size = 'default',
    disabled = false,
    loading = false,
    style,
    textStyle,
}) => {
    const buttonStyles = [
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.button_disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        styles[`text_${variant}`],
        styles[`text_${size}`],
        textStyle,
    ];

    return (
        <Pressable
            style={({ pressed }) => [
                ...buttonStyles,
                pressed && !disabled && styles.button_pressed,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'default' ? '#fff' : '#0532A9'} />
            ) : (
                <Text style={textStyles}>{children || title}</Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    button_default: {
        backgroundColor: '#0532A9',
    },
    button_outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0532A9',
    },
    button_ghost: {
        backgroundColor: 'transparent',
    },
    button_destructive: {
        backgroundColor: '#ef4444',
    },
    button_sm: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    button_lg: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    button_disabled: {
        opacity: 0.5,
    },
    button_pressed: {
        opacity: 0.7,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    text_default: {
        color: '#fff',
    },
    text_outline: {
        color: '#0532A9',
    },
    text_ghost: {
        color: '#0532A9',
    },
    text_destructive: {
        color: '#fff',
    },
    text_sm: {
        fontSize: 14,
    },
    text_lg: {
        fontSize: 18,
    },
});




