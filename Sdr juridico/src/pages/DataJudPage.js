import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Search, RefreshCw, AlertCircle, Database, FileText, Users, Calendar, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { BotaoFavorito } from '@/components/BotaoFavorito';
import { registrarConsulta } from '@/services/favoritosService';
import heroLight from '@/assets/hero-light.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isDataJudConfigured, testarConexao, buscarProcessosPorParte, buscarProcessosPorClasse, buscaAvancada, extrairInfoProcesso, buscarProcessoAutomatico, formatarNumeroProcesso, } from '@/services/datajudService';
import { cn } from '@/utils/cn';
const tribunais = [
    // Tribunais Superiores (4)
    { id: 'stj', nome: 'STJ - Superior Tribunal de Justiça' },
    { id: 'tst', nome: 'TST - Tribunal Superior do Trabalho' },
    { id: 'tse', nome: 'TSE - Tribunal Superior Eleitoral' },
    { id: 'stm', nome: 'STM - Superior Tribunal Militar' },
    // Tribunais Regionais Federais (6)
    { id: 'trf1', nome: 'TRF1 - Tribunal Regional Federal 1ª Região' },
    { id: 'trf2', nome: 'TRF2 - Tribunal Regional Federal 2ª Região' },
    { id: 'trf3', nome: 'TRF3 - Tribunal Regional Federal 3ª Região' },
    { id: 'trf4', nome: 'TRF4 - Tribunal Regional Federal 4ª Região' },
    { id: 'trf5', nome: 'TRF5 - Tribunal Regional Federal 5ª Região' },
    { id: 'trf6', nome: 'TRF6 - Tribunal Regional Federal 6ª Região' },
    // Tribunais Regionais do Trabalho (24)
    { id: 'trt1', nome: 'TRT1 - Tribunal Regional do Trabalho 1ª Região (RJ)' },
    { id: 'trt2', nome: 'TRT2 - Tribunal Regional do Trabalho 2ª Região (SP)' },
    { id: 'trt3', nome: 'TRT3 - Tribunal Regional do Trabalho 3ª Região (MG)' },
    { id: 'trt4', nome: 'TRT4 - Tribunal Regional do Trabalho 4ª Região (RS)' },
    { id: 'trt5', nome: 'TRT5 - Tribunal Regional do Trabalho 5ª Região (BA)' },
    { id: 'trt6', nome: 'TRT6 - Tribunal Regional do Trabalho 6ª Região (PE)' },
    { id: 'trt7', nome: 'TRT7 - Tribunal Regional do Trabalho 7ª Região (CE)' },
    { id: 'trt8', nome: 'TRT8 - Tribunal Regional do Trabalho 8ª Região (PA/AP)' },
    { id: 'trt9', nome: 'TRT9 - Tribunal Regional do Trabalho 9ª Região (PR)' },
    { id: 'trt10', nome: 'TRT10 - Tribunal Regional do Trabalho 10ª Região (DF/TO)' },
    { id: 'trt11', nome: 'TRT11 - Tribunal Regional do Trabalho 11ª Região (AM/RR)' },
    { id: 'trt12', nome: 'TRT12 - Tribunal Regional do Trabalho 12ª Região (SC)' },
    { id: 'trt13', nome: 'TRT13 - Tribunal Regional do Trabalho 13ª Região (PB)' },
    { id: 'trt14', nome: 'TRT14 - Tribunal Regional do Trabalho 14ª Região (RO/AC)' },
    { id: 'trt15', nome: 'TRT15 - Tribunal Regional do Trabalho 15ª Região (Campinas-SP)' },
    { id: 'trt16', nome: 'TRT16 - Tribunal Regional do Trabalho 16ª Região (MA)' },
    { id: 'trt17', nome: 'TRT17 - Tribunal Regional do Trabalho 17ª Região (ES)' },
    { id: 'trt18', nome: 'TRT18 - Tribunal Regional do Trabalho 18ª Região (GO)' },
    { id: 'trt19', nome: 'TRT19 - Tribunal Regional do Trabalho 19ª Região (AL)' },
    { id: 'trt20', nome: 'TRT20 - Tribunal Regional do Trabalho 20ª Região (SE)' },
    { id: 'trt21', nome: 'TRT21 - Tribunal Regional do Trabalho 21ª Região (RN)' },
    { id: 'trt22', nome: 'TRT22 - Tribunal Regional do Trabalho 22ª Região (PI)' },
    { id: 'trt23', nome: 'TRT23 - Tribunal Regional do Trabalho 23ª Região (MT)' },
    { id: 'trt24', nome: 'TRT24 - Tribunal Regional do Trabalho 24ª Região (MS)' },
    // Tribunais Regionais Eleitorais (27)
    { id: 'tre-ac', nome: 'TRE-AC - Tribunal Regional Eleitoral do Acre' },
    { id: 'tre-al', nome: 'TRE-AL - Tribunal Regional Eleitoral de Alagoas' },
    { id: 'tre-ap', nome: 'TRE-AP - Tribunal Regional Eleitoral do Amapá' },
    { id: 'tre-am', nome: 'TRE-AM - Tribunal Regional Eleitoral do Amazonas' },
    { id: 'tre-ba', nome: 'TRE-BA - Tribunal Regional Eleitoral da Bahia' },
    { id: 'tre-ce', nome: 'TRE-CE - Tribunal Regional Eleitoral do Ceará' },
    { id: 'tre-dft', nome: 'TRE-DFT - Tribunal Regional Eleitoral do Distrito Federal' },
    { id: 'tre-es', nome: 'TRE-ES - Tribunal Regional Eleitoral do Espírito Santo' },
    { id: 'tre-go', nome: 'TRE-GO - Tribunal Regional Eleitoral de Goiás' },
    { id: 'tre-ma', nome: 'TRE-MA - Tribunal Regional Eleitoral do Maranhão' },
    { id: 'tre-mt', nome: 'TRE-MT - Tribunal Regional Eleitoral de Mato Grosso' },
    { id: 'tre-ms', nome: 'TRE-MS - Tribunal Regional Eleitoral de Mato Grosso do Sul' },
    { id: 'tre-mg', nome: 'TRE-MG - Tribunal Regional Eleitoral de Minas Gerais' },
    { id: 'tre-pa', nome: 'TRE-PA - Tribunal Regional Eleitoral do Pará' },
    { id: 'tre-pb', nome: 'TRE-PB - Tribunal Regional Eleitoral da Paraíba' },
    { id: 'tre-pr', nome: 'TRE-PR - Tribunal Regional Eleitoral do Paraná' },
    { id: 'tre-pe', nome: 'TRE-PE - Tribunal Regional Eleitoral de Pernambuco' },
    { id: 'tre-pi', nome: 'TRE-PI - Tribunal Regional Eleitoral do Piauí' },
    { id: 'tre-rj', nome: 'TRE-RJ - Tribunal Regional Eleitoral do Rio de Janeiro' },
    { id: 'tre-rn', nome: 'TRE-RN - Tribunal Regional Eleitoral do Rio Grande do Norte' },
    { id: 'tre-rs', nome: 'TRE-RS - Tribunal Regional Eleitoral do Rio Grande do Sul' },
    { id: 'tre-ro', nome: 'TRE-RO - Tribunal Regional Eleitoral de Rondônia' },
    { id: 'tre-rr', nome: 'TRE-RR - Tribunal Regional Eleitoral de Roraima' },
    { id: 'tre-sc', nome: 'TRE-SC - Tribunal Regional Eleitoral de Santa Catarina' },
    { id: 'tre-se', nome: 'TRE-SE - Tribunal Regional Eleitoral de Sergipe' },
    { id: 'tre-sp', nome: 'TRE-SP - Tribunal Regional Eleitoral de São Paulo' },
    { id: 'tre-to', nome: 'TRE-TO - Tribunal Regional Eleitoral do Tocantins' },
    // Tribunais de Justiça Militar Estaduais (3)
    { id: 'tjmmg', nome: 'TJM-MG - Tribunal de Justiça Militar de Minas Gerais' },
    { id: 'tjmrs', nome: 'TJM-RS - Tribunal de Justiça Militar do Rio Grande do Sul' },
    { id: 'tjmsp', nome: 'TJM-SP - Tribunal de Justiça Militar de São Paulo' },
    // Tribunais de Justiça Estaduais (27)
    { id: 'tjac', nome: 'TJAC - Tribunal de Justiça do Acre' },
    { id: 'tjal', nome: 'TJAL - Tribunal de Justiça de Alagoas' },
    { id: 'tjap', nome: 'TJAP - Tribunal de Justiça do Amapá' },
    { id: 'tjam', nome: 'TJAM - Tribunal de Justiça do Amazonas' },
    { id: 'tjba', nome: 'TJBA - Tribunal de Justiça da Bahia' },
    { id: 'tjce', nome: 'TJCE - Tribunal de Justiça do Ceará' },
    { id: 'tjdft', nome: 'TJDFT - Tribunal de Justiça do Distrito Federal' },
    { id: 'tjes', nome: 'TJES - Tribunal de Justiça do Espírito Santo' },
    { id: 'tjgo', nome: 'TJGO - Tribunal de Justiça de Goiás' },
    { id: 'tjma', nome: 'TJMA - Tribunal de Justiça do Maranhão' },
    { id: 'tjmt', nome: 'TJMT - Tribunal de Justiça de Mato Grosso' },
    { id: 'tjms', nome: 'TJMS - Tribunal de Justiça de Mato Grosso do Sul' },
    { id: 'tjmg', nome: 'TJMG - Tribunal de Justiça de Minas Gerais' },
    { id: 'tjpa', nome: 'TJPA - Tribunal de Justiça do Pará' },
    { id: 'tjpb', nome: 'TJPB - Tribunal de Justiça da Paraíba' },
    { id: 'tjpr', nome: 'TJPR - Tribunal de Justiça do Paraná' },
    { id: 'tjpe', nome: 'TJPE - Tribunal de Justiça de Pernambuco' },
    { id: 'tjpi', nome: 'TJPI - Tribunal de Justiça do Piauí' },
    { id: 'tjrj', nome: 'TJRJ - Tribunal de Justiça do Rio de Janeiro' },
    { id: 'tjrn', nome: 'TJRN - Tribunal de Justiça do Rio Grande do Norte' },
    { id: 'tjrs', nome: 'TJRS - Tribunal de Justiça do Rio Grande do Sul' },
    { id: 'tjro', nome: 'TJRO - Tribunal de Justiça de Rondônia' },
    { id: 'tjrr', nome: 'TJRR - Tribunal de Justiça de Roraima' },
    { id: 'tjsc', nome: 'TJSC - Tribunal de Justiça de Santa Catarina' },
    { id: 'tjsp', nome: 'TJSP - Tribunal de Justiça de São Paulo' },
    { id: 'tjse', nome: 'TJSE - Tribunal de Justiça de Sergipe' },
    { id: 'tjto', nome: 'TJTO - Tribunal de Justiça do Tocantins' },
];
export const DataJudPage = () => {
    const navigate = useNavigate();
    const [conectado, setConectado] = React.useState(false);
    const [testando, setTestando] = React.useState(false);
    const [buscando, setBuscando] = React.useState(false);
    const [configurado, setConfigurado] = React.useState(false);
    const [tipoBusca, setTipoBusca] = React.useState('numero');
    const [tribunal, setTribunal] = React.useState('trf1');
    const [resultados, setResultados] = React.useState([]);
    const [totalEncontrado, setTotalEncontrado] = React.useState(0);
    // Campos de busca
    const [numeroProcesso, setNumeroProcesso] = React.useState('');
    const [nomeParte, setNomeParte] = React.useState('');
    const [classe, setClasse] = React.useState('');
    const [orgao, setOrgao] = React.useState('');
    const [dataInicio, setDataInicio] = React.useState('');
    const [dataFim, setDataFim] = React.useState('');
    React.useEffect(() => {
        let ativo = true;
        isDataJudConfigured()
            .then((ok) => {
            if (!ativo)
                return;
            setConfigurado(ok);
            if (ok) {
                handleTestarConexao();
            }
        })
            .catch(() => {
            if (ativo) {
                setConfigurado(false);
            }
        });
        return () => {
            ativo = false;
        };
    }, []);
    const handleTestarConexao = async () => {
        setTestando(true);
        try {
            const resultado = await testarConexao();
            setConectado(resultado.sucesso);
            if (resultado.sucesso) {
                toast.success(resultado.mensagem);
            }
            else {
                toast.error(resultado.mensagem);
            }
        }
        catch (error) {
            toast.error('Erro ao testar conexão');
            setConectado(false);
        }
        finally {
            setTestando(false);
        }
    };
    const handleBuscar = async () => {
        const ok = await isDataJudConfigured();
        if (!ok) {
            setConfigurado(false);
            toast.error('API DataJud não configurada. Configure em .env');
            return;
        }
        setConfigurado(true);
        setBuscando(true);
        try {
            let resultado;
            switch (tipoBusca) {
                case 'numero':
                    if (!numeroProcesso.trim()) {
                        toast.error('Digite o número do processo');
                        setBuscando(false);
                        return;
                    }
                    // Busca automática detectando o tribunal
                    toast.info('Detectando tribunal automaticamente...');
                    const buscaAuto = await buscarProcessoAutomatico(numeroProcesso);
                    if (buscaAuto.sucesso && buscaAuto.processo) {
                        setResultados([buscaAuto.processo]);
                        setTotalEncontrado(1);
                        setTribunal(buscaAuto.tribunal);
                        toast.success(`Processo encontrado no ${buscaAuto.tribunal?.toUpperCase()}`);
                        setBuscando(false);
                        return;
                    }
                    else {
                        toast.error(buscaAuto.erro || 'Processo não encontrado');
                        setBuscando(false);
                        return;
                    }
                case 'parte':
                    if (!nomeParte.trim()) {
                        toast.error('Digite o nome da parte');
                        setBuscando(false);
                        return;
                    }
                    resultado = await buscarProcessosPorParte(nomeParte, tribunal, 20);
                    break;
                case 'classe':
                    if (!classe.trim()) {
                        toast.error('Digite a classe processual');
                        return;
                    }
                    resultado = await buscarProcessosPorClasse(classe, tribunal, 20);
                    break;
                case 'avancada':
                    resultado = await buscaAvancada({
                        numeroProcesso: numeroProcesso || undefined,
                        nomeParte: nomeParte || undefined,
                        classe: classe || undefined,
                        orgao: orgao || undefined,
                        dataInicio: dataInicio || undefined,
                        dataFim: dataFim || undefined,
                    }, tribunal, 50);
                    break;
            }
            const processos = resultado.hits.hits.map((hit) => hit._source);
            setResultados(processos);
            setTotalEncontrado(resultado.hits.total.value);
            // Registrar consulta no histórico
            if (processos.length > 0 && processos[0].numeroProcesso) {
                registrarConsulta({
                    numero_processo: processos[0].numeroProcesso,
                    tribunal: tribunal || 'Detectado automaticamente',
                    tipo_busca: tipoBusca,
                    sucesso: true
                }).catch(console.error);
            }
            if (processos.length === 0) {
                toast.info('Nenhum processo encontrado');
            }
            else {
                toast.success(`${processos.length} processo(s) encontrado(s)`);
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao buscar processos');
            setResultados([]);
            setTotalEncontrado(0);
        }
        finally {
            setBuscando(false);
        }
    };
    const limparBusca = () => {
        setNumeroProcesso('');
        setNomeParte('');
        setClasse('');
        setOrgao('');
        setDataInicio('');
        setDataFim('');
        setResultados([]);
        setTotalEncontrado(0);
    };
    const renderValue = (value) => {
        if (typeof value === 'object' && value !== null) {
            return value.nome || value.codigo || JSON.stringify(value);
        }
        return String(value || '-');
    };
    const obterMarcaDagua = (() => {
        let cache = null;
        const watermarkUrl = 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png';
        return async () => {
            if (cache)
                return cache;
            const response = await fetch(watermarkUrl);
            if (!response.ok) {
                throw new Error('Nao foi possivel carregar a marca dagua.');
            }
            const blob = await response.blob();
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Falha ao ler a marca dagua.'));
                reader.readAsDataURL(blob);
            });
            const dimensions = await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = () => reject(new Error('Falha ao medir a marca dagua.'));
                img.src = dataUrl;
            });
            cache = { dataUrl, ...dimensions };
            return cache;
        };
    })();
    const exportarProcessoParaPDF = async (processo) => {
        try {
            const doc = new jsPDF();
            const info = extrairInfoProcesso(processo);
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 18;
            const topMargin = 28;
            const bottomMargin = 18;
            let y = topMargin;
            const maxWidth = pageWidth - 2 * margin;
            const watermark = await obterMarcaDagua().catch(() => null);
            // Configurações de fonte
            const ensureSpace = (height) => {
                if (y + height > pageHeight - bottomMargin) {
                    doc.addPage();
                    y = topMargin;
                }
            };
            const addText = (text, fontSize = 10, isBold = false) => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                const lines = doc.splitTextToSize(text, maxWidth);
                const lineHeight = fontSize * 0.5 + 3;
                ensureSpace(lines.length * lineHeight + 2);
                doc.text(lines, margin, y);
                y += lines.length * lineHeight;
            };
            const addSectionTitle = (title) => {
                ensureSpace(14);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(26, 47, 76);
                doc.text(title, margin, y);
                y += 6;
                doc.setDrawColor(220);
                doc.line(margin, y, pageWidth - margin, y);
                y += 6;
                doc.setTextColor(40);
            };
            const addKeyValue = (label, value) => {
                addText(`${label}: ${value}`, 10);
            };
            // Título
            addText('RELATORIO COMPLETO DO PROCESSO', 16, true);
            y += 5;
            addText(`Processo: ${formatarNumeroProcesso(info.numero)}`, 12, true);
            y += 3;
            if (watermark) {
                const targetWidth = pageWidth * 0.28;
                const aspect = watermark.height / watermark.width;
                const targetHeight = targetWidth * aspect;
                const x = pageWidth - targetWidth - margin;
                const yPos = topMargin + 2;
                const jsPdfAny = jsPDF;
                const docAny = doc;
                if (docAny.setGState && jsPdfAny.GState) {
                    docAny.setGState(new jsPdfAny.GState({ opacity: 0.15 }));
                }
                doc.addImage(watermark.dataUrl, 'PNG', x, yPos, targetWidth, targetHeight);
                if (docAny.setGState && jsPdfAny.GState) {
                    docAny.setGState(new jsPdfAny.GState({ opacity: 1 }));
                }
            }
            // Informações básicas
            addSectionTitle('DADOS GERAIS');
            addKeyValue('Tribunal', info.tribunal);
            addKeyValue('Classe', renderValue(info.classe));
            addKeyValue('Grau', processo.grau || '-');
            addKeyValue('Sistema', renderValue(processo.sistema));
            addKeyValue('Formato', renderValue(processo.formato));
            addKeyValue('Nivel de Sigilo', processo.nivelSigilo === 0 ? 'Publico' : 'Restrito');
            if (processo.id)
                addKeyValue('ID do Processo', processo.id);
            y += 5;
            // Órgão Julgador
            if (processo.orgaoJulgador) {
                addSectionTitle('ORGAO JULGADOR');
                addKeyValue('Nome', renderValue(processo.orgaoJulgador));
                if (processo.orgaoJulgador.codigoMunicipioIBGE) {
                    addKeyValue('Codigo IBGE', processo.orgaoJulgador.codigoMunicipioIBGE);
                }
                y += 5;
            }
            // Datas
            addSectionTitle('DATAS');
            addKeyValue('Data de Ajuizamento', info.dataAjuizamento);
            if (processo.dataHoraUltimaAtualizacao) {
                addKeyValue('Ultima Atualizacao', new Date(processo.dataHoraUltimaAtualizacao).toLocaleString('pt-BR'));
            }
            y += 5;
            // Assuntos
            if (processo.assuntos && processo.assuntos.length > 0) {
                addSectionTitle('ASSUNTOS');
                processo.assuntos.forEach((assunto) => {
                    const txt = `- ${renderValue(assunto)}`;
                    if (assunto.codigo) {
                        addText(`${txt} (Codigo: ${assunto.codigo})`);
                    }
                    else {
                        addText(txt);
                    }
                });
                y += 5;
            }
            // Movimentações
            if (processo.movimentos && processo.movimentos.length > 0) {
                addSectionTitle('HISTORICO DE MOVIMENTACOES');
                addText(`Total: ${processo.movimentos.length} movimentacoes`, 10, true);
                y += 3;
                processo.movimentos.forEach((mov, index) => {
                    ensureSpace(22);
                    addText(`${index + 1}. ${mov.nome}`, 11, true);
                    if (mov.codigo || mov.codigoNacional) {
                        let codigos = [];
                        if (mov.codigo)
                            codigos.push(`Codigo: ${mov.codigo}`);
                        if (mov.codigoNacional)
                            codigos.push(`Cod. Nacional: ${mov.codigoNacional}`);
                        addText(codigos.join(' | '), 9);
                    }
                    if (mov.dataHora) {
                        const data = new Date(mov.dataHora);
                        addText(`Data/Hora: ${data.toLocaleDateString('pt-BR')} as ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 9);
                    }
                    if (mov.complemento) {
                        addText(`Complemento: ${mov.complemento}`, 9);
                    }
                    if (mov.complementosTabelados && mov.complementosTabelados.length > 0) {
                        addText('Detalhes:', 9, true);
                        mov.complementosTabelados.forEach((c) => {
                            addText(`  - ${c.nome}`, 9);
                            if (c.descricao) {
                                addText(`    ${c.descricao.replace(/_/g, ' ')}`, 8);
                            }
                            if (c.codigo || c.valor) {
                                let detalhes = [];
                                if (c.codigo)
                                    detalhes.push(`Cod: ${c.codigo}`);
                                if (c.valor)
                                    detalhes.push(`Val: ${c.valor}`);
                                addText(`    ${detalhes.join(' | ')}`, 8);
                            }
                        });
                    }
                    y += 5;
                });
            }
            // Marca d'agua e rodapé
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFillColor(245, 247, 251);
                doc.rect(0, 0, pageWidth, 22, 'F');
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(26, 47, 76);
                doc.text('Relatorio DataJud', margin, 14);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(90);
                doc.text(formatarNumeroProcesso(info.numero), pageWidth - margin, 14, { align: 'right' });
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} - Pagina ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
                doc.setFontSize(7);
                doc.setTextColor(120);
                doc.text('LGPD: Este relatorio contem dados pessoais e deve ser acessado e compartilhado apenas por pessoas autorizadas.', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
                doc.setTextColor(40);
            }
            // Salvar PDF
            const nomeArquivo = `processo_${formatarNumeroProcesso(info.numero).replace(/[^0-9]/g, '')}.pdf`;
            doc.save(nomeArquivo);
            toast.success('PDF gerado com sucesso!');
        }
        catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Erro ao gerar PDF');
        }
    };
    const renderPolos = (processo) => {
        const polos = processo.dadosBasicos?.polo || [];
        if (!polos.length)
            return null;
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-text-muted text-xs mb-1", children: "Partes" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: polos.map((polo, idx) => (_jsxs("div", { className: "rounded-xl border border-border bg-surface-2 p-3", children: [_jsx("p", { className: "text-xs text-text-muted", children: polo.polo || polo.tipo || 'Parte' }), _jsx("p", { className: "text-sm font-semibold text-text", children: polo.nome || '-' }), polo.tipo && (_jsxs("p", { className: "text-[10px] text-text-muted mt-0.5", children: ["Tipo: ", polo.tipo] }))] }, idx))) })] }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("header", { className: "relative overflow-hidden rounded-2xl border border-border bg-surface p-7 shadow-soft", style: {
                    backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.94) 70%, rgba(216,232,255,0.3) 100%), url(${heroLight})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right center',
                    backgroundSize: '560px',
                }, children: _jsxs("div", { className: "relative z-10 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Database, { className: "h-5 w-5 text-primary" }), _jsx("p", { className: "text-[11px] uppercase tracking-[0.32em] text-text-subtle", children: "Integra\u00E7\u00E3o CNJ" })] }), _jsx("h2", { className: "font-display text-2xl text-text", children: "API DataJud" }), _jsx("p", { className: "text-sm text-text-muted", children: "Base Nacional de Dados do Poder Judici\u00E1rio - Consulta de processos judiciais" })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm flex items-center justify-between", children: [_jsx("span", { children: "Status da Conex\u00E3o" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleTestarConexao, disabled: testando, children: [_jsx(RefreshCw, { className: cn('h-4 w-4 mr-2', testando && 'animate-spin') }), "Testar Conex\u00E3o"] })] }) }), _jsx(CardContent, { children: !configurado ? (_jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-warning flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-warning", children: "API DataJud n\u00E3o configurada" }), _jsxs("p", { className: "text-xs text-text-muted", children: ["Configure a vari\u00E1vel ", _jsx("code", { className: "px-1.5 py-0.5 bg-black/5 rounded", children: "VITE_DATAJUD_API_KEY" }), " no arquivo .env. Solicite sua chave em:", ' ', _jsx("a", { href: "https://www.cnj.jus.br/sistemas/datajud/api-publica/", target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline", children: "CNJ - API P\u00FAblica" })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => navigate('/app/config'), children: "Ir para Configura\u00E7\u00F5es" })] })] })) : (_jsxs("div", { className: cn('flex items-center gap-3 rounded-2xl border p-4', conectado
                                ? 'border-success/30 bg-success/5'
                                : 'border-error/30 bg-error/5'), children: [_jsx("div", { className: cn('h-3 w-3 rounded-full', conectado ? 'bg-success animate-pulse' : 'bg-error') }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: conectado ? 'Conectado à API DataJud' : 'Falha na conexão' }), _jsx("p", { className: "text-xs text-text-muted", children: conectado
                                                ? 'Pronto para consultar processos judiciais'
                                                : 'Verifique suas credenciais ou tente novamente' })] })] })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "Tipo de Busca" }) }), _jsx(CardContent, { children: _jsx("div", { className: "flex flex-wrap gap-2", children: [
                                { id: 'numero', label: 'Por Número', icon: FileText },
                                { id: 'parte', label: 'Por Parte', icon: Users },
                                { id: 'classe', label: 'Por Classe', icon: Calendar },
                                { id: 'avancada', label: 'Busca Avançada', icon: Search },
                            ].map((tipo) => {
                                const Icon = tipo.icon;
                                return (_jsxs("button", { type: "button", onClick: () => {
                                        setTipoBusca(tipo.id);
                                        limparBusca();
                                    }, className: cn('flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition', tipoBusca === tipo.id
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-white text-text-muted hover:text-text'), children: [_jsx(Icon, { className: "h-4 w-4" }), tipo.label] }, tipo.id));
                            }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "Tribunal" }) }), _jsx(CardContent, { children: _jsx("select", { value: tribunal, onChange: (e) => setTribunal(e.target.value), className: "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", children: tribunais.map((t) => (_jsx("option", { value: t.id, children: t.nome }, t.id))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm", children: [tipoBusca === 'numero' && 'Buscar por Número do Processo', tipoBusca === 'parte' && 'Buscar por Nome da Parte', tipoBusca === 'classe' && 'Buscar por Classe Processual', tipoBusca === 'avancada' && 'Busca Avançada'] }) }), _jsxs(CardContent, { className: "space-y-4", children: [(tipoBusca === 'numero' || tipoBusca === 'avancada') && (_jsxs("div", { children: [_jsx("label", { className: "text-xs text-text-muted mb-1.5 block", children: "N\u00FAmero do Processo" }), _jsx(Input, { placeholder: "0000000-00.0000.0.00.0000", value: numeroProcesso, onChange: (e) => setNumeroProcesso(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleBuscar() })] })), (tipoBusca === 'parte' || tipoBusca === 'avancada') && (_jsxs("div", { children: [_jsx("label", { className: "text-xs text-text-muted mb-1.5 block", children: "Nome da Parte" }), _jsx(Input, { placeholder: "Digite o nome completo ou parcial", value: nomeParte, onChange: (e) => setNomeParte(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleBuscar() })] })), (tipoBusca === 'classe' || tipoBusca === 'avancada') && (_jsxs("div", { children: [_jsx("label", { className: "text-xs text-text-muted mb-1.5 block", children: "Classe Processual" }), _jsx(Input, { placeholder: "Ex: A\u00E7\u00E3o Civil P\u00FAblica", value: classe, onChange: (e) => setClasse(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleBuscar() })] })), tipoBusca === 'avancada' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-text-muted mb-1.5 block", children: "\u00D3rg\u00E3o Julgador" }), _jsx(Input, { placeholder: "Ex: 1\u00AA Vara Federal", value: orgao, onChange: (e) => setOrgao(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleBuscar() })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-text-muted mb-1.5 block", children: "Data In\u00EDcio" }), _jsx(Input, { type: "date", value: dataInicio, onChange: (e) => setDataInicio(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-text-muted mb-1.5 block", children: "Data Fim" }), _jsx(Input, { type: "date", value: dataFim, onChange: (e) => setDataFim(e.target.value) })] })] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: handleBuscar, disabled: buscando || !configurado || !conectado, className: "flex-1", children: [_jsx(Search, { className: cn('h-4 w-4 mr-2', buscando && 'animate-pulse') }), buscando ? 'Buscando...' : 'Buscar'] }), _jsx(Button, { variant: "outline", onClick: limparBusca, children: "Limpar" })] })] })] }), totalEncontrado > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm", children: ["Resultados da Busca", _jsxs(Badge, { variant: "info", className: "ml-2", children: [totalEncontrado, " encontrado(s)"] })] }) }), _jsx(CardContent, { className: "space-y-3", children: resultados.map((processo, index) => {
                            // Debug: ver estrutura do processo
                            if (index === 0) {
                                console.log('🔍 Estrutura do processo:', processo);
                                console.log('📅 dataAjuizamento:', processo.dataAjuizamento, processo.dadosBasicos?.dataAjuizamento);
                                console.log('📋 movimentos:', processo.movimentos?.length);
                            }
                            const info = extrairInfoProcesso(processo);
                            return (_jsx("div", { className: "rounded-2xl border border-border bg-surface p-6 shadow-soft hover:shadow-md transition-shadow", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-start justify-between gap-3", children: _jsxs("div", { className: "space-y-2 flex-1", children: [_jsx("p", { className: "font-mono text-base font-bold text-primary", children: formatarNumeroProcesso(info.numero) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Badge, { variant: "info", className: "text-xs", children: info.tribunal }), _jsx(Badge, { className: "text-xs", children: renderValue(info.classe) }), _jsx(Badge, { variant: "default", className: "text-xs", children: processo.grau }), processo.sistema && (_jsx(Badge, { variant: "default", className: "text-xs", children: renderValue(processo.sistema) })), processo.formato && (_jsx(Badge, { variant: "default", className: "text-xs", children: renderValue(processo.formato) })), processo.nivelSigilo !== undefined && (_jsx(Badge, { variant: processo.nivelSigilo === 0 ? "success" : "warning", className: "text-xs", children: processo.nivelSigilo === 0 ? "Público" : `Sigilo ${processo.nivelSigilo}` }))] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-text-muted text-xs mb-1", children: "\u00D3rg\u00E3o Julgador" }), _jsx("p", { className: "text-text font-medium", children: renderValue(info.orgao) }), processo.orgaoJulgador?.codigoMunicipioIBGE && (_jsxs("p", { className: "text-text-muted text-[10px] mt-0.5", children: ["IBGE: ", processo.orgaoJulgador.codigoMunicipioIBGE] }))] }), _jsxs("div", { children: [_jsx("p", { className: "text-text-muted text-xs mb-1", children: "Data Ajuizamento" }), _jsx("p", { className: "text-text font-medium", children: info.dataAjuizamento })] }), _jsxs("div", { children: [_jsx("p", { className: "text-text-muted text-xs mb-1", children: "\u00DAltima Atualiza\u00E7\u00E3o" }), _jsx("p", { className: "text-text font-medium", children: processo.dataHoraUltimaAtualizacao
                                                                ? new Date(processo.dataHoraUltimaAtualizacao).toLocaleDateString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })
                                                                : '-' })] })] }), processo.id && (_jsxs("div", { className: "text-xs text-text-muted font-mono bg-surface p-2 rounded border", children: [_jsx("span", { className: "font-semibold", children: "ID:" }), " ", processo.id] })), _jsxs("details", { className: "mt-2 rounded-2xl border border-border bg-surface-2", children: [_jsx("summary", { className: "cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-2xl", children: "Detalhes do Processo" }), _jsxs("div", { className: "space-y-4 px-4 pb-4", children: [processo.assuntos && processo.assuntos.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-text-muted text-xs mb-2", children: "Assuntos" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: processo.assuntos.map((assunto, idx) => (_jsx(Badge, { variant: "default", className: "text-xs", title: `Código: ${assunto.codigo}`, children: assunto.nome }, idx))) })] })), renderPolos(processo), processo.movimentos && processo.movimentos.length > 0 && (_jsxs("div", { className: "pt-3 border-t border-border", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("svg", { className: "w-5 h-5 text-primary", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }) }), _jsx("p", { className: "text-text font-semibold text-base", children: "Historico de movimentacoes" }), _jsxs(Badge, { variant: "info", className: "ml-auto", children: [processo.movimentos.length, " movimentacoes"] })] }), _jsx("div", { className: "max-h-[500px] overflow-y-auto space-y-3 border rounded-lg p-4 bg-surface shadow-inner", children: processo.movimentos
                                                                        .filter((m) => m.nome)
                                                                        .sort((a, b) => {
                                                                        const dateA = a.dataHora ? new Date(a.dataHora).getTime() : 0;
                                                                        const dateB = b.dataHora ? new Date(b.dataHora).getTime() : 0;
                                                                        return dateB - dateA; // Mais recente primeiro
                                                                    })
                                                                        .map((mov, idx) => (_jsxs("div", { className: "flex gap-4 p-3 rounded-lg bg-surface-2 border border-border hover:border-primary/30 hover:shadow-sm transition-all", children: [_jsxs("div", { className: "flex-shrink-0 flex flex-col items-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx("span", { className: "text-xs font-bold text-primary", children: idx + 1 }) }), idx < (processo.movimentos?.filter((m) => m.nome).length || 0) - 1 && (_jsx("div", { className: "w-px h-full bg-border mt-2" }))] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-semibold text-text leading-snug", children: mov.nome }), mov.codigo && (_jsxs("p", { className: "text-[10px] text-text-muted mt-0.5 font-mono", children: ["C\u00F3digo: ", mov.codigo, mov.codigoNacional && ` • Nacional: ${mov.codigoNacional}`] }))] }), _jsxs("div", { className: "flex flex-col items-end gap-1", children: [_jsx(Badge, { variant: "default", className: "text-[10px] flex-shrink-0", children: mov.dataHora
                                                                                                            ? new Date(mov.dataHora).toLocaleDateString('pt-BR', {
                                                                                                                day: '2-digit',
                                                                                                                month: '2-digit',
                                                                                                                year: 'numeric',
                                                                                                            })
                                                                                                            : 'Sem data' }), mov.dataHora && (_jsx("span", { className: "text-[10px] text-text-muted", children: new Date(mov.dataHora).toLocaleTimeString('pt-BR', {
                                                                                                            hour: '2-digit',
                                                                                                            minute: '2-digit',
                                                                                                        }) }))] })] }), mov.complemento && (_jsx("div", { className: "mb-2 p-2 bg-surface rounded text-xs text-text border-l-2 border-primary/30", children: mov.complemento })), mov.complementosTabelados && mov.complementosTabelados.length > 0 && (_jsxs("div", { className: "mt-2 pt-2 border-t border-border/50", children: [_jsx("p", { className: "text-xs text-text-muted font-medium mb-2", children: "Detalhes:" }), _jsx("div", { className: "space-y-1.5", children: mov.complementosTabelados.map((c, cIdx) => (_jsx("div", { className: "text-xs bg-info/10 p-2 rounded border border-info/20", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-info font-semibold", children: "\u2022" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-text font-medium", children: c.nome }), c.descricao && (_jsx("p", { className: "text-text-muted text-[10px] mt-0.5", children: c.descricao.replace(/_/g, ' ') })), _jsxs("div", { className: "flex gap-3 mt-1", children: [c.codigo && (_jsxs("span", { className: "text-[10px] text-text-muted font-mono", children: ["Cod: ", c.codigo] })), c.valor && (_jsxs("span", { className: "text-[10px] text-text-muted font-mono", children: ["Val: ", c.valor] }))] })] })] }) }, cIdx))) })] }))] })] }, idx))) })] }))] })] }), _jsxs("div", { className: "flex gap-2 pt-2 border-t", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                        navigator.clipboard.writeText(formatarNumeroProcesso(info.numero));
                                                        toast.success('Número copiado!');
                                                    }, children: "Copiar N\u00FAmero" }), _jsx(BotaoFavorito, { processo: processo }), _jsxs(Button, { size: "sm", onClick: () => exportarProcessoParaPDF(processo), className: "flex items-center gap-2 bg-brand-secondary text-white hover:bg-brand-secondary-dark border-0", children: [_jsx(FileDown, { className: "h-4 w-4" }), "Exportar PDF"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                        toast.info('Funcionalidade em desenvolvimento');
                                                    }, children: "Importar para Casos" })] })] }) }, index));
                        }) })] }))] }));
};
