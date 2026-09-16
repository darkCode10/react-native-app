import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { userAuthStore } from '@/store/user-auth-store';

// Import screens
import LandingScreen from '../screens/public/LandingScreen';
import LoginScreen from '../screens/public/LoginScreen';
import SignupScreen from '../screens/public/SignupScreen';
import ClientNavigator from './ClientNavigator';
import FreelancerNavigator from './FreelancerNavigator';
import SplashScreen from '../screens/public/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
    const { user, userExists } = userAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Show splash screen for 2.5 seconds
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!userExists ? (
                    <>
                        <Stack.Screen name="Landing" component={LandingScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                ) : user?.role === 'client' ? (
                    <Stack.Screen name="ClientTabs" component={ClientNavigator} />
                ) : (
                    <Stack.Screen name="FreelancerTabs" component={FreelancerNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

