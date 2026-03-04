import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useSettings, ThemeMode } from '../context/SettingsContext';
import { Typography, Radius, Spacing } from '../theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { exportVault, importVault } from '../utils/vault';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
    navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const {
        colors: Colors,
        themeMode,
        setThemeMode,
        accentColor,
        setAccentColor,
        lockTimeout,
        setLockTimeout,
        language,
        setLanguage
    } = useSettings();

    const [password, setPassword] = useState('');
    const [isVaultLoading, setIsVaultLoading] = useState(false);
    const [vaultMode, setVaultMode] = useState<'idle' | 'export' | 'import'>('idle');

    const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
        { label: 'System', value: 'system' },
        { label: 'Light', value: 'light' },
        { label: 'Dim', value: 'dark' },
        { label: 'Deep Black (X Style)', value: 'deep_black' }
    ];

    const ACCENT_COLORS = [
        { label: 'X Blue', value: '#1DA1F2' },
        { label: 'White', value: '#FFFFFF' },
        { label: 'Purple', value: '#8B5CF6' },
        { label: 'Emerald', value: '#10B981' },
        { label: 'Rose', value: '#F43F5E' },
    ];

    const TIMEOUT_OPTIONS = [
        { label: 'Immediately', value: 0 },
        { label: '1 Minute', value: 1 },
        { label: '5 Minutes', value: 5 },
        { label: '15 Minutes', value: 15 },
    ];

    const handleAboutDeveloper = () => {
        Linking.openURL('https://t.me/ahmdmusa');
    };

    const executeVaultAction = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter a password.');
            return;
        }

        setIsVaultLoading(true);
        try {
            if (vaultMode === 'export') {
                const uri = await exportVault(password);
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: 'Save your Garden Vault' });
                } else {
                    Alert.alert('Error', 'Sharing not available on this device');
                }
            } else if (vaultMode === 'import') {
                const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
                if (!result.canceled && result.assets[0]) {
                    const success = await importVault(result.assets[0].uri, password);
                    if (success) {
                        Alert.alert('Success', 'Vault restored securely! Restarting app is recommended.', [
                            { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
                        ]);
                    }
                }
            }
        } catch (e: any) {
            Alert.alert('Vault Error', e.message);
        } finally {
            setIsVaultLoading(false);
            setVaultMode('idle');
            setPassword('');
        }
    };

    const renderSection = (title: string, children: React.ReactNode) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>{title}</Text>
            <View style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                {children}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors.bg, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                {/* Theme Mode */}
                {renderSection('Display Theme', (
                    <View>
                        {THEME_OPTIONS.map((option, idx) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.row, idx > 0 && { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}
                                onPress={() => setThemeMode(option.value)}
                            >
                                <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>{option.label}</Text>
                                {themeMode === option.value && <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Accent Color */}
                {renderSection('Accent Color', (
                    <View style={styles.colorRow}>
                        {ACCENT_COLORS.map(color => (
                            <TouchableOpacity
                                key={color.value}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color.value },
                                    accentColor === color.value && { borderWidth: 3, borderColor: Colors.textPrimary }
                                ]}
                                onPress={() => setAccentColor(color.value)}
                            />
                        ))}
                    </View>
                ))}

                {/* Security */}
                {renderSection('Smart Security', (
                    <View>
                        <Text style={[styles.helperText, { color: Colors.textSecondary }]}>
                            Grace period before asking for Biometrics again.
                        </Text>
                        {TIMEOUT_OPTIONS.map((option, idx) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.row, { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}
                                onPress={() => setLockTimeout(option.value)}
                            >
                                <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>{option.label}</Text>
                                {lockTimeout === option.value && <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Privacy Dashboard */}
                {renderSection('Privacy Dashboard', (
                    <View style={styles.privacyContainer}>
                        <View style={styles.privacyItem}>
                            <Ionicons name="cloud-offline-outline" size={24} color={Colors.accent} />
                            <View style={styles.privacyTextContent}>
                                <Text style={[styles.privacyItemTitle, { color: Colors.textPrimary }]}>100% Offline First</Text>
                                <Text style={[styles.privacyItemDesc, { color: Colors.textSecondary }]}>Your memory engine runs entirely on your device. No cloud sync, no tracking.</Text>
                            </View>
                        </View>
                        <View style={[styles.privacyItem, { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}>
                            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.accent} />
                            <View style={styles.privacyTextContent}>
                                <Text style={[styles.privacyItemTitle, { color: Colors.textPrimary }]}>Zero Telemetry</Text>
                                <Text style={[styles.privacyItemDesc, { color: Colors.textSecondary }]}>No product analytics, crashlytics, or background data collection. Period.</Text>
                            </View>
                        </View>
                        <View style={[styles.privacyItem, { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}>
                            <Ionicons name="hardware-chip-outline" size={24} color={Colors.accent} />
                            <View style={styles.privacyTextContent}>
                                <Text style={[styles.privacyItemTitle, { color: Colors.textPrimary }]}>Local Intelligence</Text>
                                <Text style={[styles.privacyItemDesc, { color: Colors.textSecondary }]}>Insights and pattern correlations are computed dynamically using edge processing.</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* The Vault */}
                {renderSection('The Vault (Data)', (
                    <View>
                        {vaultMode === 'idle' ? (
                            <>
                                <TouchableOpacity style={styles.row} onPress={() => setVaultMode('export')}>
                                    <Ionicons name="shield-checkmark" size={22} color={Colors.accent} style={styles.rowIcon} />
                                    <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>Export Encrypted `.garden` Backup</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: Colors.borderLight }]} onPress={() => setVaultMode('import')}>
                                    <Ionicons name="download" size={22} color={Colors.textSecondary} style={styles.rowIcon} />
                                    <Text style={[styles.rowLabel, { color: Colors.textSecondary }]}>Restore from `.garden`</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.vaultActionContainer}>
                                <Text style={[styles.vaultActionTitle, { color: Colors.textPrimary }]}>
                                    {vaultMode === 'export' ? 'Create a secure password' : 'Enter vault password'}
                                </Text>
                                <Text style={[styles.vaultActionDesc, { color: Colors.textSecondary }]}>
                                    {vaultMode === 'export'
                                        ? "Don't forget it, or your backup will be permanently lost."
                                        : "Select your .garden file after entering the password."}
                                </Text>
                                <TextInput
                                    style={[styles.vaultInput, { color: Colors.textPrimary, borderColor: Colors.border, backgroundColor: Colors.bgHighlight }]}
                                    placeholder="AES-256 Password"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <View style={styles.vaultBtnRow}>
                                    <TouchableOpacity style={[styles.vaultBtn, { backgroundColor: Colors.bgHighlight }]} onPress={() => { setVaultMode('idle'); setPassword(''); }}>
                                        <Text style={[styles.vaultBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.vaultBtn, { backgroundColor: Colors.accent }]} onPress={executeVaultAction} disabled={isVaultLoading}>
                                        {isVaultLoading ? (
                                            <ActivityIndicator color={Colors.white} size="small" />
                                        ) : (
                                            <Text style={[styles.vaultBtnText, { color: Colors.white }]}>
                                                {vaultMode === 'export' ? 'Encrypt & Save' : 'Decrypt & Restore'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                {/* About Developer */}
                {renderSection('About', (
                    <TouchableOpacity style={styles.row} onPress={handleAboutDeveloper}>
                        <View style={styles.aboutInfo}>
                            <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>Developer</Text>
                            <Text style={[styles.aboutValue, { color: Colors.accent }]}>Ahmed Musa</Text>
                        </View>
                        <Ionicons name="paper-plane" size={20} color={Colors.accent} />
                    </TouchableOpacity>
                ))}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: Typography.bodyLarge.fontSize,
        fontWeight: '600',
    },
    scrollContent: {
        padding: Spacing.md,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    card: {
        borderRadius: Radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    rowIcon: {
        marginRight: Spacing.sm,
    },
    rowLabel: {
        flex: 1,
        fontSize: Typography.bodyMedium.fontSize,
        fontWeight: '500',
    },
    helperText: {
        fontSize: Typography.labelSmall.fontSize,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.md,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    aboutInfo: {
        flex: 1,
    },
    aboutValue: {
        fontSize: Typography.bodySmall.fontSize,
        marginTop: 2,
    },
    bottomSpacer: {
        height: 40,
    },
    privacyContainer: {
        paddingVertical: 0,
    },
    privacyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    privacyTextContent: {
        flex: 1,
    },
    privacyItemTitle: {
        fontSize: Typography.bodyMedium.fontSize,
        fontWeight: '700',
        marginBottom: 2,
    },
    privacyItemDesc: {
        fontSize: Typography.labelSmall.fontSize,
        lineHeight: 18,
    },
    vaultActionContainer: {
        padding: Spacing.md,
    },
    vaultActionTitle: {
        fontSize: Typography.bodyMedium.fontSize,
        fontWeight: '700',
        marginBottom: 4,
    },
    vaultActionDesc: {
        fontSize: Typography.labelSmall.fontSize,
        marginBottom: Spacing.md,
    },
    vaultInput: {
        height: 44,
        borderRadius: Radius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        fontSize: Typography.bodyMedium.fontSize,
        marginBottom: Spacing.md,
    },
    vaultBtnRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    vaultBtn: {
        flex: 1,
        height: 40,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vaultBtnText: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '700',
    }
});
