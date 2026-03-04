import React, { useState, useCallback, useRef } from 'react';
import { FAB } from 'react-native-paper';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Animated,
    ScrollView
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { RootStackParamList } from '../types/index';
import { Post } from '../types';
import { Spacing, Radius, Typography } from '../theme';
import { getAllPosts, getTodayPosts } from '../db/database';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';
import { useSettings } from '../context/SettingsContext';

type FeedNav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
    navigation: FeedNav;
}

export default function FeedScreen({ navigation }: Props) {
    const { colors: Colors } = useSettings();

    const [posts, setPosts] = useState<Post[]>([]);
    const [todayPosts, setTodayPosts] = useState<Post[]>([]);
    const [actionablePosts, setActionablePosts] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const fabAnim = useRef(new Animated.Value(1)).current;

    const loadPosts = useCallback(async () => {
        const [all, today] = await Promise.all([getAllPosts(), getTodayPosts()]);
        setPosts(all);
        setTodayPosts(today);

        const actionable = all.filter(p =>
            (p.is_actionable && p.action_status === 'pending') ||
            (p.cognitive_mode === 'decision')
        ).slice(0, 5);
        setActionablePosts(actionable);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPosts();
        }, [loadPosts]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
    };

    const openCreate = (type?: 'photo' | 'thought' | 'article') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        (navigation as any).navigate('CreatePost', { type });
    };

    const handleFabPress = () => {
        Animated.sequence([
            Animated.timing(fabAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
            Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        (navigation as any).navigate('CreatePost', {});
    };

    const EmptyFeed = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>Your space awaits</Text>
            <Text style={[styles.emptyBody, { color: Colors.textSecondary }]}>
                Start capturing your thoughts, moments, and stories. This is your private world.
            </Text>
            <View style={styles.emptyActions}>
                {[
                    { type: 'photo' as const, icon: 'image-outline' as const, label: 'Photo' },
                    { type: 'thought' as const, icon: 'chatbubble-ellipses-outline' as const, label: 'Thought' },
                    { type: 'article' as const, icon: 'document-text-outline' as const, label: 'Article' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.type}
                        style={[styles.emptyActionBtn, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
                        onPress={() => openCreate(item.type)}
                    >
                        <Ionicons name={item.icon} size={22} color={Colors.accent} />
                        <Text style={[styles.emptyActionText, { color: Colors.textSecondary }]}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const Header = () => (
        <View>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: Colors.textMuted }]}>
                        {dayjs().hour() < 12 ? 'Good morning' : dayjs().hour() < 18 ? 'Good afternoon' : 'Good evening'} 👋
                    </Text>
                    <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>My Journal</Text>
                </View>
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Profile' })}
                >
                    <Ionicons name="person-circle-outline" size={30} color={Colors.accentLight} />
                </TouchableOpacity>
            </View>
            {actionablePosts.length > 0 && (
                <View style={styles.recallWidget}>
                    <View style={styles.recallHeader}>
                        <Ionicons name="flash" size={16} color={Colors.accent} />
                        <Text style={[styles.recallTitle, { color: Colors.textPrimary }]}>Intelligent Recall</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recallScroll}>
                        {actionablePosts.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                style={[styles.recallCard, { backgroundColor: Colors.bgCard, borderColor: Colors.borderLight }]}
                                onPress={() => (navigation as any).navigate('PostDetail', { post: p })}
                            >
                                <View style={[styles.recallBadge, { backgroundColor: p.cognitive_mode === 'decision' ? Colors.accentDim : 'rgba(239,68,68,0.1)' }]}>
                                    <Text style={[styles.recallBadgeText, { color: p.cognitive_mode === 'decision' ? Colors.accent : Colors.danger }]}>
                                        {p.cognitive_mode === 'decision' ? 'Decision Context' : 'Action Required'}
                                    </Text>
                                </View>
                                <Text style={[styles.recallContext, { color: Colors.textSecondary }]} numberOfLines={2}>
                                    {p.title || p.body?.replace(/<[^>]*>?/gm, '').trim() || 'Untitled Entry'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {todayPosts.length > 0 && (
                <StoryBar
                    posts={todayPosts}
                    onPostPress={(p) => (navigation as any).navigate('PostDetail', { post: p })}
                />
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors.bg }]}>
            <FlashList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={(p) => (navigation as any).navigate('PostDetail', { post: p })}
                        onDeleted={loadPosts}
                    />
                )}
                ListHeaderComponent={<Header />}
                ListEmptyComponent={<EmptyFeed />}
                contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.accent}
                    />
                }
                showsVerticalScrollIndicator={false}
                // @ts-ignore: Known TypeScript definition issue with FlashList in some RN versions
                estimatedItemSize={250}
            />

            {/* Material 3 FAB */}
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: Colors.accent }]}
                color={Colors.white}
                onPress={handleFabPress}
                mode="elevated"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { paddingTop: Spacing.sm, paddingBottom: 100 },
    emptyList: { flexGrow: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md
    },
    greeting: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '500',
        marginBottom: 2
    },
    headerTitle: {
        fontSize: Typography.headlineSmall.fontSize,
        fontWeight: '800'
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center'
    },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl
    },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
    emptyTitle: {
        fontSize: Typography.headlineSmall.fontSize,
        fontWeight: '800',
        marginBottom: Spacing.sm,
        textAlign: 'center'
    },
    emptyBody: {
        fontSize: Typography.bodyMedium.fontSize,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl
    },
    emptyActions: {
        flexDirection: 'row',
        gap: Spacing.md
    },
    emptyActionBtn: {
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg
    },
    emptyActionText: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '500'
    },

    fab: {
        position: 'absolute',
        bottom: 28,
        right: Spacing.md,
    },
    recallWidget: {
        marginTop: Spacing.md,
        marginBottom: Spacing.sm
    },
    recallHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
        marginBottom: Spacing.sm
    },
    recallTitle: {
        fontSize: Typography.labelLarge.fontSize,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    recallScroll: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm
    },
    recallCard: {
        width: 220,
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1
    },
    recallBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radius.sm,
        marginBottom: Spacing.sm
    },
    recallBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    recallContext: {
        fontSize: Typography.bodyMedium.fontSize,
        lineHeight: 20
    }
});
