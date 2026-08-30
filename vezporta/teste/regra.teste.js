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

console.log(`\nresultado: ${ok} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
