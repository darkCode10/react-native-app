import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const textTranslateAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: false,
            }),
            Animated.sequence([
                Animated.delay(500),
                Animated.parallel([
                    Animated.timing(textFadeAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: false,
                    }),
                    Animated.timing(textTranslateAnim, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: false,
                    }),
                ]),
            ]),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#0532A9', '#03206B', '#021035']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.contentContainer}>
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <View style={styles.logoCircle}>
                            <Image 
                                source={require('@/asset/Logo.png')} 
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.textContainer,
                            {
                                opacity: textFadeAnim,
                                transform: [{ translateY: textTranslateAnim }],
                            },
                        ]}
                    >
                        <View style={styles.titleRow}>
                            <Animated.Text style={styles.titleFreelance}>Freelance</Animated.Text>
                            <Animated.Text style={styles.titleSync}>Sync</Animated.Text>
                        </View>
                        <Animated.Text style={styles.subtitle}>
                            Connect. Collaborate. Create.
                        </Animated.Text>
                    </Animated.View>
                </View>

                {/* Decorative Elements */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    logoContainer: {
        marginBottom: 24,
        // Shadow properties removed to avoid deprecation warnings
        // The logo still looks great with the gradient background
        elevation: 10,
    },
    logoCircle: {
        width: 120, 
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    logo: {
        width: 80, // Kept small as requested
        height: 80,
    },
    textContainer: {
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    titleFreelance: {
        fontSize: 32,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    titleSync: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    // Decorative Background Circles
    decorativeCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    decorativeCircle3: {
        position: 'absolute',
        top: '40%',
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(5, 50, 169, 0.2)',
    },
});

