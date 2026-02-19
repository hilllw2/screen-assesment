'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { QuestionTabs } from './components/QuestionTabs'
import { QuestionFilters } from './components/QuestionFilters'
import { QuestionTable } from './components/QuestionTable'
import { getQuestions } from './actions'
import type { QuestionCategory, Question } from '@/types/database'

export default function AdminQuestionsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<QuestionCategory>('intelligence')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ intelligence: 0, personality: 0 })
  const [filters, setFilters] = useState({ search: '', difficulty: '' })

  useEffect(() => {
    loadQuestions()
  }, [activeTab, filters])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const result = await getQuestions({
        category: activeTab,
        search: filters.search || undefined,
        difficulty: filters.difficulty || undefined,
      })
      setQuestions(result.questions)
      
      // Load counts for both categories
      const intelligenceResult = await getQuestions({ category: 'intelligence' })
      const personalityResult = await getQuestions({ category: 'personality' })
      setCounts({
        intelligence: intelligenceResult.count,
        personality: personalityResult.count,
      })
    } catch (error) {
      console.error('Failed to load questions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-gray-500 mt-1">Manage intelligence and personality questions</p>
        </div>
        <Button onClick={() => router.push('/admin/questions/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <QuestionTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            intelligenceCount={counts.intelligence}
            personalityCount={counts.personality}
          />
        </div>

        <div className="px-6 pb-6">
          <QuestionFilters
            onSearch={(search) => setFilters({ ...filters, search })}
            onDifficultyChange={(difficulty) => setFilters({ ...filters, difficulty })}
          />
        </div>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">Loading questions...</p>
            </div>
          ) : (
            <QuestionTable questions={questions} />
          )}
        </div>
      </div>
    </div>
  )
}
