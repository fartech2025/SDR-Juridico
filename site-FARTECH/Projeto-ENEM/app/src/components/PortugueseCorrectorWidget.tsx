import React from 'react';
import {
  checkPortugueseText,
  TextCorrectionError,
  type CorrectionMatch,
} from '../lib/textCorrection/languageToolClient';

type CorrectionState = {
  matches: CorrectionMatch[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: CorrectionState = {
  matches: [],
  loading: false,
  error: null,
};

export default function PortugueseCorrectorWidget() {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [state, setState] = React.useState<CorrectionState>(INITIAL_STATE);

  const hasText = text.trim().length > 0;
  const hasMatches = state.matches.length > 0;

  const handleCheck = async () => {
    if (!hasText) {
      setState(INITIAL_STATE);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await checkPortugueseText(text);
      setState({
        matches: result.matches,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof TextCorrectionError
          ? error.message
          : 'Não foi possível executar o corretor agora.';
      setState({
        matches: [],
        loading: false,
        error: message,
      });
    }
  };

  const applyCorrections = () => {
    if (!hasMatches) return;
    let corrected = text;
    const ordered = [...state.matches]
      .filter(match => match.replacements?.length)
      .sort((a, b) => (b.offset ?? 0) - (a.offset ?? 0));

    ordered.forEach(match => {
      const suggestion = match.replacements?.[0]?.value;
      if (!suggestion) return;
      corrected =
        corrected.slice(0, match.offset) +
        suggestion +
        corrected.slice(match.offset + match.length);
    });

    setText(corrected);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Abrir corretor de português"
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        {open ? 'X' : 'Aa'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100%-2rem)] rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-lg">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Corretor de Português</p>
              <p className="text-xs text-slate-400">
                Baseado no LanguageTool — válido para textos em português (Brasil).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setState(INITIAL_STATE)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Limpar
            </button>
          </div>

          <textarea
            className="h-32 w-full resize-none rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            placeholder="Cole um texto para revisar..."
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!hasText || state.loading}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
            >
              {state.loading ? 'Verificando...' : 'Verificar texto'}
            </button>
            <button
              type="button"
              onClick={applyCorrections}
              disabled={!hasMatches}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Aplicar sugestões
            </button>
            <span className="text-xs text-slate-400">
              {hasMatches ? `${state.matches.length} sugestão(ões)` : 'Nenhuma sugestão'}
            </span>
          </div>

          {state.error && (
            <p className="mt-2 text-xs text-red-300">
              {state.error}
            </p>
          )}

          {hasMatches && (
            <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-1">
              {state.matches.map((match, index) => (
                <div
                  key={`${match.offset}-${match.length}-${index}`}
                  className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-2 text-xs text-slate-200"
                >
                  <p className="font-semibold text-emerald-300">{match.shortMessage || match.message}</p>
                  {match.context?.text && (
                    <p className="mt-1 text-slate-400">
                      <span className="font-medium text-slate-300">Trecho:</span>{' '}
                      {match.context.text}
                    </p>
                  )}
                  {match.replacements?.length > 0 && (
                    <p className="mt-1 text-slate-400">
                      Sugestões:{' '}
                      {match.replacements.slice(0, 3).map(r => r.value).join(', ')}
                    </p>
                  )}
                  {match.rule?.description && (
                    <p className="mt-1 text-slate-500">Regra: {match.rule.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
