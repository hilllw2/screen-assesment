import { VIDEO_URLS } from "@/config/video-urls";

export default function VideoTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Video Access Test (AWS S3)</h1>
        <p className="text-gray-600">Testing videos from AWS S3 - No authentication required.</p>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Verbal Assessment Videos</h2>
          <div className="bg-white p-4 rounded-lg">
            <video
              className="w-full max-w-2xl mx-auto"
              controls
              playsInline
            >
              <source src={VIDEO_URLS.verbalOverview} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-500 mt-2 break-all">URL: {VIDEO_URLS.verbalOverview}</p>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <video
              className="w-full max-w-2xl mx-auto"
              controls
              playsInline
            >
              <source src={VIDEO_URLS.verbalStartInstructions} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-500 mt-2 break-all">URL: {VIDEO_URLS.verbalStartInstructions}</p>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold">Written Assessment Videos</h2>
          <div className="bg-white p-4 rounded-lg">
            <video
              className="w-full max-w-2xl mx-auto"
              controls
              playsInline
            >
              <source src={VIDEO_URLS.writingTasks[0]} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-500 mt-2 break-all">URL: {VIDEO_URLS.writingTasks[0]}</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">✅ Videos Now Served from AWS S3:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
            <li>Videos load from S3 without authentication</li>
            <li>Works in incognito mode: <code className="bg-green-100 px-1">/test-video-access</code></li>
            <li>Fast global delivery via edge caching</li>
            <li>No proxy or middleware complications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
