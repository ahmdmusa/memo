import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, Image,
    Alert, Dimensions
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { RootStackParamList, PostType, Mood } from '../types';
import { Spacing, Radius, FontSize, FontWeight, getPostColor, getPostDim } from '../theme';
import { createPost, saveImageLocally } from '../db/database';
import VoiceRecorder from '../components/VoiceRecorder';
import { useSettings } from '../context/SettingsContext';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'CreatePost'>;
    route: RouteProp<RootStackParamList, 'CreatePost'>;
};

const SCREEN_W = Dimensions.get('window').width;
const MOODS: Mood[] = ['😊', '😔', '😤', '🥱', '🤔', '❤️', '🔥', '✨', '😂', '😌'];

const POST_TYPES: { type: PostType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { type: 'thought', icon: 'chatbubble-ellipses', label: 'Thought' },
    { type: 'article', icon: 'document-text', label: 'Article' },
    { type: 'photo', icon: 'image', label: 'Photo' },
    { type: 'video', icon: 'videocam', label: 'Video' },
    { type: 'voice', icon: 'mic', label: 'Voice' },
];

export default function CreatePostScreen({ navigation, route }: Props) {
    const { colors: Colors } = useSettings();
    const insets = useSafeAreaInsets();

    // Explicitly typed initialType to avoid matching 'CreatePost' parameter error
    const initialType: PostType = route.params?.type ?? 'thought';
    const [selectedType, setSelectedType] = useState<PostType>(initialType);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [voiceDurationMs, setVoiceDurationMs] = useState(0);
    const [mood, setMood] = useState<Mood | null>(null);
    const [saving, setSaving] = useState(false);

    const color = getPostColor(Colors, selectedType);
    const dim = getPostDim(Colors, selectedType);

    const handleMediaSelection = async (useCamera: boolean) => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: selectedType === 'video' ? 'videos' : 'images',
            quality: 0.85,
            allowsEditing: false, // disable cropping for WhatsApp style
        };

        if (useCamera) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Allow access to your camera to take media.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync(options);
            if (!result.canceled && result.assets[0]) {
                setMediaUri(result.assets[0].uri);
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Allow access to your library to select media.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync(options);
            if (!result.canceled && result.assets[0]) {
                setMediaUri(result.assets[0].uri);
            }
        }
    };

    const handleSave = async () => {
        if (selectedType === 'thought' && !body.trim()) {
            Alert.alert('Empty thought', 'Write something before saving.');
            return;
        }
        if (selectedType === 'article' && !title.trim() && !body.trim()) {
            Alert.alert('Empty article', 'Add a title or content before saving.');
            return;
        }
        if ((selectedType === 'photo' || selectedType === 'video') && !mediaUri && !body.trim()) {
            Alert.alert('Empty media', 'Select a file or write something first.');
            return;
        }
        if (selectedType === 'voice' && !mediaUri) {
            Alert.alert('No recording', 'Record a voice note first.');
            return;
        }
        setSaving(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            let savedUri: string | undefined;
            if (mediaUri) {
                // Ensure media goes into proper vault context
                savedUri = await saveImageLocally(mediaUri);
            }

            const postMediaType = selectedType === 'video' || selectedType === 'voice';

            await createPost({
                type: selectedType,
                title: title.trim() || undefined,
                body: body.trim() || undefined,
                image_uri: !postMediaType ? savedUri : undefined,
                media_uri: postMediaType ? savedUri : undefined,
                duration: selectedType === 'voice' && mediaUri ? Math.round(voiceDurationMs / 1000) : undefined,
                mood: mood ?? undefined
            });
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'Could not save your post. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const canSave = () => {
        if (saving) return false;
        if (selectedType === 'photo' || selectedType === 'video') return mediaUri !== null || body.trim().length > 0;
        if (selectedType === 'thought') return body.trim().length > 0;
        if (selectedType === 'voice') return mediaUri !== null;
        return title.trim().length > 0 || body.trim().length > 0;
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: Colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Text style={[styles.cancelText, { color: Colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>New Memory</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!canSave()}
                    style={[styles.saveBtn, { backgroundColor: canSave() ? color : Colors.bgHighlight }]}
                >
                    <Text style={[styles.saveText, { color: canSave() ? Colors.white : Colors.textMuted }]}>
                        Save
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scroll}
            >
                {/* Type Selector */}
                <View style={[styles.typeRow, { backgroundColor: Colors.bgCard, borderColor: Colors.borderLight }]}>
                    {POST_TYPES.map((pt) => {
                        const active = selectedType === pt.type;
                        const ptColor = getPostColor(Colors, pt.type);
                        const ptDim = getPostDim(Colors, pt.type);
                        return (
                            <TouchableOpacity
                                key={pt.type}
                                style={[
                                    styles.typeBtn,
                                    { borderColor: active ? ptColor : Colors.border },
                                    active && { backgroundColor: ptDim },
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedType(pt.type);
                                    setMediaUri(null);
                                    setVoiceDurationMs(0);
                                }}
                            >
                                <Ionicons
                                    name={pt.icon as any}
                                    size={18}
                                    color={active ? ptColor : Colors.textMuted}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Mood Selector line */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll} contentContainerStyle={styles.moodContent}>
                    <TouchableOpacity
                        onPress={() => setMood(null)}
                        style={[styles.moodWrap, !mood && { borderColor: Colors.border, backgroundColor: Colors.bgHighlight }]}
                    >
                        <Ionicons name="close" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    {MOODS.map(m => (
                        <TouchableOpacity
                            key={m}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setMood(m === mood ? null : m);
                            }}
                            style={[styles.moodWrap, mood === m && { borderColor: Colors.accentLight, backgroundColor: Colors.accentDim }]}
                        >
                            <Text style={styles.moodEmoji}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Content Input Area */}
                <View style={styles.contentArea}>
                    {(selectedType === 'article' || selectedType === 'thought' || selectedType === 'photo' || selectedType === 'video') && (
                        <>
                            {selectedType === 'article' && (
                                <TextInput
                                    style={[styles.titleInput, { color: Colors.textPrimary, borderBottomColor: Colors.border }]}
                                    placeholder="Title (optional)"
                                    placeholderTextColor={Colors.textMuted}
                                    value={title}
                                    onChangeText={setTitle}
                                    autoFocus={true}
                                />
                            )}
                            <TextInput
                                style={[
                                    styles.bodyInput,
                                    { color: Colors.textPrimary },
                                    selectedType === 'thought' && { fontSize: FontSize.lg, fontStyle: 'italic' }
                                ]}
                                placeholder={
                                    selectedType === 'thought' ? "What's on your mind? (Markdown supported)" :
                                        selectedType === 'article' ? "Write your article here..." :
                                            "Add a caption..."
                                }
                                placeholderTextColor={Colors.textMuted}
                                value={body}
                                onChangeText={setBody}
                                multiline
                                textAlignVertical="top"
                                autoFocus={selectedType !== 'article'}
                            />
                        </>
                    )}

                    {(selectedType === 'photo' || selectedType === 'video') && (
                        <View style={styles.mediaContainer}>
                            {mediaUri ? (
                                <View style={styles.mediaPreviewWrapper}>
                                    <Image source={{ uri: mediaUri }} style={[styles.mediaPreview, { backgroundColor: Colors.bgHighlight }]} />
                                    <View style={styles.mediaIconOverlay}>
                                        <Ionicons name={selectedType === 'video' ? 'play-circle' : 'image'} size={32} color={Colors.white} />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeMediaBtn}
                                        onPress={() => setMediaUri(null)}
                                    >
                                        <Ionicons name="close" size={16} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.mediaActionsRow}>
                                    <TouchableOpacity
                                        style={[styles.addMediaBtn, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
                                        onPress={() => handleMediaSelection(true)}
                                    >
                                        <Ionicons name="camera" size={32} color={color} />
                                        <Text style={[styles.addMediaText, { color: Colors.textSecondary }]}>Capture</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.addMediaBtn, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
                                        onPress={() => handleMediaSelection(false)}
                                    >
                                        <Ionicons name="images" size={32} color={color} />
                                        <Text style={[styles.addMediaText, { color: Colors.textSecondary }]}>Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {selectedType === 'voice' && (
                        <View style={styles.voiceContainer}>
                            <VoiceRecorder
                                onRecordingComplete={(uri, durationMs) => {
                                    setMediaUri(uri);
                                    setVoiceDurationMs(durationMs);
                                }}
                                onCancel={() => {
                                    setMediaUri(null);
                                    setVoiceDurationMs(0);
                                }}
                            />
                        </View>
                    )}
                </View>

                {/* Markdown Hint */}
                {['thought', 'article'].includes(selectedType) && (
                    <Text style={[styles.markdownHint, { color: Colors.textMuted }]}>
                        Markdown supported: **bold**, *italic*, - list, # headers
                    </Text>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerBtn: {
        padding: Spacing.xs,
    },
    cancelText: {
        fontSize: FontSize.md,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    saveBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radius.full,
    },
    saveText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    scroll: {
        flexGrow: 1,
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        padding: Spacing.xs,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    typeBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 2,
        borderWidth: 1,
    },
    moodScroll: {
        marginTop: Spacing.md,
    },
    moodContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    moodWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moodEmoji: {
        fontSize: 20,
    },
    contentArea: {
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.md,
    },
    titleInput: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        paddingVertical: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginBottom: Spacing.sm,
    },
    bodyInput: {
        fontSize: FontSize.md,
        minHeight: 120,
        paddingTop: Spacing.sm,
        lineHeight: 24,
    },
    mediaContainer: {
        marginTop: Spacing.lg,
    },
    mediaActionsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    addMediaBtn: {
        flex: 1,
        height: 100,
        borderRadius: Radius.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMediaText: {
        marginTop: 6,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    mediaPreviewWrapper: {
        width: '100%',
        height: 220,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        position: 'relative',
    },
    mediaPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    mediaIconOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -16,
        marginTop: -16,
        opacity: 0.8,
    },
    removeMediaBtn: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceContainer: {
        marginTop: Spacing.lg,
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    markdownHint: {
        fontSize: FontSize.xs,
        textAlign: 'center',
        marginTop: Spacing.xl,
    }
});
