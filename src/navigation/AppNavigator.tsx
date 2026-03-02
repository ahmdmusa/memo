import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList, MainTabParamList } from '../types/index';
import { FontSize, FontWeight } from '../theme';

import FeedScreen from '../screens/FeedScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useSettings } from '../context/SettingsContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const insets = useSafeAreaInsets();
    const { colors: Colors } = useSettings();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.bgCard,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 6,
                    paddingTop: 8
                },
                tabBarActiveTintColor: Colors.accentLight,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: FontSize.xs,
                    fontWeight: FontWeight.medium,
                    marginTop: 2
                },
                tabBarIcon: ({ focused, color }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';
                    if (route.name === 'Feed') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Explore') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Memories') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={22} color={color} />;
                }
            })}
        >
            <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Memories" component={MemoriesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { colors: Colors } = useSettings();

    const NAV_THEME = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: Colors.bg,
            card: Colors.bg,
            text: Colors.textPrimary,
            border: Colors.border,
            primary: Colors.accent,
            notification: Colors.accent
        }
    };

    return (
        <NavigationContainer theme={NAV_THEME}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen
                    name="PostDetail"
                    component={PostDetailScreen}
                    options={{ presentation: 'card' }}
                />
                <Stack.Screen
                    name="CreatePost"
                    component={CreatePostScreen}
                    options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                    name="EditProfile"
                    component={EditProfileScreen}
                    options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ presentation: 'card' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
