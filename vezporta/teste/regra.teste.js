/* Testes da regra da vez.  Rode com:  node teste/regra.teste.js  */
const R = require('../regra.js');

let ok = 0, falhou = 0;
function eq(nome, real, esperado) {
  const bom = JSON.stringify(real) === JSON.stringify(esperado);
  bom ? ok++ : falhou++;
  console.log(`  ${bom ? 'ok  ' : 'FALHA'} ${nome.padEnd(62)} ${bom ? '' : `esperado ${JSON.stringify(esperado)}, veio ${JSON.stringify(real)}`}`);
}
const P = (nome, idas, vendas, extra = {}) =>
  Object.assign({ nome, idas, vendas, participa: true, presente: true, ultimaEm: 0 }, extra);
const base = (criterio = 'idas') => ({
  criterio,
  daVez: 'ialey',
  pessoas: { ialey: P('Ialey', 0, 0), michelly: P('Michelly', 0, 0), natalia: P('Natália', 0, 0) },
});

console.log('\n== quem é a próxima ==');
{
  const e = base();
  e.pessoas.ialey.idas = 3; e.pessoas.michelly.idas = 1; e.pessoas.natalia.idas = 2;
  eq('vai quem foi menos vezes', R.proximaDaVez(e.pessoas, 'idas'), 'michelly');
}
{
  const e = base();
  e.pessoas.ialey.idas = 2; e.pessoas.ialey.ultimaEm = 500;
  e.pessoas.michelly.idas = 2; e.pessoas.michelly.ultimaEm = 100;
  e.pessoas.natalia.idas = 5;
  eq('empate: vai quem está há mais tempo sem ir', R.proximaDaVez(e.pessoas, 'idas'), 'michelly');
}
{
  const e = base();
  e.pessoas.natalia.presente = false;
  e.pessoas.ialey.idas = 1; e.pessoas.michelly.idas = 2;
  eq('ausente no almoço não é chamada', R.proximaDaVez(e.pessoas, 'idas'), 'ialey');
}
{
  const e = base();
  e.pessoas.jhennifer = P('Jhennifer', 0, 0, { participa: false });
  e.pessoas.ialey.idas = 4; e.pessoas.michelly.idas = 4; e.pessoas.natalia.idas = 4;
  eq('quem não participa fica fora, mesmo com 0 vezes', R.proximaDaVez(e.pessoas, 'idas'), 'ialey');
}
{
  const e = base();
  Object.keys(e.pessoas).forEach(k => e.pessoas[k].presente = false);
  eq('ninguém presente devolve null', R.proximaDaVez(e.pessoas, 'idas'), null);
}

console.log('\n== a vez só passa quando vende ==');
{
  let e = base();
  e = R.registrar(e, 'ialey', 'sem-venda', 1000);
  eq('não vendeu: a vez continua com ela', e.daVez, 'ialey');
  eq('não vendeu: conta a ida', [e.pessoas.ialey.idas, e.pessoas.ialey.vendas], [1, 0]);
}
{
  let e = base();
  e = R.registrar(e, 'ialey', 'venda', 1000);
  eq('vendeu: a vez passa', e.daVez !== 'ialey', true);
  eq('vendeu: conta ida e venda', [e.pessoas.ialey.idas, e.pessoas.ialey.vendas], [1, 1]);
}
{
  let e = base();
  e = R.registrar(e, 'ialey', 'troca', 1000);
  eq('troca: a vez continua', e.daVez, 'ialey');
  eq('troca: não conta nada', [e.pessoas.ialey.idas, e.pessoas.ialey.vendas], [0, 0]);
}

