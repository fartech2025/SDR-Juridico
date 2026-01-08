import * as React from 'react'
import { Star, StarOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { ProcessoDataJud } from '@/services/datajudService'
import {
  adicionarFavorito,
  removerFavorito,
  isFavorito,
} from '@/services/favoritosService'

interface BotaoFavoritoProps {
  processo: ProcessoDataJud
  className?: string
  onToggle?: (favorito: boolean) => void
}

export function BotaoFavorito({ processo, className, onToggle }: BotaoFavoritoProps) {
  const [favorito, setFavorito] = React.useState(false)
  const [carregando, setCarregando] = React.useState(false)

  React.useEffect(() => {
    verificarFavorito()
  }, [processo.numeroProcesso])

  async function verificarFavorito() {
    if (!processo.numeroProcesso) return
    const ehFavorito = await isFavorito(processo.numeroProcesso)
    setFavorito(ehFavorito)
  }

  async function toggleFavorito() {
    if (!processo.numeroProcesso) return
    
    setCarregando(true)
    
    try {
      if (favorito) {
        const { error } = await removerFavorito(processo.numeroProcesso)
        if (error) throw error
        
        setFavorito(false)
        toast.success('Processo removido dos favoritos')
        onToggle?.(false)
      } else {
        const { error } = await adicionarFavorito({
          numero_processo: processo.numeroProcesso,
          tribunal: processo.tribunal || 'Não informado',
          classe: typeof processo.classe === 'object' 
            ? (processo.classe as any).nome 
            : processo.classe,
          orgao_julgador: typeof processo.orgaoJulgador === 'object'
            ? (processo.orgaoJulgador as any).nome
            : processo.orgaoJulgador,
          data_ajuizamento: processo.dataAjuizamento,
        })
        if (error) throw error
        
        setFavorito(true)
        toast.success('Processo adicionado aos favoritos')
        onToggle?.(true)
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error)
      toast.error('Erro ao atualizar favoritos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Button
      size="sm"
      variant={favorito ? "secondary" : "outline"}
      onClick={toggleFavorito}
      disabled={carregando}
      className={className}
      title={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      {favorito ? (
        <>
          <Star className="w-4 h-4 mr-1 fill-current" />
          Favorito
        </>
      ) : (
        <>
          <StarOff className="w-4 h-4 mr-1" />
          Favoritar
        </>
      )}
    </Button>
  )
}
