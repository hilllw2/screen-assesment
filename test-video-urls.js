#!/usr/bin/env node

/**
 * Test Video URLs Configuration
 * 
 * This script verifies that all video URLs are properly configured
 * and accessible from AWS S3.
 */

const https = require('https');
const videoConfig = require('./src/config/video-urls.json');

const VIDEO_NAMES = {
  'Writing-Assessment-Instructions.mp4': 'Writing Instructions',
  'Writing-Assessment-Task.mp4': 'Writing Task 1',
  'Writing-Assessment-Task-2.mp4': 'Writing Task 2',
  'Writing-Assessment-Task-3.mp4': 'Writing Task 3',
  'Writing-Assessment-Task-4.mp4': 'Writing Task 4',
  'Writing-Assessment-Task-5.mp4': 'Writing Task 5',
  'Verbal-Assessment-Overview.mp4': 'Verbal Overview',
  'Verbal-Assessment-Video-7-Start-Instructions.mp4': 'Verbal Start Instructions',
  'Verbal-Assessment-Video-8-Question-1-Preparation.mp4': 'Verbal Q1 Prep',
  'Verbal-Assessment-Video-9-Question-1.mp4': 'Verbal Q1',
  'Verbal-Assessment-Video-10-Question-2-Preparation.mp4': 'Verbal Q2 Prep',
  'Verbal-Assessment-Video-11-Question-2.mp4': 'Verbal Q2',
  'Verbal-Assessment-Video-14-Question-3-Preparation.mp4': 'Verbal Q3 Prep',
  'Verbal-Assessment-Video-15-Question-3.mp4': 'Verbal Q3',
  'Verbal-Assessment-Video-16-Ending.mp4': 'Verbal Ending',
};

function checkUrl(url, name) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${name}: Accessible`);
        resolve(true);
      } else if (res.statusCode === 403) {
        console.log(`❌ ${name}: Forbidden (need to apply bucket policy)`);
        resolve(false);
      } else {
        console.log(`⚠️  ${name}: ${res.statusCode} ${res.statusMessage}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⚠️  ${name}: Timeout`);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Video URLs Configuration...\n');
  console.log(`Bucket: ${videoConfig.bucket}`);
  console.log(`Region: ${videoConfig.region}`);
  console.log(`Last Updated: ${videoConfig.lastUpdated}\n`);

  const videos = videoConfig.videos;
  const results = [];

  for (const [filename, url] of Object.entries(videos)) {
    const name = VIDEO_NAMES[filename] || filename;
    const result = await checkUrl(url, name);
    results.push({ filename, result });
  }

  console.log('\n📊 Summary:');
  const accessible = results.filter(r => r.result).length;
  const total = results.length;
  
  console.log(`   Accessible: ${accessible}/${total} videos`);

  if (accessible === 0) {
    console.log('\n⚠️  All videos returned 403 Forbidden');
    console.log('   You need to apply the bucket policy to make them public.');
    console.log('   See AWS_S3_VIDEO_SETUP.md for instructions.\n');
    process.exit(1);
  } else if (accessible < total) {
    console.log('\n⚠️  Some videos are not accessible');
    console.log('   Check your bucket policy and try again.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All videos are accessible! You\'re good to go! 🎉\n');
    process.exit(0);
  }
}

main().catch(console.error);
