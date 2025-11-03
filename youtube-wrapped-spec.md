# YouTube Wrapped 2025 - Tessl Specification

## Overview
A Spotify Wrapped-style dashboard that analyzes YouTube watch history from Google Takeout and presents personalized insights through an immersive, data-driven interface.

## Input Specification

### Data Source
- **File**: `watch-history.html` from Google Takeout
- **Format**: HTML with Material Design Lite structure
- **Encoding**: UTF-8
- **Size**: Variable (can be 1MB+)

### HTML Structure Pattern
```html
<div class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">
  Watched <a href="https://www.youtube.com/watch?v={VIDEO_ID}">{VIDEO_TITLE}</a><br>
  <a href="https://www.youtube.com/channel/{CHANNEL_ID}">{CHANNEL_NAME}</a><br>
  {TIMESTAMP}<br>
</div>
```

### Data Fields to Extract
1. **Action Type**: "Watched" or "Viewed" (prefix before video link)
2. **Video ID**: From URL parameter `watch?v=`
3. **Video Title**: Link text content
4. **Channel ID**: From channel URL
5. **Channel Name**: Channel link text content
6. **Timestamp**: Format `DD MMM YYYY, HH:MM:SS GMT`

### Edge Cases to Handle
- Viewed posts (not videos) - should be filtered out
- Missing channel information
- Malformed timestamps
- Special characters in titles (HTML entities)
- Very long video titles (truncation)

## Data Processing Pipeline

### Phase 1: HTML Parsing

**Input**: Raw HTML string
**Output**: Array of watch events

```javascript
interface WatchEvent {
  action: 'watched' | 'viewed';
  videoId: string;
  videoUrl: string;
  title: string;
  channelId: string;
  channelName: string;
  timestamp: Date;
  year: number;
  month: number;      // 0-11
  dayOfWeek: number;  // 0-6 (Sun-Sat)
  dayOfMonth: number; // 1-31
  hour: number;       // 0-23
}
```

**Processing Steps**:
1. Parse HTML and find all `.content-cell` divs
2. For each cell, extract action type using regex: `/(Watched|Viewed)\s+<a/`
3. Extract video URL from first anchor tag
4. Parse video ID from URL query parameter
5. Extract video title from anchor text
6. Extract channel info from second anchor tag
7. Parse timestamp string to Date object
8. Calculate derived time fields (year, month, hour, etc.)
9. Filter out non-video content (posts, community content)

### Phase 2: Data Filtering

**Criteria**:
- Only include year 2025 (configurable)
- Only include "Watched" actions (exclude "Viewed")
- Remove entries with missing critical fields (videoId, timestamp)
- Deduplicate if necessary (keep first occurrence)

### Phase 3: Analytics Calculation

#### Core Metrics

**1. Volume Metrics**
```javascript
{
  totalVideos: number;
  uniqueChannels: number;
  totalHoursEstimated: number; // totalVideos * 10min / 60
  averageVideosPerDay: number;
  dateRange: { start: Date, end: Date };
}
```

**2. Channel Analytics**
```javascript
interface ChannelStats {
  channelName: string;
  channelId: string;
  videoCount: number;
  percentage: number;
  firstWatched: Date;
  lastWatched: Date;
}

// Output: Array sorted by videoCount DESC, top 10
```

**3. Temporal Patterns**
```javascript
{
  byHour: number[];        // Array[24] - count per hour
  byDayOfWeek: number[];   // Array[7] - count per day (Sun-Sat)
  byMonth: number[];       // Array[12] - count per month
  byDate: Map<string, number>; // ISO date string -> count

  peakHour: number;
  peakDay: string;         // "Monday", "Tuesday", etc.
  peakMonth: string;       // "January", "February", etc.

  weekdayCount: number;
  weekendCount: number;
}
```

**4. Binge Detection**
```javascript
interface BingeSession {
  startTime: Date;
  endTime: Date;
  videoCount: number;
  durationMinutes: number;
  videos: Array<{title: string, channel: string}>;
  dominantChannel?: string;
}

// Algorithm:
// 1. Sort events by timestamp
// 2. Group consecutive videos within 2-hour windows
// 3. Sessions with 5+ videos are "binges"
// 4. Sessions with 10+ videos are "rabbit holes"
```

