import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, Dimensions, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import RenderHtml from 'react-native-render-html';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Post } from '../types';
import { Spacing, Radius, Typography, getPostColor, getPostDim } from '../theme';
import { deletePost } from '../db/database';
import AudioPlayerCard from './AudioPlayerCard';
import { useSettings } from '../context/SettingsContext';

dayjs.extend(relativeTime);

const SCREEN_W = Dimensions.get('window').width;

interface PostCardProps {
    post: Post;
    onPress: (post: Post) => void;
    onDeleted: () => void;
}

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    photo: 'image-outline',
    video: 'videocam-outline',
    thought: 'chatbubble-ellipses-outline',
    article: 'document-text-outline',
    voice: 'mic-outline'
};

const TYPE_LABEL: Record<string, string> = {
    photo: 'Photo',
    video: 'Video',
    thought: 'Thought',
    article: 'Article',
    voice: 'Voice'
};

function PostVideo({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, p => {
        p.loop = true;
    });
    return (
        <VideoView
            player={player}
            style={StyleSheet.absoluteFillObject}
            nativeControls={false}
        />
    );
}

export default function PostCard({ post, onPress, onDeleted }: PostCardProps) {
    const { colors: Colors } = useSettings();

    const [imageError, setImageError] = useState(false);
    const color = getPostColor(Colors, post.type);
    const dim = getPostDim(Colors, post.type);

    const handleLongPress = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this memory?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        await deletePost(post);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onDeleted();
                    }
                },
            ],
        );
    };

    const handlePress = () => {
        Haptics.selectionAsync();
        onPress(post);
    };

    const isThought = post.type === 'thought';
    const baseFontSize = isThought ? Typography.bodyLarge.fontSize : Typography.bodyMedium.fontSize;

    const htmlStyles = {
        body: {
            fontSize: baseFontSize,
            color: Colors.textPrimary,
            lineHeight: isThought ? 26 : 22,
            fontStyle: isThought ? 'italic' : 'normal',
            margin: 0,
            padding: 0
        },
        p: {
            margin: 0,
            padding: 0
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.85}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.typeBadge, { backgroundColor: dim }]}>
                    <Ionicons name={TYPE_ICON[post.type]} size={12} color={color} />
                    <Text style={[styles.typeBadgeText, { color }]}>{TYPE_LABEL[post.type]}</Text>
                </View>
                <View style={styles.headerRight}>
                    {post.mood && <Text style={styles.mood}>{post.mood}</Text>}
                    <Text style={[styles.date, { color: Colors.textMuted }]}>{dayjs(post.created_at).fromNow()}</Text>
                </View>
            </View>

            {/* Content Text (HTML) */}
            {post.title && (
                <Text style={[styles.title, { color: Colors.textPrimary }]} numberOfLines={2}>{post.title}</Text>
            )}
            {post.body ? (
                <View style={styles.markdownWrapper}>
                    <RenderHtml
                        contentWidth={SCREEN_W - Spacing.md * 2}
                        source={{ html: post.body }}
                        baseStyle={htmlStyles.body as any}
                        tagsStyles={htmlStyles as any}
                    />
                </View>
            ) : null}

            {/* Media Handling */}
            {post.type === 'photo' && post.image_uri && !imageError && (
                <Image
                    source={{ uri: post.image_uri }}
                    style={[styles.media, { backgroundColor: Colors.bgHighlight }]}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            )}
            {post.type === 'photo' && (imageError || !post.image_uri) && (
                <View style={[styles.mediaPlaceholder, { backgroundColor: dim }]}>
                    <Ionicons name="image" size={48} color={color} />
                </View>
            )}

            {/* Video Player */}
            {post.type === 'video' && post.media_uri && (
                <View style={[styles.media, { backgroundColor: Colors.bgHighlight }]}>
                    <PostVideo uri={post.media_uri} />
                </View>
            )}

            {/* Voice player */}
            {post.type === 'voice' && (post.media_uri || post.image_uri) && (
                <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
                    <AudioPlayerCard
                        uri={post.media_uri ?? post.image_uri ?? ''}
                        duration={(post.duration ?? 0) * 1000}
                        compact
                    />
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerDate, { color: Colors.textMuted }]}>
                    {dayjs(post.created_at).format('MMM D, YYYY · h:mm A')}
                </Text>
                <View style={[styles.accentLine, { backgroundColor: color }]} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    typeBadgeText: {
        fontSize: Typography.labelSmall.fontSize,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    mood: {
        fontSize: Typography.bodyMedium.fontSize,
    },
    date: {
        fontSize: Typography.labelSmall.fontSize,
    },
    media: {
        width: SCREEN_W - Spacing.md * 2,
        height: (SCREEN_W - Spacing.md * 2) * 0.65,
        marginTop: Spacing.sm,
    },
    mediaPlaceholder: {
        width: '100%',
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: Typography.bodyLarge.fontSize,
        fontWeight: '700',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        lineHeight: 24,
    },
    markdownWrapper: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginTop: Spacing.xs,
    },
    footerDate: {
        fontSize: Typography.labelSmall.fontSize,
    },
    accentLine: {
        height: 3,
        width: 24,
        borderRadius: Radius.full,
    }
});
