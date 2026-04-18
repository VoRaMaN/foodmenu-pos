# Setup Guide — Khmer POS

## 1. Create GitHub Repository

```bash
# Authenticate GitHub CLI (already installed)
gh auth login

# Create the repo and push
cd E:\Business\foodmenu\foodmenu-pos
gh repo create foodmenu-pos --public --source=. --push

# OR if repo already exists on GitHub:
git push -u origin main
```

## 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `khmer-restaurant`)
3. Disable Google Analytics (optional for a POS)
4. Wait for project creation

### Enable Services

- **Authentication** → Sign-in method → Enable **Email/Password**
- **Firestore Database** → Create database → Start in **production mode**
- **Storage** → Get started → Start in **production mode**

### Get Firebase Config

1. Project Settings (gear icon) → General → Your apps → **Add app** → Web
2. Register app name (e.g. `khmer-pos`)
3. Copy the config values

### Set Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=khmer-restaurant.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=khmer-restaurant
VITE_FIREBASE_STORAGE_BUCKET=khmer-restaurant.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 3. Deploy Firestore Security Rules

Install Firebase CLI if not already installed:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # Select existing project, use firestore.rules
firebase deploy --only firestore:rules
```

## 4. Seed the Database

This migrates the 83 menu items from the customer app + creates 10 tables + default settings:

```bash
# Install dotenv for the seed script
npm install dotenv

# Run the seed script
node scripts/seedData.mjs
```

## 5. Create Manager Account

1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **Add user** → enter email & password (e.g. `manager@restaurant.com`)
3. Copy the **User UID** shown
4. Go to **Firestore** → `staff` collection
5. Find the placeholder manager document and update its ID to match the Auth UID:
   - Delete the existing placeholder doc
   - Create a new doc with ID = the Auth UID
   - Fields: `name`, `email`, `role: "manager"`, `active: true`, `createdAt`

Or use the app: Log in with the manager credentials → go to Admin → Staff → add real staff accounts through the UI.

## 6. Run Locally

```bash
npm run dev
```

Opens at `http://localhost:5173/foodmenu-pos/`

Log in with your manager credentials. From Admin → Staff, you can create accounts for cashiers, waiters, and kitchen staff.

## 7. Deploy to GitHub Pages

### Set GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|------------|-------|
| `VITE_FIREBASE_API_KEY` | Your API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | yourproject.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | yourproject.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID |

### Enable GitHub Pages

1. Go to repo Settings → Pages
2. Source: **GitHub Actions**

Now every push to `main` will auto-deploy via the workflow in `.github/workflows/deploy.yml`.

Live URL: `https://voraman.github.io/foodmenu-pos/`

## 8. Update Customer App (Optional)

To sync the customer-facing menu app with Firebase (so menu edits in POS auto-update the customer app):

1. Add `firebase` package to the `foodmenu` project
2. Create `src/firebase.js` with the same config
3. Update `App.jsx` to fetch menu from Firestore instead of `menuItems.js`
4. Keep `menuItems.js` as offline fallback
