const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'cannot', 'could', 'couldn', 'did', 'didn', 'do', 'does', 'doesn', 'doing', 'don', 'down',
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn', 'has', 'hasn', 'have', 'haven',
    'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
    'into', 'is', 'isn', 'it', 'its', 'itself', 'let', 'me', 'more', 'most', 'mustn', 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'same', 'shan', 'she', 'should', 'shouldn', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we', 'were',
    'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won', 'would',
    'wouldn', 'you', 'your', 'yours', 'yourself', 'yourselves', 'will', 'just', 'like', 'really',
    // HTML tags injected by richtext editor
    'div', 'b', 'br', 'span', 'p'
]);

/**
 * Strips HTML tags and basic punctuation from text.
 */
function cleanText(text: string): string {
    let clean = text.replace(/<[^>]*>?/gm, ' '); // Remove HTML tags
    clean = clean.replace(/[^\w\s]|_/g, ' ') // Remove punctuation
        .replace(/\s+/g, ' ')
        .toLowerCase();
    return clean.trim();
}

/**
 * Extracts the top N keywords from an array of texts using a simplified TF-IDF or just TF approach.
 * For local intelligence, pure Term Frequency filtered by stopwords is often enough.
 */
export function extractTopThemes(texts: string[], topN: number = 5): { term: string; count: number }[] {
    const termFrequency: Record<string, number> = {};

    texts.forEach(text => {
        const words = cleanText(text).split(' ');
        words.forEach(word => {
            if (word.length > 2 && !STOP_WORDS.has(word)) {
                termFrequency[word] = (termFrequency[word] || 0) + 1;
            }
        });
    });

    const entries = Object.entries(termFrequency);
    entries.sort((a, b) => b[1] - a[1]);

    return entries.slice(0, topN).map(([term, count]) => ({ term, count }));
}

/**
 * Correlates themes with moods. Given texts and their moods, finds what words are most common per mood.
 */
export function correlateMoods(entries: { text: string; mood: string }[]): Record<string, { term: string; count: number }[]> {
    const moodMap: Record<string, string[]> = {};

    entries.forEach(entry => {
        if (!entry.mood) return;
        if (!moodMap[entry.mood]) {
            moodMap[entry.mood] = [];
        }
        moodMap[entry.mood].push(entry.text);
    });

    const result: Record<string, { term: string; count: number }[]> = {};
    for (const [mood, texts] of Object.entries(moodMap)) {
        result[mood] = extractTopThemes(texts, 3);
    }

    return result;
}
