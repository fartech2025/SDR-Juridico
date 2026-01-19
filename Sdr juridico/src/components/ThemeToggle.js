import { jsx as _jsx } from "react/jsx-runtime";
import { Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ThemeToggle() {
    return (_jsx(Button, { variant: "ghost", size: "sm", className: "rounded-full", disabled: true, title: "Modo Claro", "aria-label": "Modo Claro", children: _jsx(Sun, { className: "h-4 w-4" }) }));
}
