#!/usr/bin/env node

/**
 * AWS S3 Video Upload Script
 * 
 * This script uploads all instructional videos from the public folder to AWS S3
 * and generates a configuration file with the S3 URLs.
 * 
 * Prerequisites:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3
 * 2. Set AWS credentials in .env file
 * 3. Place videos in the public folder
 * 
 * Usage: node upload-videos-to-s3.js
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Video files to upload with their folder paths
const VIDEO_FILES = [
  // Writing Assessment Videos
  'Written-Assessment-Videos/Writing-Assessment-Instructions.mp4',
  'Written-Assessment-Videos/Writing-Assessment-Task.mp4',
  'Written-Assessment-Videos/Writing-Assessment-Task-2.mp4',
  'Written-Assessment-Videos/Writing-Assessment-Task-3.mp4',
  'Written-Assessment-Videos/Writing-Assessment-Task-4.mp4',
  'Written-Assessment-Videos/Writing-Assessment-Task-5.mp4',
  
  // Verbal Assessment Videos
  'Verbal-Assessment-Videos/Verbal-Assessment-Overview.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-7-Start-Instructions.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-8-Question-1-Preparation.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-9-Question-1.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-10-Question-2-Preparation.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-11-Question-2.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-14-Question-3-Preparation.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-15-Question-3.mp4',
  'Verbal-Assessment-Videos/Verbal-Assessment-Video-16-Ending.mp4',
];

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEO_FOLDER = 'instructional-videos'; // Folder in S3 bucket

async function uploadVideoToS3(filePath, fileName) {
  try {
    const fileContent = fs.readFileSync(filePath);
    // Use just the filename without folder path for S3 key
    const baseFileName = path.basename(fileName);
    const s3Key = `${VIDEO_FOLDER}/${baseFileName}`;
    
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📤 Uploading: ${fileName} (${fileSizeMB} MB)...`);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'video/mp4',
      // Removed ACL - will use bucket policy for public access
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await s3Client.send(command);
    
    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    
    console.log(`✅ Uploaded: ${baseFileName}`);
    console.log(`   URL: ${publicUrl}\n`);
    
    return { fileName: baseFileName, url: publicUrl };
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting video upload to AWS S3...\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION}\n`);

  if (!BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Missing AWS credentials in .env.local file');
    console.error('Required variables: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION');
    process.exit(1);
  }

  const uploadedVideos = {};
  const missingFiles = [];

  // Check which videos exist
  for (const videoFile of VIDEO_FILES) {
    const filePath = path.join(PUBLIC_DIR, videoFile);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${videoFile}`);
      missingFiles.push(videoFile);
      continue;
    }

    const result = await uploadVideoToS3(filePath, videoFile);
    if (result) {
      // Store with just the filename as key for easier lookup
      uploadedVideos[result.fileName] = result.url;
    }
  }

  // Generate config file
  const config = {
    lastUpdated: new Date().toISOString(),
    bucket: BUCKET_NAME,
    region: process.env.AWS_REGION,
    videos: uploadedVideos,
  };

  const configPath = path.join(__dirname, 'src', 'config', 'video-urls.json');
  
  // Create config directory if it doesn't exist
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('\n📝 Summary:');
  console.log(`   Uploaded: ${Object.keys(uploadedVideos).length} videos`);
  console.log(`   Missing: ${missingFiles.length} files`);
  console.log(`   Config saved: ${configPath}\n`);

  if (missingFiles.length > 0) {
    console.log('⚠️  Missing files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\nPlease add these files to the public folder and run the script again.\n');
  }

  console.log('✅ Upload complete!\n');
  console.log('⚠️  IMPORTANT: Make your S3 bucket publicly accessible!');
  console.log('\nAdd this bucket policy in AWS Console:');
  console.log('S3 → Your Bucket → Permissions → Bucket Policy\n');
  console.log(JSON.stringify({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": `arn:aws:s3:::${BUCKET_NAME}/${VIDEO_FOLDER}/*`
      }
    ]
  }, null, 2));
  console.log('\n\nNext steps:');
  console.log('1. Apply the bucket policy above in AWS Console');
  console.log('2. Verify videos are accessible at the URLs above');
  console.log('3. The app will automatically use these S3 URLs\n');
}

main().catch(console.error);
