# GitHub Repository Setup

## Quick Setup (Recommended)

### Step 1: Authenticate GitHub CLI

Run this command and follow the prompts:

```bash
gh auth login
```

Choose:
- **GitHub.com** (not Enterprise)
- **HTTPS** protocol
- **Login with a web browser** (easiest)
- Copy the one-time code shown
- Press Enter to open browser
- Paste the code and authorize

### Step 2: Create Repository

After authentication, run:

```bash
gh repo create youtube-wrapped-2025 \
  --public \
  --source=. \
  --description "🎬 Spotify Wrapped-style dashboard for YouTube watch history. Built with React + Tessl for EF x Tessl x Anthropic Hackathon." \
  --push
```

This will:
- Create a public repository named `youtube-wrapped-2025`
- Set it as the remote for this project
- Push all your code to GitHub

### Step 3: Done!

Your repo will be at: `https://github.com/YOUR_USERNAME/youtube-wrapped-2025`

---

## Alternative: Manual Setup

If you prefer to create the repo manually:

### 1. Create on GitHub

Go to [github.com/new](https://github.com/new) and:
- Name: `youtube-wrapped-2025`
- Description: `🎬 Spotify Wrapped-style dashboard for YouTube watch history. Built with React + Tessl for EF x Tessl x Anthropic Hackathon.`
- Visibility: **Public**
- **Don't** initialize with README, .gitignore, or license (we have them)

### 2. Push Code

Run these commands (replace YOUR_USERNAME):

```bash
git remote add origin https://github.com/YOUR_USERNAME/youtube-wrapped-2025.git
git branch -M main
git push -u origin main
```

---

## Repository Details

### Suggested Settings

**About Section** (on GitHub):
- Description: `🎬 Spotify Wrapped-style dashboard for YouTube watch history`
- Website: (if you deploy it)
- Topics: `youtube`, `react`, `data-visualization`, `hackathon`, `tessl`, `wrapped`, `analytics`

**README Badge Ideas**:
```markdown
![React](https://img.shields.io/badge/React-19.1-blue)
![Vite](https://img.shields.io/badge/Vite-7.1-purple)
![License](https://img.shields.io/badge/license-MIT-green)
```

### Files Included in Repo

✅ Complete source code
✅ Tessl specification
✅ Full documentation (README, QUICKSTART, HACKATHON_SUMMARY)
✅ Sample data
✅ .gitignore (node_modules excluded)

### What's NOT Included

❌ `node_modules/` (users run `npm install`)
❌ `.claude/` (editor cache)
❌ Build artifacts

---

## Next Steps After Pushing

1. **Add Topics**: Go to repo → About → Settings (gear icon) → Add topics
2. **Enable GitHub Pages** (optional): Settings → Pages → Deploy from `main` branch
3. **Share**: Copy the repo URL for your hackathon submission
4. **Star it**: Give yourself a star! ⭐

---

## Quick Commands Reference

```bash
# Authenticate (one-time)
gh auth login

# Create and push repo
gh repo create youtube-wrapped-2025 --public --source=. --description "🎬 YouTube Wrapped dashboard" --push

# Or manually
git remote add origin https://github.com/USERNAME/youtube-wrapped-2025.git
git push -u origin main

# View your repo
gh repo view --web
```

---

Ready to create your GitHub repo? Run the commands above! 🚀
