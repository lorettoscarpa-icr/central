import Shell from '@/components/Shell';

export const metadata = { title: 'Organização & Cadastros · Central Única' };

// Carga inicial vinda do levantamento dos painéis atuais.
// Vira a tabela `pessoas` + `papeis` no Supabase, editável pelo administrador.
const PESSOAS = [
  { nome: 'Gregory', papel: 'Diretoria', bracos: ['Tudo'] },
  { nome: 'Larissa', papel: 'Diretoria', bracos: ['Tudo'] },
  { nome: 'Jhennifer', papel: 'Supervisora', bracos: ['Vendas & Operação'] },
  { nome: 'Ialey', papel: 'Vendedora', bracos: ['Vendas & Operação', 'Catálogos'] },
  { nome: 'Michelly', papel: 'Vendedora', bracos: ['Vendas & Operação', 'Catálogos'] },
  { nome: 'Natália', papel: 'Vendedora', bracos: ['Vendas & Operação', 'Catálogos'] },
  { nome: 'Yuri', papel: 'Estoque', bracos: ['Estoque', 'Encomendas', 'Entregas'] },
  { nome: 'Edson', papel: 'Estoque', bracos: ['Estoque', 'Entregas', 'Envios'] },
  { nome: 'Gustavo', papel: 'Entregador', bracos: ['Entregas'] },
  { nome: 'Ávia Consultoria', papel: 'Financeiro', bracos: ['ICR', 'Pagamentos', 'RH'] },
  { nome: 'Lorrayne', papel: 'Marketing', bracos: ['Campanhas', 'Catálogos'] },
];

export default function OrganizacaoPage() {
  return (
    <Shell>
      <main className="content">
        <div className="page-head">
          <div className="titles">
            <div className="eyebrow">Administração</div>
            <h1 className="page-title">Organização &amp; Cadastros</h1>
          </div>
          <div className="actions-desktop">
            <button className="btn">Novo setor</button>
            <button className="btn primary">Nova pessoa</button>
          </div>
        </div>

        <p style={{ margin: 0, maxWidth: '70ch', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Cada pessoa tem um papel por aba — a mesma pessoa pode ser gestora numa aba e só
          visualizadora em outra. O menu de cada uma se monta a partir desta grade, e as
          permissões valem no servidor, não só na tela.
        </p>

        <div className="org-grid">
          {PESSOAS.map((p) => (
            <div className="org-card" key={p.nome}>
              <div className="av">{p.nome[0]}</div>
              <div>
                <div className="nm">{p.nome}</div>
                <div className="rl">{p.papel}</div>
                <div className="tags">
                  {p.bracos.map((b) => (
                    <span className="tg" key={b}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Shell>
  );
}
