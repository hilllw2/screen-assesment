import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'audio' | 'video' | 'screen'
    const submissionId = formData.get("submissionId") as string;
    const questionNumber = formData.get("questionNumber") as string | null;

    console.log("📤 Upload request:", { type, submissionId, questionNumber, fileSize: file?.size });

    if (!file || !type || !submissionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine folder and content type
    const folder = type === "audio" ? "audio" : type === "screen" ? "screen-recordings" : "video";
    const contentType = type === "audio" ? "audio/webm" : "video/webm";

    // Upload to S3
    const questionSuffix = questionNumber ? `-q${questionNumber}` : "";
    const fileName = `${submissionId}-${type}${questionSuffix}-${Date.now()}.webm`;
    
    console.log("📤 Uploading to S3:", fileName);
    
    const url = await uploadToS3({
      file: await file.arrayBuffer() as any,
      fileName,
      contentType,
      folder: folder as any,
    });

    console.log("✅ Upload successful:", url);

    return NextResponse.json({
      url,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
