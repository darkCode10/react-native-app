import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from './src/config/supabase';
import { userAuthStore } from './src/store/user-auth-store';
import { ToastProvider } from './src/components/Toast';

// Import screens
import LandingScreen from './src/screens/public/LandingScreen';
import LoginScreen from './src/screens/public/LoginScreen';
import SignupScreen from './src/screens/public/SignupScreen';
import ClientNavigator from './src/navigation/ClientNavigator';
import FreelancerNavigator from './src/navigation/FreelancerNavigator';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5,
        },
    },
});

// Error Boundary Component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
                    <Text style={styles.errorText}>{this.state.error?.message}</Text>
                    <TouchableOpacity
                        style={styles.errorButton}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={styles.errorButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

export default function App() {
    const { user, userExists } = userAuthStore();
    const [isReady, setIsReady] = React.useState(false);

    // Check Supabase configuration on mount
    React.useEffect(() => {
        if (!isSupabaseConfigured) {
            console.warn('⚠️ Supabase not configured. Please add credentials to .env file');
        }
        setIsReady(true);
    }, []);

    // Debug: Log auth state changes
    React.useEffect(() => {
        console.log('Auth State Changed:', { userExists, role: user?.role, username: user?.username });
    }, [userExists, user]);

    if (!isReady) {
        return null;
    }

    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <QueryClientProvider client={queryClient}>
                        <ToastProvider>
                            <NavigationContainer>
                                <Stack.Navigator
                                    screenOptions={{
                                        headerShown: false,
                                        animation: 'slide_from_right',
                                    }}
                                >
                                    {!userExists ? (
                                        // Public routes
                                        <>
                                            <Stack.Screen 
                                                name="Landing" 
                                                component={LandingScreen}
                                            />
                                            <Stack.Screen 
                                                name="Login" 
                                                component={LoginScreen}
                                            />
                                            <Stack.Screen 
                                                name="Signup" 
                                                component={SignupScreen}
                                            />
                                        </>
                                    ) : user?.role === 'client' ? (
                                        // Client routes
                                        <Stack.Screen 
                                            name="ClientApp" 
                                            component={ClientNavigator}
                                        />
                                    ) : (
                                        // Freelancer routes
                                        <Stack.Screen 
                                            name="FreelancerApp" 
                                            component={FreelancerNavigator}
                                        />
                                    )}
                                </Stack.Navigator>
                            </NavigationContainer>
                        </ToastProvider>
                    </QueryClientProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButton: {
        backgroundColor: '#0532A9',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});


