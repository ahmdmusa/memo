import { MD3Colors } from 'react-native-paper/lib/typescript/types';

export interface AppColors extends MD3Colors {
    bg: string;
    bgCard: string;
    bgElevated: string;
    bgHighlight: string;
    border: string;
    borderLight: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentLight: string;
    accentDim: string;
    accentGlow: string;
    photoColor: string;
    photoDim: string;
    thoughtColor: string;
    thoughtDim: string;
    articleColor: string;
    articleDim: string;
    voiceColor: string;
    voiceDim: string;
    videoColor: string;
    videoDim: string;
    danger: string;
    warning: string;
    white: string;
    black: string;
    transparent: string;
    overlay: string;
    overlayLight: string;
}

const hexToRgba = (hex: string, alpha: number) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
};

export function getThemeColors(isDark: boolean, isDeepBlack: boolean, m3Colors: MD3Colors): AppColors {
    const baseBg = isDeepBlack ? '#000000' : m3Colors.background;
    const bgCard = isDeepBlack ? '#000000' : m3Colors.surface;
    const bgElevated = isDeepBlack ? '#121212' : m3Colors.surfaceVariant;
    const bgHighlight = isDeepBlack ? '#1A1A1A' : m3Colors.secondaryContainer;

    const border = m3Colors.outlineVariant;
    const borderLight = m3Colors.outline;

    const textPrimary = m3Colors.onBackground;
    const textSecondary = m3Colors.onSurfaceVariant;
    const textMuted = m3Colors.outline;

    return {
        ...m3Colors,
        bg: baseBg,
        bgCard,
        bgElevated,
        bgHighlight,
        border,
        borderLight,
        textPrimary,
        textSecondary,
        textMuted,

        accent: m3Colors.primary,
        accentLight: hexToRgba(m3Colors.primary, 0.8),
        accentDim: m3Colors.primaryContainer,
        accentGlow: hexToRgba(m3Colors.primary, 0.08),

        photoColor: m3Colors.tertiary,
        photoDim: m3Colors.tertiaryContainer,
        thoughtColor: m3Colors.secondary,
        thoughtDim: m3Colors.secondaryContainer,
        articleColor: m3Colors.primary,
        articleDim: m3Colors.primaryContainer,
        voiceColor: m3Colors.error,
        voiceDim: m3Colors.errorContainer,
        videoColor: m3Colors.tertiary,
        videoDim: m3Colors.tertiaryContainer,

        danger: m3Colors.error,
        warning: m3Colors.error,
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',

        overlay: 'rgba(0,0,0,0.7)',
        overlayLight: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
    };
}
