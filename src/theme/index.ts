import { AppColors } from './colors';
export * from './colors';

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const Typography = {
    displayLarge: { fontSize: 57, lineHeight: 64, letterSpacing: 0 },
    displayMedium: { fontSize: 45, lineHeight: 52, letterSpacing: 0 },
    displaySmall: { fontSize: 36, lineHeight: 44, letterSpacing: 0 },
    headlineLarge: { fontSize: 32, lineHeight: 40, letterSpacing: 0 },
    headlineMedium: { fontSize: 28, lineHeight: 36, letterSpacing: 0 },
    headlineSmall: { fontSize: 24, lineHeight: 32, letterSpacing: 0 },
    titleLarge: { fontSize: 22, lineHeight: 28, letterSpacing: 0, fontWeight: '400' as const },
    titleMedium: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontWeight: '500' as const },
    titleSmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: '500' as const },
    bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontWeight: '400' as const },
    bodyMedium: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25, fontWeight: '400' as const },
    bodySmall: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontWeight: '400' as const },
    labelLarge: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: '500' as const },
    labelMedium: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5, fontWeight: '500' as const },
    labelSmall: { fontSize: 11, lineHeight: 16, letterSpacing: 0.5, fontWeight: '500' as const },
};

export function getPostColor(Colors: AppColors, type: string) {
    switch (type) {
        case 'photo': return Colors.photoColor;
        case 'thought': return Colors.thoughtColor;
        case 'article': return Colors.articleColor;
        case 'voice': return Colors.voiceColor;
        case 'video': return Colors.videoColor;
        default: return Colors.accent;
    }
}

export function getPostDim(Colors: AppColors, type: string) {
    switch (type) {
        case 'photo': return Colors.photoDim;
        case 'thought': return Colors.thoughtDim;
        case 'article': return Colors.articleDim;
        case 'voice': return Colors.voiceDim;
        case 'video': return Colors.videoDim;
        default: return Colors.accentDim;
    }
}
