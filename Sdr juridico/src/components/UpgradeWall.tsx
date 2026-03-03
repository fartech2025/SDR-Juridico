import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function UpgradeWall({ feature, minPlan }: { feature: string; minPlan: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Lock className="mb-4 h-10 w-10 text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900">{feature}</h2>
      <p className="mt-2 text-sm text-gray-500">
        Disponível a partir do plano <strong>{minPlan}</strong>.
      </p>
      <Button className="mt-6" onClick={() => navigate('/app/plano')}>
        Ver planos e fazer upgrade
      </Button>
    </div>
  )
}