console.log('\n== o cenário que você descreveu: 3 sem venda, depois vende ==');
{
  let e = base('idas');
  for (let i = 0; i < 3; i++) e = R.registrar(e, 'natalia', 'sem-venda', 1000 + i);
  eq('depois de 3 sem venda, ainda é a vez dela', e.daVez, 'natalia');
  e = R.registrar(e, 'natalia', 'venda', 2000);
  eq('idas somam 4, vendas somam 1', [e.pessoas.natalia.idas, e.pessoas.natalia.vendas], [4, 1]);
  eq('e a vez passou', e.daVez !== 'natalia', true);
}
{
  /* mesmo cenário, mas a fila governada por VENDAS */
  let e = base('vendas'); e.daVez = 'natalia';
  for (let i = 0; i < 3; i++) e = R.registrar(e, 'natalia', 'sem-venda', 1000 + i);
  e = R.registrar(e, 'natalia', 'venda', 2000);
  eq('por vendas: sequência ruim não a joga para o fim da fila', e.pessoas.natalia.vendas, 1);
}

console.log('\n== o almoço se corrige sozinho ==');
{
  let e = base('idas');
  e.pessoas.natalia.presente = false;            // Natália sai para almoçar
  for (let i = 0; i < 6; i++) {                  // 6 clientes enquanto ela está fora
    e.daVez = R.proximaDaVez(e.pessoas, 'idas');
    e = R.registrar(e, e.daVez, 'venda', 1000 + i);
  }
  eq('Natália ficou para trás', [e.pessoas.ialey.idas, e.pessoas.michelly.idas, e.pessoas.natalia.idas], [3, 3, 0]);

  const quemEstavaComAVez = e.daVez;
  e.pessoas.natalia.presente = true;             // volta do almoço
  e = R.revalidar(e);
  /* Voltar do almoço NÃO tira a vez de quem já está com ela: essa pessoa pode estar
     atendendo agora. A Natália emparelha nas próximas, não nesta. */
  eq('voltar do almoço não tira a vez de quem já a tem', e.daVez, quemEstavaComAVez);

  for (let i = 0; i < 12; i++) e = R.registrar(e, e.daVez, 'venda', 2000 + i);
  const c = [e.pessoas.ialey.idas, e.pessoas.michelly.idas, e.pessoas.natalia.idas];
  eq('em poucas vendas a diferença cai para no máximo 1', Math.max(...c) - Math.min(...c) <= 1, true);
  eq('e a Natália deixou de ser a última', e.pessoas.natalia.idas >= 5, true);
}
{
  /* convergência de longo prazo, que é o objetivo declarado */
  let e = base('idas');
  e.pessoas.ialey.idas = 11; e.pessoas.michelly.idas = 4; e.pessoas.natalia.idas = 0;
  for (let i = 0; i < 40; i++) { e = R.revalidar(e); e = R.registrar(e, e.daVez, 'venda', 3000 + i); }
  const c = [e.pessoas.ialey.idas, e.pessoas.michelly.idas, e.pessoas.natalia.idas];
  eq('partindo de 11/4/0, 40 vendas depois a diferença é no máximo 1', Math.max(...c) - Math.min(...c) <= 1, true);
}

console.log('\n== marcar ausência não pode deixar a vez travada ==');
{
  let e = base(); e.daVez = 'ialey';
  e.pessoas.ialey.presente = false;              // a da vez saiu
  e = R.revalidar(e);
  eq('a vez sai de quem ficou ausente', e.daVez !== 'ialey', true);
  eq('e vai para alguém elegível', ['michelly', 'natalia'].includes(e.daVez), true);
}
{
  let e = base(); e.daVez = 'ialey';
  e.pessoas.ialey.idas = 9;
  const antes = JSON.stringify(e.pessoas);
  e = R.revalidar(e);
  eq('revalidar não mexe em contador', JSON.stringify(e.pessoas), antes);
}

console.log('\n== registrar não altera o estado que recebeu ==');
{
  const e = base();
  const antes = JSON.stringify(e);
  R.registrar(e, 'ialey', 'venda', 1000);
  eq('o objeto original fica intacto', JSON.stringify(e), antes);
}


