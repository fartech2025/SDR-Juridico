import { Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-full"
      disabled
      title="Modo Claro"
      aria-label="Modo Claro"
    >
      <Sun className="h-4 w-4" />
    </Button>
  )
}
