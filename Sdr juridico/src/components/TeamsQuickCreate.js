import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTeamsMeetingCreate } from '@/hooks/useTeamsMeetingCreate';
import { Copy, Check } from 'lucide-react';
export function TeamsQuickCreate({ onSuccess, onError }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(30); // minutos
    const [meetingUrl, setMeetingUrl] = useState(null);
    const teams = useTeamsMeetingCreate();
    const handleCreate = async () => {
        if (!title.trim())
            return;
        try {
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 60 * 1000);
            const result = await teams.createMeeting({
                title: title.trim(),
                startTime: now,
                endTime: endTime,
            });
            setMeetingUrl(result.joinWebUrl);
            onSuccess?.(result);
            // Auto copiar link
            if (result.joinWebUrl) {
                navigator.clipboard.writeText(result.joinWebUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro ao criar reunião');
            onError?.(err);
        }
    };
    const copyToClipboard = () => {
        if (meetingUrl) {
            navigator.clipboard.writeText(meetingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (_jsxs("div", { children: [!isOpen && !meetingUrl && (_jsx("button", { onClick: () => setIsOpen(true), className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2", children: _jsx("span", { children: "+ Reuni\u00E3o Teams" }) })), isOpen && !meetingUrl && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Criar Reuni\u00E3o no Teams" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\u00EDtulo da Reuni\u00E3o" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Digite o t\u00EDtulo", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500", autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Dura\u00E7\u00E3o (minutos)" }), _jsxs("select", { value: duration, onChange: (e) => setDuration(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500", children: [_jsx("option", { value: 15, children: "15 minutos" }), _jsx("option", { value: 30, children: "30 minutos" }), _jsx("option", { value: 60, children: "1 hora" }), _jsx("option", { value: 90, children: "1h 30min" }), _jsx("option", { value: 120, children: "2 horas" })] })] })] }), _jsxs("div", { className: "flex gap-2 mt-6", children: [_jsx("button", { onClick: handleCreate, disabled: !title.trim() || teams.isLoading, className: "flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition", children: teams.isLoading ? 'Criando...' : 'Criar' }), _jsx("button", { onClick: () => {
                                        setIsOpen(false);
                                        setTitle('');
                                    }, className: "flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium transition", children: "Cancelar" })] }), teams.error && (_jsx("div", { className: "mt-4 bg-danger-bg border border-danger-border text-danger p-3 rounded-lg text-sm", children: teams.error.message }))] }) })), meetingUrl && (_jsxs("div", { className: "bg-success-bg border border-success-border rounded-lg p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-success", children: "\u2713 Reuni\u00E3o criada no Teams!" }), _jsx("button", { onClick: () => {
                                    setMeetingUrl(null);
                                    setTitle('');
                                }, className: "text-gray-500 hover:text-gray-700", children: "\u2715" })] }), _jsxs("div", { className: "bg-white rounded border border-green-200 p-3", children: [_jsx("p", { className: "text-xs text-gray-600 mb-2", children: "Link da reuni\u00E3o:" }), _jsx("a", { href: meetingUrl, target: "_blank", rel: "noopener noreferrer", className: "text-brand-primary hover:text-brand-primary-dark text-sm break-all font-medium", children: meetingUrl })] }), _jsx("button", { onClick: copyToClipboard, className: "w-full flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 rounded-lg font-medium transition", children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 18 }), _jsx("span", { children: "Copiado!" })] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { size: 18 }), _jsx("span", { children: "Copiar Link" })] })) })] }))] }));
}
