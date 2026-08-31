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
console.log('\n== a ordem das três, uma linha por pessoa ==');
{
  const e = base('idas');
  e.pessoas.ialey.idas = 5; e.pessoas.michelly.idas = 4; e.pessoas.natalia.idas = 2;
  const o = R.ordemDistinta(e.pessoas, 'idas', 'ialey');
  eq('as três aparecem, mesmo com alguém repetindo',
     o.map(x => x.email), ['ialey', 'natalia', 'michelly']);
  eq('e diz quantas vezes cada uma vai na rodada',
     o.map(x => x.vezes), [1, 2, 1]);
}
{
  const e = base('idas');
  const o = R.ordemDistinta(e.pessoas, 'idas', 'michelly');
  eq('empatadas: começa por quem está com a vez', o[0].email, 'michelly');
  eq('e ninguém vai duas vezes', o.map(x => x.vezes), [1, 1, 1]);
}
{
  const e = base('idas');
  e.pessoas.natalia.presente = false;
  const o = R.ordemDistinta(e.pessoas, 'idas', 'ialey');
  eq('quem está no almoço não ocupa lugar na ordem', o.map(x => x.email), ['ialey', 'michelly']);
}
{
  const e = base('idas');
  e.pessoas.natalia.afast = 'ferias';
  eq('quem está afastada também não',
     R.ordemDistinta(e.pessoas, 'idas', 'ialey').map(x => x.email), ['ialey', 'michelly']);
}
{
  const e = base('idas');
  e.pessoas.ialey.afast = 'atestado';
  eq('afastada não segura a vez nem na simulação',
     R.ordemDistinta(e.pessoas, 'idas', 'ialey').map(x => x.email).includes('ialey'), false);
}
{
  const e = base('idas');
  e.pessoas.ialey.idas = 40; e.pessoas.michelly.idas = 1; e.pessoas.natalia.idas = 0;
  const o = R.ordemDistinta(e.pessoas, 'idas', 'ialey');
  eq('diferença grande não faz ninguém sumir da tela', o.length, 3);
  /* Ialey abre a lista porque a vez é dela AGORA — ainda não vendeu. Depois dela,
     quem está muito atrás vem antes, e ela não é chamada de novo na rodada. */
  eq('e quem está atrás vem logo depois de quem segura a vez',
     o.map(x => x.email), ['ialey', 'natalia', 'michelly']);
  eq('quem está muito na frente não repete na rodada', o[0].vezes, 1);
}
{
  const e = base('idas');
  Object.keys(e.pessoas).forEach(k => e.pessoas[k].presente = false);
  eq('ninguém apta devolve lista vazia', R.ordemDistinta(e.pessoas, 'idas', 'ialey'), []);
}
{
  const e = base('idas');
  e.pessoas.ialey.idas = 7;
  const antes = JSON.stringify(e.pessoas);
  R.ordemDistinta(e.pessoas, 'idas', 'ialey');
  eq('calcular a ordem não altera contador de ninguém', JSON.stringify(e.pessoas), antes);
}
{
  const e = base('vendas');
  e.pessoas.ialey.vendas = 3; e.pessoas.michelly.vendas = 1; e.pessoas.natalia.vendas = 1;
  e.pessoas.michelly.ultimaEm = 200; e.pessoas.natalia.ultimaEm = 100;
  eq('por vendas, a ordem segue as vendas',
     R.ordemDistinta(e.pessoas, 'vendas', 'ialey').map(x => x.email),
     ['ialey', 'natalia', 'michelly']);
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

console.log('\n== afastamento: férias, folga e atestado ==');
{
  ['ferias','folga','atestado'].forEach(tipo=>{
    const e = base();
    e.pessoas.natalia.afast = tipo;
    eq('de '+R.AFASTAMENTOS[tipo]+' não é chamada', R.proximaDaVez(e.pessoas,'idas') !== 'natalia', true);
    eq('e some da fila ('+tipo+')', R.ordemDaFila(e.pessoas,'idas','ialey').includes('natalia'), false);
  });
}
{
  const e = base();
  e.pessoas.natalia.ferias = true;      // forma antiga, booleana
  eq('reconhece o formato antigo (ferias:true)', R.afastada(e.pessoas.natalia), 'ferias');
  eq('e tira da fila igual', R.proximaDaVez(e.pessoas,'idas') !== 'natalia', true);
}
{
  const e = base();
  e.pessoas.natalia.afast = 'atestado';
  e.daVez = 'natalia';
  eq('afastando, a vez sai dela', R.revalidar(e).daVez !== 'natalia', true);
}

{
  const e = base();
  e.pessoas.natalia.afast = 'ferias';
  eq('de férias não é chamada', R.proximaDaVez(e.pessoas, 'idas') !== 'natalia', true);
  eq('e some da ordem da fila', R.ordemDaFila(e.pessoas,'idas','ialey').includes('natalia'), false);
}
{
  const e = base();
  e.daVez = 'natalia';
  e.pessoas.natalia.afast = 'ferias';
  const r = R.revalidar(e);
  eq('entrando de férias, a vez sai dela', r.daVez !== 'natalia', true);
}
{
  /* O caso real: ela sai duas semanas e a contagem dela para onde estava. */
  const e = base();
  e.pessoas.ialey.idas = 40; e.pessoas.ialey.vendas = 16;
  e.pessoas.michelly.idas = 44; e.pessoas.michelly.vendas = 20;
  e.pessoas.natalia.idas = 2; e.pessoas.natalia.vendas = 1;
  e.pessoas.natalia.afast = 'ferias';
  eq('de férias, ela não está na fila', R.elegiveis(e.pessoas), ['ialey', 'michelly']);
  eq('e a fila não está zerada: a Ialey ainda deve 4', R.filaZerada(e.pessoas, 'idas'), false);
  eq('faltam 4 idas para zerar', R.faltaParaZerar(e.pessoas, 'idas'), 4);

  const v = R.voltou(e, 'natalia');
  eq('voltou ao trabalho: a marca de ausência sai', R.afastada(v.pessoas.natalia), null);
  eq('mas ela ainda não entra na fila', R.elegiveis(v.pessoas), ['ialey', 'michelly']);
  eq('fica esperando a fila zerar', v.pessoas.natalia.esperando, true);
  eq('e nenhuma ida dela foi apagada', [v.pessoas.natalia.idas, v.pessoas.natalia.vendas], [2, 1]);
  eq('voltou não altera o estado que recebeu', e.pessoas.natalia.esperando, undefined);
}
{
  /* Enquanto ela espera, quem acumulou vez vai as vezes que acumulou — a regra da casa. */
  let e = base('idas');
  e.pessoas.ialey.idas = 40; e.pessoas.michelly.idas = 44; e.pessoas.natalia.idas = 2;
  e.pessoas.natalia.vendas = 1;
  e.pessoas.ialey.ultimaEm = 8000; e.pessoas.michelly.ultimaEm = 9000;
  e.pessoas.natalia.ultimaEm = 100;          /* duas semanas fora: ninguém está há mais tempo */
  e.pessoas.natalia.afast = 'ferias';
  e = R.voltou(e, 'natalia');
  e.daVez = R.proximaDaVez(e.pessoas, 'idas');
  const quem = [];
  for (let i = 0; i < 4; i++) { e = R.revalidar(e); quem.push(e.daVez); e = R.registrar(e, e.daVez, 'venda', 9000 + i); }
  eq('a Ialey vai as 4 que estava devendo', quem, ['ialey', 'ialey', 'ialey', 'ialey']);
  eq('só então a fila zera', R.filaZerada(e.pessoas, 'idas'), true);
  eq('e ela entra', e.pessoas.natalia.esperando, false);
  eq('na mesma marca das outras',
     [R.conta(e.pessoas.natalia, 'idas'), R.conta(e.pessoas.ialey, 'idas')], [44, 44]);
  eq('sem que a vida dela fosse reescrita', e.pessoas.natalia.idas, 2);
  eq('a conversão dela continua a verdadeira', R.conversao(e.pessoas.natalia), 50);
  eq('e a rodada nova começa por ela, que está há mais tempo sem ir',
     R.proximaDaVez(e.pessoas, 'idas'), 'natalia');
}
{
  /* O que a regra evita: sem esperar, ela pegaria a porta inteira por dias. */
  let e = base('idas');
  e.pessoas.ialey.idas = 40; e.pessoas.michelly.idas = 40; e.pessoas.natalia.idas = 2;
  e.daVez = 'ialey';
  let seguidas = 0;
  for (let i = 0; i < 10; i++) { e = R.revalidar(e); e = R.registrar(e, e.daVez, 'venda', 9000 + i);
    if (e.pessoas.natalia.idas > 2) seguidas++; }
  eq('entrando crua, ela pega quase tudo', seguidas >= 9, true);

  let f = base('idas');
  f.pessoas.ialey.idas = 40; f.pessoas.michelly.idas = 40; f.pessoas.natalia.idas = 2;
  f.pessoas.natalia.afast = 'ferias';
  f = R.voltou(f, 'natalia');
  eq('com a fila já zerada entre as duas, ela entra na hora', f.pessoas.natalia.esperando, false);
  f.daVez = 'ialey';
  for (let i = 0; i < 9; i++) { f = R.revalidar(f); f = R.registrar(f, f.daVez, 'venda', 9000 + i); }
  const c = ['ialey', 'michelly', 'natalia'].map(k => R.conta(f.pessoas[k], 'idas'));
  eq('e a partir daí reveza normal', Math.max(...c) - Math.min(...c) <= 1, true);
}
{
  /* Ninguém para esperar: a fila está zerada por definição. */
  let e = base('idas');
  e.pessoas.michelly.presente = false; e.pessoas.ialey.presente = false;
  e.pessoas.natalia.idas = 7; e.pessoas.natalia.afast = 'folga';
  e = R.voltou(e, 'natalia');
  eq('sozinha na loja, ela entra na hora', e.pessoas.natalia.esperando, false);
  eq('e a fila dela recomeça do zero', R.conta(e.pessoas.natalia, 'idas'), 0);
}
{
  /* Duas voltando juntas entram juntas, quando a rodada fecha. */
  let e = base('idas');
  e.pessoas.ialey.idas = 10; e.pessoas.michelly.idas = 8; e.pessoas.natalia.idas = 8;
  e.pessoas.michelly.afast = 'atestado'; e.pessoas.natalia.afast = 'ferias';
  e = R.voltou(e, 'michelly'); e = R.voltou(e, 'natalia');
  eq('com uma só na fila, não há o que esperar',
     [e.pessoas.michelly.esperando, e.pessoas.natalia.esperando], [false, false]);
  eq('e as duas entram na marca de quem ficou',
     [R.conta(e.pessoas.michelly,'idas'), R.conta(e.pessoas.natalia,'idas'), R.conta(e.pessoas.ialey,'idas')], [10, 10, 10]);
}
{
  /* A fila zerando por venda, no meio do expediente. */
  let e = base('idas');
  e.pessoas.ialey.idas = 5; e.pessoas.michelly.idas = 6; e.pessoas.natalia.idas = 6;
  e.pessoas.ialey.ultimaEm = 9000; e.pessoas.michelly.ultimaEm = 8000;
  e.pessoas.natalia.ultimaEm = 100;            /* fora há dias: é a que está há mais tempo sem ir */
  e.pessoas.natalia.afast = 'folga';
  e = R.voltou(e, 'natalia');
  eq('ainda falta 1 para zerar', R.faltaParaZerar(e.pessoas, 'idas'), 1);
  eq('e ela espera', e.pessoas.natalia.esperando, true);
  e = R.registrar(e, 'ialey', 'venda', 9500);
  eq('essa venda fechou a rodada e ela entrou', e.pessoas.natalia.esperando, false);
  eq('a vez já é dela na rodada nova', e.daVez, 'natalia');
}
{
  /* Enquanto espera, ela não pode ser chamada nem por engano. */
  let e = base('idas');
  e.pessoas.ialey.idas = 2; e.pessoas.michelly.idas = 9; e.pessoas.natalia.idas = 0;
  e.pessoas.natalia.afast = 'ferias';
  e = R.voltou(e, 'natalia');
  e.daVez = 'natalia';                                  /* estado torto, de propósito */
  e = R.revalidar(e);
  eq('revalidar tira a vez de quem está esperando', e.daVez, 'ialey');
  eq('e ela não aparece na ordem da fila',
     R.ordemDistinta(e.pessoas, 'idas', e.daVez).map(x => x.email), ['ialey', 'michelly']);
}
{
  /* Por vendas o critério é o mesmo, com a outra contagem. */
  let e = base('vendas');
  e.pessoas.ialey.vendas = 4; e.pessoas.michelly.vendas = 4; e.pessoas.natalia.vendas = 1;
  e.pessoas.ialey.idas = 9; e.pessoas.michelly.idas = 9; e.pessoas.natalia.idas = 3;
  e.pessoas.natalia.afast = 'ferias';
  e = R.voltou(e, 'natalia');
  eq('fila por vendas já zerada: entra na hora', e.pessoas.natalia.esperando, false);
  eq('e nivela as duas contagens, para a troca de critério não a desenterrar',
     [R.conta(e.pessoas.natalia,'vendas'), R.conta(e.pessoas.natalia,'idas')], [4, 9]);
}

console.log('\n== ausência puxada da escala da equipe ==');
const HJ = (d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))(new Date());
const AS = (h,m)=>{ const d=new Date(); d.setHours(h,m||0,0,0); return d.getTime(); };
const AV = (o)=>Object.assign({id:'a1', chave:'natalia', tipo:'ferias', inicio:HJ, fim:HJ, horaIni:'', horaFim:''}, o);
{
  eq('aviso do dia todo está valendo', R.avisoValendo(AV({}), AS(10)), true);
  eq('aviso de outro dia não', R.avisoValendo(AV({inicio:'2020-01-01',fim:'2020-01-01'}), AS(10)), false);
  eq('antes da hora de sair, ela ainda está na loja', R.avisoValendo(AV({horaIni:'14:00'}), AS(13,30)), false);
  eq('depois da hora de sair, não está', R.avisoValendo(AV({horaIni:'14:00'}), AS(14,10)), true);
  eq('"até as 15h": às 14h ela está fora', R.avisoValendo(AV({horaFim:'15:00'}), AS(14)), true);
  eq('e às 15h em ponto ela já voltou', R.avisoValendo(AV({horaFim:'15:00'}), AS(15)), false);
  eq('dia inteiro é ausência longa', R.ausenciaLonga(AV({})), true);
  eq('vários dias também', R.ausenciaLonga(AV({fim:'2099-01-01'})), true);
  eq('umas horas do dia, não', R.ausenciaLonga(AV({horaIni:'14:00',horaFim:'16:00'})), false);
}
{
  /* férias na escala: sai da fila sozinha */
  let e = base('idas');
  /* a Ialey está 2 atrás: a fila NÃO está zerada, então a volta vai ter de esperar */
  e.pessoas.ialey.idas = 6; e.pessoas.michelly.idas = 8; e.pessoas.natalia.idas = 8;
  const r = R.sincronizarAusencias(e, [AV({tipo:'ferias', rotulo:'férias'})], AS(9));
  eq('o painel mexeu no estado', r.mudou, true);
  eq('ela entra como afastada', R.afastada(r.estado.pessoas.natalia), 'ferias');
  eq('e sai da fila', R.elegiveis(r.estado.pessoas), ['ialey','michelly']);
  eq('marcado como automático, para poder devolver depois',
     [r.estado.pessoas.natalia.auto.id, r.estado.pessoas.natalia.auto.campo], ['a1','afast']);
  eq('rodar de novo não muda nada', R.sincronizarAusencias(r.estado, [AV({})], AS(10)).mudou, false);

  /* acabaram as férias: some o aviso */
  const v = R.sincronizarAusencias(r.estado, [], AS(9));
  eq('sem aviso, ela volta', R.afastada(v.estado.pessoas.natalia), null);
  eq('mas esperando a fila zerar, como manda a regra', v.estado.pessoas.natalia.esperando, true);
  eq('e a marca de automático sai', v.estado.pessoas.natalia.auto, null);
}
{
  /* aviso de algumas horas: é como o almoço, não tira da fila de vez */
  let e = base('idas');
  const a = AV({id:'a2', horaIni:'14:00', horaFim:'16:00', tipo:'atestado'});
  const r = R.sincronizarAusencias(e, [a], AS(14,30));
  eq('às 14h30 ela não está na loja', r.estado.pessoas.natalia.presente, false);
  eq('e não foi marcada como afastada', R.afastada(r.estado.pessoas.natalia), null);
  eq('o painel guarda que foi ele quem tirou', r.estado.pessoas.natalia.auto.campo, 'presente');
  const v = R.sincronizarAusencias(r.estado, [a], AS(16,5));
  eq('às 16h ela volta sozinha', v.estado.pessoas.natalia.presente, true);
  eq('sem esperar fila nenhuma — foram duas horas', v.estado.pessoas.natalia.esperando, undefined);
}
{
  /* a mão manda: desfazer na tela não é desfeito pelo automático no minuto seguinte */
  let e = base('idas');
  const a = AV({id:'a3'});
  let r = R.sincronizarAusencias(e, [a], AS(9)).estado;
  r.pessoas.natalia.afast = null;                       /* a gestora desfez na tela */
  r.pessoas.natalia.auto = { id:'a3', campo:null };     /* e a tela anotou */
  const dep = R.sincronizarAusencias(r, [a], AS(10));
  eq('o automático não marca de novo', R.afastada(dep.estado.pessoas.natalia), null);
  eq('e nem se diz que mudou algo', dep.mudou, false);
}
{
  /* dois avisos ao mesmo tempo: férias ganha de "saio às 14h" */
  let e = base('idas');
  const curto = AV({id:'c', horaIni:'14:00', horaFim:'16:00', tipo:'atestado'});
  const longo = AV({id:'l', tipo:'ferias'});
  eq('o de dia inteiro vale', R.avisoAtivo([curto,longo],'natalia',AS(14,30)).id, 'l');
  const r = R.sincronizarAusencias(e, [curto,longo], AS(14,30));
  eq('e é ele que sai na tela', R.afastada(r.estado.pessoas.natalia), 'ferias');
}
{
  /* aviso de quem não é da equipe da porta não faz nada */
  let e = base('idas');
  const r = R.sincronizarAusencias(e, [AV({chave:'yuri'})], AS(9));
  eq('ninguém da vez foi tocado', r.mudou, false);
}
{
  /* a vez sai de quem a escala tirou */
  let e = base('idas');
  e.daVez = 'natalia';
  const r = R.sincronizarAusencias(e, [AV({})], AS(9));
  eq('a vez passa para quem está na loja', r.estado.daVez !== 'natalia', true);
}

