import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image,
    Pressable,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMessagesForProject, sendProjectChatMessage } from '@/api/chat-functions';
import { getProjectDetailsById } from '@/api/project-functions';
import { userAuthStore } from '@/store/user-auth-store';
import { Spinner, Empty } from '@/components/ui';
import { toast } from '@/utils/toast';
import { CustomHeader } from '@/components/CustomHeader';
import { supabaseClient } from '@/config/supabase';
import { ProjectMessageFromBackendType } from '@/types';

type Props = any; // Can be either ClientStackParamList or FreelancerStackParamList

export default function ProjectChatScreen({ route }: Props) {
    const { projectId } = route.params;
    const { user } = userAuthStore();
    const navigation = useNavigation();
    const [message, setMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const queryClient = useQueryClient();

    // Fetch project details
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectDetailsById(projectId),
        enabled: !!projectId,
    });

    // Memoize back press handler
    const handleBackPress = useCallback(() => {
        // Simply go back to the previous screen in the stack
        navigation.goBack();
    }, [navigation]);

    // Memoize header component to prevent re-renders
    const headerComponent = useMemo(() => {
        return () => (
            <CustomHeader 
                title={project?.title || 'Project Chat'} 
                role={user?.role || 'client'}
                showBackButton={true}
                onBackPress={handleBackPress}
                subtitle={project?.description ? 
                    (project.description.length > 60 ? project.description.substring(0, 60) + '...' : project.description) : 
                    'Project discussion'
                }
                projectBudget={project?.budget}
                projectStatus={project?.status}
            />
        );
    }, [project, user?.role, handleBackPress]);

    // Hide tab bar and update header when screen is focused
    useLayoutEffect(() => {
        
        // Hide bottom tab bar
        const parent = navigation.getParent();
        if (parent) {
            parent.setOptions({
                tabBarStyle: { display: 'none' },
            });
        }

        // Update header with project info and back button
        navigation.setOptions({
            header: headerComponent,
        });

        // Show tab bar again when leaving this screen
        return () => {
            if (parent) {
                parent.setOptions({
                    tabBarStyle: {
                        height: 70,
                        paddingBottom: 10,
                        paddingTop: 8,
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#e0e0e0',
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    },
                });
            }
        };
    }, [navigation, headerComponent]);

    const [messages, setMessages] = useState<ProjectMessageFromBackendType[]>([]);
    
    const { data: initialMessages, isLoading } = useQuery({
        queryKey: ['projectMessages', projectId],
        queryFn: () => getMessagesForProject(projectId),
        refetchOnMount: true,
    });

    // Set initial messages when loaded
    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    // Realtime subscription for new messages
    useEffect(() => {
        if (!projectId) return;


        const channel = supabaseClient
            .channel(`project_chat_${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'project_messages',
                    filter: `project=eq.${projectId}`,
                },
                (payload) => {
                    const newMessage = payload.new as ProjectMessageFromBackendType;
                    setMessages((prev) => [...prev, newMessage]);
                }
            )
            .subscribe((status) => {
            });

        // Cleanup function
        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [projectId]);

    const sendMutation = useMutation({
        mutationFn: () =>
            sendProjectChatMessage(projectId, user!.userId, user!.username, message),
        onSuccess: () => {
            setMessage('');
            // No need to refetch - realtime subscription will handle new messages
        },
        onError: () => {
            toast.error('Failed to send message');
        },
    });

    // Scroll to bottom only when messages length changes (not on every refetch)
    const prevMessagesLengthRef = useRef(0);
    
    useEffect(() => {
        if (messages && messages.length > 0 && messages.length !== prevMessagesLengthRef.current) {
            prevMessagesLengthRef.current = messages.length;
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages?.length]); // Only depend on length, not entire messages array

    const handleSend = () => {
        if (!message.trim()) {
            toast.warning('Please enter a message');
            return;
        }
        sendMutation.mutate();
    };

    // Helper function to format date labels
    const formatDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const messageDate = new Date(date);
        messageDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        
        if (messageDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // Helper function to check if we need a time separator (2+ hour gap)
    const shouldShowTimeSeparator = (currentMsg: any, prevMsg: any) => {
        if (!prevMsg) return false;
        
        const currentTime = new Date(currentMsg.created_at).getTime();
        const prevTime = new Date(prevMsg.created_at).getTime();
        const hoursDiff = (currentTime - prevTime) / (1000 * 60 * 60);
        
        return hoursDiff >= 2;
    };

    // Transform messages to include separators
    const messagesWithSeparators = useMemo(() => {
        if (!messages || messages.length === 0) return [];
        
        const result: any[] = [];
        let lastDateLabel = '';
        
        messages.forEach((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const messageDate = new Date(message.created_at);
            const dateLabel = formatDateLabel(messageDate);
            
            // Add date separator if day changed
            if (dateLabel !== lastDateLabel) {
                result.push({
                    type: 'date-separator',
                    id: `date-${message.id}`,
                    label: dateLabel,
                });
                lastDateLabel = dateLabel;
            }
            // Add time separator if 2+ hours gap
            else if (shouldShowTimeSeparator(message, prevMessage)) {
                const timeLabel = messageDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                });
                result.push({
                    type: 'time-separator',
                    id: `time-${message.id}`,
                    label: timeLabel,
                });
            }
            
            // Add the message
            result.push({
                type: 'message',
                ...message,
            });
        });
        
        return result;
    }, [messages]);

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    return (
        <LinearGradient
            colors={['#F0F4FF', '#FAFBFF', '#F5F7FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
        >
            {/* Decorative Background Pattern */}
            <View style={styles.backgroundPattern}>
                <View style={styles.bgCircle1} />
                <View style={styles.bgCircle2} />
                <View style={styles.bgCircle3} />
                <View style={styles.bgCircle4} />
                <View style={styles.bgWave1} />
                <View style={styles.bgWave2} />
            </View>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <View style={styles.messagesContainer}>
                    {!messages || messages.length === 0 ? (
                        <Empty title="No messages" description="Start the conversation!" />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messagesWithSeparators}
                            keyExtractor={(item) => item.id?.toString() || item.id}
                            contentContainerStyle={styles.messagesList}
                            renderItem={({ item, index }) => {
                            // Render date or time separator
                            if (item.type === 'date-separator' || item.type === 'time-separator') {
                                return (
                                    <View style={styles.separatorContainer}>
                                        <View style={styles.separatorLine} />
                                        <View style={styles.separatorLabelContainer}>
                                            <Text style={styles.separatorLabel}>{item.label}</Text>
                                        </View>
                                        <View style={styles.separatorLine} />
                                    </View>
                                );
                            }

                            // Render message
                            const isMyMessage = item.sender === user?.userId;
                            
                            // Find next and previous messages (skip separators)
                            const actualMessages = messagesWithSeparators.filter(m => m.type === 'message');
                            const actualIndex = actualMessages.findIndex(m => m.id === item.id);
                            const nextMessage = actualMessages[actualIndex + 1];
                            const prevMessage = actualMessages[actualIndex - 1];
                            
                            // Show profile picture if sender will change OR if 2+ hour gap to next message
                            let isLastInSequence = !nextMessage || nextMessage.sender !== item.sender;
                            if (!isLastInSequence && nextMessage) {
                                const currentTime = new Date(item.created_at).getTime();
                                const nextTime = new Date(nextMessage.created_at).getTime();
                                const hoursDiff = (nextTime - currentTime) / (1000 * 60 * 60);
                                if (hoursDiff >= 2) {
                                    isLastInSequence = true;
                                }
                            }
                            
                            // Show username if sender changed OR if 2+ hour gap from previous message
                            let isFirstInSequence = !prevMessage || prevMessage.sender !== item.sender;
                            if (!isFirstInSequence && prevMessage) {
                                const currentTime = new Date(item.created_at).getTime();
                                const prevTime = new Date(prevMessage.created_at).getTime();
                                const hoursDiff = (currentTime - prevTime) / (1000 * 60 * 60);
                                if (hoursDiff >= 2) {
                                    isFirstInSequence = true;
                                }
                            }
                            
                            return (
                                <View
                                    style={[
                                        styles.messageRow,
                                        isMyMessage && styles.myMessageRow,
                                        !isLastInSequence && styles.messageRowCompact,
                                    ]}
                                >
                                    {/* Profile Picture (Left side for received messages) */}
                                    {!isMyMessage && (
                                        <View style={styles.avatarContainer}>
                                            {isLastInSequence ? (
                                                item.sender_profile_pic ? (
                                                    <Image
                                                        source={{ uri: item.sender_profile_pic }}
                                                        style={styles.avatar}
                                                    />
                                                ) : (
                                                    <View style={styles.avatarPlaceholder}>
                                                        <Text style={styles.avatarText}>
                                                            {item.sender_username.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )
                                            ) : (
                                                <View style={styles.avatarSpacer} />
                                            )}
                                        </View>
                                    )}

                                    {/* Message Bubble */}
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                                        ]}
                                    >
                                        {/* Username - only show on first message in sequence */}
                                        {isFirstInSequence && (
                                            <Text
                                                style={[
                                                    styles.messageSender,
                                                    isMyMessage && styles.myMessageSender,
                                                ]}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {item.sender_username}
                                            </Text>
                                        )}

                                        {/* Message Text */}
                                        <Text
                                            style={[
                                                styles.messageText,
                                                isMyMessage && styles.myMessageText,
                                            ]}
                                        >
                                            {item.message_text}
                                        </Text>

                                        {/* Timestamp */}
                                        <Text
                                            style={[
                                                styles.messageTime,
                                                isMyMessage && styles.myMessageTime,
                                            ]}
                                        >
                                            {new Date(item.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>

                                    {/* Profile Picture (Right side for my messages) */}
                                    {isMyMessage && (
                                        <View style={styles.avatarContainer}>
                                            {isLastInSequence ? (
                                                user?.profile_pic ? (
                                                    <Image
                                                        source={{ uri: user.profile_pic }}
                                                        style={styles.avatar}
                                                    />
                                                ) : (
                                                    <View style={[styles.avatarPlaceholder, styles.myAvatarPlaceholder]}>
                                                        <Text style={[styles.avatarText, styles.myAvatarText]}>
                                                            {user?.username?.charAt(0).toUpperCase() || '?'}
                                                        </Text>
                                                    </View>
                                                )
                                            ) : (
                                                <View style={styles.avatarSpacer} />
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                    />
                )}
            </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Type a message..."
                            placeholderTextColor="#9CA3AF"
                            style={styles.textInput}
                            multiline
                            maxLength={1000}
                        />
                    </View>
                    <Pressable
                        onPress={handleSend}
                        disabled={sendMutation.isPending || !message.trim()}
                        style={({ pressed }) => [
                            styles.sendButton,
                            (!message.trim() || sendMutation.isPending) && styles.sendButtonDisabled,
                            pressed && styles.sendButtonPressed,
                        ]}
                    >
                        {sendMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons 
                                name="send" 
                                size={20} 
                                color={message.trim() ? '#FFFFFF' : '#9CA3AF'} 
                            />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    backgroundPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 1,
    },
    bgCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#0532A9',
        opacity: 0.03,
        top: '10%',
        right: -50,
    },
    bgCircle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#0645C9',
        opacity: 0.04,
        bottom: '30%',
        left: -40,
    },
    bgCircle3: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0532A9',
        opacity: 0.025,
        top: '50%',
        left: '30%',
    },
    bgCircle4: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#0758D9',
        opacity: 0.035,
        bottom: '10%',
        right: '25%',
    },
    bgWave1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#0532A9',
        opacity: 0.02,
        top: '20%',
        left: -100,
        transform: [{ scaleX: 2 }],
    },
    bgWave2: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#0645C9',
        opacity: 0.025,
        bottom: -80,
        right: -60,
        transform: [{ scaleY: 1.5 }],
    },
    container: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        paddingBottom: 8,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
        gap: 8,
    },
    messageRowCompact: {
        marginBottom: 4,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        flexShrink: 0,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 2,
    },
    avatarSpacer: {
        width: 32,
        height: 32,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#9CA3AF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 2,
    },
    myAvatarPlaceholder: {
        backgroundColor: '#0532A9',
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    avatarText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    myAvatarText: {
        color: '#FFFFFF',
    },
    messageBubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        maxWidth: '70%',
        elevation: 3,
    },
    otherMessageBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(5, 50, 169, 0.08)',
    },
    myMessageBubble: {
        backgroundColor: '#0532A9',
        borderBottomRightRadius: 4,
    },
    messageSender: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        color: '#0532A9',
    },
    myMessageSender: {
        color: '#B8CFFF',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 3,
        color: '#1F2937',
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    messageTime: {
        fontSize: 10,
        color: '#9CA3AF',
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: '#B8CFFF',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
        gap: 10,
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(5, 50, 169, 0.2)',
        minHeight: 44,
        maxHeight: 120,
    },
    textInput: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 20,
        paddingVertical: 0,
        minHeight: 20,
        fontWeight: '500',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0532A9',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(229, 231, 235, 0.8)',
        elevation: 2,
        shadowOpacity: 0.15,
    },
    sendButtonPressed: {
        transform: [{ scale: 0.95 }],
        elevation: 2,
    },
    // Separator styles
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
    },
    separatorLabelContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: 'rgba(5, 50, 169, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    separatorLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});




