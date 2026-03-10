'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Webhook, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setWebhookUrl(data.webhook_url || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl })
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      alert('Please enter a webhook URL first');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testPayload = {
        event: 'test_webhook',
        message: 'This is a test webhook from your screening app',
        timestamp: new Date().toISOString(),
        test_data: {
          candidate: {
            name: 'Test Candidate',
            email: 'test@example.com'
          },
          scores: {
            intelligence: 4.5,
            personality: 4.0,
            verbal: 4.2,
            writing: 4.3,
            total: 17.0,
            total_out_of: 20,
            percentage: 85.0
          }
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ScreeningApp-Webhook/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure system settings</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Configure webhooks and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            <CardTitle>Webhook Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure webhook URL to receive notifications when candidates pass
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-webhook-url.com/endpoint"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              onPaste={(e) => {
                // Explicitly allow pasting in this field
                e.stopPropagation();
              }}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              This webhook will be triggered when an admin marks a candidate as "Passed"
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2">Webhook Payload Example:</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "event": "candidate_passed",
  "submission_id": "uuid",
  "candidate": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "test": {
    "id": "uuid",
    "title": "Screening Test",
    "type": "screening"
  },
  "scores": {
    "intelligence": 4.5,
    "personality": 4.0,
    "verbal": 4.2,
    "writing": 4.3,
    "total": 17.0,
    "total_out_of": 20,
    "percentage": 85.0
  },
  "timestamps": {
    "started_at": "ISO8601",
    "submitted_at": "ISO8601",
    "passed_at": "ISO8601"
  }
}`}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button onClick={handleTest} disabled={testing || !webhookUrl} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Testing...' : 'Test Webhook'}
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
            }`}>
              {testResult === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Webhook test successful! Check your endpoint.</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Webhook test failed. Check the URL and try again.</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Webhook Status:</span>
              {webhookUrl ? (
                <Badge variant="default">Configured</Badge>
              ) : (
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
            {webhookUrl && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Webhook URL:</span>
                <span className="text-sm font-mono text-gray-900 truncate max-w-md">
                  {webhookUrl}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
