import fs from 'fs';
import { JSDOM } from 'jsdom';

// Read the HTML file
const html = fs.readFileSync('./public/watch-history.html', 'utf8');

// Parse with JSDOM
const dom = new JSDOM(html);
const doc = dom.window.document;

const contentCells = doc.querySelectorAll('.content-cell');
console.log('Total content cells found:', contentCells.length);

let parsed = 0;
let skipped = 0;

for (let i = 0; i < Math.min(10, contentCells.length); i += 3) {
  const cell = contentCells[i];
  const textContent = cell.innerHTML;

  console.log('\n--- Cell', i, '---');
  console.log('First 200 chars:', textContent.substring(0, 200));

  // Check for action
  const actionMatch = textContent.match(/(Watched|Viewed)(?:\s|&nbsp;)+<a/);
  console.log('Action match:', actionMatch ? actionMatch[1] : 'NONE');

  if (!actionMatch) {
    skipped++;
    continue;
  }

  // Check for video link
  const videoLink = cell.querySelector('a[href*="watch?v="]');
  console.log('Video link found:', !!videoLink);

  if (!videoLink) {
    skipped++;
    console.log('SKIPPED: No video link');
    continue;
  }

  const videoUrl = videoLink.getAttribute('href');
  console.log('Video URL:', videoUrl);

  // Extract video ID
  const videoIdMatch = videoUrl.match(/[?&]v=([^&]+)/);
  console.log('Video ID match:', videoIdMatch ? videoIdMatch[1] : 'NONE');

  if (!videoIdMatch) {
    skipped++;
    console.log('SKIPPED: No video ID');
    continue;
  }

  const title = videoLink.textContent.trim();
  console.log('Title:', title);

  // Check for channel
  const channelLink = cell.querySelector('a[href*="/channel/"]');
  console.log('Channel found:', !!channelLink);
  if (channelLink) {
    console.log('Channel:', channelLink.textContent.trim());
  }

  // Check for timestamp
  const timestampMatch = textContent.match(/(\d{1,2}\s+\w+\s+\d{4},\s+\d{2}:\d{2}:\d{2}\s+GMT)/);
  console.log('Timestamp match:', timestampMatch ? timestampMatch[1] : 'NONE');

  if (timestampMatch) {
    const timestamp = new Date(timestampMatch[1]);
    console.log('Parsed date:', timestamp);
    console.log('Year:', timestamp.getFullYear());
  }

  parsed++;
}

console.log('\n\n=== SUMMARY ===');
console.log('Cells checked:', Math.min(10, contentCells.length));
console.log('Parsed successfully:', parsed);
console.log('Skipped:', skipped);
