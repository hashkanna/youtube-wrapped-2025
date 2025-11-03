# YouTube Wrapped 2025 - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the App (30 seconds)

```bash
cd youtube-wrapped-app
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

### Step 2: Get Your Data (5 minutes)

**Option A: Use the included sample data**
- The project includes `youtube_data/watch-history.html`
- Just drag and drop it into the app!

**Option B: Use your own YouTube history**
1. Go to [takeout.google.com](https://takeout.google.com)
2. Click "Deselect all"
3. Scroll to YouTube → Check the box
4. Click "All YouTube data included"
5. Uncheck everything except "history"
6. Click "Next step" → "Create export"
7. Wait for email (usually 5-10 minutes)
8. Download and extract the ZIP
9. Find `Takeout/YouTube/history/watch-history.html`

### Step 3: Upload & Explore (1 minute)

1. Open http://localhost:5173 in your browser
2. Drag and drop `watch-history.html` onto the upload zone
3. Wait 1-5 seconds for processing
4. Explore your YouTube Wrapped!

---

## 📱 What You'll See

### 6 Interactive Sections

**Tab Navigation at the top**:
1. **Overview** - Big hero stats
2. **Top Channels** - Your most-watched creators
3. **Patterns** - When you watch (heatmaps, charts)
4. **Categories** - What you watch (with personality type!)
5. **Binges** - Your marathon sessions + rewatches
6. **Fun Facts** - Quirky insights and milestones

---

## 🎯 For Hackathon Judges

### Key Files to Review

1. **`youtube-wrapped-spec.md`** ⭐ - The comprehensive Tessl specification
2. **`youtube-wrapped-app/src/App.jsx`** - Implementation matching the spec
3. **`README.md`** - Full documentation
4. **`HACKATHON_SUMMARY.md`** - Detailed submission notes

### What Makes This Special

✅ **Spec-First**: Wrote 400+ line specification before coding
✅ **Real Data**: Works with actual Google Takeout HTML files
✅ **Complete**: All 6 sections fully implemented
✅ **Polished**: Beautiful UI with Recharts visualizations
✅ **Fast**: Processes thousands of videos in seconds

### Try It Out

The easiest way to see it in action:

```bash
cd youtube-wrapped-app
npm run dev
```

Then upload the included sample file at `../youtube_data/watch-history.html`

You'll see:
- Late-night watching patterns (2am peak!)
- Tamil music binge session detected
- Mix of music, tech, sports content
- "Night Owl" badge
- Fun facts like "You watched 15 videos at 2am"

---

## 🛠️ Troubleshooting

### Port already in use?

```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Dependencies not installing?

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "No data for 2025"?

The app filters for 2025 by default. To change the year:

Edit `src/App.jsx` line ~1034:
```javascript
const [yearFilter] = useState(2024); // Change to your year
```

### Still having issues?

Check the browser console (F12) for error messages.

---

## 📊 Expected Results with Sample Data

The included sample `watch-history.html` shows:

- **Total Videos**: ~20 videos
- **Top Channel**: Various Tamil music channels
- **Peak Hour**: 2am (classic night owl behavior!)
- **Categories**: Mostly music with some tech and sports
- **Binge Session**: Multiple consecutive music videos
- **Fun Facts**: Late-night watching, specific timestamps

---

## 🎨 Customization

### Change Colors

Edit `src/App.jsx` around line 420:

```javascript
const COLORS = {
  youtubeRed: '#FF0000',
  wrappedPurple: '#8b5cf6',
  // Customize here!
};
```

### Add Categories

Edit the `categorizeContent()` function around line 230:

```javascript
const rules = {
  music: /official\s+video|lyrics/i,
  // Add your category here
  anime: /anime|manga|otaku/i,
};
```

---

## 💻 Development

### Project Structure

```
youtube-wrapped-app/
├── src/
│   ├── App.jsx          # Main component (1000+ lines)
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind styles
├── public/              # Static assets
├── index.html           # HTML template
└── package.json         # Dependencies
```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

### Deploy

The built app is just static HTML/CSS/JS, so you can deploy to:
- Vercel: `npm install -g vercel && vercel`
- Netlify: Drag `dist/` folder to netlify.com
- GitHub Pages: Push `dist/` to gh-pages branch

---

## 📚 Documentation

- **Full Spec**: `youtube-wrapped-spec.md`
- **User Guide**: `README.md`
- **Submission Notes**: `HACKATHON_SUMMARY.md`
- **This Guide**: `QUICKSTART.md`

---

## 🎉 That's It!

You're ready to explore your YouTube Wrapped 2025!

Questions? Check the detailed README.md or HACKATHON_SUMMARY.md.

Built with Tessl + Claude Code | November 3, 2025
