'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { createQuestion, updateQuestion } from '../actions'
import type { Question, QuestionCategory, Difficulty, CorrectOption, CreateQuestionInput } from '@/types/database'

interface QuestionFormProps {
  question?: Question
  mode: 'create' | 'edit'
}

export function QuestionForm({ question, mode }: QuestionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateQuestionInput>({
    category: question?.category || 'intelligence',
    prompt: question?.prompt || '',
    option_a: question?.option_a || '',
    option_b: question?.option_b || '',
    option_c: question?.option_c || '',
    option_d: question?.option_d || '',
    correct_option: question?.correct_option || undefined,
    difficulty: question?.difficulty || undefined,
    score_option_a: question?.score_option_a || undefined,
    score_option_b: question?.score_option_b || undefined,
    score_option_c: question?.score_option_c || undefined,
    score_option_d: question?.score_option_d || undefined,
    is_active: question?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.prompt.trim()) {
        alert('Please enter a question prompt')
        return
      }

      if (!formData.option_a.trim() || !formData.option_b.trim() || 
          !formData.option_c.trim() || !formData.option_d.trim()) {
        alert('Please fill in all options')
        return
      }

      if (formData.category === 'intelligence') {
        if (!formData.correct_option) {
          alert('Please select the correct answer for intelligence questions')
          return
        }
        if (!formData.difficulty) {
          alert('Please select a difficulty level for intelligence questions')
          return
        }
        // Clear personality scores
        formData.score_option_a = undefined
        formData.score_option_b = undefined
        formData.score_option_c = undefined
        formData.score_option_d = undefined
      } else {
        // Personality question
        if (formData.score_option_a === undefined || formData.score_option_b === undefined ||
            formData.score_option_c === undefined || formData.score_option_d === undefined) {
          alert('Please provide scores for all options (0-10)')
          return
        }
        // Validate score range
        const scores = [formData.score_option_a, formData.score_option_b, formData.score_option_c, formData.score_option_d]
        if (scores.some(score => score < 0 || score > 10)) {
          alert('Scores must be between 0 and 10')
          return
        }
        // Clear intelligence fields
        formData.correct_option = undefined
        formData.difficulty = undefined
      }

      if (mode === 'create') {
        await createQuestion(formData)
      } else if (question) {
        await updateQuestion({ ...formData, id: question.id })
      }

      router.push('/admin/questions')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Create New Question' : 'Edit Question'}
        </h1>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as QuestionCategory })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="intelligence">Intelligence</option>
            <option value="personality">Personality</option>
          </select>
        </div>

        {/* Prompt */}
        <div>
          <Label htmlFor="prompt">Question Prompt *</Label>
          <textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your question here..."
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="option_a">Option A *</Label>
            <Input
              id="option_a"
              value={formData.option_a}
              onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
              placeholder="Option A"
            />
            {formData.category === 'personality' && (
              <div className="mt-2">
                <Label htmlFor="score_option_a" className="text-sm">Score (0-10)</Label>
                <Input
                  id="score_option_a"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.score_option_a ?? ''}
                  onChange={(e) => setFormData({ ...formData, score_option_a: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="option_b">Option B *</Label>
            <Input
              id="option_b"
              value={formData.option_b}
              onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
              placeholder="Option B"
            />
            {formData.category === 'personality' && (
              <div className="mt-2">
                <Label htmlFor="score_option_b" className="text-sm">Score (0-10)</Label>
                <Input
                  id="score_option_b"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.score_option_b ?? ''}
                  onChange={(e) => setFormData({ ...formData, score_option_b: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="option_c">Option C *</Label>
            <Input
              id="option_c"
              value={formData.option_c}
              onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
              placeholder="Option C"
            />
            {formData.category === 'personality' && (
              <div className="mt-2">
                <Label htmlFor="score_option_c" className="text-sm">Score (0-10)</Label>
                <Input
                  id="score_option_c"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.score_option_c ?? ''}
                  onChange={(e) => setFormData({ ...formData, score_option_c: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="option_d">Option D *</Label>
            <Input
              id="option_d"
              value={formData.option_d}
              onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
              placeholder="Option D"
            />
            {formData.category === 'personality' && (
              <div className="mt-2">
                <Label htmlFor="score_option_d" className="text-sm">Score (0-10)</Label>
                <Input
                  id="score_option_d"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.score_option_d ?? ''}
                  onChange={(e) => setFormData({ ...formData, score_option_d: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Intelligence-specific fields */}
        {formData.category === 'intelligence' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="correct_option">Correct Answer *</Label>
              <select
                id="correct_option"
                value={formData.correct_option || ''}
                onChange={(e) => setFormData({ ...formData, correct_option: e.target.value as CorrectOption })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select correct answer</option>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty *</Label>
              <select
                id="difficulty"
                value={formData.difficulty || ''}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="is_active" className="cursor-pointer">Active (visible in tests)</Label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Question' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  )
}
