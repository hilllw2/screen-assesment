import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function DisqualifiedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <XCircle className="h-24 w-24 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-red-700">
            Assessment Invalidated
          </h1>
          <p className="text-xl text-muted-foreground">
            Your submission has been disqualified
          </p>
        </div>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">What Happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Your assessment was disqualified due to a violation of test rules. Common reasons include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Switching to another tab or window during the test</li>
              <li>Screen sharing was stopped or disconnected</li>
              <li>Multiple monitors were detected</li>
              <li>Page was refreshed during the test</li>
              <li>Developer tools were opened</li>
              <li>Network connection was lost</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-orange-900 mb-2">Next Steps</h3>
            <p className="text-sm text-orange-800">
              Please contact the recruiter if you believe this was an error or if you would like to request another attempt at the assessment.
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>You can now close this window.</p>
        </div>
      </div>
    </div>
  );
}
