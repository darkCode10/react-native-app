import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import { setToastInstance } from '@/utils/toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastConfig | null>(null);
    const [animation] = useState(new Animated.Value(0));

    const showToast = useCallback((config: ToastConfig) => {
        setToast(config);
    }, []);

    // Set the global toast instance for non-hook contexts
    useEffect(() => {
        setToastInstance(showToast);
    }, [showToast]);

    useEffect(() => {
        if (toast) {
            // Slide in animation
            Animated.sequence([
                Animated.spring(animation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.delay(toast.duration || 3000),
                Animated.timing(animation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setToast(null);
            });
        }
    }, [toast, animation]);

    const handleClose = () => {
        Animated.timing(animation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setToast(null);
        });
    };

    const getToastStyle = (type: ToastType) => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#10B981',
                    icon: '✓',
                };
            case 'error':
                return {
                    backgroundColor: '#EF4444',
                    icon: '✕',
                };
            case 'warning':
                return {
                    backgroundColor: '#F59E0B',
                    icon: '⚠',
                };
            case 'info':
                return {
                    backgroundColor: '#3B82F6',
                    icon: 'ℹ',
                };
            default:
                return {
                    backgroundColor: '#6B7280',
                    icon: '•',
                };
        }
    };

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
    });

    const opacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 1],
    });

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        {
                            transform: [{ translateY }],
                            opacity,
                        },
                    ]}
                >
                    <Pressable onPress={handleClose}>
                        <View
                            style={[
                                styles.toast,
                                { backgroundColor: getToastStyle(toast.type).backgroundColor },
                            ]}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>{getToastStyle(toast.type).icon}</Text>
                            </View>
                            <Text style={styles.message}>{toast.message}</Text>
                        </View>
                    </Pressable>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    message: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        lineHeight: 20,
    },
});

