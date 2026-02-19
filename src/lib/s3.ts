import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Config } from "./env-config";

// Initialize S3 client with configuration from environment variables
const getS3Client = () => {
  const config = getS3Config();
  
  if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    throw new Error(
      "AWS S3 credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in .env.local"
    );
  }

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

export interface UploadToS3Options {
  file: Buffer | Blob | ArrayBuffer;
  fileName: string;
  contentType: string;
  folder?: "audio" | "video" | "screen-recordings";
}

export async function uploadToS3(options: UploadToS3Options): Promise<string> {
  const config = getS3Config();
  const s3Client = getS3Client();
  const { file, fileName, contentType, folder = "misc" } = options;

  const uniqueFileName = `${folder}/${fileName}`;

  // Convert file to Buffer if it's a Blob or ArrayBuffer
  let fileBuffer: Buffer;
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else if (file instanceof ArrayBuffer) {
    fileBuffer = Buffer.from(file);
  } else {
    fileBuffer = file;
  }

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: uniqueFileName,
    Body: fileBuffer,
    ContentType: contentType,
    // Note: ACL 'public-read' is often disabled by default on new buckets. 
    // If you need public access, ensure Block Public Access settings allow it 
    // and Object Ownership is set to Bucket owner preferred.
    // ACL: "public-read",
  });

  try {
    console.log(`Uploading to S3: ${uniqueFileName} (${fileBuffer.length} bytes)`);
    await s3Client.send(command);
    
    // Return the URL.
    // IMPORTANT: If bucket is private, this URL won't work for download without presigning.
    // For now we return the direct URL as per requirements, assuming bucket policy allows read or we use presigned GET later.
    const url = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${uniqueFileName}`;
    console.log(`✅ Upload successful: ${url}`);
    return url;
  } catch (error: any) {
    console.error("❌ S3 Upload Error:", error.message || error);
    throw new Error(`Failed to upload file to S3: ${error.message || "Unknown error"}`);
  }
}

export async function uploadAudioToS3(
  audioBlob: Blob,
  fileName: string
): Promise<string> {
  return uploadToS3({
    file: audioBlob,
    fileName,
    contentType: "audio/webm",
    folder: "audio",
  });
}

export async function uploadVideoToS3(
  videoBlob: Blob,
  fileName: string
): Promise<string> {
  return uploadToS3({
    file: videoBlob,
    fileName,
    contentType: "video/webm",
    folder: "video",
  });
}

export async function uploadScreenRecordingToS3(
  videoBlob: Blob,
  fileName: string
): Promise<string> {
  return uploadToS3({
    file: videoBlob,
    fileName,
    contentType: "video/webm",
    folder: "screen-recordings",
  });
}
