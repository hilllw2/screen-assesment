import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role, default_webhook_url')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ 
    webhook_url: userRecord.default_webhook_url || '' 
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { webhook_url } = body;

  // Validate webhook URL
  if (webhook_url && webhook_url.trim() !== '') {
    try {
      new URL(webhook_url);
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }
  }

  // Update user's default webhook URL
  const { error } = await supabase
    .from('users')
    .update({ default_webhook_url: webhook_url || null })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating webhook URL:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update webhook_url for all tests created by this user
  await supabase
    .from('tests')
    .update({ webhook_url: webhook_url || null })
    .eq('created_by_user_id', user.id);

  return NextResponse.json({ success: true });
}
