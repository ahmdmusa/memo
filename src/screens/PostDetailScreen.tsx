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
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { RootStackParamList } from '../types/index';
import { Post } from '../types';
import { Spacing, Radius, FontSize, FontWeight, getPostColor, getPostDim } from '../theme';
import { deletePost } from '../db/database';
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
                        <Text style={[
                            styles.body,
                            { color: Colors.textSecondary },
                            post.type === 'thought' && styles.bodyThought,
                            post.type === 'thought' && { color: Colors.textPrimary }
                        ]}>
                            {post.body}
                        </Text>
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
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold
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
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: 2
    },
    metaTime: {
        fontSize: FontSize.sm
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.heavy,
        lineHeight: 34,
        marginBottom: Spacing.md
    },
    body: {
        fontSize: FontSize.md,
        lineHeight: 26,
        marginBottom: Spacing.xl
    },
    bodyThought: {
        fontSize: FontSize.xl,
        fontStyle: 'italic',
        lineHeight: 30,
        textAlign: 'center'
    },
    accentBar: {
        height: 4,
        width: 40,
        borderRadius: Radius.full,
        marginTop: Spacing.lg
    }
});
