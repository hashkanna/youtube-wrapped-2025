# Screenshot Instructions

To add demo screenshots to the repository:

## How to Take Screenshots

1. **Open the dashboard**: http://localhost:5173
2. **Upload your watch history** or let it auto-load
3. **Navigate to each section** and take screenshots

## Recommended Screenshots

### Required Screenshots (for README):

1. **`hero-section.png`** - Overview section with big stats
   - Shows total videos, hours, favorite channel
   - Full screen capture

2. **`binge-session-thumbnails.png`** - Binge section with thumbnail grids
   - Shows the thumbnail grids feature
   - Highlights interactivity

3. **`fun-facts-thumbnails.png`** - Fun facts with video thumbnails
   - Shows first/last video thumbnails
   - Demonstrates clickable features

### Optional Screenshots (for presentation):

4. **`top-channels.png`** - Top 10 channels ranking
5. **`patterns-heatmap.png`** - Time patterns and heatmap
6. **`categories-pie.png`** - Content categories breakdown

## Screenshot Settings

- **Resolution**: 1920x1080 or higher
- **Format**: PNG (for quality) or JPG (for size)
- **Browser**: Chrome/Firefox (hide dev tools)
- **Zoom**: 100% or 90% for better fit

## Where to Save

Save screenshots to: `assets/screenshots/`

Example:
```
assets/
└── screenshots/
    ├── hero-section.png
    ├── binge-session-thumbnails.png
    ├── fun-facts-thumbnails.png
    ├── top-channels.png
    ├── patterns-heatmap.png
    └── categories-pie.png
```

## After Taking Screenshots

1. Add the files to git:
   ```bash
   git add assets/screenshots/*.png
   ```

2. Commit:
   ```bash
   git commit -m "Add demo screenshots"
   ```

3. Push:
   ```bash
   git push
   ```

The README will automatically display them once uploaded!