**5. Content Categorization**
```javascript
interface CategoryStats {
  music: number;
  gaming: number;
  education: number;
  entertainment: number;
  tech: number;
  podcasts: number;
  news: number;
  sports: number;
  other: number;
}

// Classification Rules (keywords in title/channel, case-insensitive):
// - Music: "official video", "lyrics", "audio", "song", "music"
// - Gaming: "gameplay", "let's play", "gaming", "walkthrough", "playthrough"
// - Education: "tutorial", "how to", "course", "explained", "lesson", "guide"
// - Entertainment: "vlog", "comedy", "challenge", "prank", "reaction"
// - Tech: "review", "unboxing", "tech", "smartphone", "laptop", "gadget"
// - Podcasts: "podcast", "interview", "talk show"
// - News: "news", "breaking", "headlines"
// - Sports: "match", "game", "highlights", "cricket", "football", "basketball"
```

**6. Rewatch Analysis**
```javascript
interface RewatchStats {
  mostRewatchedVideo: {
    videoId: string;
    title: string;
    channel: string;
    count: number;
  };
  totalRewatches: number;
  rewatchRate: number; // percentage
  comfortChannels: string[]; // Channels with most rewatches
}
```

**7. Fun Facts**
```javascript
interface FunFacts {
  lateNightCount: number;         // 11pm-5am
  earlyBirdCount: number;         // 5am-8am
  firstVideoOf2025: WatchEvent;
  lastVideoOf2025: WatchEvent;
  video1000: WatchEvent | null;
  longestTitle: string;
  mostCommonWord: string;         // Excluding common words
  procrastinationScore: number;   // Weekday 9am-5pm watches
  longestStreak: number;          // Consecutive days with watches
}
```

## UI Specification

### Component Architecture

```
YouTubeWrapped (main component)
├── FileUploader
├── LoadingScreen
└── Dashboard
    ├── Navigation (tabs)
    ├── HeroSection
    ├── ChannelsSection
    ├── PatternsSection
    ├── CategoriesSection
    ├── BingesSection
    └── FunFactsSection
```

### Section 1: Hero Stats

**Layout**: Full-screen centered grid

**Content**:
```javascript
{
  mainMetric: "X,XXX Videos Watched",
  subMetrics: [
    "XXX Hours Estimated",
    "XX Videos/Day Average",
    "Top Channel: {name}"
  ],
  dateRange: "January 1 - December 31, 2025"
}
```

**Styling**:
- Background: Gradient (purple/pink to red)
- Main number: 8xl font, bold
- Sub metrics: 2xl font
- Animated counter effect on load

### Section 2: Top Channels

**Layout**: Vertical list with horizontal bars

**Content**:
```javascript
channels.slice(0, 10).map(channel => ({
  rank: number,
  name: string,
  count: number,
  percentage: string,
  barWidth: string // percentage
}))
```

**Features**:
- #1 channel has special gold styling
- Top 3 have podium colors
- Hover shows additional stats
- Animated bar growth on scroll-in

### Section 3: Watching Patterns

**Sub-section A: Time Heatmap**
- Grid: 7 rows (days) × 24 columns (hours)
- Color scale: light to intense red based on watch count
- Show peak time with highlight
- Tooltip on hover shows exact count

**Sub-section B: Charts**
- Hour distribution: Horizontal bar chart
- Day of week: Vertical bar chart
- Monthly trend: Line chart with area fill
- Weekend vs Weekday: Donut chart

**Insights Box**:
- Badge: "Night Owl" (peak 9pm-3am) or "Early Bird" (5am-9am)
- Text: "Most active on {day}"
- Text: "Binge month: {month}"

### Section 4: Content Categories

**Layout**: Two-column layout

**Left Column**: Pie/Donut chart
- Show all categories with percentages
- Highlight top 3 with labels
- Interactive hover

**Right Column**:
- "Your YouTube Personality" card based on top category
- Category descriptions
- Monthly trend line for top 3 categories

**Personality Mapping**:
- Music dominant → "The Audiophile"
- Gaming dominant → "The Gamer"
- Education dominant → "The Lifelong Learner"
- Entertainment → "The Fun Seeker"
- Mixed → "The Explorer"

