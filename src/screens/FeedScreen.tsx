import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { RootStackParamList } from '../types/index';
import { Post } from '../types';
import {  Spacing, Radius, FontSize, FontWeight } from '../theme';
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
    const [refreshing, setRefreshing] = useState(false);
    const fabAnim = useRef(new Animated.Value(1)).current;

    const loadPosts = useCallback(async () => {
        const [all, today] = await Promise.all([getAllPosts(), getTodayPosts()]);
        setPosts(all);
        setTodayPosts(today);
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
            <Text style={styles.emptyTitle}>Your space awaits</Text>
            <Text style={styles.emptyBody}>
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
                        style={styles.emptyActionBtn}
                        onPress={() => openCreate(item.type)}
                    >
                        <Ionicons name={item.icon} size={22} color={Colors.} />
                        <Text style={styles.emptyActionText}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const Header = () => (
        <View>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>
                        {dayjs().hour() < 12 ? 'Good morning' : dayjs().hour() < 18 ? 'Good afternoon' : 'Good evening'} 👋
                    </Text>
                    <Text style={styles.headerTitle}>My Journal</Text>
                </View>
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Profile' })}
                >
                    <Ionicons name="person-circle-outline" size={30} color={Colors.} />
                </TouchableOpacity>
            </View>
            {todayPosts.length > 0 && (
                <StoryBar
                    posts={todayPosts}
                    onPostPress={(p) => (navigation as any).navigate('PostDetail', { post: p })}
                />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
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
                        tintColor={Colors.}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabAnim }] }]}>
                <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.9}>
                    <Ionicons name="add" size={28} color={Colors.} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: .bg },
    list: { paddingTop: Spacing.sm, paddingBottom: 100 },
    emptyList: { flexGrow: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md },
    greeting: {
        fontSize: FontSize.sm,
        color: .textMuted,
        fontWeight: FontWeight.medium,
        marginBottom: 2 },
    headerTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.heavy,
        color: .textPrimary },
    headerIconBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center' },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
    emptyTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.heavy,
        color: .textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center' },
    emptyBody: {
        fontSize: FontSize.md,
        color: .textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl },
    emptyActions: {
        flexDirection: 'row',
        gap: Spacing.md },
    emptyActionBtn: {
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: .bgCard,
        borderWidth: 1,
        borderColor: .border,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg },
    emptyActionText: {
        fontSize: FontSize.sm,
        color: .textSecondary,
        fontWeight: FontWeight.medium },

    fabWrapper: {
        position: 'absolute',
        bottom: 28,
        alignSelf: 'center' },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: .accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: .accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12 } });
