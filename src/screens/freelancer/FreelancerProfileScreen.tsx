import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from '@/navigation/types';
import { userAuthStore } from '@/store/user-auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFreelancerProfileOwnDataById, updateFreelancerProfileImage } from '@/api/freelancer-functions';
import { Spinner, Avatar } from '@/components/ui';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { toast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'FreelancerProfile'>;

export default function FreelancerProfileScreen({}: Props) {
    const { user, reset, setUser } = userAuthStore();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['freelancerProfile', user?.userId],
        queryFn: () => getFreelancerProfileOwnDataById(user!.userId),
        enabled: !!user?.userId,
        retry: 1,
    });

    const uploadProfilePicture = useMutation({
        mutationFn: async (params: { fileUri: string; fileName: string }) => {
            const file = {
                uri: params.fileUri,
                name: params.fileName,
                type: 'image/jpeg',
            };
            return await updateFreelancerProfileImage({
                freelancerId: user!.userId,
                file,
            });
        },
        onSuccess: (newProfilePicUrl) => {
            if (user) {
                setUser({ ...user, profile_pic: newProfilePicUrl });
            }
            queryClient.invalidateQueries({ queryKey: ['freelancerProfile', user?.userId] });
            toast.success('Profile picture updated successfully!');
        },
        onError: (error) => {
            console.log('Upload error:', error);
            toast.error('Failed to upload profile picture');
        },
    });

    const handleSelectImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant camera roll permissions to upload a profile picture',
                    [{ text: 'OK' }]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const uri = result.assets[0].uri;
                const fileName = uri.split('/').pop() || 'profile.jpg';
                
                await uploadProfilePicture.mutateAsync({ fileUri: uri, fileName });
                setIsUploading(false);
            }
        } catch (error) {
            setIsUploading(false);
            console.log('Error selecting image:', error);
            toast.error('Failed to select image');
        }
    };

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    if (error || !profile) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
                <Text style={styles.errorTitle}>Profile Not Found</Text>
                <Text style={styles.errorMessage}>
                    Your profile data is missing. Please log out and log in again to fix this issue.
                </Text>
                <Pressable style={styles.logoutButton} onPress={() => reset()}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section with Gradient */}
            <LinearGradient
                colors={['#0532A9', '#03206B']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative Pattern */}
                <View style={styles.patternOverlay}>
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                </View>

                <View style={styles.profileHeaderContent}>
                    <Pressable onPress={handleSelectImage} style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <Avatar source={profile.profile_pic} fallback={profile.username} size={110} />
                            {isUploading && (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={18} color="#0532A9" />
                        </View>
                    </Pressable>
                    
                    <View style={styles.headerInfo}>
                        <Text style={styles.name}>{profile.username}</Text>
                        <Text style={styles.email}>{profile.email}</Text>
                        <View style={styles.roleBadge}>
                            <Ionicons name="person-outline" size={14} color="#E0E7FF" />
                            <Text style={styles.roleText}>{profile.role || 'Freelancer'}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.mainContent}>
                {/* Wallet Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="wallet-outline" size={22} color="#0532A9" />
                        </View>
                        <Text style={styles.cardTitle}>Wallet Balance</Text>
                    </View>
                    <View style={styles.walletContent}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <Text style={styles.walletAmount}>{profile.wallet_amount.toLocaleString()}</Text>
                    </View>
                    <Pressable style={styles.topUpButton}>
                        <Text style={styles.topUpText}>Withdraw Funds</Text>
                        <Ionicons name="arrow-forward" size={16} color="#0532A9" />
                    </Pressable>
                </View>

                {/* About Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconContainer, { backgroundColor: '#F3E8FF' }]}>
                            <Ionicons name="document-text-outline" size={22} color="#7C3AED" />
                        </View>
                        <Text style={styles.cardTitle}>About</Text>
                    </View>
                    <Text style={styles.description}>{profile.description || 'No description provided.'}</Text>
                </View>

                {/* Skills Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="flash-outline" size={22} color="#2563EB" />
                        </View>
                        <Text style={styles.cardTitle}>Skills</Text>
                    </View>
                    <View style={styles.skillsContainer}>
                        {profile.skills && profile.skills.length > 0 ? (
                            profile.skills.map((skill, index) => (
                                <View key={index} style={styles.skillChip}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.description}>No skills listed.</Text>
                        )}
                    </View>
                </View>

                {/* Domains Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconContainer, { backgroundColor: '#FCE7F3' }]}>
                            <Ionicons name="grid-outline" size={22} color="#DB2777" />
                        </View>
                        <Text style={styles.cardTitle}>Domains</Text>
                    </View>
                    <View style={styles.skillsContainer}>
                        {profile.domains && profile.domains.length > 0 ? (
                            profile.domains.map((domain, index) => (
                                <View key={index} style={styles.domainChip}>
                                    <Text style={styles.domainText}>{domain}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.description}>No domains listed.</Text>
                        )}
                    </View>
                </View>

                {/* Account Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconContainer, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="person-outline" size={22} color="#10B981" />
                        </View>
                        <Text style={styles.cardTitle}>Account Details</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Member Since</Text>
                        <Text style={styles.detailValue}>
                            {new Date(profile.created_at).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email Status</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    </View>
                </View>

                {/* Settings & Support Section */}
                <Text style={styles.sectionHeader}>Settings & Support</Text>
                
                <View style={styles.menuContainer}>
                    <Pressable style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="settings-outline" size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuText}>App Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>
                    
                    <View style={styles.menuDivider} />
                    
                    <Pressable style={styles.menuItem}>
                        <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="help-circle-outline" size={20} color="#0532A9" />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>
                    
                    <View style={styles.menuDivider} />
                    
                    <Pressable style={styles.menuItem} onPress={() => reset()}>
                        <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                        </View>
                        <Text style={[styles.menuText, { color: '#DC2626' }]}>Logout</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FFFFFF',
        opacity: 0.2,
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
    },
    profileHeaderContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarContainer: {
        padding: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 60,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerInfo: {
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 12,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    mainContent: {
        padding: 20,
        marginTop: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    walletContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0532A9',
        marginTop: 4,
        marginRight: 2,
    },
    walletAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#111827',
    },
    topUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        gap: 8,
    },
    topUpText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0532A9',
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    skillText: {
        color: '#0532A9',
        fontSize: 13,
        fontWeight: '600',
    },
    domainChip: {
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    domainText: {
        color: '#6B21A8',
        fontSize: 13,
        fontWeight: '600',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        marginTop: 8,
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 68,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    logoutButton: {
        backgroundColor: '#0532A9',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});




