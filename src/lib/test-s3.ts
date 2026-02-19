/**
 * Test AWS S3 Connection and Upload
 * This script verifies that S3 credentials are configured correctly
 */

import { uploadToS3 } from "./s3";

export async function testS3Connection(): Promise<boolean> {
  try {
    // Create a small test file
    const testContent = "Test file uploaded at " + new Date().toISOString();
    const buffer = Buffer.from(testContent, "utf-8");

    console.log("Testing S3 connection...");
    console.log("Bucket:", process.env.AWS_S3_BUCKET_NAME);
    console.log("Region:", process.env.AWS_REGION);

    const url = await uploadToS3({
      file: buffer,
      fileName: "test-connection.txt",
      contentType: "text/plain",
      folder: "audio",
    });

    console.log("✅ S3 Upload successful!");
    console.log("File URL:", url);

    return true;
  } catch (error) {
    console.error("❌ S3 Upload failed:", error);
    return false;
  }
}

// Allow running this test directly
if (require.main === module) {
  testS3Connection().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
