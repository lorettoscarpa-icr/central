/* ===== A regra da vez, isolada =====
   Fica em função pura, sem tocar em tela nem em banco, porque é a parte sutil do
   painel e precisa ser testável. O index.html carrega este arquivo.

   As regras, como a loja opera:
   - a vez é de quem foi MENOS vezes, entre as que estão presentes e participando;
   - empate: vai quem está há mais tempo sem ir; persistindo, ordem alfabética;
   - a vez SÓ passa quando vende;
   - cliente que não comprou conta como ida à porta, mas a vez continua com ela;
   - troca não é cliente novo: não conta ida nem passa a vez.                        */

(function (raiz) {
  'use strict';

  /* Quem pode ser chamada agora. Ausente (almoço) e quem não participa ficam fora. */
  function elegiveis(pessoas) {
    return Object.keys(pessoas)
      .filter(function (e) { return pessoas[e].participa && pessoas[e].presente; });
  }

  /* A próxima da vez. criterio: 'idas' (cada ida à porta) ou 'vendas' (vez concluída).
     Devolve o e-mail, ou null se não há ninguém disponível. */
  function proximaDaVez(pessoas, criterio) {
    var aptas = elegiveis(pessoas);
    if (!aptas.length) return null;
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    aptas.sort(function (a, b) {
      var pa = pessoas[a], pb = pessoas[b];
      /* menos vezes primeiro: é o que faz quem voltou do almoço emparelhar sozinha */
      if ((pa[chave] || 0) !== (pb[chave] || 0)) return (pa[chave] || 0) - (pb[chave] || 0);
      /* empate: quem está há mais tempo sem ir. Nunca foi (0) vem antes de todas. */
      if ((pa.ultimaEm || 0) !== (pb.ultimaEm || 0)) return (pa.ultimaEm || 0) - (pb.ultimaEm || 0);
      return (pa.nome || '').localeCompare(pb.nome || '');
    });
    return aptas[0];
  }

  /* Aplica um desfecho e devolve o estado NOVO, sem alterar o que entrou.
     desfecho: 'venda' | 'sem-venda' | 'troca'                                       */
  function registrar(estado, email, desfecho, agora) {
    var novo = JSON.parse(JSON.stringify(estado));
    var p = novo.pessoas[email];
    if (!p) return novo;
    agora = agora || Date.now();

    if (desfecho === 'troca') {
      /* Troca não é cliente novo na porta: não conta ida e não move a fila.
         Existe como botão para a pessoa registrar que atendeu sem consumir a vez. */
      novo.daVez = email;
      novo.atualizadoEm = agora;
      return novo;
    }

    p.idas = (p.idas || 0) + 1;
    p.ultimaEm = agora;

    if (desfecho === 'venda') {
      p.vendas = (p.vendas || 0) + 1;
      novo.daVez = proximaDaVez(novo.pessoas, novo.criterio);   /* vendeu: passa */
    } else {
      novo.daVez = email;                                       /* não vendeu: continua */
    }
    novo.atualizadoEm = agora;
    return novo;
  }

  /* Marcar presença/ausência ou entrada/saída do revezamento pode deixar a vez com
     alguém que não está mais apta. Recalcula sem mexer em contador nenhum. */
  function revalidar(estado) {
    var novo = JSON.parse(JSON.stringify(estado));
    var p = novo.pessoas[novo.daVez];
    if (!novo.daVez || !p || !p.participa || !p.presente) {
      novo.daVez = proximaDaVez(novo.pessoas, novo.criterio);
    }
    return novo;
  }

  /* A fila inteira, na ordem em que serão chamadas. Não basta ordenar por contagem:
     a segunda da fila só é conhecida depois de supor que a primeira já foi. Então
     simula, uma vez de cada, sem tocar no estado real.
     Devolve lista de e-mails-chave, começando por quem está com a vez agora.       */
  function ordemDaFila(pessoas, criterio, daVez, quantas) {
    var copia = JSON.parse(JSON.stringify(pessoas));
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    var ordem = [], limite = quantas || elegiveis(pessoas).length;
    var atual = (daVez && copia[daVez] && copia[daVez].participa && copia[daVez].presente)
      ? daVez : proximaDaVez(copia, criterio);
    var relogio = Date.now();
    while (atual && ordem.length < limite) {
      ordem.push(atual);
      /* supõe que ela foi e vendeu, para descobrir quem viria depois */
      copia[atual][chave] = (copia[atual][chave] || 0) + 1;
      copia[atual].ultimaEm = ++relogio;
      atual = proximaDaVez(copia, criterio);
    }
    return ordem;
  }

  /* Taxa de conversão de uma pessoa: de cada 10 idas à porta, quantas viraram venda.
     Sem ida nenhuma devolve null — 0% seria mentira sobre quem ainda não atendeu.   */
  function conversao(p) {
    var idas = p.idas || 0;
    return idas ? Math.round(((p.vendas || 0) / idas) * 100) : null;
  }

  /* Quem está para trás e por quanto. Só olha quem participa e está presente: uma
     pessoa de folga aparecendo como "12 atrás" seria alarme falso todo dia.         */
  function desequilibrio(pessoas, criterio) {
    var aptas = elegiveis(pessoas);
    if (aptas.length < 2) return { diferenca: 0, atras: null, naFrente: null };
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    var conta = function (e) { return pessoas[e][chave] || 0; };
    var ordenadas = aptas.slice().sort(function (a, b) { return conta(a) - conta(b); });
    var atras = ordenadas[0], naFrente = ordenadas[ordenadas.length - 1];
    return { diferenca: conta(naFrente) - conta(atras), atras: atras, naFrente: naFrente };
  }

  /* Agrupa o histórico por dia, do mais recente para o mais antigo. Cada dia traz o
     total e a quebra por pessoa, que é o que responde "a Michelly ficou pra trás?"  */
  function resumoPorDia(historico) {
    var dias = {};
    (historico || []).forEach(function (h) {
      var d = new Date(h.quando);
      var dia = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (!dias[dia]) dias[dia] = { dia: dia, idas: 0, vendas: 0, trocas: 0, pessoas: {} };
      var reg = dias[dia];
      if (!reg.pessoas[h.nome]) reg.pessoas[h.nome] = { idas: 0, vendas: 0 };
      if (h.desfecho === 'troca') { reg.trocas++; return; }      /* troca não é ida à porta */
      reg.idas++; reg.pessoas[h.nome].idas++;
      if (h.desfecho === 'venda') { reg.vendas++; reg.pessoas[h.nome].vendas++; }
    });
    return Object.keys(dias).sort().reverse().map(function (d) { return dias[d]; });
  }

  var api = { proximaDaVez: proximaDaVez, registrar: registrar, revalidar: revalidar,
              elegiveis: elegiveis, ordemDaFila: ordemDaFila,
              conversao: conversao, desequilibrio: desequilibrio, resumoPorDia: resumoPorDia };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.VezRegra = api;
})(typeof window !== 'undefined' ? window : this);