console.log('\n== o caso da Michelly de férias em setembro ==');
{
  /* A regra, dita pela loja: ausência de um dia ou mais é como não participar daquele
     período. Enquanto ela está fora, a vez corre só entre as outras duas — e, o ponto
     que importa, NÃO acumula vez para ela ir quando voltar.

     Este bloco roda o mês inteiro para provar as duas coisas.                        */
  const ago31 = '2026-08-31', set30 = '2026-09-30';
  const em = (dia, h) => { const p = dia.split('-'); return new Date(+p[0], +p[1]-1, +p[2], h||10).getTime(); };
  const feriasDela = [{ id:'f1', chave:'michelly', tipo:'ferias', inicio:ago31, fim:set30, horaIni:'', horaFim:'' }];

  let e = base('idas');
  ['ialey','michelly','natalia'].forEach(k => { e.pessoas[k].idas = 10; e.pessoas[k].vendas = 4; });
  e.pessoas.michelly.ultimaEm = 500;
  e.daVez = 'ialey';

  /* 30 de agosto: ainda não começou, as três na fila */
  eq('antes do dia 31, ela ainda está na vez',
     R.sincronizarAusencias(e, feriasDela, em('2026-08-30')).mudou, false);

  /* 31 de agosto: entra de férias sozinha */
  e = R.sincronizarAusencias(e, feriasDela, em(ago31)).estado;
  eq('no dia 31 ela sai da vez sozinha', R.afastada(e.pessoas.michelly), 'ferias');
  eq('e a fila fica só entre a Ialey e a Natália', R.elegiveis(e.pessoas), ['ialey','natalia']);

  /* o mês inteiro de trabalho, com o painel sincronizando todo dia */
  const chamadas = {};
  for (let dia = 1; dia <= 30; dia++) {
    const hoje = '2026-09-' + String(dia).padStart(2,'0');
    e = R.sincronizarAusencias(e, feriasDela, em(hoje)).estado;
    for (let i = 0; i < 6; i++) {
      e = R.revalidar(e);
      chamadas[e.daVez] = (chamadas[e.daVez] || 0) + 1;
      e = R.registrar(e, e.daVez, i % 3 === 0 ? 'sem-venda' : 'venda', em(hoje, 9) + i * 60000);
    }
  }
  eq('durante o mês, a Michelly não foi chamada nenhuma vez', chamadas.michelly, undefined);
  eq('a vez correu entre as outras duas', [chamadas.ialey > 80, chamadas.natalia > 80], [true, true]);
  eq('e a contagem dela ficou exatamente onde parou',
     [e.pessoas.michelly.idas, e.pessoas.michelly.vendas], [10, 4]);

  /* 1º de outubro: as férias acabaram */
  e = R.sincronizarAusencias(e, feriasDela, em('2026-10-01')).estado;
  eq('acabaram as férias, ela volta', R.afastada(e.pessoas.michelly), null);

  /* a fila pode não estar zerada no instante da volta: ela espera */
  let voltas = 0;
  while (e.pessoas.michelly.esperando && voltas < 20) {
    e = R.revalidar(e); e = R.registrar(e, e.daVez, 'venda', em('2026-10-01', 9) + voltas * 60000); voltas++;
  }
  eq('entrou assim que a fila zerou, sem depender de ninguém marcar nada', e.pessoas.michelly.esperando, false);
  eq('e não sobrou vez acumulada para ela: entra emparelhada',
     ['ialey','michelly','natalia'].map(k => R.conta(e.pessoas[k],'idas'))
       .reduce((a,b)=>Math.max(a,b)) - ['ialey','michelly','natalia'].map(k => R.conta(e.pessoas[k],'idas'))
       .reduce((a,b)=>Math.min(a,b)), 0);

  /* o teste que responde à pergunta: ela monopoliza a porta na volta? */
  const outubro = {};
  for (let i = 0; i < 30; i++) {
    e = R.revalidar(e);
    outubro[e.daVez] = (outubro[e.daVez] || 0) + 1;
    e = R.registrar(e, e.daVez, 'venda', em('2026-10-02', 9) + i * 60000);
  }
  eq('nos 30 clientes seguintes, as três dividem igual',
     [outubro.ialey, outubro.michelly, outubro.natalia], [10, 10, 10]);
  eq('as 180 idas do mês em que ela ficou fora não viraram dívida',
     e.pessoas.michelly.idas - 10 <= 11, true);
}
{
  /* O contraste: ausência de horas ela repõe no mesmo dia, e isso é o certo. */
  let e = base('idas');
  ['ialey','michelly','natalia'].forEach(k => { e.pessoas[k].idas = 10; });
  const consulta = [{ id:'c1', chave:'michelly', tipo:'atestado',
                      inicio:'2026-09-10', fim:'2026-09-10', horaIni:'14:00', horaFim:'17:00' }];
  const em = (h,m) => new Date(2026, 8, 10, h, m||0).getTime();

  let r = R.sincronizarAusencias(e, consulta, em(14, 30));
  eq('às 14h30 ela está fora da loja', r.estado.pessoas.michelly.presente, false);
  eq('mas não é ausência de fila: não fica afastada', R.afastada(r.estado.pessoas.michelly), null);
  e = r.estado;
  for (let i = 0; i < 6; i++) { e = R.revalidar(e); e = R.registrar(e, e.daVez, 'venda', em(15) + i * 60000); }

  e = R.sincronizarAusencias(e, consulta, em(17, 5)).estado;
  eq('às 17h ela volta para a vez', e.pessoas.michelly.presente, true);
  eq('sem esperar rodada nenhuma', !!e.pessoas.michelly.esperando, false);
  const tarde = {};
  for (let i = 0; i < 6; i++) { e = R.revalidar(e); tarde[e.daVez] = (tarde[e.daVez]||0)+1;
    e = R.registrar(e, e.daVez, 'venda', em(17, 10) + i * 60000); }
  eq('e repõe as que perdeu, que é o combinado para ausência de horas', tarde.michelly >= 3, true);
}

console.log(`\nresultado final: ${ok} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
