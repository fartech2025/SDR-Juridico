import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate';
/**
 * Componente para criar meetings no Google Calendar
 */
export function GoogleMeetingForm({ onSuccess, onError, initialData, clienteId, casoId, responsavelId, }) {
    const { createMeetingAndSync, isLoading, error } = useGoogleCalendarCreate();
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        startTime: initialData?.startTime || new Date(),
        endTime: initialData?.endTime || new Date(Date.now() + 60 * 60 * 1000),
        guests: initialData?.guests || [],
        videoConference: initialData?.videoConference ?? true,
        location: initialData?.location || '',
    });
    const [guestEmail, setGuestEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleAddGuest = () => {
        if (guestEmail && guestEmail.includes('@')) {
            setFormData((prev) => ({
                ...prev,
                guests: [...(prev.guests || []), guestEmail],
            }));
            setGuestEmail('');
        }
    };
    const handleRemoveGuest = (email) => {
        setFormData((prev) => ({
            ...prev,
            guests: (prev.guests || []).filter((g) => g !== email),
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await createMeetingAndSync(formData, {
                tipo: 'reuniao',
                cliente_id: clienteId,
                caso_id: casoId,
                responsavel_id: responsavelId,
            });
            onSuccess?.({
                googleEventId: result.googleEvent.id,
                agendaId: result.agendaId,
                meetUrl: result.googleEvent.conferenceData?.entryPoints?.[0]?.uri,
            });
            // Limpar formulário
            setFormData({
                title: '',
                description: '',
                startTime: new Date(),
                endTime: new Date(Date.now() + 60 * 60 * 1000),
                guests: [],
                videoConference: true,
                location: '',
            });
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Erro desconhecido');
            onError?.(error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 bg-danger-bg border border-danger-border rounded text-danger text-sm", children: error?.message })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\u00EDtulo da Reuni\u00E3o *" }), _jsx("input", { type: "text", required: true, value: formData.title, onChange: (e) => setFormData((prev) => ({ ...prev, title: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Ex: Reuni\u00E3o com cliente" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData((prev) => ({ ...prev, description: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Detalhes da reuni\u00E3o...", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Local" }), _jsx("input", { type: "text", value: formData.location, onChange: (e) => setFormData((prev) => ({ ...prev, location: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Ex: Escrit\u00F3rio, Zoom, etc" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data In\u00EDcio *" }), _jsx("input", { type: "datetime-local", required: true, value: formData.startTime.toISOString().slice(0, 16), onChange: (e) => setFormData((prev) => ({
                                    ...prev,
                                    startTime: new Date(e.target.value),
                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data Fim *" }), _jsx("input", { type: "datetime-local", required: true, value: formData.endTime.toISOString().slice(0, 16), onChange: (e) => setFormData((prev) => ({
                                    ...prev,
                                    endTime: new Date(e.target.value),
                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "videoConference", checked: formData.videoConference, onChange: (e) => setFormData((prev) => ({ ...prev, videoConference: e.target.checked })), className: "rounded" }), _jsx("label", { htmlFor: "videoConference", className: "text-sm font-medium text-gray-700", children: "Criar Google Meet automaticamente" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Convidados" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "email", value: guestEmail, onChange: (e) => setGuestEmail(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), handleAddGuest()), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "email@example.com" }), _jsx("button", { type: "button", onClick: handleAddGuest, className: "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600", children: "Adicionar" })] }), formData.guests && formData.guests.length > 0 && (_jsx("div", { className: "space-y-1", children: formData.guests.map((email) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 p-2 rounded", children: [_jsx("span", { className: "text-sm", children: email }), _jsx("button", { type: "button", onClick: () => handleRemoveGuest(email), className: "text-red-500 hover:text-red-700 text-sm", children: "\u2715" })] }, email))) }))] }), _jsx("button", { type: "submit", disabled: isLoading || isSubmitting, className: "w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium", children: isLoading || isSubmitting ? 'Criando reunião...' : 'Criar Reunião no Google Calendar' })] }));
}
export default GoogleMeetingForm;
