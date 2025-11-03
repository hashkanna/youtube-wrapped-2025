import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  Upload, Trophy, Clock, Calendar, TrendingUp, Zap,
  Play, Heart, Star, Award, Coffee, Moon, Sun, Target
} from 'lucide-react';

// ============================================================================
// DATA PROCESSING FUNCTIONS
// ============================================================================

function parseWatchHistory(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const contentCells = doc.querySelectorAll('.content-cell');

  const events = [];

  for (let i = 0; i < contentCells.length; i += 3) {
    try {
      const cell = contentCells[i];
      const textContent = cell.innerHTML;

      // Check if it's a watched/viewed action
      const actionMatch = textContent.match(/(Watched|Viewed)\s+<a/);
      if (!actionMatch) continue;

      const action = actionMatch[1].toLowerCase();

      // Extract video link
      const videoLink = cell.querySelector('a[href*="watch?v="]');
      if (!videoLink) continue; // Skip non-video content

      const videoUrl = videoLink.getAttribute('href');
      const videoId = new URL(videoUrl).searchParams.get('v');
      const title = videoLink.textContent.trim();

      // Extract channel link
      const channelLink = cell.querySelector('a[href*="/channel/"]');
      let channelName = 'Unknown Channel';
      let channelId = '';

      if (channelLink) {
        channelName = channelLink.textContent.trim();
        channelId = channelLink.getAttribute('href').split('/channel/')[1];
      }

      // Extract timestamp
      const timestampMatch = textContent.match(/(\d{1,2}\s+\w+\s+\d{4},\s+\d{2}:\d{2}:\d{2}\s+GMT)/);
      if (!timestampMatch) continue;

      const timestamp = new Date(timestampMatch[1]);

      // Only include "Watched" actions with valid data
      if (action === 'watched' && videoId && !isNaN(timestamp.getTime())) {
        events.push({
          action,
          videoId,
          videoUrl,
          title,
          channelId,
          channelName,
          timestamp,
          year: timestamp.getFullYear(),
          month: timestamp.getMonth(),
          dayOfWeek: timestamp.getDay(),
          dayOfMonth: timestamp.getDate(),
          hour: timestamp.getHours()
        });
      }
    } catch (error) {
      console.warn('Error parsing event:', error);
      continue;
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

function filterByYear(events, year) {
  return events.filter(e => e.year === year);
}

function calculateAnalytics(events) {
  if (!events || events.length === 0) {
    return null;
  }

  // Volume metrics
  const totalVideos = events.length;
  const uniqueChannels = new Set(events.map(e => e.channelName)).size;
  const totalHoursEstimated = Math.round((totalVideos * 10) / 60);
  const dateRange = {
    start: events[0].timestamp,
    end: events[events.length - 1].timestamp
  };
  const daysDiff = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) || 1;
  const averageVideosPerDay = (totalVideos / daysDiff).toFixed(1);

  // Channel stats
  const channelCounts = {};
  events.forEach(e => {
    if (!channelCounts[e.channelName]) {
      channelCounts[e.channelName] = {
        channelName: e.channelName,
        channelId: e.channelId,
        videoCount: 0,
        firstWatched: e.timestamp,
        lastWatched: e.timestamp
      };
    }
    channelCounts[e.channelName].videoCount++;
    channelCounts[e.channelName].lastWatched = e.timestamp;
  });

  const channelStats = Object.values(channelCounts)
    .map(c => ({
      ...c,
      percentage: ((c.videoCount / totalVideos) * 100).toFixed(1)
    }))
    .sort((a, b) => b.videoCount - a.videoCount);

  // Temporal patterns
  const byHour = new Array(24).fill(0);
  const byDayOfWeek = new Array(7).fill(0);
  const byMonth = new Array(12).fill(0);
  const byDate = {};

  events.forEach(e => {
    byHour[e.hour]++;
    byDayOfWeek[e.dayOfWeek]++;
    byMonth[e.month]++;
    const dateKey = e.timestamp.toISOString().split('T')[0];
    byDate[dateKey] = (byDate[dateKey] || 0) + 1;
  });

  const peakHour = byHour.indexOf(Math.max(...byHour));
  const peakDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));
  const peakMonth = byMonth.indexOf(Math.max(...byMonth));

  const weekdayCount = byDayOfWeek.slice(1, 6).reduce((a, b) => a + b, 0);
  const weekendCount = byDayOfWeek[0] + byDayOfWeek[6];

  // Binge detection
  const binges = [];
  let currentBinge = [];

  for (let i = 0; i < events.length; i++) {
    if (currentBinge.length === 0) {
      currentBinge.push(events[i]);
    } else {
      const lastEvent = currentBinge[currentBinge.length - 1];
      const timeDiff = (events[i].timestamp - lastEvent.timestamp) / (1000 * 60); // minutes

      if (timeDiff <= 120) { // Within 2 hours
        currentBinge.push(events[i]);
      } else {
        if (currentBinge.length >= 5) {
          binges.push(createBingeSession(currentBinge));
        }
        currentBinge = [events[i]];
      }
    }
  }

  if (currentBinge.length >= 5) {
    binges.push(createBingeSession(currentBinge));
  }

  binges.sort((a, b) => b.videoCount - a.videoCount);

  // Categories
  const categories = categorizeContent(events);

  // Rewatch analysis
  const videoViews = {};
  events.forEach(e => {
    videoViews[e.videoId] = videoViews[e.videoId] || [];
    videoViews[e.videoId].push(e);
  });

  const rewatched = Object.entries(videoViews)
    .filter(([_, views]) => views.length > 1)
    .map(([videoId, views]) => ({
      videoId,
      title: views[0].title,
      channel: views[0].channelName,
      count: views.length
    }))
    .sort((a, b) => b.count - a.count);

  const mostRewatchedVideo = rewatched[0] || null;
  const totalRewatches = rewatched.reduce((sum, r) => sum + r.count - 1, 0);
  const rewatchRate = ((totalRewatches / totalVideos) * 100).toFixed(1);

  // Find comfort channels (channels with most rewatches)
  const channelRewatches = {};
  rewatched.forEach(r => {
    channelRewatches[r.channel] = (channelRewatches[r.channel] || 0) + r.count - 1;
  });
  const comfortChannels = Object.entries(channelRewatches)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // Fun facts
  const lateNightCount = events.filter(e => e.hour >= 23 || e.hour < 5).length;
  const earlyBirdCount = events.filter(e => e.hour >= 5 && e.hour < 8).length;
  const firstVideoOf2025 = events[0];
  const lastVideoOf2025 = events[events.length - 1];
  const video1000 = events[999] || null;

  const longestTitle = events.reduce((longest, e) =>
    e.title.length > longest.length ? e.title : longest, '');

  const wordCounts = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

  events.forEach(e => {
    const words = e.title.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });

  const mostCommonWord = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'video';

  const procrastinationScore = events.filter(e =>
    e.dayOfWeek >= 1 && e.dayOfWeek <= 5 && e.hour >= 9 && e.hour <= 17
  ).length;

  // Calculate longest streak
  const dates = Object.keys(byDate).sort();
  let longestStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const dayDiff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return {
    volume: {
      totalVideos,
      uniqueChannels,
      totalHoursEstimated,
      averageVideosPerDay,
      dateRange
    },
    channels: channelStats,
    patterns: {
      byHour,
      byDayOfWeek,
      byMonth,
      byDate,
      peakHour,
      peakDay,
      peakMonth,
      weekdayCount,
      weekendCount
    },
    categories,
    binges,
    rewatches: {
      mostRewatchedVideo,
      totalRewatches,
      rewatchRate,
      comfortChannels
    },
    funFacts: {
      lateNightCount,
      earlyBirdCount,
      firstVideoOf2025,
      lastVideoOf2025,
      video1000,
      longestTitle,
      mostCommonWord,
      procrastinationScore,
      longestStreak: longestStreak || 1,
      rabbitHoleCount: binges.filter(b => b.videoCount >= 10).length
    }
  };
}

