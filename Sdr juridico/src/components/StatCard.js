import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
const trendClasses = {
    up: 'text-emerald-500',
    down: 'text-text-subtle',
    flat: 'text-text-subtle',
};
const trendIcon = (trend) => {
    if (trend === 'up')
        return ArrowUpRight;
    if (trend === 'down')
        return ArrowDownRight;
    return Minus;
};
export const StatCard = ({ label, value, delta, trend, period, className }) => {
    const Icon = trendIcon(trend);
    return (_jsx(Card, { className: className, children: _jsxs(CardContent, { className: "space-y-2 px-6 py-5", children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.28em] text-text-muted", children: label }), _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("div", { className: "text-3xl font-semibold text-text", children: value }), _jsxs("div", { className: cn('flex items-center gap-1 text-[11px]', trendClasses[trend]), children: [_jsx(Icon, { className: "h-4 w-4" }), _jsxs("span", { children: [delta, "%"] })] })] }), _jsx("p", { className: "text-[11px] text-text-subtle", children: period })] }) }));
};
