import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { FontProvider } from '@/contexts/FontContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { router } from '@/app/router';
const App = () => {
    return (_jsx(FontProvider, { children: _jsx(AuthProvider, { children: _jsx(OrganizationProvider, { children: _jsx(PermissionsProvider, { children: _jsxs(_Fragment, { children: [_jsx(RouterProvider, { router: router }), _jsx(Toaster, { theme: "light", position: "top-right", toastOptions: {
                                    className: 'border border-border bg-surface text-text shadow-panel',
                                    descriptionClassName: 'text-text-muted',
                                } })] }) }) }) }) }));
};
export default App;
