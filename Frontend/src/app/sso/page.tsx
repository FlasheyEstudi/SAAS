'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';

/**
 * /sso — entrada desde LogiFast.
 *
 * El ticket llega en el **fragmento** de la URL (`#t=…`), que el navegador no manda al servidor ni
 * queda en los logs. Se canjea por una sesión normal de Ganesha y se borra de la barra de
 * direcciones. Si algo falla, se manda al login de siempre.
 *
 * El canje va por `/backend-api/…` (el rewrite interno de Next) para no depender de la URL pública
 * del backend y no abrir CORS.
 */
export default function SsoPage() {
  const [mensaje, setMensaje] = useState('Conectando con LogiFast…');
  const [error, setError] = useState<string | null>(null);
  const loginAction = useAppStore((s) => s.login);

  useEffect(() => {
    const canjear = async () => {
      const ticket = (window.location.hash || '').replace(/^#t=/, '').trim();
      // El ticket no debe quedarse en la barra de direcciones ni en el historial
      window.history.replaceState(null, '', window.location.pathname);

      if (!ticket) {
        setError('Falta el ticket de acceso. Abre Ganesha desde el panel de LogiFast.');
        return;
      }

      try {
        const res = await fetch('/backend-api/auth/sso/sesion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket }),
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.success || !json?.data?.token) {
          throw new Error(json?.error || 'No se pudo validar el acceso');
        }

        const { user, token } = json.data;
        let company = null;
        if (user?.companyId) {
          try {
            const r = await fetch(`/backend-api/companies/${user.companyId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const c = await r.json();
            company = c?.data ?? null;
          } catch {
            /* la empresa se carga luego en el dashboard */
          }
        }

        loginAction(user, token, user?.companyId || user?.availableCompanies?.[0]?.id || '', company);
        setMensaje(`Bienvenido, ${user?.name || 'usuario'}.`);
        window.location.replace('/');
      } catch (err: any) {
        setError(err?.message || 'No se pudo iniciar la sesión desde LogiFast');
      }
    };

    void canjear();
  }, [loginAction]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-2xl">🐘</div>
        {error ? (
          <>
            <h1 className="mb-2 text-lg font-semibold">No se pudo entrar</h1>
            <p className="mb-6 text-sm text-slate-400">{error}</p>
            <a
              href="/"
              className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
            >
              Ir al inicio de sesión
            </a>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-semibold">Entrando a Ganesha</h1>
            <p className="text-sm text-slate-400">{mensaje}</p>
          </>
        )}
      </div>
    </main>
  );
}
