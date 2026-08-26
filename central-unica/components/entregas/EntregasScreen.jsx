'use client';

import { useState } from 'react';

// Dados de exemplo do design — serão substituídos pela tabela `entregas` do Supabase.
const ENTREGAS = [
  { cliente: 'Carlos Menezes', endereco: 'Setor Bueno, Goiânia', entregador: 'Gustavo', pagamento: 'Pix', status: 'Em rota', hora: '14:20' },
  { cliente: 'Rafael Antunes', endereco: 'Jardim Goiás', entregador: 'Gustavo', pagamento: 'Cartão · 3x', status: 'Em rota', hora: '14:20' },
  { cliente: 'Paulo H. Duarte', endereco: 'Setor Marista', entregador: '—', pagamento: 'Dinheiro', status: 'Pendente', hora: '—' },
  { cliente: 'João Vitor Reis', endereco: 'Setor Oeste', entregador: '—', pagamento: 'Pix na entrega', status: 'Pendente', hora: '—' },
  { cliente: 'Marcos Tavares', endereco: 'Campinas', entregador: 'Edson', pagamento: 'Cartão · débito', status: 'Entregue', hora: '11:45' },
  { cliente: 'André Sampaio', endereco: 'Setor Sul', entregador: 'Gustavo', pagamento: 'Troca', status: 'Aguard. volta', hora: '10:10' },
];

const CHIP_CLASSE = {
  'Em rota': 'rota',
  'Pendente': 'pend',
  'Entregue': 'done',
  'Aguard. volta': 'volta',
};

const ABAS = ['Pendentes', 'Rotas', 'Finalizadas', 'Devoluções e trocas', 'Envios'];

export default function EntregasScreen() {
  const [aba, setAba] = useState('Pendentes');

  return (
    <main className="content">
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Vendas &amp; Operação</div>
          <h1 className="page-title">Entregas</h1>
        </div>
        <div className="actions-desktop">
          <button className="btn">Colar mensagem do WhatsApp</button>
          <button className="btn primary">Nova entrega</button>
        </div>
      </div>

      {/* Abas (desktop) */}
      <div className="tabs" role="tablist">
        {ABAS.map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={aba === a}
            className={`tab${aba === a ? ' on' : ''}`}
            onClick={() => setAba(a)}
          >
            {a} {a === 'Pendentes' && <span className="n">8</span>}
          </button>
        ))}
      </div>

      {/* Filtros (celular) */}
      <div className="mchips">
        {['Pendentes · 8', 'Rotas', 'Finalizadas'].map((a, i) => (
          <span key={a} className={`mchip${i === 0 ? ' on' : ''}`}>{a}</span>
        ))}
      </div>

      {/* Indicadores */}
      <div className="kpis">
        <div className="kpi"><div className="k">Entregas hoje</div><div className="v">14</div></div>
        <div className="kpi"><div className="k">Pendentes</div><div className="v">8</div></div>
        <div className="kpi"><div className="k">A receber do entregador</div><div className="v">R$ 1.240</div></div>
        <div className="kpi"><div className="k">No prazo este mês</div><div className="v">96%</div></div>
      </div>

      {/* Tabela + painéis (desktop) */}
      <div className="split">
        <div className="card table">
          <div className="trow thead">
            <div>Cliente</div><div>Endereço</div><div>Entregador</div><div>Pagamento</div><div>Status</div><div style={{ textAlign: 'right' }}>Hora</div>
          </div>
          {ENTREGAS.map((e) => (
            <div className="trow" key={e.cliente}>
              <div className="strong">{e.cliente}</div>
              <div className="dim">{e.endereco}</div>
              <div className="dim">{e.entregador}</div>
              <div className="dim">{e.pagamento}</div>
              <div><span className={`chip ${CHIP_CLASSE[e.status]}`}>{e.status}</span></div>
              <div className="time">{e.hora}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          <div className="card panel">
            <div className="ph">
              <span>Frota ao vivo</span>
              <a href="#">Ver mapa</a>
            </div>
            <div className="person">
              <div className="av live">G</div>
              <div className="info">
                <div className="nm">Gustavo</div>
                <div className="st">Em rota · 3 paradas restantes</div>
              </div>
              <span className="status live" />
            </div>
            <div className="person">
              <div className="av idle">E</div>
              <div className="info">
                <div className="nm">Edson</div>
                <div className="st">Na loja · disponível</div>
              </div>
              <span className="status idle" />
            </div>
          </div>

          <div className="card panel" style={{ gap: 10 }}>
            <div className="ph"><span>Dinheiro a receber</span></div>
            <div className="money">R$ 1.240,00</div>
            <div className="money-lines">Gustavo · R$ 890,00<br />Edson · R$ 350,00</div>
            <a href="#" style={{ fontSize: 12 }}>Gerar relatório de pagamento</a>
          </div>
        </div>
      </div>

      {/* Lista (celular) */}
      <div className="mlist">
        {ENTREGAS.slice(0, 5).map((e) => (
          <div className="mcard" key={e.cliente}>
            <div className="info">
              <div className="nm">{e.cliente}</div>
              <div className="dt">{e.endereco} · {e.entregador}</div>
            </div>
            <span className={`chip ${CHIP_CLASSE[e.status]}`}>{e.status}</span>
          </div>
        ))}
      </div>
      <button className="mcta">Nova entrega · colar WhatsApp</button>
    </main>
  );
}
