import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '../context/SettingsContext';
import { Spacing, Radius, Typography } from '../theme';
import { getAllPosts } from '../db/database';
import { correlateMoods } from '../utils/PatternDetection';
import { Post } from '../types';

const SCREEN_W = Dimensions.get('window').width;

export default function InsightsScreen() {
    const { colors: Colors } = useSettings();
    const insets = useSafeAreaInsets();

    const [refreshing, setRefreshing] = useState(false);
    const [moodData, setMoodData] = useState<{ name: string, population: number, color: string, legendFontColor: string, legendFontSize: number }[]>([]);
    const [themeCorrelation, setThemeCorrelation] = useState<Record<string, { term: string; count: number }[]>>({});

    const loadData = useCallback(async () => {
        const posts = await getAllPosts();

        // 1. Calculate mood distribution
        const moodCounts: Record<string, number> = {};
        posts.forEach(p => {
            if (p.mood) {
                moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
            }
        });

        // Generate colors dynamically for the pie chart
        const colorPalette = [
            Colors.accent, Colors.accentLight, Colors.danger,
            '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'
        ];

        const mData = Object.entries(moodCounts).map(([mood, count], idx) => ({
            name: mood,
            population: count,
            color: colorPalette[idx % colorPalette.length],
            legendFontColor: Colors.textSecondary,
            legendFontSize: 14
        }));

        // Sort by population
        mData.sort((a, b) => b.population - a.population);
        setMoodData(mData);

        // 2. Correlate local NLP themes
        const textEntries = posts
            .filter(p => !!p.body)
            .map(p => ({ text: p.body!, mood: p.mood ?? '' }));

        const correlations = correlateMoods(textEntries);
        setThemeCorrelation(correlations);

    }, [Colors]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const chartConfig = {
        backgroundGradientFrom: Colors.bgCard,
        backgroundGradientTo: Colors.bgCard,
        color: (opacity = 1) => Colors.accent,
        labelColor: (opacity = 1) => Colors.textSecondary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.bg, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Insights</Text>
                <Text style={[styles.headerSubtitle, { color: Colors.textMuted }]}>Local Pattern Detection</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
            >
                {/* Visual Privacy Badge */}
                <View style={[styles.privacyBadge, { backgroundColor: Colors.bgHighlight }]}>
                    <Ionicons name="shield-checkmark" size={16} color={Colors.accentLight} />
                    <Text style={[styles.privacyText, { color: Colors.textSecondary }]}>
                        Processed 100% locally. Zero telemetry.
                    </Text>
                </View>

                {moodData.length > 0 ? (
                    <View style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                        <Text style={[styles.cardTitle, { color: Colors.textPrimary }]}>Mood Heatmap</Text>
                        <PieChart
                            data={moodData}
                            width={SCREEN_W - Spacing.md * 4}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            absolute
                        />
                    </View>
                ) : (
                    <View style={[styles.emptyCard, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                        <Text style={[styles.emptyText, { color: Colors.textMuted }]}>Not enough mood data.</Text>
                    </View>
                )}

                <View style={[styles.card, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                    <Text style={[styles.cardTitle, { color: Colors.textPrimary }]}>Themes by Mood</Text>
                    {Object.keys(themeCorrelation).length > 0 ? (
                        Object.entries(themeCorrelation).map(([mood, themes]) => {
                            if (!mood || themes.length === 0) return null;
                            return (
                                <View key={mood} style={styles.themeRow}>
                                    <View style={styles.themeMoodBox}>
                                        <Text style={styles.themeMoodIcon}>{mood}</Text>
                                    </View>
                                    <View style={styles.themeWords}>
                                        {themes.map(t => (
                                            <View key={t.term} style={[styles.themePill, { backgroundColor: Colors.bgHighlight }]}>
                                                <Text style={[styles.themePillText, { color: Colors.textSecondary }]}>{t.term}</Text>
                                                <Text style={[styles.themePillCount, { color: Colors.textMuted }]}>{t.count}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={[styles.emptyText, { color: Colors.textMuted, marginTop: Spacing.md }]}>Write more posts with moods to see correlations.</Text>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm
    },
    headerTitle: {
        fontSize: Typography.headlineMedium.fontSize,
        fontWeight: '800'
    },
    headerSubtitle: {
        fontSize: Typography.bodyMedium.fontSize,
        marginTop: 2
    },
    scroll: {
        paddingHorizontal: Spacing.md,
        paddingBottom: 100,
        gap: Spacing.md
    },
    privacyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        marginTop: Spacing.xs
    },
    privacyText: {
        fontSize: Typography.labelSmall.fontSize,
        fontWeight: '600'
    },
    card: {
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: Typography.titleLarge.fontSize,
        fontWeight: '700',
        marginBottom: Spacing.md
    },
    emptyCard: {
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyText: {
        fontSize: Typography.bodyMedium.fontSize
    },
    themeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
        gap: Spacing.md
    },
    themeMoodBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    themeMoodIcon: {
        fontSize: 24
    },
    themeWords: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm
    },
    themePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.full
    },
    themePillText: {
        fontSize: Typography.bodySmall.fontSize,
        fontWeight: '600'
    },
    themePillCount: {
        fontSize: Typography.labelSmall.fontSize,
        opacity: 0.7
    }
});
