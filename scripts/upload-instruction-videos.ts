/**
 * Upload instruction videos to S3
 * Run this once to upload all instruction videos to your S3 bucket
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

async function uploadVideosToS3() {
  const folders = [
    { local: './public/Verbal-Assessment-Videos', s3Prefix: 'instruction-videos/verbal' },
    { local: './public/Written-Assessment-Videos', s3Prefix: 'instruction-videos/written' },
  ];

  for (const folder of folders) {
    console.log(`\nUploading from ${folder.local}...`);
    const files = readdirSync(folder.local).filter((f) => f.endsWith('.mp4'));

    for (const file of files) {
      const filePath = join(folder.local, file);
      const fileContent = readFileSync(filePath);
      const s3Key = `${folder.s3Prefix}/${file}`;

      console.log(`  Uploading ${file} (${(fileContent.length / (1024 * 1024)).toFixed(2)} MB)...`);

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'video/mp4',
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );
        console.log(`  ✓ Uploaded: https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`);
      } catch (error) {
        console.error(`  ✗ Failed to upload ${file}:`, error);
      }
    }
  }

  console.log('\n✅ Upload complete!');
  console.log('\nNext steps:');
  console.log('1. Update video paths in your components to use S3 URLs');
  console.log('2. Remove large video files from public/ folder');
  console.log('3. Redeploy your application');
}

uploadVideosToS3().catch(console.error);
