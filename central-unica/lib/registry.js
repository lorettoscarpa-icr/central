// Registro único de braços e módulos da Central.
// A ordem aqui é a ordem do menu; slugs são as rotas (/[braco]/[modulo]).
export const BRACOS = [
  {
    slug: 'vendas',
    nome: 'Vendas & Operação',
    curto: 'Vendas',
    modulos: [
      { slug: 'metas', nome: 'Metas' },
      { slug: 'entregas', nome: 'Entregas' },
      { slug: 'encomendas', nome: 'Encomendas' },
      { slug: 'vendas-perdidas', nome: 'Vendas Perdidas' },
      { slug: 'pos-venda', nome: 'Pós-venda' },
      { slug: 'supervisora', nome: 'Supervisora' },
      { slug: 'parcerias', nome: 'Parcerias' },
      { slug: 'consertos', nome: 'Consertos' },
      { slug: 'presentes', nome: 'Presentes' },
    ],
  },
  {
    slug: 'estoque',
    nome: 'Estoque',
    curto: 'Estoque',
    modulos: [
      { slug: 'estoque', nome: 'Central do Estoque' },
      { slug: 'suprimentos', nome: 'Suprimentos' },
    ],
  },
  {
    slug: 'financeiro',
    nome: 'Financeiro & RH',
    curto: 'Financeiro',
    modulos: [
      { slug: 'icr', nome: 'ICR Control' },
      { slug: 'pagamentos', nome: 'Pagamentos' },
      { slug: 'caixa', nome: 'Cruzamento de Caixa' },
      { slug: 'relatorio-vendas', nome: 'Relatório de Vendas' },
      { slug: 'conexoes', nome: 'Conexões bancárias' },
      { slug: 'rh', nome: 'RH' },
    ],
  },
  {
    slug: 'marketing',
    nome: 'Marketing',
    curto: 'Marketing',
    modulos: [
      { slug: 'colecoes', nome: 'Coleções' },
      { slug: 'catalogos', nome: 'Catálogos' },
      { slug: 'campanhas', nome: 'Campanhas' },
      { slug: 'modelos', nome: 'Modelos' },
      { slug: 'trafego', nome: 'Tráfego Pago' },
    ],
  },
];

export function findBraco(slug) {
  return BRACOS.find((b) => b.slug === slug) || null;
}

export function findModulo(bracoSlug, moduloSlug) {
  const b = findBraco(bracoSlug);
  if (!b) return null;
  const m = b.modulos.find((m) => m.slug === moduloSlug);
  return m ? { braco: b, modulo: m } : null;
}
