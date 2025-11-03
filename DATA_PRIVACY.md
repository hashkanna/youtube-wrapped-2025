# Data Privacy & Management

## ✅ What's Protected

Your personal YouTube watch history is **never committed to git**.

### Git-Ignored Paths

The following are excluded from version control:

```
data/                                    # Your personal data folder
youtube-wrapped-app/public/watch-history.html  # Sample data copy
```

### What IS in the Repository

- ✅ Source code
- ✅ Documentation
- ✅ Configuration files
- ✅ Empty data folder structure (with README)
- ❌ **NO personal watch history**

## 📁 Data Folder Structure

```
data/
├── README.md           # Instructions (committed to git)
└── watch-history.html  # YOUR data (git-ignored, never committed)
```

## 🔒 Privacy by Design

1. **Automatic Protection**: `.gitignore` prevents accidental commits
2. **Local Only**: Data stays on your machine
3. **No Uploads**: Sample data auto-loads locally, no server needed
4. **Open Source**: All code is visible, no hidden data collection

## 📦 For Development

### Local Setup

The app automatically loads `public/watch-history.html` for development:

```bash
# Copy your data to public folder for local testing
cp data/watch-history.html youtube-wrapped-app/public/

# This file is git-ignored, safe for local dev
```

### Production/Sharing

When sharing the repository:
- Only code and docs are shared
- No personal data included
- Users must get their own watch history from Google Takeout

## 🎯 How to Get Your Data

1. Go to [Google Takeout](https://takeout.google.com)
2. Select **YouTube** → **History** only
3. Download and extract
4. Copy `watch-history.html` to the `data/` folder
5. The app will load it automatically!

## ✅ Verification

Check that your data is properly ignored:

```bash
# Should NOT show data/watch-history.html or public/watch-history.html
git status

# Should show data/ and youtube-wrapped-app/public/watch-history.html
cat .gitignore
```

## 🔐 Security Notes

- **Never** commit personal watch history
- **Never** upload to public repositories
- **Never** share your `watch-history.html` publicly
- The file contains all your viewing history with timestamps

## 🎬 Safe Sharing

You can safely share:
- Screenshots of the dashboard (your choice what to show)
- The GitHub repository (no personal data included)
- Documentation and code
- The concept and implementation

You should NOT share:
- Raw `watch-history.html` file
- Data folder contents
- Exported analytics with personal details

---

**Your privacy is protected by design.** 🔒

The only data that leaves your machine is what you explicitly choose to share (like screenshots or manual exports).
