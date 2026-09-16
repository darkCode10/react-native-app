import { Platform, ViewStyle } from 'react-native';

/**
 * Creates shadow styles compatible with both iOS and Android
 * Uses elevation for Android and removes deprecated shadow properties
 * @param elevation - Android elevation value (0-24)
 */
export function createShadow(elevation: number = 4): ViewStyle {
    // Only use elevation for Android, iOS shadow properties are deprecated
    // For better shadows on iOS in RN 0.76+, use boxShadow instead
    return {
        elevation,
    };
}

/**
 * Pre-defined shadow presets
 */
export const shadowPresets = {
    small: createShadow(2),
    medium: createShadow(4),
    large: createShadow(8),
    xlarge: createShadow(12),
};









