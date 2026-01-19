import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import authHero from '@/assets/auth-hero.svg';
import { cn } from '@/utils/cn';
export const AuthLayout = ({ title, children, sideTitle = 'Nao e membro ainda?', sideSubtitle = '', className, }) => {
    return (_jsx("div", { className: cn('relative min-h-screen px-6 py-12 text-(--auth-text)', className), style: {
            backgroundColor: '#0b1d33',
            backgroundImage: 'radial-gradient(1200px 720px at 80% -10%, rgba(30,94,180,0.32), transparent 55%), radial-gradient(960px 620px at 12% 0%, rgba(212,32,39,0.22), transparent 50%)',
        }, children: _jsxs("div", { className: "mx-auto max-w-6xl", children: [title ? (_jsx("h1", { className: "text-center text-4xl font-semibold tracking-[0.35em] text-(--auth-text)", children: title })) : null, _jsxs("div", { className: cn('grid gap-8 lg:grid-cols-[440px_1fr]', title ? 'mt-10' : 'mt-6'), children: [_jsx("div", { className: "rounded-2xl border bg-white/95 px-10 py-9 shadow-2xl backdrop-blur", style: {
                                borderColor: 'rgba(12,39,75,0.12)',
                                boxShadow: '0 20px 70px rgba(4,22,45,0.35), 0 4px 20px rgba(20,70,130,0.18)',
                            }, children: children }), _jsxs("div", { className: "relative min-h-140 overflow-hidden rounded-2xl border bg-white/10 shadow-2xl backdrop-blur", style: {
                                borderColor: 'rgba(255,255,255,0.08)',
                                boxShadow: '0 20px 70px rgba(4,22,45,0.45)',
                                backgroundImage: 'linear-gradient(145deg, rgba(12,39,75,0.65) 0%, rgba(32,86,160,0.55) 45%, rgba(212,32,39,0.35) 100%)',
                            }, children: [_jsxs("div", { className: "absolute right-6 top-6 flex items-center gap-3 text-xs text-white/80", children: [_jsx("span", { className: "uppercase tracking-[0.18em]", children: sideTitle }), _jsx("button", { type: "button", className: "rounded-full bg-[#d42027] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#d42027]/30 hover:brightness-105", children: "Cadastrar" })] }), _jsx("div", { className: "absolute inset-0 opacity-20", style: {
                                        backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45) 0, transparent 38%), radial-gradient(circle at 75% 60%, rgba(255,255,255,0.35) 0, transparent 40%)',
                                    } }), _jsx("div", { className: "relative flex h-full items-center justify-center px-10 py-16", children: _jsx("img", { src: authHero, alt: "Ilustracao juridica", className: "max-h-105 w-full object-contain" }) }), sideSubtitle ? (_jsxs("div", { className: "absolute left-10 top-16 max-w-sm space-y-3 text-white drop-shadow", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-white/70", children: "SDR Jur\u00EDdico Online" }), _jsx("h2", { className: "text-2xl font-semibold leading-tight", children: sideSubtitle }), _jsx("p", { className: "text-sm text-white/75", children: "Intelig\u00EAncia jur\u00EDdica com a for\u00E7a e a presen\u00E7a da OAB." })] })) : null] })] })] }) }));
};
