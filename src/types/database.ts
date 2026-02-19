// Database types for questions
export type QuestionCategory = 'intelligence' | 'personality'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type CorrectOption = 'a' | 'b' | 'c' | 'd'

export interface Question {
  id: string
  category: QuestionCategory
  prompt: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option?: CorrectOption | null
  difficulty?: Difficulty | null
  score_option_a?: number | null
  score_option_b?: number | null
  score_option_c?: number | null
  score_option_d?: number | null
  is_active: boolean
  created_at: string
}

export interface CreateQuestionInput {
  category: QuestionCategory
  prompt: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option?: CorrectOption
  difficulty?: Difficulty
  score_option_a?: number
  score_option_b?: number
  score_option_c?: number
  score_option_d?: number
  is_active?: boolean
}

export interface UpdateQuestionInput extends Partial<CreateQuestionInput> {
  id: string
}
