import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, Clock, XCircle, CheckCircle, WifiOff } from "lucide-react";

interface ErrorPageProps {
  type: 'invalid' | 'expired' | 'submitted' | 'disqualified' | 'network' | 'generic';
  title?: string;
  message?: string;
  showRetry?: boolean;
  showContact?: boolean;
}

export function TestErrorPage({
  type,
  title,
  message,
  showRetry = false,
  showContact = true,
}: ErrorPageProps) {
  const config = getErrorConfig(type);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.iconBgClass}`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className={config.titleClass}>
                {title || config.defaultTitle}
              </CardTitle>
              <CardDescription>
                {type === 'invalid' && 'Error Code: INVALID_TOKEN'}
                {type === 'expired' && 'Error Code: LINK_EXPIRED'}
                {type === 'submitted' && 'Error Code: ALREADY_COMPLETED'}
                {type === 'disqualified' && 'Error Code: DISQUALIFIED'}
                {type === 'network' && 'Error Code: NETWORK_ERROR'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {message || config.defaultMessage}
          </p>
          
          {type === 'disqualified' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">
                Common reasons for disqualification:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                <li>Switching browser tabs during the test</li>
                <li>Stopping screen share recording</li>
                <li>Refreshing the page</li>
                <li>Using multiple monitors</li>
                <li>Network disconnection</li>
              </ul>
            </div>
          )}
          
          {type === 'network' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                Please check your internet connection and try again. If the problem persists, 
                you may need to request a new test link.
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {showRetry && (
              <Button onClick={() => window.location.reload()} variant="default" className="flex-1">
                Try Again
              </Button>
            )}
            
            {showContact && (
              <Button variant="outline" asChild className="flex-1">
                <Link href="mailto:support@example.com">
                  Contact Support
                </Link>
              </Button>
            )}
            
            {!showRetry && !showContact && (
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            )}
          </div>
          
          {type === 'expired' && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Test links typically expire after 30 days for security reasons.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getErrorConfig(type: ErrorPageProps['type']) {
  const configs = {
    invalid: {
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      iconBgClass: 'bg-red-100',
      titleClass: 'text-red-600',
      defaultTitle: 'Invalid Test Link',
      defaultMessage: 'This test link is invalid or does not exist. Please check the URL and try again, or contact the recruiter for a new link.',
    },
    expired: {
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      iconBgClass: 'bg-orange-100',
      titleClass: 'text-orange-600',
      defaultTitle: 'Link Expired',
      defaultMessage: 'This test link has expired and is no longer valid. Please contact the recruiter to request a new test link.',
    },
    submitted: {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      iconBgClass: 'bg-green-100',
      titleClass: 'text-green-600',
      defaultTitle: 'Test Already Completed',
      defaultMessage: 'You have already completed this assessment. Thank you for your submission! The recruiter will review your responses and contact you soon.',
    },
    disqualified: {
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
      iconBgClass: 'bg-red-100',
      titleClass: 'text-red-600',
      defaultTitle: 'Assessment Invalidated',
      defaultMessage: 'Your assessment has been disqualified due to a violation of test-taking rules. This decision is final.',
    },
    network: {
      icon: <WifiOff className="h-6 w-6 text-orange-600" />,
      iconBgClass: 'bg-orange-100',
      titleClass: 'text-orange-600',
      defaultTitle: 'Network Error',
      defaultMessage: 'A network error occurred while processing your request. Please check your internet connection and try again.',
    },
    generic: {
      icon: <AlertCircle className="h-6 w-6 text-gray-600" />,
      iconBgClass: 'bg-gray-100',
      titleClass: 'text-gray-600',
      defaultTitle: 'Something Went Wrong',
      defaultMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    },
  };
  
  return configs[type];
}
