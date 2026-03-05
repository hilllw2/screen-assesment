"use client";

import { VIDEO_URLS, videoConfigInfo, isUsingS3 } from "@/config/video-urls";

export default function DebugVideoConfig() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Video Configuration Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Config Status</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(videoConfigInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Using S3: {isUsingS3 ? "✅ YES" : "❌ NO"}</h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Verbal Overview URL</h2>
          <p className="text-sm font-mono break-all bg-gray-100 p-4 rounded">
            {VIDEO_URLS.verbalOverview}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Video URLs</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(VIDEO_URLS, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Video</h2>
          <video controls className="w-full max-w-2xl">
            <source src={VIDEO_URLS.verbalOverview} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
