import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';

interface AvatarProps {
    source?: string;
    fallback?: string;
    size?: number;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
    source,
    fallback = '?',
    size = 40,
    style,
}) => {
    const initials = fallback.slice(0, 2).toUpperCase();

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
            {source ? (
                <Image
                    source={{ uri: source }}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                    resizeMode="cover"
                />
            ) : (
                <Text style={[styles.fallback, { fontSize: size * 0.4 }]}>{initials}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#e5e5e5',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    image: {
        // resizeMode moved to prop on Image component
    },
    fallback: {
        fontWeight: '600',
        color: '#666',
    },
});




