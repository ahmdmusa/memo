import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import {  Spacing, Radius, FontSize, FontWeight } from '../theme';
import { useSettings } from '../context/SettingsContext';

interface BiometricLockProps {
    onUnlocked: () => void;
}

export default function BiometricLock({ onUnlocked }: BiometricLockProps) {
    const { colors: Colors } = useSettings();

    const [error, setError] = useState('');
    const [supported, setSupported] = useState(true);
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        checkAndAuthenticate();
    }, []);

    const pulse = () => {
        Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    const checkAndAuthenticate = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!compatible || !enrolled) {
            setSupported(false);
            // If no biometric hardware, skip lock
            onUnlocked();
            return;
        }
        authenticate();
    };

    const authenticate = async () => {
        setError('');
        pulse();
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Private Garden',
                fallbackLabel: 'Use Passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false });
            if (result.success) {
                onUnlocked();
            } else {
                setError('Authentication failed. Try again.');
            }
        } catch (e) {
            setError('Biometric authentication unavailable.');
            onUnlocked(); // fallback: let them in
        }
    };

    if (!supported) return null;

    return (
        <View style={styles.container}>
            {/* Background glow */}
            <View style={styles.glow} />

            <View style={styles.content}>
                <View style={styles.iconWrapper}>
                    <Animated.View style={[styles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="lock-closed" size={36} color={.accentLight} />
                    </Animated.View>
                </View>

                <Text style={styles.title}>Private Garden</Text>
                <Text style={styles.subtitle}>Your private space · Unlock to enter</Text>

                {error ? (
                    <View style={styles.errorBadge}>
                        <Ionicons name="warning-outline" size={14} color={.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <TouchableOpacity style={styles.unlockBtn} onPress={authenticate} activeOpacity={0.85}>
                    <Ionicons name="finger-print-outline" size={22} color={.white} />
                    <Text style={styles.unlockText}>Tap to Unlock</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: .bg,
        alignItems: 'center',
        justifyContent: 'center' },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: .accent,
        opacity: 0.04,
        top: '30%',
        alignSelf: 'center' },
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl },
    iconWrapper: {
        marginBottom: Spacing.xl },
    iconRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: .accentDim,
        borderWidth: 2,
        borderColor: .accent + '60',
        alignItems: 'center',
        justifyContent: 'center' },
    title: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.heavy,
        color: .textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center' },
    subtitle: {
        fontSize: FontSize.sm,
        color: .textMuted,
        textAlign: 'center',
        marginBottom: Spacing.xl },
    errorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderColor: .danger + '40',
        borderWidth: 1,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        marginBottom: Spacing.md },
    errorText: {
        fontSize: FontSize.sm,
        color: .danger },
    unlockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: .accent,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        shadowColor: .accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10 },
    unlockText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: .white } });
