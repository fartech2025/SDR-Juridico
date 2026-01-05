import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-text-subtle">
            404
          </p>
          <CardTitle>Pagina nao encontrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-text-muted">
          <p>Verifique a rota ou retorne para o dashboard.</p>
          <Button variant="primary" onClick={() => navigate('/app/dashboard')}>
            Ir para o app
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
