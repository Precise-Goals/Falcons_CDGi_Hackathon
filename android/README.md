# Intra Android Mobile Companion App

A lightweight Flutter 3.x companion application for the **Intra** autonomous dependency resilience platform.

Designed following the **Washi & Crimson** editorial design system (`#C8102E` Crimson, `#FAF7F2` Cream, `#0A0A0A` Carbon Charcoal).

---

## Key Features

1. **USB Debugging ADB Reverse Bridge**:
   - Zero-configuration local connection over USB cable.
   - Automatically communicates with `http://127.0.0.1:3001` (Core Engine) and `http://127.0.0.1:4000` (Simulated Services).

2. **Audible Sound Beeps & Haptic Alarms**:
   - Emits instant audible sound beeps and dual-pulse hardware haptic vibrations when external API mutations (e.g., M1–M10) or breaking schema drifts occur.
   - Toggleable from the top app bar or settings.

3. **Remote Switchboard Controller (M1–M10)**:
   - Interactive mobile toggles for all 10 simulated Fastify service mutations:
     - `M1`: Field Rename (`name` &rarr; `display_name`)
     - `M2`: Format Shift (`First Last` &rarr; `Last, First`)
     - `M3`: Unit Shift (Float Dollars &rarr; Integer Cents)
     - `M4`: Currency Flip (Omitted currency defaults to `EUR`)
     - `M5`: Offset Deprecation &rarr; Base64 `nextCursor`
     - `M6`: Silent Truncation (`limit > 20` clamped)
     - `M7`: Webhook Envelope Flattening
     - `M8`: Burst Rate-Limiting (`429 Too Many Requests`)
     - `M9`: Customer MCP Tool Drift (`query` &rarr; `q`)
     - `M10`: Enum Semantics (Suspended accounts return `active`, tripping breaker)

4. **One-Tap In-Process Adapter Approvals**:
   - Approve canary proposals directly from your phone with a single tap.

5. **Firebase Authentication & Trial History Storage**:
   - Firebase email & password sign-in with instant Guest/Demo mode.
   - Stores recent trial logs, audit histories, and W3C WebCrypto SHA-256 seals in persistent storage / Cloud Firestore.

---

## USB Debugging Setup Guide

1. Connect your Android phone to your PC via USB cable.
2. Enable **Developer Options** and turn on **USB Debugging** on the device.
3. Accept the RSA fingerprint prompt on your phone screen when prompted by ADB.
4. Run ADB port reverse commands in your terminal:
   ```bash
   adb reverse tcp:3001 tcp:3001
   adb reverse tcp:4000 tcp:4000
   adb reverse tcp:3000 tcp:3000
   ```
5. Launch the companion app:
   ```bash
   cd android
   flutter run
   ```

---

## Test Suite

Run Flutter analyzer and unit tests:
```bash
cd android
flutter analyze
flutter test
```
All tests verify model serialization, Washi & Crimson color palettes, sound services, and login screen widgets.
