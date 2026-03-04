import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SectionList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { RootStackParamList } from '../types/index';
import { Post } from '../types';
import { Spacing, Radius, Typography, getPostColor, getPostDim } from '../theme';
import { getAllPosts } from '../db/database';
import PostCard from '../components/PostCard';
import { useSettings } from '../context/SettingsContext';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'MainTabs'> };

interface SectionData {
    title: string;
    subtitle: string;
    data: Post[];
}

export default function MemoriesScreen({ navigation }: Props) {
    const { colors: Colors } = useSettings();

    const [sections, setSections] = useState<SectionData[]>([]);
    const [totalMemories, setTotalMemories] = useState(0);

    const loadMemories = useCallback(async () => {
        const all = await getAllPosts();
        const now = dayjs();
        const thisMonth = now.month();
        const thisDay = now.date();

        const result: SectionData[] = [];

        // Group by year offset
        const byYear: Record<number, Post[]> = {};
        for (const post of all) {
            const d = dayjs(post.created_at);
            const yearDiff = now.year() - d.year();
            if (yearDiff <= 0) continue; // skip this year
            if (d.month() === thisMonth && d.date() === thisDay) {
                if (!byYear[yearDiff]) byYear[yearDiff] = [];
                byYear[yearDiff].push(post);
            }
        }

        // "On this day" sections
        const yearKeys = Object.keys(byYear).sort((a, b) => Number(a) - Number(b));
        for (const yearStr of yearKeys) {
            const yDiff = Number(yearStr);
            const year = now.year() - yDiff;
            result.push({
                title: `On this day ${yDiff} year${yDiff > 1 ? 's' : ''} ago`,
                subtitle: now.format(`MMMM D, ${year}`),
                data: byYear[yDiff]
            });
        }

        // Random throwback: oldest posts
        const oldest = [...all]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(0, 3);
        if (oldest.length > 0) {
            result.push({
                title: '📼 From the beginning',
                subtitle: 'Your very first memories',
                data: oldest
            });
        }

        setTotalMemories(all.length);
        setSections(result);
    }, []);

    useFocusEffect(useCallback(() => { loadMemories(); }, [loadMemories]));

    if (sections.length === 0) {
        return (
            <View style={[styles.container, styles.empty, { backgroundColor: Colors.bg }]}>
                <Text style={styles.emptyEmoji}>🕰️</Text>
                <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>No time capsules yet</Text>
                <Text style={[styles.emptyBody, { color: Colors.textSecondary }]}>
                    Your memories from past years will appear here. Keep journaling every day!
                </Text>
                <View style={styles.emptyStats}>
                    <Text style={[styles.emptyStatNum, { color: Colors.accent }]}>{totalMemories}</Text>
                    <Text style={[styles.emptyStatLabel, { color: Colors.textMuted }]}>total memories so far</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.bg }]}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={(p) => (navigation as any).navigate('PostDetail', { post: p })}
                        onDeleted={loadMemories}
                    />
                )}
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: Colors.accentLight }]}>{section.title}</Text>
                        <Text style={[styles.sectionSub, { color: Colors.textMuted }]}>{section.subtitle}</Text>
                    </View>
                )}
                ListHeaderComponent={
                    <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Memory Lane</Text>
                        <Text style={[styles.headerSub, { color: Colors.textMuted }]}>
                            {dayjs().format('MMMM D')} · Looking back in time ✨
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        paddingTop: 60,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        marginBottom: Spacing.md
    },
    headerTitle: {
        fontSize: Typography.headlineSmall.fontSize,
        fontWeight: '800',
        marginBottom: 4
    },
    headerSub: {
        fontSize: Typography.bodySmall.fontSize
    },

    sectionHeader: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        paddingTop: Spacing.md
    },
    sectionTitle: {
        fontSize: Typography.bodyLarge.fontSize,
        fontWeight: '700',
        marginBottom: 2
    },
    sectionSub: {
        fontSize: Typography.labelSmall.fontSize,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        fontWeight: '500'
    },

    list: { paddingBottom: 120 },

    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md
    },
    emptyEmoji: { fontSize: 56 },
    emptyTitle: {
        fontSize: Typography.headlineSmall.fontSize,
        fontWeight: '800',
        textAlign: 'center'
    },
    emptyBody: {
        fontSize: Typography.bodyMedium.fontSize,
        textAlign: 'center',
        lineHeight: 22
    },
    emptyStats: { alignItems: 'center', marginTop: Spacing.lg },
    emptyStatNum: {
        fontSize: Typography.headlineLarge.fontSize,
        fontWeight: '800'
    },
    emptyStatLabel: {
        fontSize: Typography.bodySmall.fontSize
    }
});
