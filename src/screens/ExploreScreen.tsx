import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, PostType } from '../types/index';
import { Post } from '../types';
import {  Spacing, Radius, FontSize, FontWeight, getPostColor, getPostDim } from '../theme';
import { getAllPosts, getPostsByType, searchPosts } from '../db/database';
import PostCard from '../components/PostCard';
import { useSettings } from '../context/SettingsContext';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'MainTabs'> };

type Filter = 'all' | PostType;

const FILTERS: { key: Filter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'photo', label: 'Photos', icon: 'image-outline' },
    { key: 'thought', label: 'Thoughts', icon: 'chatbubble-ellipses-outline' },
    { key: 'article', label: 'Articles', icon: 'document-text-outline' },
];

export default function ExploreScreen({ navigation }: Props) {
    const { colors: Colors } = useSettings();

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.bg },
        header: {
            paddingTop: 60,
            paddingHorizontal: Spacing.md,
            paddingBottom: Spacing.md },
        title: {
            fontSize: FontSize.xxl,
            fontWeight: FontWeight.heavy,
            color: Colors.textPrimary,
            marginBottom: Spacing.md },
        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.lg,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm + 2 },
        searchInput: {
            flex: 1,
            fontSize: FontSize.md,
            color: Colors.textPrimary },
        filterRow: {
            flexDirection: 'row',
            gap: Spacing.sm,
            paddingHorizontal: Spacing.md,
            marginBottom: Spacing.sm },
        filterBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: Spacing.sm,
            paddingVertical: 6,
            borderRadius: Radius.full,
            borderWidth: 1,
            borderColor: Colors.border },
        filterText: {
            fontSize: FontSize.xs,
            fontWeight: FontWeight.medium,
            color: Colors.textMuted },
        resultsCount: {
            fontSize: FontSize.xs,
            color: Colors.textMuted,
            paddingHorizontal: Spacing.md,
            marginBottom: Spacing.sm,
            fontWeight: FontWeight.medium,
            textTransform: 'uppercase',
            letterSpacing: 0.6 },
        list: { paddingTop: Spacing.sm, paddingBottom: 120 },
        empty: {
            alignItems: 'center',
            paddingTop: 80,
            gap: Spacing.md },
        emptyText: {
            fontSize: FontSize.md,
            color: Colors.textMuted },
    });

    const [posts, setPosts] = useState<Post[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');

    const loadPosts = useCallback(async (f: Filter, q: string) => {
        if (q.trim().length > 1) {
            const results = await searchPosts(q);
            setPosts(results);
        } else if (f === 'all') {
            setPosts(await getAllPosts());
        } else {
            setPosts(await getPostsByType(f as PostType));
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPosts(filter, query);
        }, [filter, query, loadPosts]),
    );

    const handleFilter = (f: Filter) => {
        setFilter(f);
        loadPosts(f, query);
    };

    const handleSearch = (q: string) => {
        setQuery(q);
        loadPosts(filter, q);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Explore</Text>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={16} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search memories..."
                        placeholderTextColor={Colors.textMuted}
                        value={query}
                        onChangeText={handleSearch}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    const fColor = f.key === 'all' ? Colors.accent : getPostColor(Colors, f.key as PostType);
                    const fDim = f.key === 'all' ? Colors.accentDim : getPostDim(Colors, f.key as PostType);
                    return (
                        <TouchableOpacity
                            key={f.key}
                            style={[
                                styles.filterBtn,
                                active && { backgroundColor: fDim, borderColor: fColor },
                            ]}
                            onPress={() => handleFilter(f.key)}
                        >
                            <Ionicons name={f.icon} size={14} color={active ? fColor : Colors.textMuted} />
                            <Text style={[styles.filterText, active && { color: fColor }]}>{f.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Results count */}
            {posts.length > 0 && (
                <Text style={styles.resultsCount}>{posts.length} {posts.length === 1 ? 'memory' : 'memories'}</Text>
            )}

            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={(p) => (navigation as any).navigate('PostDetail', { post: p })}
                        onDeleted={() => loadPosts(filter, query)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>
                            {query ? 'No results found' : 'Nothing here yet'}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

