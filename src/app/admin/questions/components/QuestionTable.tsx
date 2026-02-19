'use client'

import { Question } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import { deleteQuestion, toggleQuestionActive } from '../actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface QuestionTableProps {
  questions: Question[]
}

export function QuestionTable({ questions }: QuestionTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    setLoading(id)
    try {
      await deleteQuestion(id)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete question')
    } finally {
      setLoading(null)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLoading(id)
    try {
      await toggleQuestionActive(id, !currentStatus)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to toggle question status')
    } finally {
      setLoading(null)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/questions/${id}/edit`)
  }

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Prompt</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Difficulty</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Correct Answer</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {questions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No questions found. Create your first question to get started.
              </td>
            </tr>
          ) : (
            questions.map((question) => (
              <tr key={question.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div className="max-w-md">{truncate(question.prompt, 100)}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="capitalize">{question.category}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {question.category === 'intelligence' ? (
                    question.difficulty ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {question.category === 'intelligence' ? (
                    question.correct_option ? (
                      <span className="font-medium uppercase">{question.correct_option}</span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )
                  ) : (
                    <div className="flex gap-2 text-xs">
                      <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">A:{question.score_option_a ?? 0}</span>
                      <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">B:{question.score_option_b ?? 0}</span>
                      <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">C:{question.score_option_c ?? 0}</span>
                      <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">D:{question.score_option_d ?? 0}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    question.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {question.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(question.id)}
                      disabled={loading === question.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(question.id, question.is_active)}
                      disabled={loading === question.id}
                    >
                      {question.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                      disabled={loading === question.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