console.log('\n== a ordem da fila que elas veem ==');
{
  const e = base('idas');
  e.pessoas.ialey.idas = 5; e.pessoas.michelly.idas = 4; e.pessoas.natalia.idas = 2;
  e.daVez = 'ialey';
  eq('começa por quem está com a vez, depois em ordem de contagem',
     R.ordemDaFila(e.pessoas, 'idas', 'ialey'), ['ialey', 'natalia', 'natalia', 'michelly'].slice(0,3));
}
{
  const e = base('idas');
  e.pessoas.ialey.idas = 0; e.pessoas.michelly.idas = 0; e.pessoas.natalia.idas = 0;
  e.daVez = 'michelly';
  const o = R.ordemDaFila(e.pessoas, 'idas', 'michelly');
  eq('todas empatadas: a da vez primeiro, e ninguém repete na volta', o.length, 3);
  eq('e as três aparecem', [...new Set(o)].length, 3);
}
{
  const e = base('idas');
  e.pessoas.natalia.presente = false;
  e.daVez = 'ialey';
  const o = R.ordemDaFila(e.pessoas, 'idas', 'ialey');
  eq('quem está ausente não aparece na ordem', o.includes('natalia'), false);
}
{
  const e = base('idas');
  e.pessoas.ialey.idas = 9;
  const antes = JSON.stringify(e.pessoas);
  R.ordemDaFila(e.pessoas, 'idas', 'ialey');
  eq('calcular a ordem não altera contador de ninguém', JSON.stringify(e.pessoas), antes);
}
console.log('\n== taxa de conversão ==');
eq('4 vendas em 10 idas dá 40%', R.conversao({idas:10, vendas:4}), 40);
eq('1 em 3 arredonda para 33%',  R.conversao({idas:3,  vendas:1}), 33);
eq('sem ida nenhuma devolve null, não 0%', R.conversao({idas:0, vendas:0}), null);
eq('vendeu em todas dá 100%', R.conversao({idas:5, vendas:5}), 100);

console.log('\n== aviso de desequilíbrio ==');
{
  const e = base();
  e.pessoas.ialey.idas = 9; e.pessoas.michelly.idas = 5; e.pessoas.natalia.idas = 4;
  const d = R.desequilibrio(e.pessoas, 'idas');
  eq('acha a diferença entre a primeira e a última', d.diferenca, 5);
  eq('e quem está atrás', d.atras, 'natalia');
}
{
  const e = base();
  e.pessoas.ialey.idas = 9; e.pessoas.michelly.idas = 8; e.pessoas.natalia.idas = 20;
  e.pessoas.natalia.presente = false;      // de folga: não pode virar alarme falso
  const d = R.desequilibrio(e.pessoas, 'idas');
  eq('quem está ausente fica fora da conta', d.diferenca, 1);
}
{
  const e = base();
  Object.keys(e.pessoas).forEach(k => { if(k!=='ialey') e.pessoas[k].presente = false; });
  eq('com uma pessoa só não existe desequilíbrio', R.desequilibrio(e.pessoas,'idas').diferenca, 0);
}
{
  const e = base('vendas');
  e.pessoas.ialey.idas = 2; e.pessoas.ialey.vendas = 6;
  e.pessoas.michelly.idas = 9; e.pessoas.michelly.vendas = 1;
  e.pessoas.natalia.idas = 5; e.pessoas.natalia.vendas = 3;
  eq('respeita o critério escolhido (por vendas)', R.desequilibrio(e.pessoas,'vendas').atras, 'michelly');
  eq('e por idas daria outra pessoa',              R.desequilibrio(e.pessoas,'idas').atras, 'ialey');
}

