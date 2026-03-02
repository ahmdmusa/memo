export type PostType = 'photo' | 'thought' | 'article' | 'voice' | 'video';

export type Mood = '😊' | '😔' | '😤' | '🥱' | '🤔' | '❤️' | '🔥' | '✨' | '😂' | '😌';

export interface Post {
    id: number;
    type: PostType;
    title?: string;
    body?: string;
    // image / voice file path
    image_uri?: string;
    media_uri?: string;
    // voice note duration in seconds
    duration?: number;
    mood?: Mood;
    mood_tag?: string;
    location_metadata?: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    name: string;
    bio: string;
    avatar_uri?: string;
    cover_uri?: string;
}

export type RootStackParamList = {
    MainTabs: undefined;
    PostDetail: { post: Post };
    CreatePost: { type?: PostType };
    EditPost: { post: Post };
    EditProfile: undefined;
    Lock: undefined;
    Settings: undefined;
};

export type MainTabParamList = {
    Feed: undefined;
    Explore: undefined;
    Memories: undefined;
    Profile: undefined;
};
