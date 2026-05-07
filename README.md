# SplitFamily — Co-parent Expense Tracker

A full-featured React web app for tracking and splitting children's expenses between co-parents.

## Features
- **Google OAuth login** (simulated — swap in real Firebase in production)
- **Email confirmation flow** (6-digit code, use `123456` in demo)
- **Co-parent invitation** with secure link
- **Dashboard** — live balance, monthly/yearly totals, pending flags
- **Kids profiles** — per-child spend, split visualization, category breakdown
- **Expenses** — full list with filter tabs, approve/reject with one tap
- **Reports** — Recharts bar chart, AI insights, audit trail, export
- **Settings** — split slider, notification toggles, co-parent management

## Demo Accounts
| Email | Role |
|-------|------|
| alex@gmail.com | Co-parent A (admin) |
| jordan@gmail.com | Co-parent B |

## Quick Start
```bash
npm install
npm run dev        # development server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

## Production: Replace Mock Auth with Real Firebase
1. Install Firebase: `npm install firebase`
2. Create `src/lib/firebase.js`:
```js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const app = initializeApp({ /* your firebase config */ })
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
```
3. In `AuthContext.jsx`, replace `signInWithGoogle` with:
```js
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const result = await signInWithPopup(auth, googleProvider)
const user = result.user  // { uid, email, displayName, photoURL }
```
4. Add Firestore for persistent data:
```js
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
const db = getFirestore(app)
await setDoc(doc(db, 'users', uid), { ... })
```

## Email Confirmation
Use Firebase Auth's `sendEmailVerification()` or a service like SendGrid/Postmark.

## Deployment
- **Vercel**: `npm install -g vercel && vercel --prod`  
- **Netlify**: drag `dist/` folder to netlify.com
- **Firebase Hosting**: `firebase deploy`

## Tech Stack
- React 18 + React Router 6
- Recharts (bar charts)
- Vite (build tool)
- CSS Modules
- Google Fonts: DM Sans + DM Serif Display
