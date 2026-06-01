# Pintalú

A React Native drawing app for kids, built with Expo (bare workflow), Skia, and Gesture Handler.

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Expo CLI | `expo` (bundled via `npx`) |
| Ruby / Bundler | 3.x (for CocoaPods) |
| Xcode | 15+ |
| iOS Deployment Target | 16.4+ |
| Android Studio | Hedgehog+ |
| Android min SDK | API 24 (Android 7) |
| CocoaPods | 1.14+ |

## Project Structure

```
pintalu/
├── src/
│   ├── components/
│   │   ├── Canvas/          # CanvasView — Skia rendering + gesture handling
│   │   ├── ColorPicker/     # 16-color swatch row
│   │   ├── NewCanvasSheet/  # New project modal (size presets + fill mode)
│   │   └── Toolbar/         # TopBar + BottomToolbar + BrushSizeSlider
│   ├── hooks/
│   │   ├── useAutoSave.ts   # Saves PNG on app background
│   │   ├── useCanvasGestures.ts  # Draw (1-finger) + zoom/pan (2-finger)
│   │   ├── useDrawing.ts    # Active tool + brush settings
│   │   └── useHistory.ts    # Undo/redo with MMKV persistence
│   ├── navigation/          # RootStackParamList types
│   ├── screens/
│   │   ├── CanvasScreen/    # Main drawing screen
│   │   └── GalleryScreen/   # Project grid + thumbnails
│   ├── store/
│   │   ├── projectsStore.ts # MMKV + expo-file-system persistence
│   │   └── types.ts         # All TypeScript types
│   ├── theme/
│   │   └── darkTheme.ts     # Colors, drawing palette, brush sizes
│   └── utils/
│       ├── brushPaints.ts   # Skia paint factory per tool
│       └── floodFill.ts     # Stack-based flood fill algorithm
├── App.tsx                  # Navigation root
├── app.json                 # Expo config
├── babel.config.js
└── tsconfig.json
```

## Setup

### 1. Install JS dependencies

```bash
npm install
```

### 2. Install iOS native dependencies

```bash
cd ios && pod install && cd ..
```

> Run this again after adding any new native package.

## Running the App

### iOS Simulator

```bash
npm run ios
```

To target a specific simulator:

```bash
npx expo run:ios --device "iPhone 15 Pro"
```

### Android Emulator

```bash
npm run android
```

Ensure an Android emulator is running (or a device is connected via USB with debugging enabled) before running this command.

### Start the Metro bundler only

```bash
npm start
```

Then press `i` for iOS or `a` for Android in the terminal. This requires a dev client build already installed on the device.

## Type-Checking

```bash
./node_modules/.bin/tsc --noEmit
```

## Debugging

### Hermes / Chrome DevTools

1. Start the app with `npm run ios` or `npm run android`.
2. Shake the device (or press `Cmd+D` in the iOS Simulator / `Cmd+M` in Android Emulator) to open the Dev Menu.
3. Tap **Open Debugger** — this opens Chrome DevTools connected to the Hermes engine.

Alternatively, open `chrome://inspect` in Chrome and click **Inspect** under the Remote Target that appears.

### Expo Dev Menu shortcuts

| Action | iOS Simulator | Android Emulator |
|--------|--------------|-----------------|
| Open Dev Menu | `Cmd + D` | `Cmd + M` |
| Reload JS | `Cmd + R` | `R R` (double-tap) |
| Toggle Performance Monitor | Dev Menu → Perf Monitor | Dev Menu → Perf Monitor |

### React Native Debugger (standalone)

Install [React Native Debugger](https://github.com/jhen0409/react-native-debugger) then launch it before starting Metro:

```bash
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
npm start
```

### Logs

**iOS (device or simulator):**
```bash
npx react-native log-ios
```

**Android:**
```bash
npx react-native log-android
# or filter by tag
adb logcat *:S ReactNative:V ReactNativeJS:V
```

### Skia / Canvas issues

`@shopify/react-native-skia` renders on a separate thread. To inspect canvas output:
- Use `canvas.makeImageSnapshot()` and encode to base64 for in-app debugging.
- Enable the **Skia Debug** overlay by setting `debug={true}` on the `<Canvas>` component temporarily.

### MMKV storage inspection

During development, print the stored keys from a React component or the debugger console:

```ts
import { createMMKV } from 'react-native-mmkv';
const storage = createMMKV({ id: 'pintalu' });
console.log(storage.getAllKeys());
```

### Shake-to-undo

On a physical device, shake it to trigger undo (handled by `react-native-shake`). In the iOS Simulator use **Device → Shake** from the menu bar. In the Android Emulator use `Ctrl + M` → shake is not available; test on a real device.

## Building for Production

### iOS

```bash
npx expo run:ios --configuration Release
```

Or archive via Xcode: open `ios/Pintalu.xcworkspace`, select **Any iOS Device**, then **Product → Archive**.

### Android

```bash
npx expo run:android --variant release
```

Or build an AAB via Gradle:

```bash
cd android && ./gradlew bundleRelease
```

The output is at `android/app/build/outputs/bundle/release/app-release.aab`.

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@shopify/react-native-skia` 2.6.2 | Canvas drawing (GPU-accelerated) |
| `react-native-gesture-handler` 2.31.x | Touch gestures (draw, pinch-zoom, pan) |
| `react-native-reanimated` 4.3.x | Shared values for zoom/pan transforms |
| `react-native-mmkv` 4.3.x | Fast synchronous key-value storage |
| `expo-file-system` 56.x | PNG file persistence |
| `expo-media-library` 56.x | Export drawings to camera roll |
| `react-native-shake` 6.8.x | Shake gesture → undo |
| `@react-navigation/native-stack` | Screen navigation |
