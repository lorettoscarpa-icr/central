import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import EntregasScreen from '@/components/entregas/EntregasScreen';
import { BRACOS, findModulo } from '@/lib/registry';

export function generateStaticParams() {
  return BRACOS.flatMap((b) => b.modulos.map((m) => ({ braco: b.slug, modulo: m.slug })));
}

export async function generateMetadata({ params }) {
  const { braco, modulo } = await params;
  const hit = findModulo(braco, modulo);
  if (!hit) return {};
  return { title: `${hit.modulo.nome} · Central Única` };
}

export default async function ModuloPage({ params }) {
  const { braco, modulo } = await params;
  const hit = findModulo(braco, modulo);
  if (!hit) notFound();

  if (braco === 'vendas' && modulo === 'entregas') {
    return (
      <Shell>
        <EntregasScreen />
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="content">
        <div className="page-head">
          <div className="titles">
            <div className="eyebrow">{hit.braco.nome}</div>
            <h1 className="page-title">{hit.modulo.nome}</h1>
          </div>
        </div>
        <div className="placeholder">
          <h2 className="serif">Em construção</h2>
          <p>
            Este módulo faz parte do braço {hit.braco.nome} e será montado nas próximas fases,
            seguindo o mesmo design da tela de Entregas.
          </p>
        </div>
      </main>
    </Shell>
  );
}
