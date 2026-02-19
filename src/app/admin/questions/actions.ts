'use server'

import { createClient } from '@/lib/supabase/server'
import type { Question, CreateQuestionInput, UpdateQuestionInput, QuestionCategory } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function getQuestions(filters?: {
  category?: QuestionCategory
  difficulty?: string
  search?: string
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  if (filters?.search) {
    query = query.ilike('prompt', `%${filters.search}%`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`)
  }

  return {
    questions: data as Question[],
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function createQuestion(input: CreateQuestionInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('questions')
    .insert({
      ...input,
      is_active: input.is_active ?? true
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create question: ${error.message}`)
  }

  revalidatePath('/admin/questions')
  return data as Question
}

export async function updateQuestion(input: UpdateQuestionInput) {
  const supabase = await createClient()
  const { id, ...updates } = input

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`)
  }

  revalidatePath('/admin/questions')
  return data as Question
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete question: ${error.message}`)
  }

  revalidatePath('/admin/questions')
}

export async function toggleQuestionActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('questions')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to toggle question status: ${error.message}`)
  }

  revalidatePath('/admin/questions')
}

export async function getQuestion(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch question: ${error.message}`)
  }

  return data as Question
}
