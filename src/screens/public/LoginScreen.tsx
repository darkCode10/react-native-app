import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { userAuthStore } from '../../store/user-auth-store';
import { supabaseClient } from '../../config/supabase';
import { toast } from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
    const { setUser } = userAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            toast.warning('Fields are empty!');
            return;
        }

        if (password.length < 6) {
            toast.warning('Password should be at least 6 letters!');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.warning('Invalid email address');
            return;
        }

        setLoading(true);

        const initialResponse = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (initialResponse.error) {
            setLoading(false);
            console.log('error message:', initialResponse.error.message);
            toast.error(`Login failed: ${initialResponse.error.message}`);
            return;
        }

        const userId = initialResponse.data.user?.id;
        if (userId) {
            console.log('Login: userId obtained:', userId);
            
            // First, check user_roles table to get the correct role (source of truth)
            console.log('[Login] Checking user_roles table for userId:', userId);
            const { data: userRoleData, error: roleError } = await supabaseClient
                .from('user_roles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            console.log('[Login] user_roles result:', {
                found: !!userRoleData,
                role: userRoleData?.role,
                error: roleError?.message
            });

            if (!userRoleData || !userRoleData.role) {
                setLoading(false);
                toast.error('User role not found. Please contact support.');
                return;
            }

            const userRole = userRoleData.role;

            // Fetch profile data based on the role from user_roles table
            if (userRole === 'freelancer') {
                console.log('[Login] Fetching freelancer profile for userId:', userId);
                const { data: freelancerData, error: freelancerError } = await supabaseClient
                    .from('freelancers')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                console.log('[Login] Freelancer query result:', {
                    found: !!freelancerData,
                    error: freelancerError?.message,
                    data: freelancerData ? { id: freelancerData.id, username: freelancerData.username } : null
                });

                if (freelancerError) {
                    console.log('Freelancer lookup error:', freelancerError.message);
                    setLoading(false);
                    toast.error('Failed to load freelancer profile');
                    return;
                }

                if (freelancerData) {
                    console.log('Login: user role obtained: freelancer');
                    console.log('Login successful, setting user:', {
                        userId: freelancerData.id,
                        username: freelancerData.username,
                        role: 'freelancer',
                        email: freelancerData.email || initialResponse.data.user?.email || '',
                        profile_pic: freelancerData.profile_pic,
                        wallet_amount: freelancerData.wallet_amount || 0,
                    });
                    setUser({
                        userId: freelancerData.id,
                        username: freelancerData.username,
                        role: 'freelancer',
                        email: freelancerData.email || initialResponse.data.user?.email || '',
                        profile_pic: freelancerData.profile_pic,
                        wallet_amount: freelancerData.wallet_amount || 0,
                    });
                    toast.success('Logged in successfully');
                    setLoading(false);
                    return;
                }
            } else if (userRole === 'client') {
                console.log('[Login] Fetching client profile for userId:', userId);
                const { data: clientData, error: clientError } = await supabaseClient
                    .from('clients')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                console.log('[Login] Client query result:', {
                    found: !!clientData,
                    error: clientError?.message,
                    data: clientData ? { id: clientData.id, username: clientData.username } : null
                });

                if (clientError) {
                    console.log('Client lookup error:', clientError.message);
                    setLoading(false);
                    toast.error('Failed to load client profile');
                    return;
                }

                if (clientData) {
                    console.log('Login: user role obtained: client');
                    console.log('Login successful, setting user:', {
                        userId: clientData.id,
                        username: clientData.username,
                        role: 'client',
                        email: clientData.email || initialResponse.data.user?.email || '',
                        profile_pic: clientData.profile_pic,
                        wallet_amount: clientData.wallet_amount || 0,
                    });
                    setUser({
                        userId: clientData.id,
                        username: clientData.username,
                        role: 'client',
                        email: clientData.email || initialResponse.data.user?.email || '',
                        profile_pic: clientData.profile_pic,
                        wallet_amount: clientData.wallet_amount || 0,
                    });
                    toast.success('Logged in successfully');
                    setLoading(false);
                    return;
                }
            }

            // Fallback
            toast.error('Profile not found. Please contact support.');
            setLoading(false);
        } else {
            setLoading(false);
            toast.error('Login failed, something went wrong!');
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Background */}
                <View style={styles.headerBackground}>
                    <LinearGradient
                        colors={['#0532A9', '#03206B']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.decorativeCircle, { top: -50, right: -50, width: 200, height: 200 }]} />
                        <View style={[styles.decorativeCircle, { bottom: -30, left: -30, width: 120, height: 120, opacity: 0.05 }]} />
                        
                        <View style={styles.headerContent}>
                            <View style={styles.logoContainer}>
                                <Image 
                                    source={require('@/asset/Logo.png')} 
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.headerTitle}>Welcome Back</Text>
                            <Text style={styles.headerSubtitle}>Sign in to continue</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Login Form Card */}
                <View style={styles.cardContainer}>
                    <View style={styles.formCard}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <Input
                                    label=""
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.seamlessInput}
                                    placeholderTextColor="#9CA3AF"
                                    containerStyle={{ marginBottom: 0 }}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <Input
                                    label=""
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    style={styles.seamlessInput}
                                    placeholderTextColor="#9CA3AF"
                                    containerStyle={{ marginBottom: 0, flex: 1 }}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Text style={{ fontSize: 20 }}>
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <Pressable style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </Pressable>

                        <Button
                            title="Login"
                            onPress={handleLogin}
                            disabled={loading}
                            loading={loading}
                            style={styles.loginButton}
                            textStyle={styles.loginButtonText}
                        />

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupText}>Sign Up</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    headerBackground: {
        height: 280,
        width: '100%',
        marginBottom: -60, // Overlap effect
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerContent: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        backgroundColor: 'transparent',
    },
    logoImage: {
        width: 80,
        height: 80,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    cardContainer: {
        paddingHorizontal: 20,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 56,
    },
    inputIcon: {
        marginRight: 8,
    },
    seamlessInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        height: '100%',
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#0532A9',
        height: 56,
        borderRadius: 16,
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 14,
    },
    signupText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
