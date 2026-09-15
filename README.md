# ⚡ RankSync — Academic Mission Control

> **Precision, distraction-free study tracking & run-rate intelligence dashboard for CBSE Class 11th, Class 12th & JEE Main aspirants.** Built with React, TypeScript, Vite, and Electron. 100% offline, local-first, with native Windows desktop overlays, automatic midnight focus reset, and live velocity run-rates.

---

<p align="center">
  <img src="public/ranksync-icon.svg" width="80" height="80" alt="RankSync Logo" />
  <br />
  <a href="https://github.com">
    <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows" />
  </a>
  <a href="https://github.com">
    <img src="https://img.shields.io/badge/Offline-100%25%20Local-10b981?style=for-the-badge&logo=electron&logoColor=white" alt="Offline Local" />
  </a>
  <a href="https://github.com">
    <img src="https://img.shields.io/badge/UI-Linear%20%2F%20Raycast%20Dark-18181b?style=for-the-badge" alt="Anti-Slop UI" />
  </a>
  <a href="https://github.com">
    <img src="https://img.shields.io/badge/React-19%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  </a>
</p>

---

## 🚀 Download & Run for Students (Direct .exe / .zip)

Students do **not** need to install Node.js, Python, or write any code:

### 📥 **[Download Latest RankSync for Windows (.zip)](https://github.com/arshdevx/RankSync/releases/tag/v1.0.0)**

1. Go to **Releases** on GitHub and download **`RankSync-Windows.zip`**.
2. Right-click the downloaded `.zip` file and click **"Extract All..."**.
3. Double-click **`RankSync.exe`** inside the folder to launch immediately!
   *(100% offline, portable, zero installation needed).*

---

## ✨ Key Features

### 1. 🎓 Personalized Onboarding Roadmap Wizard
* **Student Identity:** Personalized greeting, study handle, and motivational telemetry.
* **Multi-Syllabus Presets:** Choose your stream or build your own:
  * **Class 12th PCM (CBSE):** 37 official chapters with unit weightages & exam tags.
  * **Class 11th PCM (CBSE):** 37 foundation chapters (14 Physics, 9 Chemistry, 14 Maths).
  * **JEE Main / Dropper (11th + 12th):** 74 combined chapters with competitive scoring priorities.
  * **Custom Syllabus:** Add any coaching curriculum or state board syllabus.
* **3-Phase Milestone Roadmap:**
  * **Syllabus End Date:** Target deadline to finish theory & first reading.
  * **Mock Test Series Start Date:** When full 3-hour sample papers & PYQs begin.
  * **Final Exam Date:** Board exam or JEE Main session date.
  * Live roadmap simulator calculating days allocated to theory vs. intensive revision.

### 2. ➕ Full Chapter Customization (+ Add / Edit / Delete)
* Add custom topics and coaching modules with **`+ Add Chapter`** directly on any subject page.
* Assign custom marks weightage, unit blocks, and priority tags (`Must Do`, `High Yield`, `Moderate`, `Scoring`).
* Delete or edit user-created chapters with zero impact on core syllabus presets.

### 3. ⏱️ Dynamic Run-Rate Intelligence & Focus Timer
* Live pace calculation based on remaining days and completed chapters:
  $$\text{Required Pace} = \frac{\text{Remaining Chapters}}{\text{Days to Syllabus Deadline}}$$
* As you complete chapters, required pace dynamically relaxes (e.g. `0.60 ch/day` $\rightarrow$ `0.52 ch/day` $\rightarrow$ `0.27 ch/day`).
* **Midnight Rollover:** At 12:00:00 AM local time, focus timers and daily metrics automatically rollover and reset cleanly. Pre-midnight time is safely logged into yesterday's history.

### 4. 🎯 "Today's Target" Action Card
* Pinned at the top of the dashboard as your immediate daily action station.
* **Bidirectional Sync:** Checking a chapter in Today's Target immediately marks it complete in the syllabus.
* **Interactive Question Counter:** Quick `+5` and `+10` buttons to record daily practice problems.
* **Next Best Action:** Automatically suggests the next highest-yield chapter to tackle.

### 5. 🔔 Native Desktop Notifications & Focus Overlays
* Native Windows notifications even over fullscreen video players or games.
* Optional **Always-On-Top floating window** mode (`PIN ON TOP`).
* Restrained hydration tracker in the precision toolbar with 1-click logging (`💧 0/8`).

### 6. 🔒 100% Local-First & Private
* Storage is isolated per profile in Windows `%APPDATA%\ranksync`.
* Sharing the app with friends gives them a clean, fresh 0% database — your personal progress never leaks.
* Built-in **Export / Import Backup (.json)** in Settings to safely backup or transfer data between PCs.

---

## 🛠️ Developer Setup & Local Development

To run or build RankSync from source:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ranksync.git
cd ranksync

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run native Electron desktop app in development
npm run app

# 5. Build production bundle and pack app.asar
npm run bundle:exe
```

---

## 📂 Project Architecture

```
ranksync/
├── electron/
│   ├── main.cjs            # Electron main process (IPC, notifications, overlays)
│   └── preload.cjs         # Secure contextBridge IPC preload
├── src/
│   ├── components/
│   │   ├── AddChapterModal.tsx   # Custom chapter creation modal
│   │   ├── ChapterRow.tsx        # Granular chapter row with 4 subtasks & notes
│   │   ├── Dashboard.tsx         # Level 1/2/3 visual hierarchy dashboard
│   │   ├── HydrationCard.tsx     # Hydration tracker card
│   │   ├── RankSyncLogo.tsx      # SVG brand logo component
│   │   ├── ReminderPanel.tsx     # System notifications & chime settings
│   │   ├── SetupWizard.tsx       # First-time interactive onboarding roadmap
│   │   ├── StudyTimer.tsx        # Midnight rollover focus timer
│   │   ├── SubjectPage.tsx       # Filterable subject page with sticky toolbar
│   │   ├── TodayTargetCard.tsx   # Daily target action station
│   │   ├── WaterReminderOverlay.tsx # Overlay popup
│   │   └── Settings.tsx          # Profile & milestone date configuration
│   ├── data/
│   │   └── syllabus.ts           # Class 12, Class 11, JEE presets & metadata
│   ├── lib/
│   │   ├── config.ts             # AppConfig, syllabus presets, date settings
│   │   ├── notifications.ts      # Native notifications & web audio chimes
│   │   ├── stats.ts              # Single source of truth calculation engine
│   │   └── storage.ts            # LocalStorage engine, custom chapters CRUD
│   ├── App.tsx                   # Main layout and route orchestration
│   └── index.css                 # Linear/Raycast dark theme tokens
├── verify-scenarios.ts           # Automated 58-test verification suite
└── build-asar.js                 # Clean ASAR packaging script for Windows
```

---

## 📄 License

Distributed under the MIT License. Free to use, modify, and share for all students and aspirants.
