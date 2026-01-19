import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
const FontContext = createContext(undefined);
const fontScales = {
    xs: 0.8,
    sm: 0.9,
    md: 0.95,
    lg: 1.05,
    normal: 1,
    xl: 1.2,
    xxl: 1.4,
    xxxl: 1.6,
    huge: 1.85,
    mega: 2.2,
};
const fontSizeOrder = ['xs', 'sm', 'md', 'lg', 'normal', 'xl', 'xxl', 'xxxl', 'huge', 'mega'];
export function FontProvider({ children }) {
    const [fontSize, setFontSize] = useState('normal');
    const [isMounted, setIsMounted] = useState(false);
    // Carregar preferência do localStorage na montagem
    useEffect(() => {
        try {
            const saved = localStorage.getItem('sdr-font-size');
            if (saved && fontScales[saved]) {
                setFontSize(saved);
            }
        }
        catch {
            console.warn('Erro ao carregar preferência de fonte');
        }
        setIsMounted(true);
    }, []);
    // Salvar preferência quando mudar
    useEffect(() => {
        if (isMounted) {
            try {
                localStorage.setItem('sdr-font-size', fontSize);
            }
            catch {
                console.warn('Erro ao salvar preferência de fonte');
            }
        }
    }, [fontSize, isMounted]);
    // Aplicar escala ao document
    useEffect(() => {
        const scale = fontScales[fontSize];
        // Usar !important para garantir que sobrescreve CSS do Tailwind
        document.documentElement.style.setProperty('--font-scale', scale.toString(), 'important');
        console.log('FontScale aplicada:', fontSize, '=', scale); // Debug
    }, [fontSize]);
    const increaseFontSize = useCallback(() => {
        setFontSize((current) => {
            const currentIndex = fontSizeOrder.indexOf(current);
            const nextIndex = Math.min(currentIndex + 1, fontSizeOrder.length - 1);
            return fontSizeOrder[nextIndex];
        });
    }, []);
    const decreaseFontSize = useCallback(() => {
        setFontSize((current) => {
            const currentIndex = fontSizeOrder.indexOf(current);
            const nextIndex = Math.max(currentIndex - 1, 0);
            return fontSizeOrder[nextIndex];
        });
    }, []);
    const resetFontSize = useCallback(() => {
        setFontSize('normal');
    }, []);
    const value = {
        fontSize,
        scale: fontScales[fontSize],
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
    };
    return _jsx(FontContext.Provider, { value: value, children: children });
}
/**
 * Hook para usar o contexto de fonte
 */
export function useFont() {
    const context = useContext(FontContext);
    if (!context) {
        throw new Error('useFont deve ser usado dentro de FontProvider');
    }
    return context;
}