console.log('\n== resumo por dia ==');
{
  const d1 = new Date(2026,7,30,10,0).getTime(), d2 = new Date(2026,7,29,10,0).getTime();
  const h = [
    {nome:'Ialey',   desfecho:'venda',     quando:d1},
    {nome:'Ialey',   desfecho:'sem-venda', quando:d1+1000},
    {nome:'Natália', desfecho:'venda',     quando:d1+2000},
    {nome:'Natália', desfecho:'troca',     quando:d1+3000},
    {nome:'Michelly',desfecho:'venda',     quando:d2},
  ];
  const r = R.resumoPorDia(h);
  eq('agrupa em dois dias', r.length, 2);
  eq('o mais recente vem primeiro', r[0].dia, '2026-08-30');
  eq('conta 3 idas no dia (a troca não conta)', r[0].idas, 3);
  eq('conta a troca à parte', r[0].trocas, 1);
  eq('conta 2 vendas no dia', r[0].vendas, 2);
  eq('e quebra por pessoa', [r[0].pessoas['Ialey'].idas, r[0].pessoas['Ialey'].vendas], [2,1]);
}
eq('histórico vazio devolve lista vazia', R.resumoPorDia([]), []);

console.log('\n== modo férias ==');
{
  const e = base();
  e.pessoas.natalia.ferias = true;
  eq('de férias não é chamada', R.proximaDaVez(e.pessoas, 'idas') !== 'natalia', true);
  eq('e some da ordem da fila', R.ordemDaFila(e.pessoas,'idas','ialey').includes('natalia'), false);
}
{
  const e = base();
  e.daVez = 'natalia';
  e.pessoas.natalia.ferias = true;
  const r = R.revalidar(e);
  eq('entrando de férias, a vez sai dela', r.daVez !== 'natalia', true);
}
{
  const e = base();
  e.pessoas.ialey.idas = 40; e.pessoas.ialey.vendas = 16;
  e.pessoas.michelly.idas = 44; e.pessoas.michelly.vendas = 20;
  e.pessoas.natalia.idas = 2; e.pessoas.natalia.vendas = 1;   // voltou de duas semanas
  e.pessoas.natalia.ferias = true;
  eq('férias fica fora da média', R.mediaAtiva(e.pessoas,'idas'), 42);
  eq('e a média de quem ficou ignora a própria pessoa',
     R.mediaAtiva(e.pessoas,'idas','natalia'), 42);
  eq('e o atraso dela é calculado', R.atrasoSeVoltar(e.pessoas,'natalia','idas'), 40);
  const r = R.nivelar(e, 'natalia');
  eq('nivelar põe na média das ativas', [r.pessoas.natalia.idas, r.pessoas.natalia.vendas], [42, 18]);
  eq('e não mexe em quem ficou',
     [r.pessoas.ialey.idas, r.pessoas.michelly.idas], [40, 44]);
}
{
  /* o motivo de existir o nivelamento: sem ele, ela monopoliza a porta */
  let e = base('idas');
  e.pessoas.ialey.idas = 40; e.pessoas.michelly.idas = 40; e.pessoas.natalia.idas = 2;
  e.daVez = 'ialey';
  let seguidas = 0;
  for (let i = 0; i < 10; i++) { e = R.revalidar(e); e = R.registrar(e, e.daVez, 'venda', 9000+i);
    if (e.pessoas.natalia.idas > 2) seguidas++; }
  eq('sem nivelar, ela pega quase tudo ao voltar', seguidas >= 9, true);

  let f = base('idas');
  f.pessoas.ialey.idas = 40; f.pessoas.michelly.idas = 40; f.pessoas.natalia.idas = 2;
  f = R.nivelar(f, 'natalia');
  f.daVez = 'ialey';
  const antes = f.pessoas.natalia.idas;
  for (let i = 0; i < 6; i++) { f = R.revalidar(f); f = R.registrar(f, f.daVez, 'venda', 9000+i); }
  const c = [f.pessoas.ialey.idas, f.pessoas.michelly.idas, f.pessoas.natalia.idas];
  eq('nivelada, ela volta a revezar normal', Math.max(...c) - Math.min(...c) <= 1, true);
  eq('e entrou na média de quem ficou, não no zero', antes, 40);
}
{
  const e = base();
  e.pessoas.natalia.ferias = true;
  const antes = JSON.stringify(e.pessoas);
  R.nivelar(e, 'natalia');
  eq('nivelar não altera o estado que recebeu', JSON.stringify(e.pessoas), antes);
}

console.log(`\nresultado final: ${ok} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
