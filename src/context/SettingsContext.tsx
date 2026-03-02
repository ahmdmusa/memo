import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { getThemeColors, AppColors } from '../theme/colors';

export type ThemeMode = 'system' | 'light' | 'dark' | 'deep_black';

interface SettingsState {
    themeMode: ThemeMode;
    accentColor: string;
    language: string;
    lockTimeout: number; // in minutes
}

interface SettingsContextType extends SettingsState {
    colors: AppColors;
    setThemeMode: (mode: ThemeMode) => void;
    setAccentColor: (color: string) => void;
    setLanguage: (lang: string) => void;
    setLockTimeout: (timeout: number) => void;
}

const defaultSettings: SettingsState = {
    themeMode: 'deep_black',
    accentColor: '#1DA1F2', // X Blue default
    language: 'en',
    lockTimeout: 5, // 5 min default
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = '@memo_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() || 'light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                if (stored) {
                    setSettings({ ...defaultSettings, ...JSON.parse(stored) });
                }
            } catch (e) {
                console.error('Failed to load settings', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadSettings();

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemColorScheme(colorScheme);
        });
        return () => subscription.remove();
    }, []);

    const updateSetting = async <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    const isDark =
        settings.themeMode === 'deep_black' ||
        settings.themeMode === 'dark' ||
        (settings.themeMode === 'system' && systemColorScheme === 'dark');

    const colors = getThemeColors(isDark, settings.themeMode === 'deep_black', settings.accentColor);

    if (!isLoaded) return null;

    return (
        <SettingsContext.Provider
            value={{
                ...settings,
                colors,
                setThemeMode: (mode) => updateSetting('themeMode', mode),
                setAccentColor: (color) => updateSetting('accentColor', color),
                setLanguage: (lang) => updateSetting('language', lang),
                setLockTimeout: (timeout) => updateSetting('lockTimeout', timeout),
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
