# 🍉 Ultimate Fruit Ninja: Slice. Score. Master. 🗡️

An arcade-grade, responsive 2D fruit-slicing game built with vanilla HTML5, Canvas, CSS3, and ES6 JavaScript. Features 100% offline **Progressive Web App (PWA)** support, touch controls for mobile/tablets, mouse swiping for desktop, realistic 2D physics, procedural fruit anatomy splitting, juice splats, custom blade trails, Web Audio API sound effects, 3 game modes, achievements, and persistent high scores.

Includes a complete **Android Studio Project** (`android/`) with package `com.happyarcade.ultimatefruitninja`.

---

## 🌟 Key Features

- **Responsive Touch & Mouse Controls**:
  - Play on **Mobile & Tablets** via multi-touch finger swipes.
  - Play on **Desktop & Laptop** with mouse drag or trackpad slicing.
  - Auto-adapting layout for portrait, landscape, tablets, and desktop displays.
- **Juicy 2D Physics & Slicing**:
  - Precise line-segment to circle collision detection.
  - Sliced fruits split along the exact cut angle into two halves with opposing outward repulsive velocities and rotation.
  - Cross-section internal rendering: exposed pulp, citrus segments, seeds, cores, and rinds.
  - Wall juice splatters that slowly drip down the wooden dojo wall and fade.
  - 30+ particle bursts per fruit slice matching each fruit's juice color.
- **10 Distinct Fruits + Bombs + Special Powerups**:
  1. 🍉 **Watermelon** - Striped rind, pink/red flesh with black teardrop seeds.
  2. 🍊 **Orange** - Textured peel, white pith, citrus segments.
  3. 🍎 **Apple** - Glossy crimson body, core with apple seeds.
  4. 🍌 **Banana** - Curved crescent with golden rind and creamy center.
  5. 🍍 **Pineapple** - Diamond lattice skin, crown leaves, golden rings.
  6. 🍓 **Strawberry** - Heart silhouette, piplet seeds, green calyx cap.
  7. 🍑 **Peach** - Rosy ombre gradient with cleft seam and textured pit.
  8. 🥥 **Coconut** - Fibrous brown husk with crisp white meat.
  9. 🍋 **Lemon** - Bright sun-yellow citrus with tart segments.
  10. 🌟 **Golden Dragon Fruit** - Radiant shimmering bonus fruit worth 50+ points!
  - 💣 **Bomb** - Cast-iron sphere with sizzling burning fuse and spark particles. Slicing detonates a screen-shaking fireball!
  - ❄️ **Freeze Fruit** (Arcade) - Slows time by 55% for 6 seconds.
  - ⚡ **Frenzy Fruit** (Arcade) - Spawns a massive wave of fruit from both sides.
  - 2️⃣❌ **Double Score Fruit** (Arcade) - Doubles all slice and combo points for 8 seconds.
- **3 Thrilling Game Modes**:
  - ⚔️ **Classic Mode**: 3 lives. Missing a fruit costs 1 life. Bombs detonate and end your round. Combos score huge bonuses!
  - 🌸 **Zen Mode**: Relaxing 90-second session. No bombs, no lives, no penalties. Calming drifting sakura cherry blossom petals.
  - ⚡ **Arcade Mode**: 90-second intense timer blitz. Special powerup fruits, combo multipliers, bombs deduct time and score without ending the game.
- **🗡️ Blade Dojo (7 Unlockable Cosmetic Blades)**:
  - **Classic Blue** (Starter): Traditional ninja katana with cyan spark trail.
  - **Flame Blade**: Forged in fire with rising embers and smoke. (Unlock: Slice 100 fruits)
  - **Neon Blade**: High-frequency cyber magenta laser trail. (Unlock: 4x Combo)
  - **Rainbow Blade**: Dynamic spectrum prism trail with stardust. (Unlock: Score 300 points)
  - **Golden Blade**: Pure 24k gold blade with star sparkles. (Unlock: Slice a Golden Fruit)
  - **Nature Emerald**: Ancient jade bamboo trail with leaf motes. (Unlock: Complete Zen Mode)
  - **Crystal Frost**: Glacial diamond blade with falling snowflakes. (Unlock: Score 500 in Classic)
