import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { userAuthStore } from '../../store/user-auth-store';
import { supabaseClient } from '../../config/supabase';
import { toast } from '../../utils/toast';
import { SkillsPicker } from '../../components/SkillsPicker';
import { DomainPicker } from '../../components/DomainPicker';
import { UserRoleType } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SignupScreen({ navigation }: any) {
    const { setUser } = userAuthStore();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<UserRoleType | ''>('');
    const [skills, setSkills] = useState<string[]>([]);
    const [domains, setDomains] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignup() {
        if (!username || !email || !password || !role) {
            toast.warning('Fields are empty!');
            return;
        }

        if (role === 'freelancer' && (skills.length === 0 || domains.length === 0 || !description)) {
            toast.warning('Please add domains, skills and description!');
            return;
        }

        if (username.length < 3) {
            toast.warning('Username is too short!');
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

        const initialResponse = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (initialResponse.error) {
            setLoading(false);
            toast.error(`Signup failed: ${initialResponse.error.message}`);
            return;
        }

        const userId = initialResponse.data.user?.id;

        if (userId) {
            // ... (keeping existing logic for role insertion and profile creation)
            const middleResponse = await supabaseClient.from('user_roles').insert({
                id: userId,
                role: role,
            });

            if (middleResponse.error) {
                setLoading(false);
                toast.error(`Signup failed: ${middleResponse.error.message}`);
                return;
            }

            if (role === 'client') {
                const finalResponse = await supabaseClient
                    .from('clients')
                    .insert({
                        id: userId,
                        username: username,
                        email: email,
                        role: 'client',
                    })
                    .select()
                    .single();

                if (finalResponse.error) {
                    setLoading(false);
                    toast.error(`Signup failed: ${finalResponse.error.message}`);
                    return;
                }

                if (finalResponse.data) {
                    const userData = {
                        email: finalResponse.data.email,
                        role: finalResponse.data.role || 'client',
                        username: finalResponse.data.username,
                        userId: finalResponse.data.id,
                        wallet_amount: finalResponse.data.wallet_amount || 0,
                        profile_pic: finalResponse.data.profile_pic || null,
                    };
                    setUser(userData);
                    setLoading(false);
                    toast.success('Account created successfully!');
                    return;
                }
            } else {
                const finalResponse = await supabaseClient
                    .from('freelancers')
                    .insert({
                        id: userId,
                        username: username,
                        email: email,
                        skills: skills,
                        domains: domains,
                        description: description,
                        role: 'freelancer',
                    })
                    .select()
                    .single();

                if (finalResponse.error) {
                    setLoading(false);
                    toast.error(`Signup failed: ${finalResponse.error.message}`);
                    return;
                }

                if (finalResponse.data) {
                    const userData = {
                        email: finalResponse.data.email,
                        role: finalResponse.data.role || 'freelancer',
                        username: finalResponse.data.username,
                        userId: finalResponse.data.id,
                        wallet_amount: finalResponse.data.wallet_amount || 0,
                        profile_pic: finalResponse.data.profile_pic || null,
                    };
                    setUser(userData);
                    toast.success('Account created! Redirecting...');
                    setTimeout(() => setLoading(false), 500);
                    return;
                }
            }
        }
        setLoading(false);
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
                        <View style={[styles.decorativeCircle, { top: -60, left: -40, width: 220, height: 220, opacity: 0.1 }]} />
                        <View style={[styles.decorativeCircle, { bottom: -20, right: -20, width: 100, height: 100, opacity: 0.05 }]} />
                        
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Join Us</Text>
                            <Text style={styles.headerSubtitle}>Create your account to get started</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Form Card */}
                <View style={styles.cardContainer}>
                    <View style={styles.formCard}>
                        
                        {/* Username */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <Input
                                    label=""
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Choose a username"
                                    style={styles.seamlessInput}
                                    placeholderTextColor="#9CA3AF"
                                    containerStyle={{ marginBottom: 0 }}
                                />
                            </View>
                        </View>

                        {/* Email */}
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

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <Input
                                    label=""
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Create a password"
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

                        {/* Role Selector */}
                        <Text style={styles.sectionLabel}>I want to...</Text>
                        <View style={styles.roleContainer}>
                            <Pressable 
                                style={[styles.roleCard, role === 'client' && styles.roleCardActive]}
                                onPress={() => setRole('client')}
                            >
                                <View style={[styles.roleIcon, role === 'client' ? styles.roleIconActive : styles.roleIconInactive]}>
                                    <Ionicons name="briefcase" size={24} color={role === 'client' ? '#fff' : '#6B7280'} />
                                </View>
                                <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>Hire Talent</Text>
                            </Pressable>

                            <Pressable 
                                style={[styles.roleCard, role === 'freelancer' && styles.roleCardActive]}
                                onPress={() => setRole('freelancer')}
                            >
                                <View style={[styles.roleIcon, role === 'freelancer' ? styles.roleIconActive : styles.roleIconInactive]}>
                                    <Ionicons name="person" size={24} color={role === 'freelancer' ? '#fff' : '#6B7280'} />
                                </View>
                                <Text style={[styles.roleText, role === 'freelancer' && styles.roleTextActive]}>Find Work</Text>
                            </Pressable>
                        </View>

                        {/* Freelancer Extra Fields */}
                        {role === 'freelancer' && (
                            <View style={styles.extraFields}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Professional Bio</Text>
                                    <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                        <Input
                                            label=""
                                            value={description}
                                            onChangeText={setDescription}
                                            placeholder="Briefly describe your expertise..."
                                            multiline
                                            numberOfLines={4}
                                            style={styles.seamlessTextArea}
                                            placeholderTextColor="#9CA3AF"
                                            containerStyle={{ marginBottom: 0 }}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.inputLabel}>Domains</Text>
                                <View style={styles.skillsWrapper}>
                                    <DomainPicker value={domains} onChange={setDomains} />
                                </View>

                                <Text style={styles.inputLabel}>Skills</Text>
                                <View style={styles.skillsWrapper}>
                                    <SkillsPicker value={skills} onChange={setSkills} />
                                </View>
                            </View>
                        )}

                        <Button
                            title="Create Account"
                            onPress={handleSignup}
                            disabled={loading}
                            loading={loading}
                            style={styles.signupButton}
                            textStyle={styles.signupButtonText}
                            icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginText}>Log In</Text>
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
        height: 240,
        width: '100%',
        marginBottom: -60,
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
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
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
    textAreaWrapper: {
        height: 'auto',
        alignItems: 'flex-start',
        paddingVertical: 4,
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
    seamlessTextArea: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        minHeight: 100,
        paddingVertical: 12,
        paddingHorizontal: 0,
        fontSize: 16,
        color: '#1F2937',
        textAlignVertical: 'top',
    },
    eyeIcon: {
        padding: 8,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        marginTop: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleCardActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#0532A9',
        borderWidth: 2,
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleIconActive: {
        backgroundColor: '#0532A9',
    },
    roleIconInactive: {
        backgroundColor: '#E5E7EB',
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    roleTextActive: {
        color: '#0532A9',
        fontWeight: '700',
    },
    extraFields: {
        marginBottom: 16,
    },
    skillsWrapper: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    signupButton: {
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
        marginTop: 8,
    },
    signupButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 14,
    },
    loginText: {
        color: '#0532A9',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
