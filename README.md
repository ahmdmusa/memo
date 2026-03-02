<div align="center">

<img src="assets/icon.png" width="120" height="120" style="border-radius: 24px;" />

# memo
### *Your private garden. Always offline. Always yours.*

[![Build Android APK](https://github.com/ahmdmusa/memo/actions/workflows/build-apk.yml/badge.svg)](https://github.com/ahmdmusa/memo/actions/workflows/build-apk.yml)
![Platform](https://img.shields.io/badge/platform-Android-black?logo=android)
![Framework](https://img.shields.io/badge/React%20Native-Expo-blue?logo=expo)
![License](https://img.shields.io/badge/license-Private-lightgrey)

</div>

---

## ✦ What is memo?

**memo** is a beautiful, completely offline-first journaling app. It looks and feels like Instagram meets X (Twitter) — but it's 100% private and lives only on your device. No accounts, no cloud sync, no social features. Just you and your thoughts.

---

## ✦ Features

| Feature | Description |
|---|---|
| 📝 **Text Posts** | X-style minimalist text entries with Markdown support |
| 📷 **Photo Posts** | Instagram-style image capture from camera or gallery |
| 🎙️ **Voice Notes** | Press-and-hold to record, WhatsApp-style animated waveform |
| 🎬 **Video Posts** | Local video capture and playback |
| 🌑 **Deep Black Theme** | X/Twitter-inspired Dark Mode (`#000000`) |
| 🎨 **Dynamic Themes** | Switchable accent colors and theme modes |
| 🔒 **Biometric Lock** | Fingerprint/Face lock with configurable grace period |
| 🛡️ **The Vault** | AES-256 encrypted `.garden` backup files |
| 📍 **Mood Tags** | Emoji tags for emotional context |
| 🗂️ **Memory Lane** | Browse your past entries by date |
| 👤 **X-Style Profile** | Cover photo, avatar, bio + Posts & Media tabs |
| 🔍 **Local Search** | Filter posts by text or hashtags |

---

## ✦ Stack

- **Framework:** React Native (Expo SDK 55)
- **Database:** expo-sqlite (100% local SQLite)
- **Storage:** expo-file-system (media files)
- **Audio:** expo-av (recording & playback)
- **Security:** expo-local-authentication + AES-256 (crypto-js)
- **Navigation:** React Navigation (Stack + Bottom Tabs)

---

## ✦ Architecture

```
src/
├── components/       # PostCard, VoiceRecorder, AudioPlayerCard
├── context/          # SettingsContext (theme, lock, accent color)
├── db/               # database.ts — SQLite schema & queries
├── navigation/       # AppNavigator
├── screens/          # Feed, Create, Profile, Memories, Settings...
├── theme/            # colors.ts, index.ts
├── types/            # TypeScript type definitions
└── utils/            # vault.ts — AES-256 backup & restore
```

---

## ✦ Download APK

The APK is automatically built via **GitHub Actions** on every push.

👉 **[Download from Actions Artifacts](https://github.com/ahmdmusa/memo/actions)**

1. Click the latest successful workflow run
2. Scroll to **Artifacts**
3. Download `memo-release.apk`
4. Install on Android (enable "Unknown sources" if prompted)

---

## ✦ Developer

Built with care by **Ahmed Musa**

[![Telegram](https://img.shields.io/badge/Contact-Telegram-2CA5E0?logo=telegram)](https://t.me/ahmdmusa)