- **🔊 Zero-Dependency Web Audio API Sound Engine**:
  - Procedural sound synthesis: crisp blade whooshes, juicy fruit squishes, heavy watermelon splats, golden bell chimes, ascending combo fanfares, fuse sizzles, thunderous explosions, and ambient Japanese dojo koto music.
  - Works 100% offline with zero latency.
  - Haptic vibration support via `navigator.vibrate`.
- **🏆 Leaderboards & 12 Achievements**:
  - Persistent LocalStorage for Top 10 high scores per mode (score, date, difficulty, fruits sliced, highest combo).
  - 12 unlockable achievement badges with real-time popup toasts.
- **♿ Accessibility & Settings**:
  - 4 Difficulty presets: Relaxed (gentle, no bombs), Easy, Normal, Fast.
  - Swipe sensitivity slider, volume slider, sound FX toggle, music toggle, vibration toggle, reduced motion toggle, high contrast mode.

---

## 🚀 How to Play

### 1. Play Directly in the Browser (Localhost)
Double-click `index.html` in your file explorer or start a local server:
```bash
# Python
python -m http.server 8080

# Or Node.js
npx serve .
```
Open [http://localhost:8080](http://localhost:8080) in your web browser.

### 2. Install as a Progressive Web App (PWA)
- **On Desktop (Chrome, Edge, Brave)**: Click the **Install** icon in the browser address bar (or Menu > "Install Ultimate Fruit Ninja"). The game will run in a dedicated borderless window like a native desktop app!
- **On Android (Chrome)**: Tap the 3-dot menu > **Add to Home screen** / **Install App**. The game installs with its custom icon, splash screen, and full offline caching.
- **On iOS (Safari)**: Tap the Share button > **Add to Home Screen**.

### 3. Deploy to Free GitHub Pages
1. Go to your GitHub repository: `https://github.com/mechxmaster/ultimatefruitninja`
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Branch**, select `main` (or `master`) and `/ (root)`.
4. Click **Save**.
5. Your game will be live at `https://mechxmaster.github.io/ultimatefruitninja/`!

---

## 📱 Native Android Project

The repository includes a ready-to-build Android Studio project in the `android/` directory:
- **Package Name**: `com.happyarcade.ultimatefruitninja`
- **Entry Point**: `MainActivity.kt` with hardware-accelerated WebView, sticky fullscreen immersive mode, and lifecycle management.
- **SDK**: compileSdk 34, minSdk 24.

To build:
1. Open the `android/` folder in **Android Studio**.
2. Let Gradle sync.
3. Click **Run** (or `Build > Build Bundle(s) / APK(s) > Build APK(s)`).

---

## 🎮 Controls Summary

| Action | Mobile / Tablet | Desktop / Laptop |
|---|---|---|
| **Slice Fruit** | Drag finger across screen | Click & drag left mouse button / trackpad |
| **Combo Slice** | Slice 3+ fruits in one swipe | Slice 3+ fruits in one mouse drag |
| **Pause Game** | Tap ⏸️ button | Tap ⏸️ button or press `P` / `Esc` |
| **Equip Blade** | Tap Blade in Dojo Modal | Click Blade in Dojo Modal |

---

## 📁 Repository Structure

```
├── index.html          # Semantic HTML5 game layout & modals
├── style.css           # Premium Japanese dojo arcade styling
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker for offline play
├── js/
│   ├── audio.js        # Web Audio API sound & music synthesizer
│   ├── blade.js        # Blade trail physics, 7 styles, collision detection
│   ├── fruit.js        # 10 fruits + bomb procedural anatomy renderer
│   ├── particles.js    # Object-pooled juice, splats & score popups
│   ├── storage.js      # LocalStorage scores, achievements & blades
│   ├── game.js         # Core game loop, spawner & mode state machine
│   └── app.js          # UI controller, modals & event binding
├── icons/
│   ├── icon.svg        # Master vector emblem
│   ├── icon-192.png    # PWA 192x192 icon
│   └── icon-512.png    # PWA 512x512 icon
└── android/            # Full Android Studio project (package: com.happyarcade.ultimatefruitninja)
    ├── build.gradle.kts
    ├── settings.gradle.kts
    └── app/
        ├── build.gradle.kts
        └── src/main/
            ├── AndroidManifest.xml
            ├── java/com/happyarcade/ultimatefruitninja/MainActivity.kt
            ├── res/values/
            └── assets/www/
```

---

## 📜 License
MIT License. Created with passion for arcade gaming fans.
