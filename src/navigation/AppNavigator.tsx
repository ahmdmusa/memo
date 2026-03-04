import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList, MainTabParamList } from '../types/index';
import { Typography } from '../theme';

import FeedScreen from '../screens/FeedScreen';
import InsightsScreen from '../screens/InsightsScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useSettings } from '../context/SettingsContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

import { CommonActions } from '@react-navigation/native';
import { BottomNavigation } from 'react-native-paper';

function MainTabs() {
    const insets = useSafeAreaInsets();
    const { colors: Colors } = useSettings();

    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={({ navigation, state, descriptors, insets: safeAreaInsets }) => (
                <BottomNavigation.Bar
                    navigationState={state}
                    safeAreaInsets={{ ...safeAreaInsets, top: 0 }}
                    style={{ backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border }}
                    activeIndicatorStyle={{ backgroundColor: Colors.accentDim }}
                    inactiveColor={Colors.textMuted}
                    activeColor={Colors.accent}
                    onTabPress={({ route, preventDefault }) => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (event.defaultPrevented) {
                            preventDefault();
                        } else {
                            navigation.dispatch({
                                ...CommonActions.navigate({ name: route.name, merge: true }),
                                target: state.key,
                            });
                        }
                    }}
                    renderIcon={({ route, focused, color }) => {
                        const { options } = descriptors[route.key];
                        let iconName: keyof typeof Ionicons.glyphMap = 'home';
                        if (route.name === 'Feed') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Insights') {
                            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                        } else if (route.name === 'Memories') {
                            iconName = focused ? 'time' : 'time-outline';
                        } else if (route.name === 'Profile') {
                            iconName = focused ? 'person' : 'person-outline';
                        }
                        return <Ionicons name={iconName} size={24} color={color} />;
                    }}
                    getLabelText={({ route }) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel !== undefined
                            ? options.tabBarLabel as string
                            : options.title !== undefined
                                ? options.title
                                : route.name;
                        return label;
                    }}
                />
            )}
        >
            <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="Insights" component={InsightsScreen} />
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
            <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.FadeFromBottomAndroid }}>
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
