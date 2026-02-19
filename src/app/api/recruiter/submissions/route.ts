import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract filters
    const testId = searchParams.get('testId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('submissions')
      .select(`
        *,
        candidates(*),
        tests!submissions_test_id_fkey(*),
        submission_scores(*),
        submission_notes(*)
      `)
      .order('created_at', { ascending: false });

    // If recruiter, only show their submissions
    if (userData.role === 'recruiter') {
      const { data: recruiterTests } = await supabase
        .from('tests')
        .select('id')
        .eq('created_by', user.id);

      if (recruiterTests) {
        const testIds = recruiterTests.map((t) => t.id);
        query = query.in('test_id', testIds);
      }
    }

    // Apply filters
    if (testId) {
      query = query.eq('test_id', testId);
    }

    if (status && status !== 'all') {
      if (status === 'disqualified') {
        query = query.eq('disqualified', true);
      } else {
        query = query.eq('status', status);
      }
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: submissions, error: submissionsError } = await query;

    if (submissionsError) {
      return NextResponse.json(
        { error: submissionsError.message },
        { status: 500 }
      );
    }

    // Filter by search term if provided
    let filteredSubmissions = submissions || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubmissions = filteredSubmissions.filter((sub: any) => {
        const candidateName = sub.candidates?.name?.toLowerCase() || '';
        const candidateEmail = sub.candidates?.email?.toLowerCase() || '';
        return (
          candidateName.includes(searchLower) ||
          candidateEmail.includes(searchLower)
        );
      });
    }

    return NextResponse.json({ submissions: filteredSubmissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
