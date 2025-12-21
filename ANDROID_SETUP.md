# 📱 Running on Android Studio

## Prerequisites Checklist ✅

Before running on Android, make sure you have:
- ✅ Android Studio installed
- ✅ Android SDK installed
- ✅ Android Virtual Device (AVD) created

---

## 🚀 Step-by-Step Guide

### Step 1: Set Up Android Emulator

1. **Open Android Studio**
2. **Click on "More Actions" → "Virtual Device Manager"**
3. **Create a new device** (if you don't have one):
   - Click "Create Virtual Device"
   - Choose a device (e.g., Pixel 5)
   - Download a system image (e.g., Android 13 / API 33)
   - Click "Finish"

### Step 2: Start the Emulator

**Option A: From Android Studio**
- Open Virtual Device Manager
- Click the ▶️ (Play) button next to your device

**Option B: From Command Line**
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd Pixel_5_API_33
```

---

### Step 3: Install Dependencies

```bash
cd react-native-app
npm install
```

---

### Step 4: Run the App

**Make sure the emulator is running first!**

Then run:

```bash
npm run android
```

---

## 🎯 What Should Happen

1. **Terminal shows:**
   ```
   › Opening on Android...
   › Metro waiting on exp://...
   ```

2. **Expo app installs on emulator**

3. **Your app loads automatically**

4. **You see:**
   - Blue splash screen (2 seconds)
   - Landing page with 🚀 logo
   - Login/Signup buttons

---

## 🐛 Troubleshooting

### Issue 1: "No devices found"

**Fix:**
```bash
# Check if emulator is running
adb devices

# Should show something like:
# emulator-5554    device
```

If nothing shows, **start the emulator first!**

---

### Issue 2: "SDK location not found"

**Fix:** Set ANDROID_HOME environment variable

**Windows (PowerShell):**
```powershell
# Add to your PowerShell profile
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\emulator"
```

**Windows (Permanently):**
1. Search for "Environment Variables" in Windows
2. Add new System Variable:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YourName\AppData\Local\Android\Sdk`
3. Add to PATH:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`

---

### Issue 3: "Unable to connect to Metro"

**Fix:**
```bash
# Clear cache and restart
npm start -- --clear

# Then in another terminal:
npm run android
```

---

### Issue 4: App installs but crashes

**Fix:**
```bash
# Reinstall the app
adb uninstall host.exp.exponent
npm run android
```

---

## 💡 Pro Tips

### Faster Development

**Use web for quick changes:**
```bash
npm run web  # Fast iteration in browser
```

**Use Android for testing:**
```bash
npm run android  # Test native features
```

### Reload App

- **Shake the emulator** (Ctrl+M on Windows, Cmd+M on Mac)
- Select "Reload"

Or press **R** twice in the terminal

### View Logs

```bash
# Android logs
adb logcat

# Filtered logs
adb logcat | findstr "ReactNative"
```

---

## ⚙️ Android Studio Settings

### Enable Developer Mode in Emulator

The emulator has developer mode enabled by default, but if you need:
1. Go to Settings in emulator
2. About phone
3. Tap "Build number" 7 times
4. Developer options enabled!

---

## 🎬 Alternative: Physical Android Device

Want to test on your real phone?

1. **Enable USB Debugging** on your phone
2. **Connect via USB**
3. **Run:**
   ```bash
   npm run android
   ```
4. **Select your device** when prompted

---

## 📊 Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run android` | Run on Android emulator/device |
| `adb devices` | List connected devices |
| `adb logcat` | View Android logs |
| `npm start -- --clear` | Clear cache and restart |

---

## 🚀 Quick Start (Summary)

```bash
# 1. Start Android emulator in Android Studio

# 2. Install and run
cd react-native-app
npm install
npm run android

# 3. Wait for app to load (first time takes 2-3 minutes)
```

---

## ✅ Success Checklist

- [ ] Android Studio installed
- [ ] Virtual device created
- [ ] Emulator is running
- [ ] Dependencies installed (`npm install`)
- [ ] App starts with `npm run android`
- [ ] You see the landing page

---

**Need help? Check what you see in the terminal and let me know!** 🔍




