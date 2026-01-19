import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const theme = 'light';
    const toggleTheme = () => {
        // Light mode only - sem toggle
    };
    const setTheme = () => {
        // Light mode only - sem mudanças
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme, setTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme deve ser usado dentro de ThemeProvider');
    }
    return context;
}
