import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTeamsMeetingCreate } from '@/hooks/useTeamsMeetingCreate';
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate';
export function MeetingCreatorForm({ onSuccess, onError, defaultValues, agendaData, }) {
    const [formData, setFormData] = useState({
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        startTime: defaultValues?.startTime || new Date(),
        endTime: defaultValues?.endTime || new Date(Date.now() + 60 * 60 * 1000),
        guests: '',
        useTeams: true,
        useGoogle: false,
    });
    const teams = useTeamsMeetingCreate();
    const google = useGoogleCalendarCreate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const attendees = formData.guests
            .split(',')
            .map((email) => email.trim())
            .filter((email) => email);
        try {
            const results = [];
            // Criar no Teams
            if (formData.useTeams) {
                const teamsResult = await teams.createMeetingAndSync({
                    title: formData.title,
                    description: formData.description,
                    startTime: new Date(formData.startTime),
                    endTime: new Date(formData.endTime),
                    attendees,
                    agendaData: agendaData || {},
                });
                results.push({ provider: 'teams', ...teamsResult });
            }
            // Criar no Google Calendar
            if (formData.useGoogle) {
                const googleResult = await google.createMeetingAndSync({
                    title: formData.title,
                    description: formData.description,
                    startTime: new Date(formData.startTime),
                    endTime: new Date(formData.endTime),
                    guests: attendees,
                    videoConference: true,
                }, agendaData);
                results.push({ provider: 'google', ...googleResult });
            }
            if (results.length === 0) {
                throw new Error('Selecione pelo menos um provedor de reunião');
            }
            onSuccess?.(results);
            // Limpar formulário
            setFormData({
                title: '',
                description: '',
                startTime: new Date(),
                endTime: new Date(Date.now() + 60 * 60 * 1000),
                guests: '',
                useTeams: true,
                useGoogle: false,
            });
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            onError?.(err);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\u00EDtulo da Reuni\u00E3o *" }), _jsx("input", { type: "text", required: true, value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Digite o t\u00EDtulo da reuni\u00E3o" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3, placeholder: "Digite a descri\u00E7\u00E3o da reuni\u00E3o" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data/Hora In\u00EDcio *" }), _jsx("input", { type: "datetime-local", required: true, value: new Date(formData.startTime).toISOString().slice(0, 16), onChange: (e) => setFormData({ ...formData, startTime: new Date(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data/Hora Fim *" }), _jsx("input", { type: "datetime-local", required: true, value: new Date(formData.endTime).toISOString().slice(0, 16), onChange: (e) => setFormData({ ...formData, endTime: new Date(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Participantes (emails separados por v\u00EDrgula)" }), _jsx("input", { type: "text", value: formData.guests, onChange: (e) => setFormData({ ...formData, guests: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "email1@example.com, email2@example.com" })] }), _jsxs("div", { className: "space-y-2 bg-gray-50 p-3 rounded-lg", children: [_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: formData.useTeams, onChange: (e) => setFormData({ ...formData, useTeams: e.target.checked }), className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Criar reuni\u00E3o no Microsoft Teams" })] }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: formData.useGoogle, onChange: (e) => setFormData({ ...formData, useGoogle: e.target.checked }), className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Criar reuni\u00E3o no Google Calendar" })] })] }), _jsx("div", { className: "flex gap-2", children: _jsx("button", { type: "submit", disabled: teams.isLoading || google.isLoading, className: "flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition", children: teams.isLoading || google.isLoading ? 'Criando...' : 'Criar Reunião' }) }), (teams.error || google.error) && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm", children: teams.error?.message || google.error?.message }))] }));
}
