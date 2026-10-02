# 🦶 StepSense - Smart Insole Gait Analysis & Health Monitoring System

> **Samsung Solve for Tomorrow Entry**  
> An end-to-end smart insole healthcare platform for real-time gait analysis, diabetic foot ulcer prevention, joint strain assessment, fall detection, and vascular health monitoring.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Monorepo Architecture](#-monorepo-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [Windows Batch Launchers](#-windows-batch-launchers)
- [Environment Configuration](#-environment-configuration)
- [Core Package & Biomechanical Models](#-core-package--biomechanical-models)
- [Database & Supabase Integration](#-database--supabase-integration)
- [Git Setup & Guidelines](#-git-setup--guidelines)

---

## 🔬 Overview

**StepSense** bridges hardware micro-sensors embedded in smart insoles with real-time mobile and web dashboards. By capturing multi-point plantar pressure distributions, accelerometer readings, and surface telemetry, StepSense calculates critical gait indices to prevent diabetic ulceration, alert users to elevated fall risks, monitor joint strain, and suggest proactive lifestyle interventions.

---

## ⚡ Key Features

- 🩺 **Diabetic Ulcer Risk Scoring**: Real-time evaluation of continuous pressure spikes, localized thermal hotspots, and tissue shear stress.
- ⚖️ **Gait Asymmetry & Fatigue Monitoring**: Dual-foot balance comparison, stride cadence, stance duration tracking, and dynamic fatigue indexes.
- 🚨 **Real-Time Fall Detection & Safety**: Immediate high-impact event identification with automated emergency alerts.
- 🦴 **Joint Strain & Vascular Assessment**: Biomechanical force projection for knees/hips and peripheral vascular risk scoring.
- 📱 **Expo / React Native Mobile App**: On-the-go patient view, live Bluetooth sensor stream display, and push notification system.
- 📊 **Vite + React Web Dashboard**: Interactive analytics platform featuring Plotly & Recharts visualizations for clinicians and caregivers.
- 🤖 **Groq AI Assistant**: Context-aware clinical assistant for personalized recovery insights and gait recommendations.

---

## 🏗️ Monorepo Architecture

```
stepsense/
├── apps/
│   ├── web/               # Clinician & Patient Web Dashboard (Vite + React 19 + Tailwind CSS)
│   └── mobile/            # iOS & Android Mobile App (Expo 57 + React Native + NativeWind)
├── packages/
│   ├── core/              # Biomechanical algorithms (gait, ulcer risk, fatigue, fall detection)
│   ├── design-tokens/     # Shared color palette, typography, and styling variables
│   ├── supabase-client/   # Supabase DB queries, real-time subscriptions, and auth helpers
│   └── types/             # Shared TypeScript database schemas and data types
├── supabase/
│   ├── migrations/        # SQL migration scripts for Supabase backend
│   └── functions/         # Edge functions for AI & notification services
├── start-all.bat          # Interactive Windows Control Panel Launcher
├── start-web.bat          # One-click Windows starter for Web App
├── start-mobile.bat       # One-click Windows starter for Mobile App
└── install-deps.bat       # Monorepo dependency installer
```

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js**: `v18.0.0` or higher (recommended: `v20+`)
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)
- **Expo Go App** (Optional, for testing mobile app on physical iOS/Android devices)
- **Git**

---

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/stepsense.git
cd stepsense
```

### 2. Configure Environment Variables

Copy `.env.example` into both `apps/web` and `apps/mobile`:

```bash
# Web Environment
cp .env.example apps/web/.env

# Mobile Environment
cp .env.example apps/mobile/.env
```

Ensure `apps/web/.env` contains:
```env
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

Ensure `apps/mobile/.env` contains:
```env
EXPO_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
EXPO_NO_DEVTOOLS=1
```

### 3. Install Monorepo Dependencies

```bash
npm install
```

### 4. Run Applications

#### 🌐 Web Dashboard (Vite + React)
```bash
npm run dev:web
```
Access the app at: `http://localhost:5173`

#### 📱 Mobile App (Expo)
```bash
npm run dev:mobile
```
Press `w` to open in browser, `a` for Android emulator, or scan the QR code with Expo Go.

---

## 🖥️ Windows Batch Launchers

For convenience on Windows systems, pre-built batch scripts are included in the root directory:

| Script | Action |
|---|---|
| `start-all.bat` | Opens an interactive control panel menu to launch Web, Mobile, or both. |
| `start-web.bat` | Immediately starts the Web Dashboard dev server. |
| `start-mobile.bat` | Immediately launches the Expo Mobile bundler. |
| `install-deps.bat` | Installs all root and workspace dependencies. |

*To use, simply double-click any `.bat` file in File Explorer or run it from command prompt.*

---

## 🧮 Core Package & Biomechanical Models

The `@stepsense/core` package contains modular biomechanical algorithms:

- `diabeticMetrics.ts`: Tissue pressure time-integrals and risk categorizations.
- `gait.ts`: Cadence, step cycle calculation, and stride length estimation.
- `asymmetry.ts`: Limb symmetry index (LSI) comparison.
- `fallDetection.ts`: Tri-axial accelerometer peak magnitude & posture shift detection.
- `fatigue.ts`: Frequency domain power shift and endurance degradation.
- `ulcerRisk.ts`: Multi-sensor risk fusion engine.
- `sessionFinalize.ts`: Session summaries and aggregated wellness reports.

Unit tests for algorithms are located alongside each core module (`*.test.ts`).

---

## 🗄️ Database & Supabase Integration

StepSense leverages Supabase for PostgreSQL database storage, real-time telemetry subscriptions, and authentication.

To run migrations against a local or remote Supabase instance:

```bash
cd supabase
supabase db push
```

Migration scripts can be found in `supabase/migrations/`.

---

## 📦 Git Setup & Version Control

The repository is configured with a comprehensive `.gitignore` filtering `node_modules`, secret files (`.env`), build bundles (`dist/`, `.expo/`), and OS/IDE cache artifacts.

### Initial Commit Instructions

If initializing for the first time:

```bash
git add .
git commit -m "feat: initial commit for StepSense monorepo setup"
```

### Git Branching Conventions

- `main` / `master`: Production-ready releases.
- `feature/<name>`: New UI features or algorithmic updates.
- `fix/<issue>`: Bug fixes and patches.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
