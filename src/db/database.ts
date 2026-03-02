import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Post, PostType, Mood, Profile } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        db = await SQLite.openDatabaseAsync('memo.db');
        await initDb(db);
    }
    return db;
}

async function initDb(database: SQLite.SQLiteDatabase) {
    await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT,
      body TEXT,
      image_uri TEXT,
      media_uri TEXT,
      duration INTEGER,
      mood TEXT,
      mood_tag TEXT,
      location_metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO profile (key, value) VALUES ('name', 'Me');
    INSERT OR IGNORE INTO profile (key, value) VALUES ('bio', 'This is my personal space \u2728');
    INSERT OR IGNORE INTO profile (key, value) VALUES ('avatar_uri', '');
    INSERT OR IGNORE INTO profile (key, value) VALUES ('cover_uri', '');
  `);

    // Migrations: add columns if not yet present (for existing DBs)
    const pragmaRows = await database.getAllAsync<{ name: string }>(
        `PRAGMA table_info(posts)`
    );
    const cols = pragmaRows.map(r => r.name);
    if (!cols.includes('media_uri')) {
        await database.execAsync(`ALTER TABLE posts ADD COLUMN media_uri TEXT`);
    }
    if (!cols.includes('duration')) {
        await database.execAsync(`ALTER TABLE posts ADD COLUMN duration INTEGER`);
    }
    if (!cols.includes('mood_tag')) {
        await database.execAsync(`ALTER TABLE posts ADD COLUMN mood_tag TEXT`);
    }
    if (!cols.includes('location_metadata')) {
        await database.execAsync(`ALTER TABLE posts ADD COLUMN location_metadata TEXT`);
    }
}

// ── Posts ──────────────────────────────────────────────

export async function createPost(params: {
    type: PostType;
    title?: string;
    body?: string;
    image_uri?: string;
    media_uri?: string;
    duration?: number;
    mood?: Mood;
    mood_tag?: string;
    location_metadata?: string;
}): Promise<Post> {
    const database = await getDb();
    const now = new Date().toISOString();
    const result = await database.runAsync(
        `INSERT INTO posts (type, title, body, image_uri, media_uri, duration, mood, mood_tag, location_metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params.type,
        params.title ?? null,
        params.body ?? null,
        params.image_uri ?? null,
        params.media_uri ?? null,
        params.duration ?? null,
        params.mood ?? null,
        params.mood_tag ?? null,
        params.location_metadata ?? null,
        now,
        now,
    );
    return {
        id: result.lastInsertRowId,
        type: params.type,
        title: params.title,
        body: params.body,
        image_uri: params.image_uri,
        media_uri: params.media_uri,
        duration: params.duration,
        mood: params.mood,
        mood_tag: params.mood_tag,
        location_metadata: params.location_metadata,
        created_at: now,
        updated_at: now,
    };
}

export async function getAllPosts(): Promise<Post[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<Post>(
        'SELECT * FROM posts ORDER BY created_at DESC',
    );
    return rows;
}

export async function getPostsByType(type: PostType): Promise<Post[]> {
    const database = await getDb();
    return database.getAllAsync<Post>(
        'SELECT * FROM posts WHERE type = ? ORDER BY created_at DESC',
        type,
    );
}

export async function searchPosts(query: string): Promise<Post[]> {
    const database = await getDb();
    const q = `%${query}%`;
    return database.getAllAsync<Post>(
        `SELECT * FROM posts
     WHERE title LIKE ? OR body LIKE ?
     ORDER BY created_at DESC`,
        q,
        q,
    );
}

