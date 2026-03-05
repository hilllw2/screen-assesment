/**
 * Video URLs Configuration
 * 
 * This file manages video URLs for the screening app.
 * Videos are hosted on AWS S3 for better performance and reliability.
 * 
 * To update URLs:
 * 1. Run: node upload-videos-to-s3.js
 * 2. The script will update video-urls.json automatically
 */

import videoConfig from './video-urls.json';

interface VideoUrls {
  // Writing Assessment Videos
  writingInstructions: string;
  writingTasks: string[];
  
  // Verbal Assessment Videos
  verbalOverview: string;
  verbalStartInstructions: string;
  verbalQuestion1Prep: string;
  verbalQuestion1: string;
  verbalQuestion2Prep: string;
  verbalQuestion2: string;
  verbalQuestion3Prep: string;
  verbalQuestion3: string;
  verbalEnding: string;
}

// Fallback to local URLs if S3 config is not available
const defaultUrls: VideoUrls = {
  writingInstructions: '/Writing-Assessment-Instructions.mp4',
  writingTasks: [
    '/Writing-Assessment-Task.mp4',
    '/Writing-Assessment-Task-2.mp4',
    '/Writing-Assessment-Task-3.mp4',
    '/Writing-Assessment-Task-4.mp4',
    '/Writing-Assessment-Task-5.mp4',
  ],
  verbalOverview: '/Verbal-Assessment-Overview.mp4',
  verbalStartInstructions: '/Verbal-Assessment-Video-7-Start-Instructions.mp4',
  verbalQuestion1Prep: '/Verbal-Assessment-Video-8-Question-1-Preparation.mp4',
  verbalQuestion1: '/Verbal-Assessment-Video-9-Question-1.mp4',
  verbalQuestion2Prep: '/Verbal-Assessment-Video-10-Question-2-Preparation.mp4',
  verbalQuestion2: '/Verbal-Assessment-Video-11-Question-2.mp4',
  verbalQuestion3Prep: '/Verbal-Assessment-Video-14-Question-3-Preparation.mp4',
  verbalQuestion3: '/Verbal-Assessment-Video-15-Question-3.mp4',
  verbalEnding: '/Verbal-Assessment-Video-16-Ending.mp4',
};

// Map S3 URLs from config
function getVideoUrls(): VideoUrls {
  if (!videoConfig?.videos) {
    console.warn('⚠️ Video config not found, using local URLs');
    return defaultUrls;
  }

  const videos = videoConfig.videos;

  return {
    writingInstructions: videos['Writing-Assessment-Instructions.mp4'] || defaultUrls.writingInstructions,
    writingTasks: [
      videos['Writing-Assessment-Task.mp4'] || defaultUrls.writingTasks[0],
      videos['Writing-Assessment-Task-2.mp4'] || defaultUrls.writingTasks[1],
      videos['Writing-Assessment-Task-3.mp4'] || defaultUrls.writingTasks[2],
      videos['Writing-Assessment-Task-4.mp4'] || defaultUrls.writingTasks[3],
      videos['Writing-Assessment-Task-5.mp4'] || defaultUrls.writingTasks[4],
    ],
    verbalOverview: videos['Verbal-Assessment-Overview.mp4'] || defaultUrls.verbalOverview,
    verbalStartInstructions: videos['Verbal-Assessment-Video-7-Start-Instructions.mp4'] || defaultUrls.verbalStartInstructions,
    verbalQuestion1Prep: videos['Verbal-Assessment-Video-8-Question-1-Preparation.mp4'] || defaultUrls.verbalQuestion1Prep,
    verbalQuestion1: videos['Verbal-Assessment-Video-9-Question-1.mp4'] || defaultUrls.verbalQuestion1,
    verbalQuestion2Prep: videos['Verbal-Assessment-Video-10-Question-2-Preparation.mp4'] || defaultUrls.verbalQuestion2Prep,
    verbalQuestion2: videos['Verbal-Assessment-Video-11-Question-2.mp4'] || defaultUrls.verbalQuestion2,
    verbalQuestion3Prep: videos['Verbal-Assessment-Video-14-Question-3-Preparation.mp4'] || defaultUrls.verbalQuestion3Prep,
    verbalQuestion3: videos['Verbal-Assessment-Video-15-Question-3.mp4'] || defaultUrls.verbalQuestion3,
    verbalEnding: videos['Verbal-Assessment-Video-16-Ending.mp4'] || defaultUrls.verbalEnding,
  };
}

export const VIDEO_URLS = getVideoUrls();

// Helper function to get a random writing task video
export function getRandomWritingTask(): string {
  const tasks = VIDEO_URLS.writingTasks;
  return tasks[Math.floor(Math.random() * tasks.length)];
}

// Check if using S3 URLs
export const isUsingS3 = Boolean(videoConfig?.videos);

// Export config for debugging
export const videoConfigInfo = {
  lastUpdated: videoConfig?.lastUpdated || 'never',
  bucket: videoConfig?.bucket || 'none',
  region: videoConfig?.region || 'none',
  isUsingS3,
};
