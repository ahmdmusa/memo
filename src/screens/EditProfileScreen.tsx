import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/index';
import { Spacing, Radius, Typography } from '../theme';
import { getProfile, saveProfile, saveImageLocally } from '../db/database';
import { useSettings } from '../context/SettingsContext';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'EditProfile'> };

export default function EditProfileScreen({ navigation }: Props) {
    const { colors: Colors } = useSettings();

    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getProfile().then((p) => {
            setName(p.name);
            setBio(p.bio);
            setAvatarUri(p.avatar_uri);
        });
    }, []);

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images' as any,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1]
        });
        if (!result.canceled && result.assets[0]) {
            const uri = await saveImageLocally(result.assets[0].uri);
            setAvatarUri(uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Name required', 'Please enter your name.');
            return;
        }
        setSaving(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await saveProfile({ name: name.trim(), bio: bio.trim(), avatar_uri: avatarUri });
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: Colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { borderBottomColor: Colors.border, paddingTop: insets.top + Spacing.sm }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveBtn, { backgroundColor: Colors.accent, opacity: saving ? 0.6 : 1 }]}
                >
                    <Text style={[styles.saveBtnText, { color: Colors.white }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: Colors.accent }]} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.accentDim, borderColor: Colors.accent }]}>
                            <Text style={[styles.avatarLetter, { color: Colors.accentLight }]}>{(name || 'M')[0].toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={[styles.changeAvatarText, { color: Colors.accentLight }]}>Change photo</Text>
                </TouchableOpacity>

                <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { color: Colors.textMuted }]}>Name</Text>
                    <TextInput
                        style={[styles.fieldInput, { color: Colors.textPrimary, backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor={Colors.textMuted}
                        maxLength={40}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { color: Colors.textMuted }]}>Bio</Text>
                    <TextInput
                        style={[styles.fieldInput, styles.bioInput, { color: Colors.textPrimary, backgroundColor: Colors.bgCard, borderColor: Colors.border }]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="A little about yourself..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        maxLength={160}
                    />
                    <Text style={[styles.charCount, { color: Colors.textMuted }]}>{bio.length}/160</Text>
                </View>
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
        paddingHorizontal: Spacing.sm,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1
    },
    navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700' },
    saveBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full
    },
    saveBtnText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700' },
    scroll: { padding: Spacing.md },
    avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3 },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarLetter: { fontSize: 36, fontWeight: '800' },
    changeAvatarText: {
        marginTop: Spacing.sm,
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '500'
    },
    field: { marginBottom: Spacing.lg },
    fieldLabel: {
        fontSize: Typography.labelSmall.fontSize,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm
    },
    fieldInput: {
        fontSize: Typography.bodyMedium.fontSize,
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.md
    },
    bioInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.md },
    charCount: { fontSize: Typography.labelSmall.fontSize, marginTop: 4, alignSelf: 'flex-end' }
});
