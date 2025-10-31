import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type CheckResult = {
  ok: boolean;
  url?: string;
  details?: string;
};

export default function Monitor() {
  const [signedCheck, setSignedCheck] = useState<CheckResult>({ ok: false });
  const [publicCheck, setPublicCheck] = useState<CheckResult>({ ok: false });
  const [headPublicCheck, setHeadPublicCheck] = useState<CheckResult>({ ok: false });
  const [error, setError] = useState<string | null>(null);

  const env = useMemo(() => ({
    VITE_SUPABASE_URL: (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined,
    VITE_LOGO_BUCKET: (import.meta as any)?.env?.VITE_LOGO_BUCKET as string | undefined,
    VITE_LOGO_PATH: (import.meta as any)?.env?.VITE_LOGO_PATH as string | undefined,
  }), []);

  const bucket = env.VITE_LOGO_BUCKET?.trim();
  const path = env.VITE_LOGO_PATH?.trim();

  useEffect(() => {
    const run = async () => {
      try {
        if (!bucket || !path) {
          setError('Variáveis de ambiente VITE_LOGO_BUCKET e/ou VITE_LOGO_PATH não estão definidas.');
          return;
        }

        // 1) Tenta URL assinada (válida mesmo com bucket privado)
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 60 * 60);
          if (error) throw error;
          if (data?.signedUrl) {
            setSignedCheck({ ok: true, url: data.signedUrl });
          } else {
            setSignedCheck({ ok: false, details: 'createSignedUrl não retornou URL.' });
          }
        } catch (e: any) {
          setSignedCheck({ ok: false, details: e?.message ?? String(e) });
        }

        // 2) Tenta publicUrl
        try {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          if (data?.publicUrl) {
            setPublicCheck({ ok: true, url: data.publicUrl });
            // 2.1) HEAD para validar existência do objeto público
            try {
              const res = await fetch(data.publicUrl, { method: 'HEAD' });
              setHeadPublicCheck({ ok: res.ok, url: data.publicUrl, details: `HTTP ${res.status}` });
            } catch (err: any) {
              setHeadPublicCheck({ ok: false, details: err?.message ?? String(err) });
            }
          } else {
            setPublicCheck({ ok: false, details: 'getPublicUrl não retornou URL.' });
          }
        } catch (e: any) {
          setPublicCheck({ ok: false, details: e?.message ?? String(e) });
        }
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    };
    run();
  }, [bucket, path]);

  const Info = ({ label, value, secret }: { label: string; value?: string; secret?: boolean }) => (
    <div className="flex flex-col">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="font-mono text-sm break-all">{secret && value ? '••••••••' : (value ?? '-')}</span>
    </div>
  );

  const Badge = ({ ok }: { ok: boolean }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ok ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
      {ok ? 'OK' : 'ERRO'}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">📊 Monitoramento do App</h1>

        <section className="grid sm:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <Info label="VITE_SUPABASE_URL" value={env.VITE_SUPABASE_URL} />
          <Info label="VITE_LOGO_BUCKET" value={env.VITE_LOGO_BUCKET} />
          <Info label="VITE_LOGO_PATH" value={env.VITE_LOGO_PATH} />
        </section>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl">
            <strong>Configuração incompleta:</strong> {error}
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Teste: createSignedUrl</h2>
              <Badge ok={signedCheck.ok} />
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400">URL Assinada:</span>{' '}
                {signedCheck.url ? (
                  <a className="text-blue-300 underline break-all" href={signedCheck.url} target="_blank" rel="noreferrer">{signedCheck.url}</a>
                ) : (
                  <span>-</span>
                )}
              </div>
              {signedCheck.details && (
                <div className="text-slate-400">Detalhes: {signedCheck.details}</div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Teste: getPublicUrl + HEAD</h2>
              <Badge ok={publicCheck.ok && headPublicCheck.ok} />
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400">URL Pública:</span>{' '}
                {publicCheck.url ? (
                  <a className="text-blue-300 underline break-all" href={publicCheck.url} target="_blank" rel="noreferrer">{publicCheck.url}</a>
                ) : (
                  <span>-</span>
                )}
              </div>
              {publicCheck.details && (
                <div className="text-slate-400">Detalhes: {publicCheck.details}</div>
              )}
              {headPublicCheck.details && (
                <div className="text-slate-400">HEAD: {headPublicCheck.details}</div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-2">Como usar</h2>
          <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1">
            <li>Defina VITE_LOGO_BUCKET e VITE_LOGO_PATH nas variáveis de ambiente.</li>
            <li>Esta página tenta carregar a logo via URL assinada (privada) e via URL pública (com validação HEAD).</li>
            <li>Use os links acima para validar acesso ao objeto no Storage do Supabase.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
