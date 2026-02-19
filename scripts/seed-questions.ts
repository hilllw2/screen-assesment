/**
 * Seed Script for Question Bank
 * 
 * This script populates the database with sample intelligence and personality questions.
 * 
 * To run this script:
 * 1. Make sure you have Supabase configured
 * 2. Run: npx tsx scripts/seed-questions.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Intelligence Questions (20+)
const intelligenceQuestions = [
  // Easy Level
  {
    category: 'intelligence',
    prompt: 'What is the next number in the sequence: 2, 4, 6, 8, __?',
    option_a: '9',
    option_b: '10',
    option_c: '11',
    option_d: '12',
    correct_option: 'B',
    difficulty: 'easy',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Which word does not belong in the group: Apple, Banana, Carrot, Orange?',
    option_a: 'Apple',
    option_b: 'Banana',
    option_c: 'Carrot',
    option_d: 'Orange',
    correct_option: 'C',
    difficulty: 'easy',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
    option_a: 'Yes',
    option_b: 'No',
    option_c: 'Maybe',
    option_d: 'Not enough information',
    correct_option: 'A',
    difficulty: 'easy',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'What comes next in the pattern: A, C, E, G, __?',
    option_a: 'H',
    option_b: 'I',
    option_c: 'J',
    option_d: 'K',
    correct_option: 'B',
    difficulty: 'easy',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Which number is the odd one out: 2, 4, 6, 9, 10?',
    option_a: '2',
    option_b: '4',
    option_c: '9',
    option_d: '10',
    correct_option: 'C',
    difficulty: 'easy',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Complete the analogy: Book is to Reading as Fork is to __?',
    option_a: 'Drawing',
    option_b: 'Writing',
    option_c: 'Eating',
    option_d: 'Cooking',
    correct_option: 'C',
    difficulty: 'easy',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'If 5 cats can catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?',
    option_a: '5',
    option_b: '10',
    option_c: '20',
    option_d: '100',
    correct_option: 'A',
    difficulty: 'easy',
    is_active: true
  },

  // Medium Level
  {
    category: 'intelligence',
    prompt: 'What is the missing number: 3, 6, 11, 18, 27, __?',
    option_a: '36',
    option_b: '37',
    option_c: '38',
    option_d: '39',
    correct_option: 'C',
    difficulty: 'medium',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Which number should replace the question mark: 2, 6, 12, 20, 30, ?',
    option_a: '40',
    option_b: '42',
    option_c: '44',
    option_d: '46',
    correct_option: 'B',
    difficulty: 'medium',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
    option_a: '0 degrees',
    option_b: '7.5 degrees',
    option_c: '15 degrees',
    option_d: '22.5 degrees',
    correct_option: 'B',
    difficulty: 'medium',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'If CAT = 24 and DOG = 26, what does BIRD equal?',
    option_a: '30',
    option_b: '32',
    option_c: '34',
    option_d: '36',
    correct_option: 'B',
    difficulty: 'medium',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Complete the series: 1, 1, 2, 3, 5, 8, 13, __?',
    option_a: '18',
    option_b: '19',
    option_c: '20',
    option_d: '21',
    correct_option: 'D',
    difficulty: 'medium',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Which shape completes the pattern? [Imagine: Circle, Square, Triangle, Circle, Square, __]',
    option_a: 'Circle',
    option_b: 'Square',
    option_c: 'Triangle',
    option_d: 'Pentagon',
    correct_option: 'C',
    difficulty: 'medium',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'A father is 4 times as old as his son. In 20 years, he will be twice as old. How old is the son now?',
    option_a: '5',
    option_b: '10',
    option_c: '15',
    option_d: '20',
    correct_option: 'B',
    difficulty: 'medium',
    is_active: true
  },

  // Hard Level
  {
    category: 'intelligence',
    prompt: 'What is the next number in the sequence: 1, 4, 9, 16, 25, 36, __?',
    option_a: '45',
    option_b: '48',
    option_c: '49',
    option_d: '50',
    correct_option: 'C',
    difficulty: 'hard',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'If you rearrange the letters "CIFAIPC" you would have the name of a(n):',
    option_a: 'City',
    option_b: 'Animal',
    option_c: 'Ocean',
    option_d: 'Country',
    correct_option: 'C',
    difficulty: 'hard',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Complete the analogy: Optimist is to Pessimist as Hope is to __?',
    option_a: 'Despair',
    option_b: 'Fear',
    option_c: 'Sadness',
    option_d: 'Anger',
    correct_option: 'A',
    difficulty: 'hard',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'A train travels 60 km at 30 km/h, then 80 km at 40 km/h. What is its average speed?',
    option_a: '33.3 km/h',
    option_b: '34 km/h',
    option_c: '35 km/h',
    option_d: '36 km/h',
    correct_option: 'C',
    difficulty: 'hard',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'What number comes next: 2, 3, 5, 7, 11, 13, __?',
    option_a: '15',
    option_b: '16',
    option_c: '17',
    option_d: '19',
    correct_option: 'C',
    difficulty: 'hard',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'Which is the odd one out: 121, 144, 169, 196, 200?',
    option_a: '121',
    option_b: '144',
    option_c: '169',
    option_d: '200',
    correct_option: 'D',
    difficulty: 'hard',
    is_active: true
  },
  {
    category: 'intelligence',
    prompt: 'If 8 workers can build a wall in 10 days, how many days will 4 workers take?',
    option_a: '5 days',
    option_b: '15 days',
    option_c: '20 days',
    option_d: '25 days',
    correct_option: 'C',
    difficulty: 'hard',
    is_active: true
  },
]

// Personality Questions (20+)
const personalityQuestions = [
  {
    category: 'personality',
    prompt: 'When working on a team project, I prefer to:',
    option_a: 'Take the lead and organize everyone',
    option_b: 'Contribute ideas but let someone else lead',
    option_c: 'Focus on my assigned tasks independently',
    option_d: 'Support others and help where needed',
    score_a: 8,
    score_b: 6,
    score_c: 4,
    score_d: 7,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When faced with a deadline, I typically:',
    option_a: 'Plan everything in advance and finish early',
    option_b: 'Start early but work at my own pace',
    option_c: 'Work best under pressure at the last minute',
    option_d: 'Need reminders and external motivation',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 3,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'In social situations, I am most likely to:',
    option_a: 'Be the center of attention and energize others',
    option_b: 'Engage in small group conversations',
    option_c: 'Observe and listen more than speak',
    option_d: 'Find a quiet corner to recharge',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 3,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When making important decisions, I rely on:',
    option_a: 'Logic and objective analysis',
    option_b: 'A balance of facts and feelings',
    option_c: 'My gut feeling and intuition',
    option_d: 'Advice from others',
    score_a: 8,
    score_b: 7,
    score_c: 6,
    score_d: 4,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'How do you handle criticism?',
    option_a: 'Use it as constructive feedback to improve',
    option_b: 'Consider it carefully before deciding',
    option_c: 'Feel hurt initially but try to move on',
    option_d: 'Take it very personally and dwell on it',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 2,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'My workspace is usually:',
    option_a: 'Extremely organized and minimalist',
    option_b: 'Mostly tidy with some personal items',
    option_c: 'A bit messy but I know where everything is',
    option_d: 'Chaotic and disorganized',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 3,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When learning something new, I prefer:',
    option_a: 'Structured courses with clear objectives',
    option_b: 'Guided tutorials with some flexibility',
    option_c: 'Self-directed exploration',
    option_d: 'Learning by doing and making mistakes',
    score_a: 8,
    score_b: 7,
    score_c: 6,
    score_d: 5,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'How do you react to unexpected changes in plans?',
    option_a: 'Get stressed and prefer to stick to the original plan',
    option_b: 'Adapt but need time to adjust',
    option_c: 'Go with the flow easily',
    option_d: 'Get excited about new possibilities',
    score_a: 3,
    score_b: 5,
    score_c: 8,
    score_d: 9,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'In conflicts, I tend to:',
    option_a: 'Address issues directly and immediately',
    option_b: 'Think through before responding',
    option_c: 'Avoid confrontation when possible',
    option_d: 'Seek mediation or third-party help',
    score_a: 8,
    score_b: 7,
    score_c: 4,
    score_d: 5,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'My ideal work environment is:',
    option_a: 'Fast-paced with lots of variety',
    option_b: 'Balanced between routine and novelty',
    option_c: 'Stable and predictable',
    option_d: 'Quiet and independent',
    score_a: 9,
    score_b: 7,
    score_c: 6,
    score_d: 5,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When working on long-term projects, I:',
    option_a: 'Break it into milestones and track progress',
    option_b: 'Work steadily with occasional check-ins',
    option_c: 'Start strong but momentum decreases',
    option_d: 'Struggle with sustained focus',
    score_a: 9,
    score_b: 7,
    score_c: 4,
    score_d: 2,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'How do you prefer to communicate at work?',
    option_a: 'Face-to-face meetings',
    option_b: 'Video calls',
    option_c: 'Phone calls',
    option_d: 'Written messages/emails',
    score_a: 8,
    score_b: 7,
    score_c: 6,
    score_d: 5,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When receiving a new task, I first:',
    option_a: 'Clarify all requirements and expectations',
    option_b: 'Review similar past work',
    option_c: 'Jump in and figure it out as I go',
    option_d: 'Ask for help or guidance',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 4,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'My approach to problem-solving is:',
    option_a: 'Systematic and methodical',
    option_b: 'Analytical with creative elements',
    option_c: 'Intuitive and experimental',
    option_d: 'Collaborative and discussion-based',
    score_a: 9,
    score_b: 7,
    score_c: 6,
    score_d: 5,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'How do you handle multitasking?',
    option_a: 'Excel at juggling multiple tasks',
    option_b: 'Can manage a few tasks simultaneously',
    option_c: 'Prefer focusing on one thing at a time',
    option_d: 'Get overwhelmed easily',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 2,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When setting goals, I:',
    option_a: 'Set ambitious, challenging targets',
    option_b: 'Set realistic, achievable goals',
    option_c: 'Keep goals flexible and adaptable',
    option_d: 'Rarely set formal goals',
    score_a: 9,
    score_b: 8,
    score_c: 5,
    score_d: 3,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'In group discussions, I typically:',
    option_a: 'Lead the conversation and share ideas',
    option_b: 'Participate actively when I have input',
    option_c: 'Listen more and speak when asked',
    option_d: 'Rarely contribute unless necessary',
    score_a: 9,
    score_b: 7,
    score_c: 5,
    score_d: 3,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'How do you recharge after a stressful day?',
    option_a: 'Exercise or physical activity',
    option_b: 'Socializing with friends',
    option_c: 'Hobbies or creative pursuits',
    option_d: 'Quiet time alone',
    score_a: 8,
    score_b: 7,
    score_c: 6,
    score_d: 5,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'My attitude toward rules and procedures is:',
    option_a: 'Follow them strictly',
    option_b: 'Generally follow with some flexibility',
    option_c: 'Question them if they don\'t make sense',
    option_d: 'Often find them restrictive',
    score_a: 8,
    score_b: 7,
    score_c: 5,
    score_d: 3,
    is_active: true
  },
  {
    category: 'personality',
    prompt: 'When teaching others, I prefer to:',
    option_a: 'Provide detailed step-by-step instructions',
    option_b: 'Demonstrate and then let them practice',
    option_c: 'Give them resources to learn independently',
    option_d: 'Rarely take on teaching roles',
    score_a: 8,
    score_b: 7,
    score_c: 6,
    score_d: 3,
    is_active: true
  },
]

async function seedQuestions() {
  try {
    console.log('Starting to seed questions...\n')

    // Seed Intelligence Questions
    console.log('Seeding intelligence questions...')
    const { data: intelligenceData, error: intelligenceError } = await supabase
      .from('questions')
      .insert(intelligenceQuestions)
      .select()

    if (intelligenceError) {
      throw new Error(`Failed to seed intelligence questions: ${intelligenceError.message}`)
    }

    console.log(`✅ Successfully seeded ${intelligenceData.length} intelligence questions\n`)

    // Seed Personality Questions
    console.log('Seeding personality questions...')
    const { data: personalityData, error: personalityError } = await supabase
      .from('questions')
      .insert(personalityQuestions)
      .select()

    if (personalityError) {
      throw new Error(`Failed to seed personality questions: ${personalityError.message}`)
    }

    console.log(`✅ Successfully seeded ${personalityData.length} personality questions\n`)

    console.log('🎉 All questions seeded successfully!')
    console.log(`Total: ${intelligenceData.length + personalityData.length} questions`)
    console.log(`  - Intelligence: ${intelligenceData.length}`)
    console.log(`  - Personality: ${personalityData.length}`)

  } catch (error) {
    console.error('❌ Error seeding questions:', error)
    process.exit(1)
  }
}

// Run the seed function
seedQuestions()
