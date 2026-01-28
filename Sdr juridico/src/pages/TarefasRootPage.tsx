import * as React from 'react'
import { TarefasKanbanPage } from '@/pages/TarefasKanbanPage'
import { TarefasPage } from '@/pages/TarefasPage'
import { cn } from '@/utils/cn'

type TabKey = 'kanban' | 'lista'

export const TarefasRootPage = () => {
  const [tab, setTab] = React.useState<TabKey>('kanban')

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        <button
          onClick={() => setTab('kanban')}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            tab === 'kanban'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          Kanban
        </button>
        <button
          onClick={() => setTab('lista')}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            tab === 'lista'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          Lista
        </button>
      </div>

      {tab === 'kanban' ? <TarefasKanbanPage /> : <TarefasPage />}
    </div>
  )
}
