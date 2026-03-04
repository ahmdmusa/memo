import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Animated,
    Alert
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight } from '../theme';
import { useSettings } from '../context/SettingsContext';

interface VoiceRecorderProps {
    onRecordingComplete: (uri: string, durationMs: number) => void;
    onCancel: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
    const { colors: Colors } = useSettings();

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

    const startPulse = () => {
        pulseRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        pulseRef.current.start();
    };

    const stopPulse = () => {
        pulseRef.current?.stop();
        pulseAnim.setValue(1);
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Allow microphone access to record voice notes.');
                return;
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                playThroughEarpieceAndroid: false,
            });

            const customOptions = {
                isMeteringEnabled: true,
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 44100,
                    numberOfChannels: 2,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.m4a',
                    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                    audioQuality: Audio.IOSAudioQuality.MAX,
                    sampleRate: 44100,
                    numberOfChannels: 2,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/webm',
                    bitsPerSecond: 128000,
                },
            };

            const { recording: rec } = await Audio.Recording.createAsync(customOptions);
            setRecording(rec);
            setIsRecording(true);
            setDuration(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startPulse();

            // Timer
            timerRef.current = setInterval(() => {
                setDuration((d) => d + 1);
            }, 1000);

            Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }).start();
        } catch (e) {
            Alert.alert('Error', 'Could not start recording.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        clearInterval(timerRef.current!);
        stopPulse();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        const status = await recording.getStatusAsync();
        const uri = recording.getURI();

        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
        setIsRecording(false);
        setRecording(null);

        if (uri && status.durationMillis) {
            // Copy to permanent location
            const dir = `${FileSystem.documentDirectory ?? ''}memo_audio/`;
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            const filename = `voice_${Date.now()}.m4a`;
            const dest = `${dir}${filename}`;
            await FileSystem.copyAsync({ from: uri, to: dest });
            onRecordingComplete(dest, status.durationMillis);
        } else {
            onCancel();
        }
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.hint, { color: Colors.textMuted }]}>
                {isRecording ? 'Recording...' : 'Hold button to record'}
            </Text>

            {isRecording && (
                <View style={styles.timerRow}>
                    <View style={[styles.recordingDot, { backgroundColor: Colors.danger }]} />
                    <Text style={[styles.timer, { color: Colors.danger }]}>{formatDuration(duration)}</Text>
                </View>
            )}

            {/* Pulse rings */}
            {isRecording && (
                <>
                    <Animated.View style={[styles.pulseRing, styles.pulseRing1, { borderColor: Colors.danger, transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={[styles.pulseRing, styles.pulseRing2, { borderColor: Colors.danger, transform: [{ scale: pulseAnim }], opacity: 0.4 }]} />
                </>
            )}

            {/* Main record button */}
            <Pressable
                onPressIn={startRecording}
                onPressOut={isRecording ? stopRecording : undefined}
                disabled={!isRecording && recording !== null}
            >
                <Animated.View style={[styles.recordBtn, { backgroundColor: Colors.danger, shadowColor: Colors.danger, transform: [{ scale: scaleAnim }] }, isRecording && styles.recordBtnActive]}>
                    <Ionicons
                        name={isRecording ? 'stop' : 'mic'}
                        size={36}
                        color={Colors.white}
                    />
                </Animated.View>
            </Pressable>

            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={[styles.cancelText, { color: Colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        gap: Spacing.lg
    },
    hint: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    timer: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.heavy,
        fontVariant: ['tabular-nums']
    },
    pulseRing: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 2
    },
    pulseRing1: { width: 110, height: 110, opacity: 0.3 },
    pulseRing2: { width: 140, height: 140 },
    recordBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10
    },
    recordBtnActive: {
        backgroundColor: '#B91C1C'
    },
    cancelBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm
    },
    cancelText: {
        fontSize: FontSize.sm
    }
});
