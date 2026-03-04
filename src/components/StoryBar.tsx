import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Post } from '../types';
import { Spacing, Radius, Typography, getPostColor, getPostDim } from '../theme';
import { useSettings } from '../context/SettingsContext';

interface StoryBarProps {
    posts: Post[];
    onPostPress: (post: Post) => void;
}

interface StoryBarProps {
    posts: Post[];
    onPostPress: (post: Post) => void;
}

export default function StoryBar({ posts, onPostPress }: StoryBarProps) {
    const { colors: Colors } = useSettings();

    if (posts.length === 0) return null;

    return (
        <View style={[styles.wrapper, { borderBottomColor: Colors.border }]}>
            <Text style={[styles.label, { color: Colors.textMuted }]}>Today's entries</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {posts.map((post) => {
                    const color = getPostColor(Colors, post.type);
                    const dim = getPostDim(Colors, post.type);
                    const icon: keyof typeof Ionicons.glyphMap =
                        post.type === 'photo' ? 'image'
                            : post.type === 'thought' ? 'chatbubble-ellipses'
                                : 'document-text';

                    return (
                        <TouchableOpacity
                            key={post.id}
                            style={styles.storyItem}
                            onPress={() => onPostPress(post)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.storyRing, { borderColor: color }]}>
                                <View style={[styles.storyInner, { backgroundColor: dim }]}>
                                    <Ionicons name={icon} size={22} color={color} />
                                </View>
                            </View>
                            <Text style={[styles.storyTime, { color: Colors.textMuted }]}>
                                {dayjs(post.created_at).format('h:mm A')}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1
    },
    label: {
        fontSize: Typography.labelSmall.fontSize,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginLeft: Spacing.md,
        marginBottom: Spacing.sm
    },
    scroll: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.md
    },
    storyItem: {
        alignItems: 'center',
        gap: Spacing.xs
    },
    storyRing: {
        width: 56,
        height: 56,
        borderRadius: Radius.full,
        borderWidth: 2,
        padding: 3,
        alignItems: 'center',
        justifyContent: 'center'
    },
    storyInner: {
        width: '100%',
        height: '100%',
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center'
    },
    storyTime: {
        fontSize: Typography.labelSmall.fontSize,
        fontWeight: '500'
    }
});