function createBingeSession(events) {
  const channelCounts = {};
  events.forEach(e => {
    channelCounts[e.channelName] = (channelCounts[e.channelName] || 0) + 1;
  });

  const dominantChannel = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    startTime: events[0].timestamp,
    endTime: events[events.length - 1].timestamp,
    videoCount: events.length,
    durationMinutes: Math.round((events[events.length - 1].timestamp - events[0].timestamp) / (1000 * 60)),
    videos: events.map(e => ({ title: e.title, channel: e.channelName })),
    dominantChannel
  };
}

function categorizeContent(events) {
  const categories = {
    music: 0,
    gaming: 0,
    education: 0,
    entertainment: 0,
    tech: 0,
    podcasts: 0,
    news: 0,
    sports: 0,
    other: 0
  };

  const rules = {
    music: /official\s+video|lyrics|audio|song|music|mv|album/i,
    gaming: /gameplay|let'?s\s+play|gaming|walkthrough|playthrough|game|stream/i,
    education: /tutorial|how\s+to|course|explained|lesson|guide|learn|teach/i,
    entertainment: /vlog|comedy|challenge|prank|reaction|funny|meme/i,
    tech: /review|unboxing|tech|smartphone|laptop|gadget|iphone|android|samsung/i,
    podcasts: /podcast|interview|talk\s+show|conversation/i,
    news: /news|breaking|headlines|report/i,
    sports: /match|game|highlights|cricket|football|basketball|soccer|tennis|sports/i
  };

  events.forEach(e => {
    const text = `${e.title} ${e.channelName}`;
    let categorized = false;

    for (const [category, pattern] of Object.entries(rules)) {
      if (pattern.test(text)) {
        categories[category]++;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.other++;
    }
  });

  return categories;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const COLORS = {
  youtubeRed: '#FF0000',
  youtubeDark: '#282828',
  wrappedPurple: '#8b5cf6',
  wrappedPink: '#ec4899',
  bgLight: '#fafafa',
  textPrimary: '#0f0f0f',
  textSecondary: '#606060',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32'
};

const CHART_COLORS = [
  '#FF0000', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#6366f1', '#f43f5e', '#14b8a6', '#a855f7'
];

function FileUploader({ onFileLoad }) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileLoad(e.target.result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">YouTube Wrapped 2025</h1>
          <p className="text-xl text-white/90">Discover your year in YouTube</p>
        </div>

        <div
          className={`bg-white rounded-3xl shadow-2xl p-12 border-4 border-dashed transition-all ${
            dragActive ? 'border-purple-500 scale-105' : 'border-gray-300'
          }`}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="w-20 h-20 mx-auto mb-6 text-purple-500" />
            <h2 className="text-2xl font-semibold mb-4">Upload Your Watch History</h2>
            <p className="text-gray-600 mb-8">
              Drop your <code className="bg-gray-100 px-2 py-1 rounded">watch-history.html</code> file here
              <br />or click to browse
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".html"
                onChange={handleChange}
                className="hidden"
              />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold cursor-pointer hover:scale-105 transition-transform inline-block">
                Choose File
              </span>
            </label>
            <div className="mt-8 text-sm text-gray-500">
              <p>Get your watch history from <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google Takeout</a></p>
              <p className="mt-2">Select YouTube → History → watch-history.html</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-white mx-auto mb-6"></div>
        <p className="text-2xl text-white font-semibold">Analyzing your YouTube journey...</p>
      </div>
    </div>
  );
}

function HeroSection({ analytics }) {
  const { volume } = analytics;
  const topChannel = analytics.channels[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-8 text-white">
      <div className="text-center max-w-4xl">
        <h2 className="text-2xl mb-4 opacity-90">Your 2025 YouTube Wrapped</h2>
        <div className="mb-12">
          <div className="text-8xl font-bold mb-4 animate-pulse">
            {volume.totalVideos.toLocaleString()}
          </div>
          <div className="text-3xl opacity-90">Videos Watched</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xl">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <div className="text-4xl font-bold mb-2">{volume.totalHoursEstimated}</div>
            <div className="opacity-90">Hours Estimated</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <TrendingUp className="w-12 h-12 mx-auto mb-3" />
            <div className="text-4xl font-bold mb-2">{volume.averageVideosPerDay}</div>
            <div className="opacity-90">Videos Per Day</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <Trophy className="w-12 h-12 mx-auto mb-3" />
            <div className="text-2xl font-bold mb-2">{topChannel.channelName}</div>
            <div className="opacity-90">Favorite Channel</div>
            <div className="text-sm mt-2">{topChannel.videoCount} videos</div>
          </div>
        </div>

        <div className="mt-12 text-lg opacity-75">
          {new Date(volume.dateRange.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(volume.dateRange.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

function ChannelsSection({ channels }) {
  const top10 = channels.slice(0, 10);
  const maxCount = top10[0].videoCount;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-bold mb-12 text-center">Top Channels</h2>

        <div className="space-y-4">
          {top10.map((channel, index) => (
            <div
              key={channel.channelName}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold w-12 ${
                  index === 0 ? 'text-yellow-500' :
                  index === 1 ? 'text-gray-400' :
                  index === 2 ? 'text-orange-600' :
                  'text-gray-300'
                }`}>
                  {index === 0 && <Trophy className="w-12 h-12" />}
                  {index > 0 && `#${index + 1}`}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold">{channel.channelName}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{channel.videoCount}</div>
                      <div className="text-sm text-gray-500">{channel.percentage}%</div>
                    </div>
                  </div>

                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(channel.videoCount / maxCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatternsSection({ patterns }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const hourData = patterns.byHour.map((count, hour) => ({
    hour: `${hour}:00`,
    videos: count
  }));

  const dayData = patterns.byDayOfWeek.map((count, day) => ({
    day: days[day],
    videos: count
  }));

  const monthData = patterns.byMonth.map((count, month) => ({
    month: months[month],
    videos: count
  }));

  const badge = patterns.peakHour >= 21 || patterns.peakHour < 5 ? 'Night Owl' :
                patterns.peakHour >= 5 && patterns.peakHour < 9 ? 'Early Bird' :
                'Daytime Watcher';

  const badgeIcon = badge === 'Night Owl' ? Moon : badge === 'Early Bird' ? Sun : Clock;
  const BadgeIcon = badgeIcon;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold mb-12 text-center">Watching Patterns</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 text-center">
            <BadgeIcon className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <div className="text-2xl font-bold mb-2">{badge}</div>
            <div className="text-gray-600">Peak hour: {patterns.peakHour}:00</div>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <div className="text-2xl font-bold mb-2">Most Active</div>
            <div className="text-gray-600">{days[patterns.peakDay]}</div>
          </div>

          <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl p-6 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <div className="text-2xl font-bold mb-2">Binge Month</div>
            <div className="text-gray-600">{months[patterns.peakMonth]}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-2xl font-semibold mb-4">By Hour of Day</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="videos" fill={COLORS.wrappedPurple} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-2xl font-semibold mb-4">By Day of Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="videos" fill={COLORS.wrappedPink} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-2xl font-semibold mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="videos" stroke={COLORS.youtubeRed} fill={COLORS.youtubeRed} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-2xl font-semibold mb-4">Weekend vs Weekday</h3>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-purple-600 mb-2">{patterns.weekdayCount}</div>
                <div className="text-xl text-gray-600">Weekday Videos</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-pink-600 mb-2">{patterns.weekendCount}</div>
                <div className="text-xl text-gray-600">Weekend Videos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesSection({ categories, analytics }) {
  const categoryData = Object.entries(categories)
    .map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: count
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const topCategory = categoryData[0]?.name.toLowerCase() || 'mixed';

  const personalities = {
    music: { name: 'The Audiophile', desc: 'Your ears are always craving the next beat' },
    gaming: { name: 'The Gamer', desc: 'Living vicariously through gameplay' },
    education: { name: 'The Lifelong Learner', desc: 'Knowledge is your superpower' },
    entertainment: { name: 'The Fun Seeker', desc: 'Life is too short to be serious' },
    tech: { name: 'The Tech Enthusiast', desc: 'Always hunting for the next gadget' },
    podcasts: { name: 'The Conversationalist', desc: 'Deep dives and long talks' },
    news: { name: 'The Informed Citizen', desc: 'Staying connected to the world' },
    sports: { name: 'The Sports Fan', desc: 'Every game matters' }
  };

  const personality = personalities[topCategory] || { name: 'The Explorer', desc: 'A true YouTube adventurer' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold mb-12 text-center">Content Categories</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <Star className="w-16 h-16 text-yellow-500 mb-4" />
              <h3 className="text-3xl font-bold mb-2">You are...</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {personality.name}
              </div>
              <p className="text-xl text-gray-600">{personality.desc}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-xl font-semibold mb-4">Top 3 Categories</h4>
              <div className="space-y-3">
                {categoryData.slice(0, 3).map((cat, index) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full`} style={{ backgroundColor: CHART_COLORS[index] }}></div>
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-700">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BingesSection({ binges, rewatches }) {
  const top5Binges = binges.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold mb-12 text-center">Binge Behavior</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-8 h-8 text-yellow-400" />
              Top Binge Sessions
            </h3>
            <div className="space-y-4">
              {top5Binges.map((binge, index) => (
                <div key={index} className="bg-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xl font-bold text-purple-400">{binge.videoCount} videos</div>
                      <div className="text-sm text-gray-400">
                        {new Date(binge.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{Math.floor(binge.durationMinutes / 60)}h {binge.durationMinutes % 60}m</div>
                      <div className="text-sm text-gray-400">duration</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    Mostly: <span className="font-semibold text-pink-400">{binge.dominantChannel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {rewatches.mostRewatchedVideo && (
              <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-8 h-8 text-red-400" />
                  Most Rewatched
                </h3>
                <div className="text-xl font-semibold mb-2">{rewatches.mostRewatchedVideo.title}</div>
                <div className="text-gray-300 mb-4">{rewatches.mostRewatchedVideo.channel}</div>
                <div className="text-4xl font-bold text-pink-400">{rewatches.mostRewatchedVideo.count}x</div>
              </div>
            )}

            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-2xl font-semibold mb-4">Rewatch Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-purple-400">{rewatches.rewatchRate}%</div>
                  <div className="text-gray-400">Rewatch Rate</div>
                </div>
                {rewatches.comfortChannels.length > 0 && (
                  <div>
                    <div className="text-lg font-semibold mb-2">Comfort Channels:</div>
                    <div className="space-y-1">
                      {rewatches.comfortChannels.map((channel, i) => (
                        <div key={i} className="text-pink-400">{channel}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunFactsSection({ funFacts }) {
  const facts = [
    {
      icon: Moon,
      label: 'Late Night Videos',
      value: funFacts.lateNightCount,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      icon: Sun,
      label: 'Early Bird Sessions',
      value: funFacts.earlyBirdCount,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Coffee,
      label: 'Procrastination Score',
      value: funFacts.procrastinationScore,
      desc: 'Videos during work hours',
      color: 'from-brown-500 to-amber-600'
    },
    {
      icon: Target,
      label: 'Longest Streak',
      value: `${funFacts.longestStreak} days`,
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Zap,
      label: 'Rabbit Holes',
      value: funFacts.rabbitHoleCount,
      desc: '10+ video sessions',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: Award,
      label: 'Most Common Word',
      value: funFacts.mostCommonWord,
      color: 'from-blue-500 to-cyan-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-bold mb-12 text-center">Fun Facts</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {facts.map((fact, index) => {
            const Icon = fact.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${fact.color} rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform`}
              >
                <Icon className="w-12 h-12 mb-4" />
                <div className="text-4xl font-bold mb-2">{fact.value}</div>
                <div className="text-lg opacity-90">{fact.label}</div>
                {fact.desc && <div className="text-sm opacity-75 mt-1">{fact.desc}</div>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {funFacts.firstVideoOf2025 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Play className="w-8 h-8" />
                First Video of 2025
              </h3>
              <div className="text-lg font-semibold mb-2">{funFacts.firstVideoOf2025.title}</div>
              <div className="text-gray-300">{funFacts.firstVideoOf2025.channelName}</div>
              <div className="text-sm text-gray-400 mt-2">
                {new Date(funFacts.firstVideoOf2025.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {funFacts.lastVideoOf2025 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Play className="w-8 h-8" />
                Latest Video
              </h3>
              <div className="text-lg font-semibold mb-2">{funFacts.lastVideoOf2025.title}</div>
              <div className="text-gray-300">{funFacts.lastVideoOf2025.channelName}</div>
              <div className="text-sm text-gray-400 mt-2">
                {new Date(funFacts.lastVideoOf2025.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {funFacts.video1000 && (
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-8 h-8" />
                Video #1000 Milestone!
              </h3>
              <div className="text-xl font-semibold mb-2">{funFacts.video1000.title}</div>
              <div className="text-gray-100">{funFacts.video1000.channelName}</div>
            </div>
          )}

          {funFacts.longestTitle && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-2xl font-semibold mb-4">Longest Title Award</h3>
              <div className="text-sm italic">{funFacts.longestTitle}</div>
              <div className="text-xs text-gray-400 mt-2">{funFacts.longestTitle.length} characters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function YouTubeWrapped() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hero');
  const [yearFilter] = useState(2025);

  // Auto-load the sample data on mount
  React.useEffect(() => {
    fetch('/watch-history.html')
      .then(response => response.text())
      .then(content => {
        console.log('Loaded file, length:', content.length);
        setHtmlContent(content);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading file:', error);
        setLoading(false);
      });
  }, []);

  const analytics = useMemo(() => {
    if (!htmlContent) return null;

    try {
      const events = parseWatchHistory(htmlContent);
      console.log('Parsed events:', events.length);
      const filtered = filterByYear(events, yearFilter);
      console.log('Filtered events for 2025:', filtered.length);
      const result = calculateAnalytics(filtered);
      console.log('Analytics:', result);
      return result;
    } catch (error) {
      console.error('Error processing data:', error);
      return null;
    }
  }, [htmlContent, yearFilter]);

  const handleFileLoad = (content) => {
    setLoading(true);
    setTimeout(() => {
      setHtmlContent(content);
      setLoading(false);
    }, 1000);
  };

  if (!htmlContent) {
    return <FileUploader onFileLoad={handleFileLoad} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Error Processing Data</h2>
          <p className="text-gray-600 mb-6">Could not analyze your watch history. Please try again.</p>
          <button
            onClick={() => setHtmlContent(null)}
            className="bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'hero', label: 'Overview', component: HeroSection },
    { id: 'channels', label: 'Top Channels', component: ChannelsSection },
    { id: 'patterns', label: 'Patterns', component: PatternsSection },
    { id: 'categories', label: 'Categories', component: CategoriesSection },
    { id: 'binges', label: 'Binges', component: BingesSection },
    { id: 'funfacts', label: 'Fun Facts', component: FunFactsSection }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || HeroSection;

  return (
    <div className="relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Play className="w-8 h-8 text-red-600" />
              <span className="font-bold text-xl">YouTube Wrapped 2025</span>
            </div>
            <div className="flex space-x-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHtmlContent(null)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Upload New
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {activeTab === 'hero' && <HeroSection analytics={analytics} />}
        {activeTab === 'channels' && <ChannelsSection channels={analytics.channels} />}
        {activeTab === 'patterns' && <PatternsSection patterns={analytics.patterns} />}
        {activeTab === 'categories' && <CategoriesSection categories={analytics.categories} analytics={analytics} />}
        {activeTab === 'binges' && <BingesSection binges={analytics.binges} rewatches={analytics.rewatches} />}
        {activeTab === 'funfacts' && <FunFactsSection funFacts={analytics.funFacts} />}
      </div>
    </div>
  );
}
