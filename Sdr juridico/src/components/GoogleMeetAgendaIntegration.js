import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate';
import { Copy, Check } from 'lucide-react';
export function GoogleMeetAgendaIntegration({ onMeetingCreated, onError, defaultValues, }) {
    const [formData, setFormData] = useState({
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        startTime: defaultValues?.startTime || new Date(),
        endTime: defaultValues?.endTime || new Date(Date.now() + 60 * 60 * 1000),
        guests: '',
    });
    const [meetingUrl, setMeetingUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const { createMeeting, isLoading, error } = useGoogleCalendarCreate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const guests = formData.guests
            .split(',')
            .map((email) => email.trim())
            .filter((email) => email);
        try {
            const result = await createMeeting({
                title: formData.title,
                description: formData.description,
                startTime: new Date(formData.startTime),
                endTime: new Date(formData.endTime),
                guests,
                videoConference: true, // Sempre criar Google Meet
            });
            // Extrair link do Google Meet
            const meetLink = result.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri || '';
            setMeetingUrl(meetLink);
            onMeetingCreated?.({ meeting: result, meetLink });
            // Limpar formulário
            setFormData({
                title: '',
                description: '',
                startTime: new Date(),
                endTime: new Date(Date.now() + 60 * 60 * 1000),
                guests: '',
            });
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
    if (meetingUrl) {
        return (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-green-800", children: "\u2713 Google Meet criado!" }), _jsx("button", { onClick: () => setMeetingUrl(null), className: "text-gray-500 hover:text-gray-700 text-lg", children: "\u2715" })] }), _jsxs("div", { className: "bg-white rounded border border-green-200 p-3 space-y-2", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Link para salvar no campo \"Local\":" }), _jsx("input", { type: "text", readOnly: true, value: meetingUrl, className: "w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { onClick: copyToClipboard, className: "flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-medium transition text-sm", children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 16 }), _jsx("span", { children: "Copiado!" })] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { size: 16 }), _jsx("span", { children: "Copiar" })] })) }), _jsx("button", { onClick: () => {
                                window.open(meetingUrl, '_blank');
                            }, className: "flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg font-medium transition text-sm", children: _jsx("span", { children: "Abrir" }) })] })] }));
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 bg-gray-50 p-4 rounded-lg", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDCF9" }), _jsx("span", { children: "Criar Google Meet" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\u00EDtulo da Reuni\u00E3o *" }), _jsx("input", { type: "text", required: true, value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Digite o t\u00EDtulo da reuni\u00E3o" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 2, placeholder: "Digite a descri\u00E7\u00E3o da reuni\u00E3o" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data/Hora In\u00EDcio *" }), _jsx("input", { type: "datetime-local", required: true, value: new Date(formData.startTime).toISOString().slice(0, 16), onChange: (e) => setFormData({ ...formData, startTime: new Date(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data/Hora Fim *" }), _jsx("input", { type: "datetime-local", required: true, value: new Date(formData.endTime).toISOString().slice(0, 16), onChange: (e) => setFormData({ ...formData, endTime: new Date(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Participantes (emails separados por v\u00EDrgula)" }), _jsx("input", { type: "text", value: formData.guests, onChange: (e) => setFormData({ ...formData, guests: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "email1@example.com, email2@example.com" })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700", children: [_jsx("p", { className: "font-medium", children: "\uD83D\uDCA1 Link autom\u00E1tico" }), _jsx("p", { className: "text-xs mt-1", children: "Ap\u00F3s criar, o link do Google Meet ser\u00E1 exibido para copiar e salvar no campo \"Local\" da agenda" })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition", children: isLoading ? 'Criando Google Meet...' : 'Criar Google Meet' }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm", children: error.message }))] }));
}
