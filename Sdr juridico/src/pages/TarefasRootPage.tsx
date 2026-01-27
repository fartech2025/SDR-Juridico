import * as React from 'react'
import { TarefasKanbanPage } from '@/pages/TarefasKanbanPage'
import { TarefasPage } from '@/pages/TarefasPage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type TabKey = 'kanban' | 'lista'

export const TarefasRootPage = () => {
  const [tab, setTab] = React.useState<TabKey>('kanban')

  return (
    <div className="space-y-4">
      <Card className="p-2">
        <div className="flex gap-2">
          <Button variant={tab === 'kanban' ? 'primary' : 'secondary'} onClick={() => setTab('kanban')}>
            Kanban
          </Button>
          <Button variant={tab === 'lista' ? 'primary' : 'secondary'} onClick={() => setTab('lista')}>
            Lista
          </Button>
        </div>
      </Card>

      {tab === 'kanban' ? <TarefasKanbanPage /> : <TarefasPage />}
    </div>
  )
}
