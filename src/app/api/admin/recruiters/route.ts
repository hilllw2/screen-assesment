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
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all recruiters with their statistics
  const { data: recruiters, error: recruitersError } = await supabase
    .from('users')
    .select('id, email, name, role, created_at, updated_at')
    .eq('role', 'recruiter')
    .order('created_at', { ascending: false });

  if (recruitersError) {
    console.error('Error fetching recruiters:', recruitersError);
    return NextResponse.json({ error: recruitersError.message }, { status: 500 });
  }

  // Fetch statistics for each recruiter
  const recruitersWithStats = await Promise.all(
    (recruiters || []).map(async (recruiter) => {
      // Count tests created
      const { count: testsCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_user_id', recruiter.id);

      // Count test links created
      const { count: linksCount } = await supabase
        .from('test_links')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_user_id', recruiter.id);

      // Count submissions through their test links
      const { data: testLinks } = await supabase
        .from('test_links')
        .select('id')
        .eq('created_by_user_id', recruiter.id);

      const testLinkIds = testLinks?.map(link => link.id) || [];
      
      let submissionsCount = 0;
      let completedSubmissionsCount = 0;
      
      if (testLinkIds.length > 0) {
        const { count: totalSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('test_link_id', testLinkIds);

        const { count: completedSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('test_link_id', testLinkIds)
          .eq('status', 'submitted');

        submissionsCount = totalSubmissions || 0;
        completedSubmissionsCount = completedSubmissions || 0;
      }

      return {
        ...recruiter,
        stats: {
          testsCreated: testsCount || 0,
          linksCreated: linksCount || 0,
          submissions: submissionsCount,
          completedSubmissions: completedSubmissionsCount
        }
      };
    })
  );

  return NextResponse.json({ recruiters: recruitersWithStats });
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
  const { email, name } = body;

  if (!email || !name) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
  }

  // Create the recruiter in the users table
  const { data: newRecruiter, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      name,
      role: 'recruiter'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating recruiter:', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ recruiter: newRecruiter }, { status: 201 });
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const recruiterId = searchParams.get('id');

  if (!recruiterId) {
    return NextResponse.json({ error: 'Recruiter ID is required' }, { status: 400 });
  }

  // Delete the recruiter
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', recruiterId)
    .eq('role', 'recruiter');

  if (deleteError) {
    console.error('Error deleting recruiter:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
