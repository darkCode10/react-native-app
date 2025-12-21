import React from 'react';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
    const { user, userExists } = userAuthStore();

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

