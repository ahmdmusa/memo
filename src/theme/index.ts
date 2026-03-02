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

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 34,
};

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
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