export async function updatePost(
    id: number,
    params: Partial<{ title: string; body: string; image_uri: string; mood: Mood }>,
): Promise<void> {
    const database = await getDb();
    const now = new Date().toISOString();
    const sets: string[] = [];
    const values: (string | null)[] = [];

    if (params.title !== undefined) { sets.push('title = ?'); values.push(params.title); }
    if (params.body !== undefined) { sets.push('body = ?'); values.push(params.body); }
    if (params.image_uri !== undefined) { sets.push('image_uri = ?'); values.push(params.image_uri); }
    if (params.mood !== undefined) { sets.push('mood = ?'); values.push(params.mood); }
    sets.push('updated_at = ?'); values.push(now);
    values.push(String(id));

    await database.runAsync(
        `UPDATE posts SET ${sets.join(', ')} WHERE id = ?`,
        ...values,
    );
}

export async function deletePost(post: Post): Promise<void> {
    const database = await getDb();
    // Delete local image copy if it exists in app dir
    if (post.image_uri && post.image_uri.startsWith(FileSystem.documentDirectory ?? '')) {
        try { await FileSystem.deleteAsync(post.image_uri, { idempotent: true }); } catch { }
    }
    await database.runAsync('DELETE FROM posts WHERE id = ?', post.id);
}

export async function getPostsCount(): Promise<number> {
    const database = await getDb();
    const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM posts');
    return row?.count ?? 0;
}

export async function getPostsCountByType(): Promise<Record<PostType, number>> {
    const database = await getDb();
    const rows = await database.getAllAsync<{ type: string; count: number }>(
        'SELECT type, COUNT(*) as count FROM posts GROUP BY type',
    );
    const counts: Record<PostType, number> = {
        photo: 0,
        thought: 0,
        article: 0,
        voice: 0,
        video: 0,
    };
    for (const row of rows) {
        counts[row.type as PostType] = row.count;
    }
    return counts;
}

export async function getStreak(): Promise<number> {
    const database = await getDb();
    const rows = await database.getAllAsync<{ day: string }>(
        `SELECT DISTINCT date(created_at) as day FROM posts ORDER BY day DESC`,
    );
    if (rows.length === 0) return 0;

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const row of rows) {
        const rowDate = new Date(row.day);
        const diffDays = Math.round((current.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
            streak++;
            current = rowDate;
        } else {
            break;
        }
    }
    return streak;
}

export async function getTodayPosts(): Promise<Post[]> {
    const database = await getDb();
    const today = new Date().toISOString().split('T')[0];
    return database.getAllAsync<Post>(
        `SELECT * FROM posts WHERE date(created_at) = ? ORDER BY created_at DESC`,
        today,
    );
}

export async function getThisDayLastYear(): Promise<Post[]> {
    const database = await getDb();
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const day = lastYear.toISOString().split('T')[0];
    return database.getAllAsync<Post>(
        `SELECT * FROM posts WHERE date(created_at) = ? ORDER BY created_at DESC`,
        day,
    );
}

// ── Profile ──────────────────────────────────────────────

export async function getProfile(): Promise<Profile> {
    const database = await getDb();
    const rows = await database.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM profile',
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
        name: map['name'] ?? 'Me',
        bio: map['bio'] ?? '',
        avatar_uri: map['avatar_uri'] || undefined,
        cover_uri: map['cover_uri'] || undefined,
    };
}

export async function saveProfile(profile: Profile): Promise<void> {
    const database = await getDb();
    await database.runAsync(
        'INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)',
        'name', profile.name,
    );
    await database.runAsync(
        'INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)',
        'bio', profile.bio,
    );
    if (profile.avatar_uri !== undefined) {
        await database.runAsync(
            'INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)',
            'avatar_uri', profile.avatar_uri,
        );
    }
    if (profile.cover_uri !== undefined) {
        await database.runAsync(
            'INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)',
            'cover_uri', profile.cover_uri,
        );
    }
}

// ── Image Helper ──────────────────────────────────────────

export async function saveImageLocally(uri: string): Promise<string> {
    const dir = `${FileSystem.documentDirectory ?? ''}memo_images/`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    const filename = `img_${Date.now()}.jpg`;
    const dest = `${dir}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
}
