export default function VideoTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Video Access Test (No Auth)</h1>
        <p className="text-gray-600">This page should be accessible without login in incognito mode.</p>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Verbal Assessment Videos</h2>
          <div className="bg-white p-4 rounded-lg">
            <video
              className="w-full max-w-2xl mx-auto"
              controls
              playsInline
            >
              <source src="/Verbal-Assessment-Videos/Verbal-Assessment-Overview.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-500 mt-2">Path: /Verbal-Assessment-Videos/Verbal-Assessment-Overview.mp4</p>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <video
              className="w-full max-w-2xl mx-auto"
              controls
              playsInline
            >
              <source src="/Verbal-Assessment-Videos/Verbal-Assessment-Video-7-Start-Instructions.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-500 mt-2">Path: /Verbal-Assessment-Videos/Verbal-Assessment-Video-7-Start-Instructions.mp4</p>
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
              <source src="/Written-Assessment-Videos/Writing-Assessment-Task.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-500 mt-2">Path: /Written-Assessment-Videos/Writing-Assessment-Task.mp4</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">Test Instructions:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            <li>Open this page in incognito mode: <code className="bg-yellow-100 px-1">/test-video-access</code></li>
            <li>Videos should play without any authentication</li>
            <li>If videos don't load, check browser console for errors</li>
            <li>Try clicking play on each video</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
