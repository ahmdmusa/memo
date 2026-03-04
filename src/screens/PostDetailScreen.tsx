import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Share,
    Alert
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useVideoPlayer, VideoView } from 'expo-video';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { RootStackParamList } from '../types/index';
import { Post } from '../types';
import { Spacing, Radius, Typography, getPostColor, getPostDim } from '../theme';
import { deletePost } from '../db/database';
import AudioPlayerCard from '../components/AudioPlayerCard';
import { useSettings } from '../context/SettingsContext';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'PostDetail'>;
    route: RouteProp<RootStackParamList, 'PostDetail'>;
};

const SCREEN_W = Dimensions.get('window').width;
const TYPE_LABEL: Record<string, string> = { photo: 'Photo', thought: 'Thought', article: 'Article' };
const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    photo: 'image-outline',
    thought: 'chatbubble-ellipses-outline',
    article: 'document-text-outline'
};

export default function PostDetailScreen({ navigation, route }: Props) {
    const { colors: Colors } = useSettings();

    const { post } = route.params;
    const insets = useSafeAreaInsets();
    const color = getPostColor(Colors, post.type);
    const dim = getPostDim(Colors, post.type);

    const videoPlayer = useVideoPlayer(post.media_uri ?? null, p => {
        p.loop = true;
    });

    const isThought = post.type === 'thought';
    const baseFontSize = isThought ? Typography.titleLarge.fontSize : Typography.bodyMedium.fontSize;

    const htmlStyles = {
        body: {
            fontSize: baseFontSize,
            lineHeight: isThought ? 32 : 26,
            fontStyle: isThought ? 'italic' : 'normal',
            color: isThought ? Colors.textPrimary : Colors.textSecondary,
            textAlign: isThought ? 'center' : 'left',
            margin: 0,
            padding: 0
        },
        p: {
            margin: 0,
            padding: 0
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Memory',
            'This memory will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        await deletePost(post);
                        navigation.goBack();
                    }
                },
            ],
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.bg, paddingTop: insets.top }]}>
            {/* Nav Bar */}
            <View style={styles.navbar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.navBtn, { backgroundColor: Colors.bgCard }]}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={[styles.typePill, { backgroundColor: dim }]}>
                    <Ionicons name={TYPE_ICON[post.type]} size={14} color={color} />
                    <Text style={[styles.typePillText, { color }]}>{TYPE_LABEL[post.type]}</Text>
                </View>
                <TouchableOpacity onPress={handleDelete} style={[styles.navBtn, { backgroundColor: Colors.bgCard }]}>
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Image */}
                {post.type === 'photo' && post.image_uri && (
                    <Image
                        source={{ uri: post.image_uri }}
                        style={[styles.fullImage, { backgroundColor: Colors.bgHighlight }]}
                        resizeMode="cover"
                    />
                )}

                {/* Video */}
                {post.type === 'video' && post.media_uri && (
                    <View style={[styles.fullImage, { backgroundColor: Colors.bgHighlight }]}>
                        <VideoView
                            player={videoPlayer}
                            style={StyleSheet.absoluteFillObject}
                            nativeControls={true}
                        />
                    </View>
                )}

                {/* Voice */}
                {post.type === 'voice' && (post.media_uri || post.image_uri) && (
                    <View style={{ padding: Spacing.md }}>
                        <AudioPlayerCard
                            uri={post.media_uri ?? post.image_uri ?? ''}
                            duration={(post.duration ?? 0) * 1000}
                        />
                    </View>
                )}

                <View style={styles.content}>
                    {/* Mood & Date */}
                    <View style={styles.meta}>
                        {post.mood && <Text style={styles.mood}>{post.mood}</Text>}
                        <Text style={[styles.metaDate, { color: Colors.textPrimary }]}>
                            {dayjs(post.created_at).format('dddd, MMMM D, YYYY')}
                        </Text>
                        <Text style={[styles.metaTime, { color: Colors.textMuted }]}>
                            {dayjs(post.created_at).format('h:mm A')}
                        </Text>
                    </View>

                    {/* Title */}
                    {post.title && (
                        <Text style={[styles.title, { color: Colors.textPrimary }]}>{post.title}</Text>
                    )}

                    {/* Body */}
                    {post.body && (
                        <View style={{ marginBottom: Spacing.xl }}>
                            <RenderHtml
                                contentWidth={SCREEN_W - Spacing.md * 2}
                                source={{ html: post.body }}
                                baseStyle={htmlStyles.body as any}
                                tagsStyles={htmlStyles as any}
                            />
                        </View>
                    )}

                    {/* Accent line */}
                    <View style={[styles.accentBar, { backgroundColor: color }]} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm
    },
    navBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.full
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full
    },
    typePillText: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '600'
    },
    scroll: { paddingBottom: 80 },
    fullImage: {
        width: SCREEN_W,
        height: SCREEN_W * 0.75
    },
    content: { padding: Spacing.md },
    meta: { marginBottom: Spacing.md },
    mood: { fontSize: 36, marginBottom: Spacing.xs },
    metaDate: {
        fontSize: Typography.bodyLarge.fontSize,
        fontWeight: '600',
        marginBottom: 2
    },
    metaTime: {
        fontSize: Typography.bodySmall.fontSize
    },
    title: {
        fontSize: Typography.headlineSmall.fontSize,
        fontWeight: '800',
        lineHeight: 34,
        marginBottom: Spacing.md
    },
    accentBar: {
        height: 4,
        width: 40,
        borderRadius: Radius.full,
        marginTop: Spacing.lg
    }
});
