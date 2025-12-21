import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { icon: 'code-slash-outline', title: 'Development & IT' },
    { icon: 'color-palette-outline', title: 'Design & Creative' },
    { icon: 'analytics-outline', title: 'AI & Data Science' },
    { icon: 'megaphone-outline', title: 'Sales & Marketing' },
    { icon: 'create-outline', title: 'Writing & Translation' },
    { icon: 'people-outline', title: 'Admin & Support' },
    { icon: 'cash-outline', title: 'Finance & Accounting' },
    { icon: 'camera-outline', title: 'Video & Photography' },
];

const TESTIMONIALS = [
    {
        category: '💻 Dev & IT',
        text: '"Haris came in and helped us transfer knowledge from our departing developer, meeting a serious deadline, without fail. His knowledge and experience are exceptional."',
        rating: 5,
        name: 'Haris S.',
        role: 'Full-Stack Developer',
        date: 'Apr 7, 2025',
    },
    {
        category: '🎨 Design & Creative',
        text: '"Ayesha delivered stunning UI/UX designs that completely transformed our app. Her creativity and attention to detail were beyond expectations."',
        rating: 4,
        name: 'Ayesha K.',
        role: 'UI/UX Designer',
        date: 'Mar 15, 2025',
    },
    {
        category: '🤖 AI & Data',
        text: '"Ali built a machine learning model that improved our recommendation system dramatically. His expertise in AI gave us a real competitive edge."',
        rating: 5,
        name: 'Ali R.',
        role: 'Data Scientist',
        date: 'Feb 22, 2025',
    },
    {
        category: '📚 Admin & Support',
        text: '"Sana managed our customer support with professionalism and warmth. She kept everything organized and clients happy throughout."',
        rating: 5,
        name: 'Sana M.',
        role: 'Virtual Assistant',
        date: 'Jan 30, 2025',
    },
    {
        category: '📷 Photography',
        text: '"Usman captured our corporate event perfectly. The photos were crisp, professional, and delivered right on time."',
        rating: 3,
        name: 'Usman T.',
        role: 'Photographer',
        date: 'Dec 18, 2024',
    },
    {
        category: '💰 Finance',
        text: '"Zara streamlined our bookkeeping and financial reporting. Her clear communication and accuracy saved us countless hours."',
        rating: 5,
        name: 'Zara L.',
        role: 'Accountant',
        date: 'Nov 5, 2024',
    },
];

const StarRating = ({ rating }: { rating: number }) => (
    <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
                key={star} 
                name={star <= rating ? "star" : "star-outline"} 
                size={16} 
                color="#FBBF24" 
            />
        ))}
    </View>
);

