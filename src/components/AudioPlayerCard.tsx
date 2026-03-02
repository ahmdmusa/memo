import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import {  Spacing, Radius, FontSize, FontWeight, getPostColor, getPostDim } from '../theme';
import { useSettings } from '../context/SettingsContext';

interface AudioPlayerCardProps {
    uri: string;
    duration?: number; // milliseconds
    compact?: boolean;
}

export default function AudioPlayerCard({ uri, duration, compact = false }: AudioPlayerCardProps) {
    const { colors: Colors } = useSettings();

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration ?? 0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const waveAnims = Array.from({ length: 20 }, () => useRef(new Animated.Value(0.3)).current);

    useEffect(() => {
        return () => {
            sound?.unloadAsync();
        };
    }, [sound]);

    const animateWaves = (playing: boolean) => {
        if (!playing) {
            waveAnims.forEach((a) => {
                Animated.spring(a, { toValue: 0.3, useNativeDriver: true }).start();
            });
            return;
        }
        waveAnims.forEach((a, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(a, {
                        toValue: 0.3 + Math.random() * 0.7,
                        duration: 150 + Math.random() * 250,
                        useNativeDriver: true }),
                    Animated.timing(a, {
                        toValue: 0.3,
                        duration: 150 + Math.random() * 250,
                        useNativeDriver: true }),
                ])
            ).start();
        });
    };

    const togglePlay = async () => {
        if (sound && isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            animateWaves(false);
            return;
        }

        if (sound) {
            await sound.playAsync();
            setIsPlaying(true);
            animateWaves(true);
            return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            (status) => {
                if (status.isLoaded) {
                    const pos = status.positionMillis;
                    const dur = status.durationMillis ?? duration ?? 0;
                    setPosition(pos);
                    setTotalDuration(dur);
                    if (dur > 0) {
                        Animated.timing(progressAnim, {
                            toValue: pos / dur,
                            duration: 100,
                            useNativeDriver: false }).start();
                    }
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        animateWaves(false);
                        progressAnim.setValue(0);
                    }
                }
            }
        );
        setSound(newSound);
        setIsPlaying(true);
        animateWaves(true);
    };

    const formatMs = (ms: number) => {
        const secs = Math.floor(ms / 1000);
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const color = getPostColor(Colors, 'voice');
    const dim = getPostDim(Colors, 'voice');

    return (
        <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: dim, borderColor: color + '40' }]}>
            {/* Play button */}
            <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: color }]}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.right}>
                {/* Waveform */}
                <View style={styles.waveform}>
                    {waveAnims.map((anim, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.waveBar,
                                { backgroundColor: color, transform: [{ scaleY: anim }] },
                            ]}
                        />
                    ))}
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: color,
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'] }) },
                        ]}
                    />
                </View>

                {/* Duration */}
                <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color }]}>{formatMs(position)}</Text>
                    <Text style={[styles.timeMuted, { color: Colors.textMuted }]}>{formatMs(totalDuration)}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.sm },
    containerCompact: {
        marginHorizontal: 0,
        marginVertical: 0 },
    playBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 2 },
    right: { flex: 1, gap: 6 },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        gap: 2 },
    waveBar: {
        width: 3,
        height: 24,
        borderRadius: 2,
        opacity: 0.8 },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        overflow: 'hidden' },
    progressFill: {
        height: '100%',
        borderRadius: 2 },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between' },
    timeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold },
    timeMuted: {
        fontSize: FontSize.xs } });
