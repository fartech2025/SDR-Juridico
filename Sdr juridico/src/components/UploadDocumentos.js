import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Upload, FileUp, Image, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { documentosService, formatarTamanhoArquivo, obterIconeArquivo } from '@/services/documentosService';
import { FormularioContestacao } from '@/components/FormularioContestacao';
import { FormularioContrato } from '@/components/FormularioContrato';
export function UploadDocumentos({ casoId, orgId, onUploadComplete, className, disabled = false }) {
    const [arquivos, setArquivos] = React.useState([]);
    const [dragActive, setDragActive] = React.useState(false);
    const [tipoDocumento, setTipoDocumento] = React.useState('');
    const [observacao, setObservacao] = React.useState('');
    const [dadosProcuracao, setDadosProcuracao] = React.useState({
        tipo: '',
        status: 'rascunho',
        numeroId: '',
        dataDocumento: '',
        dataAssinatura: '',
        validade: 'indeterminada',
        dataExpiracao: '',
        outorgante: { nome: '', cpfCnpj: '', rgIe: '', endereco: '', email: '', telefone: '' },
        outorgados: [{ nome: '', oab: '', uf: '', cpf: '', sociedade: '' }],
        poderesPrincipais: [],
        poderesEspeciais: '',
        limitacoes: '',
        orgaoCompetencia: '',
        processosVinculados: '',
        areaDireito: '',
        finalidade: '',
        tipoAssinatura: '',
        assinantes: '',
        evidencias: '',
        reconhecimentoFirma: false,
        cartorio: '',
        testemunhas: '',
    });
    const [dadosContestacao, setDadosContestacao] = React.useState({
        status: 'rascunho',
        numeroProcesso: '',
        classeProcessual: '',
        varaOrgao: '',
        comarca: '',
        areaDireito: '',
        dataCriacao: '',
        dataProtocolo: '',
        prazoFinal: '',
        situacaoPrazo: 'no_prazo',
        autores: [{ nome: '', cpfCnpj: '' }],
        reus: [{ nome: '', cpfCnpj: '' }],
        advogadosReu: [{ nome: '', oab: '', uf: '' }],
        advogadosContrarios: '',
        resumoPeticaoInicial: '',
        pedidosAutor: [],
        valorCausa: '',
        riscoJuridico: 'medio',
        impactoFinanceiro: '',
        probabilidadeAcordo: '',
        tesePrincipais: [],
        tesePreliminares: '',
        teseMerito: '',
        jurisprudencias: [],
        fundamentacaoLegal: '',
        pedidosContestacao: [],
        documentosAnexados: [],
        documentosPendentes: [],
        validacaoInterna: 'pendente',
        tipoProvaRequerida: [],
        testemunhas: [],
        meioProtocolo: '',
        numeroProtocolo: '',
        comprovanteAnexado: false,
        confirmacaoProtocolo: false,
        usuarioProtocolo: '',
        dataHoraEnvio: '',
    });
    const [dadosContrato, setDadosContrato] = React.useState({
        tipoContrato: '',
        subtipoContrato: '',
        status: 'rascunho',
        numeroContrato: '',
        dataEmissao: '',
        dataAssinatura: '',
        dataInicio: '',
        dataTermino: '',
        prazoVigencia: '',
        renovacaoAutomatica: false,
        partes: [{ tipo: '', nome: '', cpfCnpj: '', endereco: '', email: '', telefone: '', representante: '' }],
        objetoContrato: '',
        valorTotal: '',
        formaPagamento: '',
        parcelas: '',
        dataVencimento: '',
        reajuste: '',
        indiceReajuste: '',
        honorariosFixo: '',
        honorariosExito: '',
        percentualExito: '',
        valorMinimoGarantido: '',
        garantias: [],
        tipoGarantia: '',
        clausulasEspecificas: '',
        clausulaRescisao: '',
        multaRescisoria: '',
        clausulaNaoConcorrencia: '',
        sla: '',
        escopo: '',
        limitesHoras: '',
        propriedadeIntelectual: '',
        confidencialidade: false,
        foro: '',
        legislacaoAplicavel: '',
        tipoAssinatura: '',
        assinantes: '',
        reconhecimentoFirma: false,
        cartorio: '',
        vinculacaoCliente: '',
        vinculacaoCaso: '',
        vinculacaoHonorarios: '',
        alertaVencimento: false,
        diasAntesAlerta: '',
        alertaReajuste: false,
        observacoes: '',
    });
    const inputFileRef = React.useRef(null);
    const inputCameraRef = React.useRef(null);
    const handleDrag = (e) => {
        if (disabled)
            return;
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        }
        else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };
    const handleDrop = (e) => {
        if (disabled)
            return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleArquivos(Array.from(e.dataTransfer.files));
        }
    };
    const handleFileInput = (e) => {
        if (disabled)
            return;
        if (e.target.files && e.target.files.length > 0) {
            handleArquivos(Array.from(e.target.files));
        }
    };
    const handleArquivos = (novosArquivos) => {
        if (disabled) {
            toast.error('Voce nao tem permissao para enviar documentos.');
            return;
        }
        // Validar se tipo de documento foi selecionado
        if (!tipoDocumento) {
            toast.error('Por favor, selecione o tipo de documento antes de fazer o upload');
            return;
        }
        const arquivosValidos = novosArquivos.filter((arquivo) => {
            // Validar tamanho
            if (arquivo.size > 10 * 1024 * 1024) {
                toast.error(`${arquivo.name}: Arquivo muito grande (máx 10MB)`);
                return false;
            }
            // Validar tipo
            const tiposPermitidos = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            if (!tiposPermitidos.includes(arquivo.type)) {
                toast.error(`${arquivo.name}: Tipo de arquivo não permitido`);
                return false;
            }
            return true;
        });
        const novosUploads = arquivosValidos.map((arquivo) => ({
            arquivo,
            progresso: 0,
            status: 'aguardando',
        }));
        setArquivos((prev) => [...prev, ...novosUploads]);
        // Iniciar uploads
        novosUploads.forEach((upload, index) => {
            fazerUpload(upload, arquivos.length + index);
        });
    };
    const fazerUpload = async (upload, index) => {
        try {
            // Atualizar status para enviando
            setArquivos((prev) => prev.map((a, i) => i === index ? { ...a, status: 'enviando', progresso: 50 } : a));
            // Preparar descrição com dados da procuração, contestação ou contrato se aplicável
            let descricaoCompleta = observacao || '';
            if (tipoDocumento === 'procuracao') {
                descricaoCompleta = JSON.stringify({ observacao, dadosProcuracao });
            }
            else if (tipoDocumento === 'contestacao') {
                descricaoCompleta = JSON.stringify({ observacao, dadosContestacao });
            }
            else if (tipoDocumento === 'contrato') {
                descricaoCompleta = JSON.stringify({ observacao, dadosContrato });
            }
            // Fazer upload
            await documentosService.uploadDocumento({
                arquivo: upload.arquivo,
                casoId,
                orgId,
                categoria: tipoDocumento || 'geral',
                descricao: descricaoCompleta || undefined,
            });
            // Sucesso
            setArquivos((prev) => prev.map((a, i) => i === index ? { ...a, status: 'sucesso', progresso: 100 } : a));
            toast.success(`${upload.arquivo.name} enviado com sucesso!`);
            // Limpar campos se todos os uploads foram concluídos
            const todosCompletos = arquivos.every((a, i) => i === index ? true : a.status === 'sucesso' || a.status === 'erro');
            if (todosCompletos) {
                setTipoDocumento('');
                setObservacao('');
            }
            // Chamar callback se fornecido
            if (onUploadComplete) {
                onUploadComplete();
            }
        }
        catch (error) {
            // Erro
            const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
            setArquivos((prev) => prev.map((a, i) => i === index ? { ...a, status: 'erro', erro: mensagemErro } : a));
            toast.error(`Erro ao enviar ${upload.arquivo.name}: ${mensagemErro}`);
        }
    };
    const removerArquivo = (index) => {
        setArquivos((prev) => prev.filter((_, i) => i !== index));
    };
    const limparConcluidos = () => {
        setArquivos((prev) => prev.filter((a) => a.status !== 'sucesso'));
    };
    return (_jsxs("div", { className: className, children: [_jsx("div", { children: _jsxs(Card, { className: "mb-4 p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "tipoDocumento", className: "block text-sm font-medium text-text mb-2", children: "Tipo de Documento *" }), _jsxs("select", { id: "tipoDocumento", value: tipoDocumento, onChange: (e) => setTipoDocumento(e.target.value), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "", children: "Selecione o tipo" }), _jsx("option", { value: "peticao_inicial", children: "Peti\u00E7\u00E3o Inicial" }), _jsx("option", { value: "contestacao", children: "Contesta\u00E7\u00E3o" }), _jsx("option", { value: "recurso", children: "Recurso" }), _jsx("option", { value: "procuracao", children: "Procura\u00E7\u00E3o" }), _jsx("option", { value: "contrato", children: "Contrato" }), _jsx("option", { value: "documento_pessoal", children: "Documento Pessoal" }), _jsx("option", { value: "comprovante", children: "Comprovante" }), _jsx("option", { value: "laudo", children: "Laudo/Per\u00EDcia" }), _jsx("option", { value: "sentenca", children: "Senten\u00E7a" }), _jsx("option", { value: "acordo", children: "Acordo" }), _jsx("option", { value: "outro", children: "Outro" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "observacao", className: "block text-sm font-medium text-text mb-2", children: "Observa\u00E7\u00E3o" }), _jsx("textarea", { id: "observacao", value: observacao, onChange: (e) => setObservacao(e.target.value), placeholder: "Adicione observa\u00E7\u00F5es sobre este documento (opcional)", rows: 3, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" })] })] }) }), tipoDocumento === 'procuracao' && (_jsxs("div", { className: "space-y-4 mb-4", children: [_jsxs(Card, { className: "p-4 space-y-4", children: [_jsx("h3", { className: "text-base font-semibold text-text border-b border-border pb-2", children: "1. Identifica\u00E7\u00E3o R\u00E1pida" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Tipo de Procura\u00E7\u00E3o *" }), _jsxs("select", { value: dadosProcuracao.tipo, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, tipo: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "", children: "Selecione" }), _jsx("option", { value: "judicial", children: "Judicial" }), _jsx("option", { value: "extrajudicial", children: "Extrajudicial" }), _jsx("option", { value: "ad_judicia", children: "Ad Judicia" }), _jsx("option", { value: "ad_judicia_et_extra", children: "Ad Judicia et Extra" }), _jsx("option", { value: "substabelecimento", children: "Substabelecimento" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Status" }), _jsxs("select", { value: dadosProcuracao.status, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, status: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "rascunho", children: "Rascunho" }), _jsx("option", { value: "enviada", children: "Enviada" }), _jsx("option", { value: "assinada", children: "Assinada" }), _jsx("option", { value: "valida", children: "V\u00E1lida" }), _jsx("option", { value: "vencida", children: "Vencida" }), _jsx("option", { value: "revogada", children: "Revogada" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "N\u00FAmero/ID Interno" }), _jsx("input", { type: "text", value: dadosProcuracao.numeroId, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, numeroId: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Data do Documento" }), _jsx("input", { type: "date", value: dadosProcuracao.dataDocumento, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, dataDocumento: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Data de Assinatura" }), _jsx("input", { type: "date", value: dadosProcuracao.dataAssinatura, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, dataAssinatura: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Validade" }), _jsxs("select", { value: dadosProcuracao.validade, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, validade: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "indeterminada", children: "Indeterminada" }), _jsx("option", { value: "por_prazo", children: "Por Prazo" })] })] }), dadosProcuracao.validade === 'por_prazo' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Data de Expira\u00E7\u00E3o" }), _jsx("input", { type: "date", value: dadosProcuracao.dataExpiracao, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, dataExpiracao: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] }))] })] }), _jsxs(Card, { className: "p-4 space-y-4", children: [_jsx("h3", { className: "text-base font-semibold text-text border-b border-border pb-2", children: "2. Partes e Poderes" }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-text", children: "Outorgante (Cliente)" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "Nome/Raz\u00E3o Social" }), _jsx("input", { type: "text", value: dadosProcuracao.outorgante.nome, onChange: (e) => setDadosProcuracao({
                                                            ...dadosProcuracao,
                                                            outorgante: { ...dadosProcuracao.outorgante, nome: e.target.value }
                                                        }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "CPF/CNPJ" }), _jsx("input", { type: "text", value: dadosProcuracao.outorgante.cpfCnpj, onChange: (e) => setDadosProcuracao({
                                                            ...dadosProcuracao,
                                                            outorgante: { ...dadosProcuracao.outorgante, cpfCnpj: e.target.value }
                                                        }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "RG/IE" }), _jsx("input", { type: "text", value: dadosProcuracao.outorgante.rgIe, onChange: (e) => setDadosProcuracao({
                                                            ...dadosProcuracao,
                                                            outorgante: { ...dadosProcuracao.outorgante, rgIe: e.target.value }
                                                        }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "Endere\u00E7o" }), _jsx("input", { type: "text", value: dadosProcuracao.outorgante.endereco, onChange: (e) => setDadosProcuracao({
                                                            ...dadosProcuracao,
                                                            outorgante: { ...dadosProcuracao.outorgante, endereco: e.target.value }
                                                        }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "E-mail" }), _jsx("input", { type: "email", value: dadosProcuracao.outorgante.email, onChange: (e) => setDadosProcuracao({
                                                            ...dadosProcuracao,
                                                            outorgante: { ...dadosProcuracao.outorgante, email: e.target.value }
                                                        }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "Telefone" }), _jsx("input", { type: "tel", value: dadosProcuracao.outorgante.telefone, onChange: (e) => setDadosProcuracao({
                                                            ...dadosProcuracao,
                                                            outorgante: { ...dadosProcuracao.outorgante, telefone: e.target.value }
                                                        }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-text", children: "Outorgado(s) (Advogados)" }), dadosProcuracao.outorgados.map((outorgado, idx) => (_jsxs("div", { className: "border border-border rounded-lg p-3 space-y-2", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "Nome" }), _jsx("input", { type: "text", value: outorgado.nome, onChange: (e) => {
                                                                    const novos = [...dadosProcuracao.outorgados];
                                                                    novos[idx].nome = e.target.value;
                                                                    setDadosProcuracao({ ...dadosProcuracao, outorgados: novos });
                                                                }, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "OAB" }), _jsx("input", { type: "text", value: outorgado.oab, onChange: (e) => {
                                                                    const novos = [...dadosProcuracao.outorgados];
                                                                    novos[idx].oab = e.target.value;
                                                                    setDadosProcuracao({ ...dadosProcuracao, outorgados: novos });
                                                                }, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "UF" }), _jsx("input", { type: "text", value: outorgado.uf, onChange: (e) => {
                                                                    const novos = [...dadosProcuracao.outorgados];
                                                                    novos[idx].uf = e.target.value;
                                                                    setDadosProcuracao({ ...dadosProcuracao, outorgados: novos });
                                                                }, maxLength: 2, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "CPF (opcional)" }), _jsx("input", { type: "text", value: outorgado.cpf, onChange: (e) => {
                                                                    const novos = [...dadosProcuracao.outorgados];
                                                                    novos[idx].cpf = e.target.value;
                                                                    setDadosProcuracao({ ...dadosProcuracao, outorgados: novos });
                                                                }, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-xs text-text-muted mb-1", children: "Sociedade de Advogados" }), _jsx("input", { type: "text", value: outorgado.sociedade, onChange: (e) => {
                                                                    const novos = [...dadosProcuracao.outorgados];
                                                                    novos[idx].sociedade = e.target.value;
                                                                    setDadosProcuracao({ ...dadosProcuracao, outorgados: novos });
                                                                }, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" })] })] }), dadosProcuracao.outorgados.length > 1 && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                    setDadosProcuracao({
                                                        ...dadosProcuracao,
                                                        outorgados: dadosProcuracao.outorgados.filter((_, i) => i !== idx)
                                                    });
                                                }, className: "text-xs text-red-500", children: [_jsx(X, { className: "h-3 w-3 mr-1" }), " Remover"] }))] }, idx))), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                            setDadosProcuracao({
                                                ...dadosProcuracao,
                                                outorgados: [...dadosProcuracao.outorgados, { nome: '', oab: '', uf: '', cpf: '', sociedade: '' }]
                                            });
                                        }, children: "+ Adicionar Outorgado" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Poderes Principais" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: ['receber e dar quitação', 'confessar', 'transigir', 'firmar compromisso',
                                                    'substabelecer', 'representar em audiência', 'levantamento de valores/alvará',
                                                    'representação administrativa', 'propositura de ação'].map((poder) => (_jsxs("label", { className: "flex items-center space-x-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: dadosProcuracao.poderesPrincipais.includes(poder), onChange: (e) => {
                                                                if (e.target.checked) {
                                                                    setDadosProcuracao({
                                                                        ...dadosProcuracao,
                                                                        poderesPrincipais: [...dadosProcuracao.poderesPrincipais, poder]
                                                                    });
                                                                }
                                                                else {
                                                                    setDadosProcuracao({
                                                                        ...dadosProcuracao,
                                                                        poderesPrincipais: dadosProcuracao.poderesPrincipais.filter(p => p !== poder)
                                                                    });
                                                                }
                                                            }, className: "rounded border-border text-primary focus:ring-primary" }), _jsx("span", { className: "text-text", children: poder })] }, poder))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Poderes Especiais" }), _jsx("textarea", { value: dadosProcuracao.poderesEspeciais, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, poderesEspeciais: e.target.value }), rows: 2, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none", placeholder: "Descreva poderes especiais espec\u00EDficos" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Limita\u00E7\u00F5es/Ressalvas" }), _jsx("textarea", { value: dadosProcuracao.limitacoes, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, limitacoes: e.target.value }), rows: 2, className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none", placeholder: "Ex: vedado substabelecer, somente INSS, somente processo X" })] })] })] }), _jsxs(Card, { className: "p-4 space-y-4", children: [_jsx("h3", { className: "text-base font-semibold text-text border-b border-border pb-2", children: "3. Contexto do Uso" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "\u00D3rg\u00E3o/Compet\u00EAncia" }), _jsx("input", { type: "text", value: dadosProcuracao.orgaoCompetencia, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, orgaoCompetencia: e.target.value }), placeholder: "Ex: JT, JF, TJ, TRF, Juizado", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "\u00C1rea do Direito" }), _jsx("input", { type: "text", value: dadosProcuracao.areaDireito, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, areaDireito: e.target.value }), placeholder: "Ex: c\u00EDvel, trabalhista, previdenci\u00E1rio", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Processos Vinculados (CNJs)" }), _jsx("textarea", { value: dadosProcuracao.processosVinculados, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, processosVinculados: e.target.value }), rows: 2, placeholder: "Liste os n\u00FAmeros de processo CNJ separados por v\u00EDrgula", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Finalidade" }), _jsx("input", { type: "text", value: dadosProcuracao.finalidade, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, finalidade: e.target.value }), placeholder: "Ex: ajuizamento, acompanhamento, acordo, alvar\u00E1", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] })] })] }), _jsxs(Card, { className: "p-4 space-y-4", children: [_jsx("h3", { className: "text-base font-semibold text-text border-b border-border pb-2", children: "4. Assinaturas e Autentica\u00E7\u00E3o" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Tipo de Assinatura" }), _jsxs("select", { value: dadosProcuracao.tipoAssinatura, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, tipoAssinatura: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "", children: "Selecione" }), _jsx("option", { value: "manuscrita", children: "Manuscrita" }), _jsx("option", { value: "icp_brasil", children: "ICP-Brasil" }), _jsx("option", { value: "govbr", children: "Gov.br" }), _jsx("option", { value: "docusign", children: "DocuSign" }), _jsx("option", { value: "clicksign", children: "Clicksign" }), _jsx("option", { value: "outra", children: "Outra Plataforma" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "reconhecimentoFirma", checked: dadosProcuracao.reconhecimentoFirma, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, reconhecimentoFirma: e.target.checked }), className: "rounded border-border text-primary focus:ring-primary" }), _jsx("label", { htmlFor: "reconhecimentoFirma", className: "text-sm font-medium text-text", children: "Reconhecimento de Firma" })] }), dadosProcuracao.reconhecimentoFirma && (_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Cart\u00F3rio" }), _jsx("input", { type: "text", value: dadosProcuracao.cartorio, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, cartorio: e.target.value }), className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary" })] })), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Assinantes (nome + documento + data)" }), _jsx("textarea", { value: dadosProcuracao.assinantes, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, assinantes: e.target.value }), rows: 2, placeholder: "Liste quem assinou, documentos e datas", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Evid\u00EAncias (certificado, hash, trilha)" }), _jsx("textarea", { value: dadosProcuracao.evidencias, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, evidencias: e.target.value }), rows: 2, placeholder: "Informa\u00E7\u00F5es sobre certificados, hash, carimbo do tempo, etc", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-text mb-2", children: "Testemunhas (nome + CPF)" }), _jsx("textarea", { value: dadosProcuracao.testemunhas, onChange: (e) => setDadosProcuracao({ ...dadosProcuracao, testemunhas: e.target.value }), rows: 2, placeholder: "Liste as testemunhas com seus CPFs", className: "w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" })] })] })] })] })), tipoDocumento === 'contestacao' && (_jsx(FormularioContestacao, { dados: dadosContestacao, onChange: setDadosContestacao })), tipoDocumento === 'contrato' && (_jsx(FormularioContrato, { dados: dadosContrato, onChange: setDadosContrato })), _jsx(Card, { className: `relative border-2 border-dashed transition-colors ${dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'}`, onDragEnter: handleDrag, onDragLeave: handleDrag, onDragOver: handleDrag, onDrop: handleDrop, children: _jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "rounded-full bg-primary/10 p-4", children: _jsx(Upload, { className: "h-8 w-8 text-primary" }) }) }), _jsx("h3", { className: "text-lg font-semibold text-text mb-2", children: "Arraste arquivos aqui" }), _jsx("p", { className: "text-sm text-text-muted mb-4", children: "ou clique nos bot\u00F5es abaixo para selecionar" }), _jsxs("div", { className: "flex flex-wrap justify-center gap-3", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => inputFileRef.current?.click(), disabled: disabled, children: [_jsx(FileUp, { className: "h-4 w-4 mr-2" }), "Selecionar Arquivos"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => inputCameraRef.current?.click(), disabled: disabled, children: [_jsx(Image, { className: "h-4 w-4 mr-2" }), "Tirar Foto"] })] }), _jsx("input", { ref: inputFileRef, type: "file", multiple: true, className: "hidden", onChange: handleFileInput, accept: "application/pdf,image/*,.doc,.docx,.xls,.xlsx", disabled: disabled }), _jsx("input", { ref: inputCameraRef, type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: handleFileInput, disabled: disabled }), _jsxs("p", { className: "text-xs text-text-muted mt-4", children: ["Formatos aceitos: PDF, Imagens (JPG, PNG, WebP), Word, Excel", _jsx("br", {}), "Tamanho m\u00E1ximo: 10MB por arquivo"] })] }) }), arquivos.length > 0 && (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h4", { className: "text-sm font-medium text-text", children: ["Arquivos (", arquivos.length, ")"] }), arquivos.some((a) => a.status === 'sucesso') && (_jsx(Button, { variant: "ghost", size: "sm", onClick: limparConcluidos, className: "text-xs", children: "Limpar conclu\u00EDdos" }))] }), arquivos.map((upload, index) => (_jsx(Card, { className: "p-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "text-2xl", children: obterIconeArquivo(upload.arquivo.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-text truncate", children: upload.arquivo.name }), _jsx("p", { className: "text-xs text-text-muted", children: formatarTamanhoArquivo(upload.arquivo.size) }), upload.status === 'enviando' && (_jsx("div", { className: "mt-2 h-1 w-full bg-surface rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary transition-all duration-300", style: { width: `${upload.progresso}%` } }) })), upload.status === 'erro' && upload.erro && (_jsx("p", { className: "text-xs text-red-500 mt-1", children: upload.erro }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [upload.status === 'aguardando' && (_jsx("span", { className: "text-xs text-text-muted", children: "Aguardando..." })), upload.status === 'enviando' && (_jsx(Loader2, { className: "h-4 w-4 animate-spin text-primary" })), upload.status === 'sucesso' && (_jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" })), upload.status === 'erro' && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => fazerUpload(upload, index), className: "text-xs", children: "Tentar novamente" })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removerArquivo(index), children: _jsx(X, { className: "h-4 w-4" }) })] })] }) }, index)))] }))] }));
}
