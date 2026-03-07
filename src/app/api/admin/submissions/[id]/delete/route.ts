import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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

  try {
    // Delete related records first (due to foreign key constraints)
    // Delete submission_answers
    await supabase
      .from('submission_answers')
      .delete()
      .eq('submission_id', id);

    // Delete submission_violations
    await supabase
      .from('submission_violations')
      .delete()
      .eq('submission_id', id);

    // Delete submission_scores
    await supabase
      .from('submission_scores')
      .delete()
      .eq('submission_id', id);

    // Delete submission_notes
    await supabase
      .from('submission_notes')
      .delete()
      .eq('submission_id', id);

    // Finally, delete the submission itself
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting submission:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete submission' }, { status: 500 });
  }
}
