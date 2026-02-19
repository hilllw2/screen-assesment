import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function FinishPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-24 w-24 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-green-700">
            Assessment Complete!
          </h1>
          <p className="text-xl text-muted-foreground">
            Thank you for completing the assessment
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-700 text-sm font-bold">1</span>
              </div>
              <p className="text-sm">
                Your responses have been successfully submitted and are being reviewed
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-700 text-sm font-bold">2</span>
              </div>
              <p className="text-sm">
                The recruiter will evaluate your performance across all test sections
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-700 text-sm font-bold">3</span>
              </div>
              <p className="text-sm">
                You will be contacted via email regarding the next steps
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-blue-800">
              You can now safely close this window. Your submission has been saved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
