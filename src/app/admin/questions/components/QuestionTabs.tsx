'use client'

import { useState } from 'react'
import { QuestionCategory } from '@/types/database'

interface QuestionTabsProps {
  activeTab: QuestionCategory
  onTabChange: (tab: QuestionCategory) => void
  intelligenceCount: number
  personalityCount: number
}

export function QuestionTabs({ activeTab, onTabChange, intelligenceCount, personalityCount }: QuestionTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('intelligence')}
          className={`
            py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'intelligence'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          Intelligence
          <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
            {intelligenceCount}
          </span>
        </button>
        <button
          onClick={() => onTabChange('personality')}
          className={`
            py-4 px-1 border-b-2 font-medium text-sm transition-colors
            ${activeTab === 'personality'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          Personality
          <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
            {personalityCount}
          </span>
        </button>
      </nav>
    </div>
  )
}