export default function LandingScreen({ navigation }: Props) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Hero Gradient Section */}
                <LinearGradient
                    colors={['#0532A9', '#03206B']}
                    style={styles.heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Decorative Circles */}
                    <View style={[styles.decorativeCircle, { top: -60, right: -60, width: 240, height: 240, opacity: 0.1 }]} />
                    <View style={[styles.decorativeCircle, { bottom: 40, left: -40, width: 140, height: 140, opacity: 0.05 }]} />

                    {/* Navbar */}
                    <View style={styles.navbar}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="infinite" size={32} color="#fff" />
                            <Text style={styles.logoText}>Freelansync</Text>
                        </View>
                        <View style={styles.navButtons}>
                            <Pressable
                                onPress={() => navigation.navigate('Login')}
                                style={({ pressed }) => [
                                    styles.navBtn,
                                    pressed && styles.btnPressed
                                ]}
                            >
                                <Text style={styles.navBtnText}>Log In</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => navigation.navigate('Signup')}
                                style={({ pressed }) => [
                                    styles.navBtnPrimary,
                                    pressed && styles.btnPressed
                                ]}
                            >
                                <Text style={styles.navBtnPrimaryText}>Sign Up</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Hero Content */}
                    <View style={styles.heroContent}>
                        <View style={styles.tagBadge}>
                            <Ionicons name="sparkles" size={16} color="#E0E7FF" style={{ marginRight: 6 }} />
                            <Text style={styles.tagText}>The Future of Work</Text>
                        </View>
                        <Text style={styles.heroTitle}>
                            Connecting clients to <Text style={styles.highlightText}>world-class</Text> freelancers
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Find the perfect talent for your next big project or start earning by doing what you love.
                        </Text>
                        
                        <View style={styles.heroActions}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.heroButton,
                                    pressed && styles.btnPressed,
                                ]}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <Text style={styles.heroButtonText}>Start Working</Text>
                                <Ionicons name="arrow-forward" size={20} color="#0532A9" />
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.heroButtonSecondary,
                                    pressed && styles.btnPressed,
                                ]}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <Ionicons name="search" size={20} color="#fff" />
                                <Text style={styles.heroButtonSecondaryText}>Find Talent</Text>
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>
                
                {/* Image Section - Placed directly after gradient with negative margin to pull it up */}
                <View style={styles.heroImageContainer}>
                        <ImageBackground
                        source={{ uri: 'https://fyp-frontend-topaz.vercel.app/assets/landing-page-image-D62JdLAF.jpg' }}
                        style={styles.heroImage}
                        imageStyle={{ borderRadius: 24, resizeMode: 'cover' }}
                    >
                        <View style={styles.imageOverlay} />
                    </ImageBackground>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Categories Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>EXPLORE</Text>
                            <Text style={styles.sectionTitle}>Browse Talent by Category</Text>
                        </View>
                        
                        <View style={styles.categoriesGrid}>
                            {CATEGORIES.map((category, index) => (
                                <Pressable
                                    key={index}
                                    style={({ pressed }) => [
                                        styles.categoryCard,
                                        pressed && styles.categoryCardPressed,
                                    ]}
                                >
                                    <View style={styles.categoryIconContainer}>
                                        <Ionicons name={category.icon as any} size={24} color="#0532A9" />
                                    </View>
                                    <Text style={styles.categoryTitle}>{category.title}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Testimonials Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>TESTIMONIALS</Text>
                            <Text style={styles.sectionTitle}>Real Results from Clients</Text>
                        </View>
                        
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.testimonialsScroll}
                        >
                            {TESTIMONIALS.map((testimonial, index) => (
                                <View key={index} style={styles.testimonialCard}>
                                    <View style={styles.quoteIcon}>
                                        <Ionicons name="chatbubble-ellipses" size={24} color="#0532A9" />
                                    </View>
                                    <Text style={styles.testimonialText}>{testimonial.text}</Text>
                                    
                                    <View style={styles.testimonialDivider} />
                                    
                                    <View style={styles.testimonialFooter}>
                                        <View style={styles.avatarPlaceholder}>
                                            <Text style={styles.avatarText}>{testimonial.name.charAt(0)}</Text>
                                        </View>
                                        <View style={styles.testimonialInfo}>
                                            <Text style={styles.testimonialName}>{testimonial.name}</Text>
                                            <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                                        </View>
                                        <StarRating rating={testimonial.rating} />
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* CTA Section */}
                    <View style={styles.ctaSection}>
                        <LinearGradient
                            colors={['#0532A9', '#03206B']}
                            style={styles.ctaGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                             <View style={[styles.decorativeCircle, { top: -40, left: -40, width: 150, height: 150, opacity: 0.1 }]} />
                            <Text style={styles.ctaTitle}>Ready to get started?</Text>
                            <Text style={styles.ctaSubtitle}>Join thousands of freelancers and clients today.</Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.ctaButton,
                                    pressed && styles.btnPressed,
                                ]}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <Text style={styles.ctaButtonText}>Create an Account</Text>
                            </Pressable>
                        </LinearGradient>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerTop}>
                        <View style={styles.footerBrand}>
                             <Ionicons name="infinite" size={24} color="#fff" style={{ marginBottom: 8 }} />
                            <Text style={styles.footerLogo}>Freelansync</Text>
                            <Text style={styles.footerDesc}>
                                Connecting professionals for short tasks and long-term success.
                            </Text>
                        </View>
                        
                        <View style={styles.footerLinks}>
                            <Text style={styles.footerLinkTitle}>Company</Text>
                            <Text style={styles.footerLinkItem}>About Us</Text>
                            <Text style={styles.footerLinkItem}>Careers</Text>
                            <Text style={styles.footerLinkItem}>Contact</Text>
                        </View>
                        
                        <View style={styles.footerLinks}>
                            <Text style={styles.footerLinkTitle}>Legal</Text>
                            <Text style={styles.footerLinkItem}>Terms</Text>
                            <Text style={styles.footerLinkItem}>Privacy</Text>
                        </View>
                    </View>
                    
                    <View style={styles.footerBottom}>
                        <Text style={styles.copyright}>© 2025 Freelansync. All rights reserved.</Text>
                        <View style={styles.socialIcons}>
                             <Ionicons name="logo-linkedin" size={20} color="#9CA3AF" style={styles.socialIcon} />
                             <Ionicons name="logo-twitter" size={20} color="#9CA3AF" style={styles.socialIcon} />
                             <Ionicons name="logo-instagram" size={20} color="#9CA3AF" style={styles.socialIcon} />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroGradient: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        zIndex: 1,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    navButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    navBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    navBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    navBtnPrimary: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    navBtnPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    btnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 20, // Add some bottom margin within gradient
    },
    tagBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagText: {
        color: '#E0E7FF',
        fontSize: 14,
        fontWeight: '600',
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 44,
        marginBottom: 16,
    },
    highlightText: {
        color: '#93C5FD',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#E0E7FF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        maxWidth: 300,
    },
    heroActions: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    heroButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    heroButtonText: {
        color: '#0532A9',
        fontSize: 16,
        fontWeight: 'bold',
    },
    heroButtonSecondary: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroButtonSecondaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    heroImageContainer: {
        marginTop: 20,
        marginHorizontal: 20,
        height: 220,
        borderRadius: 24,
        shadowColor: '#0532A9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 50, 169, 0.05)', // Very subtle overlay
        borderRadius: 24,
    },
    mainContent: {
        paddingTop: 20,
    },
    section: {
        marginBottom: 48,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        marginBottom: 24,
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0532A9',
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    categoryCard: {
        width: (width - 60) / 2, // 2 columns with gaps
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    categoryCardPressed: {
        backgroundColor: '#F9FAFB',
        transform: [{ scale: 0.98 }],
    },
    categoryIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#EFF6FF',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    testimonialsScroll: {
        paddingRight: 20,
        gap: 16,
    },
    testimonialCard: {
        width: 300,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    quoteIcon: {
        marginBottom: 16,
        opacity: 0.2,
    },
    testimonialText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        fontStyle: 'italic',
        marginBottom: 20,
        minHeight: 72,
    },
    testimonialDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 16,
    },
    testimonialFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#0532A9',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    testimonialInfo: {
        flex: 1,
    },
    testimonialName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    testimonialRole: {
        fontSize: 12,
        color: '#6B7280',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    ctaSection: {
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    ctaGradient: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 16,
        color: '#E0E7FF',
        textAlign: 'center',
        marginBottom: 24,
    },
    ctaButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    ctaButtonText: {
        color: '#0532A9',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: '#111827',
        paddingTop: 48,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    footerTop: {
        marginBottom: 32,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 32,
        justifyContent: 'space-between',
    },
    footerBrand: {
        maxWidth: 200,
    },
    footerLogo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    footerDesc: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
    },
    footerLinks: {
        gap: 12,
    },
    footerLinkTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    footerLinkItem: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    footerBottom: {
        borderTopWidth: 1,
        borderTopColor: '#374151',
        paddingTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    copyright: {
        fontSize: 12,
        color: '#6B7280',
    },
    socialIcons: {
        flexDirection: 'row',
        gap: 16,
    },
    socialIcon: {
        opacity: 0.8,
    },
});
