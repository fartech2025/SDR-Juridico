import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adicionarFavorito, removerFavorito, isFavorito, } from '@/services/favoritosService';
export function BotaoFavorito({ processo, className, onToggle }) {
    const [favorito, setFavorito] = React.useState(false);
    const [carregando, setCarregando] = React.useState(false);
    React.useEffect(() => {
        verificarFavorito();
    }, [processo.numeroProcesso]);
    async function verificarFavorito() {
        if (!processo.numeroProcesso)
            return;
        const ehFavorito = await isFavorito(processo.numeroProcesso);
        setFavorito(ehFavorito);
    }
    async function toggleFavorito() {
        if (!processo.numeroProcesso)
            return;
        setCarregando(true);
        try {
            if (favorito) {
                const { error } = await removerFavorito(processo.numeroProcesso);
                if (error)
                    throw error;
                setFavorito(false);
                toast.success('Processo removido dos favoritos');
                onToggle?.(false);
            }
            else {
                const { error } = await adicionarFavorito({
                    numero_processo: processo.numeroProcesso,
                    tribunal: processo.tribunal || 'Não informado',
                    classe: typeof processo.classe === 'object'
                        ? processo.classe.nome
                        : processo.classe,
                    orgao_julgador: typeof processo.orgaoJulgador === 'object'
                        ? processo.orgaoJulgador.nome
                        : processo.orgaoJulgador,
                    data_ajuizamento: processo.dataAjuizamento,
                });
                if (error)
                    throw error;
                setFavorito(true);
                toast.success('Processo adicionado aos favoritos');
                onToggle?.(true);
            }
        }
        catch (error) {
            console.error('Erro ao favoritar:', error);
            toast.error('Erro ao atualizar favoritos');
        }
        finally {
            setCarregando(false);
        }
    }
    return (_jsx(Button, { size: "sm", variant: favorito ? "secondary" : "outline", onClick: toggleFavorito, disabled: carregando, className: className, title: favorito ? "Remover dos favoritos" : "Adicionar aos favoritos", children: favorito ? (_jsxs(_Fragment, { children: [_jsx(Star, { className: "w-4 h-4 mr-1 fill-current" }), "Favorito"] })) : (_jsxs(_Fragment, { children: [_jsx(StarOff, { className: "w-4 h-4 mr-1" }), "Favoritar"] })) }));
}
