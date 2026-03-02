import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, Dimensions, FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import { RootStackParamList, Post, Profile } from '../types';
import { Spacing, Radius, FontSize, FontWeight, getPostColor } from '../theme';
import { useSettings } from '../context/SettingsContext';
import {
    getProfile, saveProfile, getAllPosts, saveImageLocally
} from '../db/database';

const SCREEN_W = Dimensions.get('window').width;
const GRID_CELL = (SCREEN_W - 2) / 3;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'MainTabs'> };

export default function ProfileScreen({ navigation }: Props) {
    const { colors: Colors } = useSettings();

    const [profile, setProfile] = useState<Profile>({ name: 'Me', bio: '' });
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');

    const loadData = useCallback(async () => {
        const [p, posts] = await Promise.all([
            getProfile(),
            getAllPosts(),
        ]);
        setProfile(p);
        setAllPosts(posts);
        setMediaPosts(posts.filter(x => (x.type === 'photo' || x.type === 'video') && (x.image_uri || x.media_uri)));
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const pickImage = async (isCover: boolean) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images' as any,
            allowsEditing: true,
            aspect: isCover ? [3, 1] : [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const uri = await saveImageLocally(result.assets[0].uri);
            const updated = isCover ? { ...profile, cover_uri: uri } : { ...profile, avatar_uri: uri };
            setProfile(updated);
            await saveProfile(updated);
        }
    };

    const renderPostItem = (post: Post) => (
        <TouchableOpacity
            key={`post - ${post.id} `}
            style={[styles.postItem, { borderBottomColor: Colors.borderLight }]}
            onPress={() => (navigation as any).navigate('PostDetail', { post })}
        >
            <View style={styles.postAvatarPlaceholder}>
                <Text style={{ color: Colors.white, fontWeight: FontWeight.bold }}>
                    {profile.name.charAt(0)}
                </Text>
            </View>
            <View style={styles.postContent}>
                <View style={styles.postHeaderRow}>
                    <Text style={[styles.postAuthor, { color: Colors.textPrimary }]}>{profile.name}</Text>
                    <Text style={[styles.postDate, { color: Colors.textSecondary }]}>
                        · {dayjs(post.created_at).format('MMM D, YYYY')}
                    </Text>
                </View>
                {post.title ? <Text style={[styles.postTitle, { color: Colors.textPrimary }]}>{post.title}</Text> : null}
                {post.body ? <Text style={[styles.postBodyText, { color: Colors.textPrimary }]} numberOfLines={3}>{post.body}</Text> : null}
                {(post.image_uri || post.media_uri) && (
                    <View style={styles.postMediaPreview}>
                        <Image source={{ uri: post.image_uri || post.media_uri }} style={styles.postImage} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors.bg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Cover Photo */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => pickImage(true)} style={[styles.coverContainer, { backgroundColor: Colors.border }]}>
                    {profile.cover_uri ? (
                        <Image source={{ uri: profile.cover_uri }} style={styles.coverImage} />
                    ) : (
                        <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                    )}
                </TouchableOpacity>

                {/* Profile Header section */}
                <View style={styles.headerInfoContainer}>
                    <View style={styles.avatarRow}>
                        <TouchableOpacity onPress={() => pickImage(false)} style={[styles.avatarWrapper, { borderColor: Colors.bg }]}>
                            {profile.avatar_uri ? (
                                <Image source={{ uri: profile.avatar_uri }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.accentDim }]}>
                                    <Text style={[styles.avatarLetter, { color: Colors.accent }]}>
                                        {(profile.name || 'M')[0].toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.borderLight }]} onPress={() => (navigation as any).navigate('Settings')}>
                                <Ionicons name="settings-outline" size={18} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.borderLight }]} onPress={() => (navigation as any).navigate('EditProfile')}>
                                <Text style={[styles.actionBtnText, { color: Colors.textPrimary }]}>Edit profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={[styles.nameText, { color: Colors.textPrimary }]}>{profile.name}</Text>
                    <Text style={[styles.bioText, { color: Colors.textPrimary }]}>{profile.bio}</Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{allPosts.length}</Text>
                        <Text style={[styles.statLabel, { color: Colors.textSecondary }]}> Memories</Text>
                    </View>
                </View>

                {/* Custom Tab Bar */}
                <View style={[styles.tabBar, { borderBottomColor: Colors.borderLight }]}>
                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('posts')}>
                        <Text style={[styles.tabText, { color: activeTab === 'posts' ? Colors.textPrimary : Colors.textSecondary }]}>Posts</Text>
                        {activeTab === 'posts' && <View style={[styles.activeTabIndicator, { backgroundColor: Colors.accent }]} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('media')}>
                        <Text style={[styles.tabText, { color: activeTab === 'media' ? Colors.textPrimary : Colors.textSecondary }]}>Media</Text>
                        {activeTab === 'media' && <View style={[styles.activeTabIndicator, { backgroundColor: Colors.accent }]} />}
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'posts' && (
                        allPosts.map(renderPostItem)
                    )}

                    {activeTab === 'media' && (
                        <View style={styles.mediaGrid}>
                            {mediaPosts.map(post => (
                                <TouchableOpacity
                                    key={post.id}
                                    onPress={() => (navigation as any).navigate('PostDetail', { post })}
                                >
                                    <Image source={{ uri: post.image_uri || post.media_uri }} style={styles.gridCell} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    coverContainer: {
        width: '100%',
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerInfoContainer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    avatarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: -35,
        marginBottom: Spacing.sm,
    },
    avatarWrapper: {
        borderRadius: 40,
        borderWidth: 4,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
    },
    avatarPlaceholder: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: 32,
        fontWeight: FontWeight.bold,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: 45,
    },
    actionBtn: {
        borderWidth: 1,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        justifyContent: 'center',
    },
    actionBtnText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    nameText: {
        fontSize: 22,
        fontWeight: FontWeight.heavy,
        marginBottom: 6,
    },
    bioText: {
        fontSize: FontSize.md,
        marginBottom: Spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    statValue: {
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
    statLabel: {
        fontSize: FontSize.md,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        position: 'relative',
    },
    tabText: {
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: 0,
        width: 50,
        height: 4,
        borderRadius: 2,
    },
    tabContent: {
        minHeight: 300,
    },
    postItem: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    postAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#555',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    postContent: {
        flex: 1,
    },
    postHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    postAuthor: {
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
    postDate: {
        fontSize: FontSize.sm,
        marginLeft: 4,
    },
    postTitle: {
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
        marginBottom: 4,
    },
    postBodyText: {
        fontSize: FontSize.md,
        lineHeight: 20,
        marginBottom: Spacing.sm,
    },
    postMediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: Radius.md,
        overflow: 'hidden',
        marginTop: Spacing.xs,
    },
    postImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridCell: {
        width: GRID_CELL,
        height: GRID_CELL,
        marginRight: 1,
        marginBottom: 1,
        backgroundColor: '#333',
    },
});
