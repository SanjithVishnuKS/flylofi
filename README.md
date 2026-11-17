# ✈️ FlyLofi Focus Flight & Sentinel Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20%7C%20Android-brightgreen.svg)](focus-flight.apk)
[![Edge Deployment](https://img.shields.io/badge/Cloudflare%20Workers-Live%20on%20Edge-orange.svg)](https://focus-flight.always04king.workers.dev)
[![Privacy Friendly](https://img.shields.io/badge/Privacy-Zero%20Tracking-purple.svg)](https://focus-flight.always04king.workers.dev/privacy.html)

> **FlyLofi Focus Flight** transforms your device into an immersive ambient flight cabin engineered for deep focus, studying, flow-state productivity, and tranquil relaxation.

---

## 🌟 Live Deployments & Downloads

| Target | Status / Link | Details |
| :--- | :--- | :--- |
| **🌐 Cloudflare Edge Web App** | [focus-flight.always04king.workers.dev](https://focus-flight.always04king.workers.dev/) | Deployed globally on Cloudflare Workers edge network with instant response times and offline PWA caching. |
| **📱 Android Production APK** | [`focus-flight.apk`](focus-flight.apk) | Verified with **v1 (JAR), v2, and v3** signatures, 4-byte ZIP alignment, `minSdkVersion 24`, custom adaptive/bitmap FlyLofi launcher icons. |
| **🛡️ Privacy Policy** | [Live Privacy Policy](https://focus-flight.always04king.workers.dev/privacy.html) | Compliant with Google Play Data Safety, F-Droid FOSS criteria, and GDPR. |
| **🖥️ Local Sentinel Server** | `http://localhost:8000/` | Local Python HTTP media server supporting full audio/video streaming and control console. |

---

## 🎨 App Branding & Assets

- **App Name**: FlyLofi Focus Flight
- **Brand Colors**: `#071117` (Deep Obsidian Cockpit), `#5CE1E6` (Cyan Ambient Glow), `#FFFFFF` (Pure Cloud White).
- **Launcher Icons**: Custom launcher bitmaps and vector mipmaps generated across all Android screen densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
- **Store Graphics**:
  - `play-store-assets/icon-512.png` (512x512 Store Icon)
  - `play-store-assets/feature-graphic-1024x500.png` (1024x500 Feature Banner)

---

## 🚀 Key Features

1. **✈️ Ambient Flight Deck Experience**:
   - Cruise at 35,000 feet with atmospheric night cabin, cockpit, and wing window views.
   - Soothing airplane cabin white noise for masking office or household distractions.
2. **🎵 Curated Lofi & Ambient Audio**:
   - Curated chillhop beats, mellow piano, and jazzhop tuned specifically for studying and coding.
   - Dual audio channel mixing with independent sliders for ambient sound and musical tracks.
3. **📶 100% Offline Independence**:
   - Progressive Web App (PWA) with Service Worker offline caching.
   - Android APK packages all required assets for zero-network playback during flights or commutes.
4. **🔒 Pure Privacy & Zero Telemetry**:
   - No analytics SDKs, no ad trackers, no third-party telemetry, no user accounts required.
   - All settings and flight logs are stored strictly on local device storage (`localStorage`).

---

## 📁 Repository Structure

```
├── focus-flight/               # Web Application & PWA Source
│   ├── app.html                # Main Flight Deck UI
│   ├── cruise.html             # Ambient Cruise Cabin View
│   ├── ticket-showcase.html    # Interactive Flight Boarding Pass
│   ├── manifest.json           # PWA Web App Manifest
│   ├── sw.js                   # Service Worker Cache Engine
│   ├── privacy.html            # Privacy Policy
│   └── focus-flight.apk        # Signed Android Production APK
├── fastlane/                   # F-Droid Fastlane Metadata Structure
│   └── metadata/android/en-US/
│       ├── title.txt
│       ├── short_description.txt
│       ├── full_description.txt
│       └── images/             # 512x512 icon & 1024x500 feature graphic
├── fdroid/                     # F-Droid Build Recipe
│   └── org.flylofi.focusflight.yml
├── play-store-assets/          # Google Play Console Release Package
│   ├── icon-512.png
│   ├── feature-graphic-1024x500.png
│   └── store-listing-details.txt
├── media/                      # Media directory (Git LFS / local insertion)
├── server.py                   # Local Sentinel Media Server
├── index.html                  # Sentinel Server Dashboard
├── LICENSE                     # MIT Open Source License
└── README.md
```

---

## 🐙 Pushing to GitHub

To push this repository to your GitHub account:

1. Create a new repository on GitHub (e.g. `flylofi`).
2. Run the following commands from your terminal:

```bash
cd "d:\SERVER APP"
git remote add origin https://github.com/SanjithVishnuKS/flylofi.git
git branch -M main
git push -u origin main
```

*(Note: Large media files in `media/` are excluded via `.gitignore` to keep your repository well under GitHub's 100MB file limit).*

---

## 🤖 Publishing to F-Droid

F-Droid builds open-source Android apps directly from source repositories.

1. **Verify Metadata**:
   All Fastlane metadata files are located under `fastlane/metadata/android/en-US/`.
2. **Submit Build Recipe**:
   - Fork the official repository: [gitlab.com/fdroid/fdroiddata](https://gitlab.com/fdroid/fdroiddata)
   - Copy `fdroid/org.flylofi.focusflight.yml` into `packages/org.flylofi.focusflight.yml` in your fork.
   - Update `Repo:` in the YAML file to your public GitHub repository URL.
   - Open a **Merge Request (MR)** to `fdroid/fdroiddata`.
   - F-Droid's automated build server will verify the build and publish it to the F-Droid client catalog!

---

## 🛍️ Publishing to Google Play Store

1. **Google Play Console**:
   - Go to [Google Play Console](https://play.google.com/console) and select **Create App**.
   - App Name: `FlyLofi Focus Flight`
   - Language: `en-US` | Free App
2. **Store Listing**:
   - Copy details from [`play-store-assets/store-listing-details.txt`](play-store-assets/store-listing-details.txt).
   - Upload `play-store-assets/icon-512.png` as the **App Icon**.
   - Upload `play-store-assets/feature-graphic-1024x500.png` as the **Feature Graphic**.
3. **Privacy Policy**:
   - Set Privacy Policy URL to: `https://focus-flight.always04king.workers.dev/privacy.html`.
4. **App Release**:
   - Under **Production / Testing**, upload the release bundle.
   - For Play App Signing, enroll your key and upload your release bundle (`.aab` or `.apk`).

---

## 🛠️ Local Development & Sentinel Server

To run the local server for media streaming:

```bash
cd "d:\SERVER APP"
python server.py --port 8000
```

Open your browser to:
- **Sentinel Dashboard**: `http://localhost:8000/`
- **Focus Flight Deck**: `http://localhost:8000/focus-flight/app.html`
- **Cruise Mode**: `http://localhost:8000/focus-flight/cruise.html`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.
