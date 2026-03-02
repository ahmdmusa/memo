export interface AppColors {
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
    // 3 digits
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    }
    // 6 digits
    else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
};

export function getThemeColors(isDark: boolean, isDeepBlack: boolean, accentColor: string): AppColors {
    const isLight = !isDark;

    const baseBg = isDeepBlack ? '#000000' : isDark ? '#0A0A12' : '#F7F9FA';
    const bgCard = isDeepBlack ? '#000000' : isDark ? '#12121E' : '#FFFFFF';
    const bgElevated = isDeepBlack ? '#16181C' : isDark ? '#1A1A2E' : '#FFFFFF';
    const bgHighlight = isDeepBlack ? '#1C1F23' : isDark ? '#22223A' : '#EFF3F4';

    const border = isDeepBlack ? '#2F3336' : isDark ? '#2A2A45' : '#EFF3F4';
    const borderLight = isDeepBlack ? '#38444D' : isDark ? '#3A3A5C' : '#E1E8ED';

    const textPrimary = isDark ? '#E7E9EA' : '#0F1419';
    const textSecondary = isDark ? '#71767B' : '#536471';
    const textMuted = isDark ? '#5A5A80' : '#8B98A5';

    return {
        bg: baseBg,
        bgCard,
        bgElevated,
        bgHighlight,
        border,
        borderLight,
        textPrimary,
        textSecondary,
        textMuted,

        accent: accentColor,
        accentLight: hexToRgba(accentColor, 0.8),
        accentDim: hexToRgba(accentColor, 0.15),
        accentGlow: hexToRgba(accentColor, 0.08),

        photoColor: '#EC4899',
        photoDim: 'rgba(236,72,153,0.15)',
        thoughtColor: '#06B6D4',
        thoughtDim: 'rgba(6,182,212,0.15)',
        articleColor: '#10B981',
        articleDim: 'rgba(16,185,129,0.15)',
        voiceColor: '#F59E0B',
        voiceDim: 'rgba(245,158,11,0.15)',
        videoColor: '#8B5CF6',
        videoDim: 'rgba(139,92,246,0.15)',

        danger: '#F4212E',
        warning: '#FFAD1F',
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',

        overlay: 'rgba(0,0,0,0.7)',
        overlayLight: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
    };
}
