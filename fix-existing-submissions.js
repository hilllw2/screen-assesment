/**
 * One-time script to fix submissions that are stuck in "in_progress" status
 * but have actually been completed (have audio_recording_url)
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSubmissions() {
  console.log('🔍 Checking for completed submissions with incorrect status...\n');

  // Find submissions that:
  // 1. Have status = 'in_progress'
  // 2. Have audio_recording_url (meaning they completed verbal assessment)
  // 3. Have current_phase = 'finish' OR have audio_recording_url
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      id, 
      status, 
      current_phase, 
      audio_recording_url, 
      created_at,
      candidate:candidates (
        name,
        email
      )
    `)
    .eq('status', 'in_progress')
    .not('audio_recording_url', 'is', null);

  if (error) {
    console.error('❌ Error fetching submissions:', error);
    process.exit(1);
  }

  if (!submissions || submissions.length === 0) {
    console.log('✅ No submissions need fixing. All good!');
    process.exit(0);
  }

  console.log(`Found ${submissions.length} submission(s) that need fixing:\n`);
  
  submissions.forEach((sub, idx) => {
    console.log(`${idx + 1}. ${sub.candidate?.name || 'Unknown'} (${sub.candidate?.email || 'No email'})`);
    console.log(`   - ID: ${sub.id}`);
    console.log(`   - Current status: ${sub.status}`);
    console.log(`   - Current phase: ${sub.current_phase}`);
    console.log(`   - Has audio: ${sub.audio_recording_url ? 'Yes' : 'No'}`);
    console.log(`   - Created: ${new Date(sub.created_at).toLocaleString()}`);
    console.log('');
  });

  // Update all of them to "submitted" status
  const idsToUpdate = submissions.map(s => s.id);
  
  console.log(`🔧 Updating ${idsToUpdate.length} submission(s) to "submitted" status...\n`);

  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', idsToUpdate);

  if (updateError) {
    console.error('❌ Error updating submissions:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully updated all submissions!');
  console.log('\n📊 Summary:');
  console.log(`   - Fixed: ${idsToUpdate.length} submission(s)`);
  console.log(`   - Status changed from: "in_progress" → "submitted"`);
  console.log('\n✨ Done! You should now see Pass/Fail buttons for these submissions in the admin panel.');
}

fixSubmissions();
