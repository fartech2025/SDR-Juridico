import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate';
import { Copy, Check, Video } from 'lucide-react';
export function GoogleMeetQuickCreate({ onSuccess, onError }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(30); // minutos
    const [meetingUrl, setMeetingUrl] = useState(null);
    const { createMeeting, isLoading, error } = useGoogleCalendarCreate();
    const handleCreate = async () => {
        if (!title.trim())
            return;
        try {
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 60 * 1000);
            const result = await createMeeting({
                title: title.trim(),
                startTime: now,
                endTime: endTime,
                videoConference: true, // Sempre criar Google Meet
            });
            // Extrair link do Google Meet
            const meetLink = result.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri || '';
            setMeetingUrl(meetLink);
            onSuccess?.(result);
            // Auto copiar link
            if (meetLink) {
                navigator.clipboard.writeText(meetLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Erro ao criar reunião');
            onError?.(error);
        }
    };
    const copyToClipboard = () => {
        if (meetingUrl) {
            navigator.clipboard.writeText(meetingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (_jsxs("div", { children: [!isOpen && !meetingUrl && (_jsxs("button", { onClick: () => setIsOpen(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2", children: [_jsx(Video, { size: 18 }), _jsx("span", { children: "+ Google Meet" })] })), isOpen && !meetingUrl && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Video, { size: 24, className: "text-blue-600" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Criar Reuni\u00E3o Google Meet" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\u00EDtulo da Reuni\u00E3o" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Digite o t\u00EDtulo", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Dura\u00E7\u00E3o (minutos)" }), _jsxs("select", { value: duration, onChange: (e) => setDuration(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: 15, children: "15 minutos" }), _jsx("option", { value: 30, children: "30 minutos" }), _jsx("option", { value: 60, children: "1 hora" }), _jsx("option", { value: 90, children: "1h 30min" }), _jsx("option", { value: 120, children: "2 horas" })] })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700", children: [_jsx("p", { className: "font-medium", children: "\u2139\uFE0F Link gerado automaticamente" }), _jsx("p", { className: "text-xs mt-1", children: "Voc\u00EA receber\u00E1 um link \u00FAnico para compartilhar com participantes" })] })] }), _jsxs("div", { className: "flex gap-2 mt-6", children: [_jsx("button", { onClick: handleCreate, disabled: !title.trim() || isLoading, className: "flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition", children: isLoading ? 'Criando...' : 'Criar Google Meet' }), _jsx("button", { onClick: () => {
                                        setIsOpen(false);
                                        setTitle('');
                                    }, className: "flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium transition", children: "Cancelar" })] }), error && (_jsx("div", { className: "mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm", children: error.message }))] }) })), meetingUrl && (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm font-medium text-green-800 flex items-center gap-2", children: [_jsx("span", { children: "\u2713" }), _jsx("span", { children: "Google Meet criado!" })] }), _jsx("button", { onClick: () => {
                                    setMeetingUrl(null);
                                    setTitle('');
                                }, className: "text-gray-500 hover:text-gray-700 text-lg", children: "\u2715" })] }), _jsxs("div", { className: "bg-white rounded border border-green-200 p-3", children: [_jsx("p", { className: "text-xs text-gray-600 mb-2", children: "Link da reuni\u00E3o:" }), _jsx("a", { href: meetingUrl, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-700 text-sm break-all font-medium", children: meetingUrl })] }), _jsx("button", { onClick: copyToClipboard, className: "w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-medium transition", children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 18 }), _jsx("span", { children: "Copiado!" })] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { size: 18 }), _jsx("span", { children: "Copiar Link" })] })) }), _jsxs("button", { onClick: () => {
                            window.open(meetingUrl, '_blank');
                        }, className: "w-full flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg font-medium transition", children: [_jsx(Video, { size: 18 }), _jsx("span", { children: "Abrir Reuni\u00E3o" })] })] }))] }));
}
