'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRACOS } from '@/lib/registry';

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" /><line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" /><line x1="17" y1="7" x2="19.1" y2="4.9" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 13.2A9 9 0 1 1 10.8 3 7 7 0 0 0 21 13.2z" />
    </svg>
  );
}

function alternarTema() {
  const html = document.documentElement;
  const escuro = html.dataset.theme === 'escuro';
  if (escuro) delete html.dataset.theme;
  else html.dataset.theme = 'escuro';
  try {
    localStorage.setItem('cu_tema', escuro ? 'claro' : 'escuro');
  } catch {}
}

// Badges de aviso por módulo — virão do Supabase; por ora, exemplo do design.
const BADGES = { 'vendas/entregas': 8 };

export default function Shell({ children }) {
  const pathname = usePathname();
  const bracoAtual = BRACOS.find((b) => pathname.startsWith(`/${b.slug}`))?.slug || 'vendas';
  const [aberto, setAberto] = useState(bracoAtual);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/favicon.png" alt="Loretto Scarpa" />
          <div>
            <div className="nm">Loretto Scarpa</div>
            <div className="sub">Central Única</div>
          </div>
        </div>

        <nav className="nav" aria-label="Braços da Central">
          {BRACOS.map((b) => {
            const expandido = aberto === b.slug;
            return (
              <div key={b.slug}>
                <button
                  className="nav-sec"
                  aria-expanded={expandido}
                  onClick={() => setAberto(expandido ? null : b.slug)}
                >
                  <span>{b.nome}</span>
                  <span className="caret">›</span>
                </button>
                {expandido && (
                  <div className="nav-group">
                    {b.modulos.map((m) => {
                      const href = `/${b.slug}/${m.slug}`;
                      const ativo = pathname === href;
                      const badge = BADGES[`${b.slug}/${m.slug}`];
                      return (
                        <Link key={m.slug} href={href} className={`nav-item${ativo ? ' on' : ''}`}>
                          <span className="lbl">{m.nome}</span>
                          {badge ? <span className="badge">{badge}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="side-foot">
          <Link href="/organizacao" className={`org${pathname === '/organizacao' ? ' on' : ''}`}>
            Organização &amp; Cadastros
          </Link>
          <div className="userchip">
            <div className="av">G</div>
            <div>
              <div className="nm">Gregory</div>
              <div className="rl">Diretoria</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="mbrand" style={{ alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <img src="/favicon.png" alt="Loretto Scarpa" style={{ width: 34, height: 34, borderRadius: 8, display: 'block' }} />
            <div style={{ lineHeight: 1.15 }}>
              <div className="serif" style={{ fontSize: 15 }}>Loretto Scarpa</div>
              <div style={{ fontSize: 9.5, letterSpacing: '.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>Central Única</div>
            </div>
          </div>
          <div className="search" role="search">
            <IconSearch />
            Buscar cliente, entrega, modelo…
          </div>
          <div style={{ flex: 1 }} className="spacer-desktop" />
          <button className="icon-btn" title="Alternar tema" onClick={alternarTema} suppressHydrationWarning>
            <span className="so-claro"><IconMoon /></span>
            <span className="so-escuro"><IconSun /></span>
          </button>
          <button className="icon-btn" title="Avisos">
            <IconBell />
            <span className="dot" />
          </button>
        </header>

        {children}

        <nav className="bottomnav" aria-label="Braços">
          {BRACOS.map((b) => {
            const ativo = bracoAtual === b.slug;
            const primeiro = `/${b.slug}/${b.modulos[0].slug}`;
            return (
              <Link key={b.slug} href={primeiro} className={`bnav-item${ativo ? ' on' : ''}`}>
                <span className="pip" />
                <span className="lb">{b.curto}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