### Section 5: Binge Behavior

**Sub-section A: Top Binge Sessions**
```javascript
sessions.slice(0, 5).map(session => ({
  date: formatted date,
  videoCount: number,
  duration: "X hours Y minutes",
  topic: dominant channel or category,
  timeline: visual representation
}))
```

**Sub-section B: Rewatch Stats**
- Card: Most rewatched video (with count)
- List: Comfort content channels
- Metric: Rewatch rate percentage
- Badge: "Rabbit Hole Count" (10+ video sessions)

### Section 6: Fun Facts

**Layout**: Grid of fact cards (2-3 columns)

**Content** (prioritized list):
1. Late night watching count
2. First & last video of 2025
3. Most common title word
4. Procrastination score
5. Video #1000 milestone
6. Longest title
7. Longest watching streak
8. Unusual patterns

**Styling**: Each card has icon, stat, and description

## Technical Implementation

### Tech Stack
- **Framework**: React 18+
- **Build**: Single .jsx file (for simplicity)
- **Charts**: Recharts library
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **HTML Parsing**: Browser DOMParser API

### State Management
```javascript
const [uploadedFile, setUploadedFile] = useState(null);
const [rawData, setRawData] = useState([]);
const [analytics, setAnalytics] = useState(null);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState('hero');
const [yearFilter, setYearFilter] = useState(2025);
```

### Performance Considerations
- Parse HTML in Web Worker (if available)
- Virtualize long lists (channel rankings)
- Lazy load chart components
- Memoize expensive calculations
- Debounce filter changes

### Responsive Design Breakpoints
- Mobile: < 640px (single column, simplified charts)
- Tablet: 640px - 1024px (two columns)
- Desktop: > 1024px (full layout)

## Color Palette

```css
--youtube-red: #FF0000;
--youtube-dark: #282828;
--wrapped-purple: #8b5cf6;
--wrapped-pink: #ec4899;
--bg-light: #fafafa;
--bg-dark: #0f0f0f;
--text-primary: #0f0f0f;
--text-secondary: #606060;
--accent-gold: #ffd700;
--accent-silver: #c0c0c0;
--accent-bronze: #cd7f32;
```

## Error Handling

### File Upload Errors
- Invalid file type → Show error message
- File too large (>50MB) → Warn and attempt anyway
- Parse failure → Show sample of problematic content

### Data Processing Errors
- No 2025 data → Suggest year filter change
- Empty file → Clear error message
- Malformed entries → Skip and log count

### Chart Rendering Errors
- No data for category → Show "No data" placeholder
- Division by zero → Handle gracefully
- Overflow → Truncate with ellipsis

## Success Criteria

- ✅ Parse any valid Google Takeout watch-history.html
- ✅ Display accurate statistics for 2025
- ✅ All 6 sections render correctly
- ✅ Charts are interactive and visually appealing
- ✅ Mobile responsive design works
- ✅ Handles edge cases gracefully
- ✅ Fun, shareable insights
- ✅ Loads and processes within 5 seconds for typical file

## Output Deliverable

**File**: `youtube-wrapped.jsx`

**Usage**:
```bash
# With create-react-app
npm create vite@latest youtube-wrapped -- --template react
cd youtube-wrapped
# Copy youtube-wrapped.jsx to src/
npm install recharts lucide-react
npm run dev
```

**Standalone HTML Version** (bonus):
Single HTML file with inline React/Recharts from CDN for easy sharing.

---

## Implementation Notes for Claude Code

1. Start with HTML parser - test with sample data first
2. Build analytics engine - verify calculations manually
3. Create static UI with mock data
4. Connect data pipeline to UI
5. Add interactivity and polish
6. Test with real watch-history.html file
7. Optimize performance if needed

## Example Data Flow

```
watch-history.html
  → parseHTML()
  → Array<WatchEvent>
  → filterByYear(2025)
  → calculateAnalytics()
  → {
      volume: {...},
      channels: [...],
      patterns: {...},
      categories: {...},
      binges: [...],
      rewatches: {...},
      funFacts: {...}
    }
  → render Dashboard sections
```
