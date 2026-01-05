import * as React from 'react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

type PageStateStatus = 'loading' | 'empty' | 'error' | 'ready'

export interface PageStateProps {
  status: PageStateStatus
  children: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  errorTitle?: string
  errorDescription?: string
  onRetry?: () => void
}

export const PageState = ({
  status,
  children,
  emptyTitle = 'Nada por aqui...',
  emptyDescription = 'Conteudos serao exibidos assim que estiverem disponiveis.',
  errorTitle = 'Nao foi possivel carregar',
  errorDescription = 'Tente novamente em alguns segundos.',
  onRetry,
}: PageStateProps) => {
  if (status === 'ready') {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Inbox className="h-4 w-4 text-text-subtle" />
          {emptyTitle}
        </div>
        <p className="text-sm text-text-muted">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-danger/30 bg-danger/10 p-6 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-semibold text-danger">
        <AlertTriangle className="h-4 w-4" />
        {errorTitle}
      </div>
      <p className="text-sm text-text-muted">{errorDescription}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className={cn('border border-border')}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
