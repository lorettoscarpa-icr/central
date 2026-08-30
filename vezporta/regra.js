/* ===== A regra da vez, isolada =====
   Fica em função pura, sem tocar em tela nem em banco, porque é a parte sutil do
   painel e precisa ser testável. O index.html carrega este arquivo.

   As regras, como a loja opera:
   - a vez é de quem foi MENOS vezes, entre as que estão presentes e participando;
   - empate: vai quem está há mais tempo sem ir; persistindo, ordem alfabética;
   - a vez SÓ passa quando vende;
   - cliente que não comprou conta como ida à porta, mas a vez continua com ela;
   - troca não é cliente novo: não conta ida nem passa a vez;
   - quem volta de ausência NÃO entra no meio da rodada: espera a fila zerar.        */

(function (raiz) {
  'use strict';

  /* Afastamento: férias, folga ou atestado. É estado próprio, não "ausente por muito
     tempo", por dois motivos: some da fila de vez sem alguém religar por engano na
     manhã seguinte, e a volta exige nivelar a contagem — ver nivelar() abaixo.

     Os três se comportam igual na fila; o tipo existe para a tela dizer o motivo e
     para o histórico registrar por que a pessoa saiu.                              */
  var AFASTAMENTOS = { ferias: 'férias', folga: 'folga', atestado: 'atestado' };

  function afastada(p) {
    /* p.ferias é a forma antiga, booleana. Fica reconhecida para não perder estado
       de quem já estava marcada quando o tipo passou a existir. */
    return p.afast || (p.ferias ? 'ferias' : null);
  }

  /* Duas contagens diferentes moram no mesmo lugar, e confundir as duas já custou uma
     versão inteira desta regra:

     - idas e vendas são a VIDA da pessoa. Nunca são reescritas: é delas que sai a taxa
       de conversão, e mexer ali é apagar trabalho de alguém.
     - a contagem da FILA é o que ela fez desde que entrou na rodada atual. É essa que
       decide quem vai agora.

     base guarda a diferença: quando alguém volta de ausência e a fila zera, a base
     sobe até a marca das outras, e a contagem de fila dela nasce igual à delas — sem
     que uma única ida ou venda tenha sido apagada.                                   */
  function conta(p, chave) {
    var base = (p.base && p.base[chave]) || 0;
    return Math.max(0, (p[chave] || 0) - base);
  }

  /* Quem pode ser chamada agora. Ficam fora: quem não participa do revezamento, quem
     está ausente (almoço), quem está de ausência marcada, e quem voltou e ainda espera
     a fila zerar. */
  function apta(p) {
    return !!(p && p.participa && p.presente && !afastada(p) && !p.esperando);
  }
  function elegiveis(pessoas) {
    return Object.keys(pessoas).filter(function (e) { return apta(pessoas[e]); });
  }

  /* A fila zerou quando ninguém está mais devendo vez: todas as que estão na fila com
     a mesma contagem. É o instante em que uma rodada fecha e outra começa.

     Com uma pessoa só (ou nenhuma) na fila, não há o que emparelhar — está zerada.   */
  function filaZerada(pessoas, criterio) {
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    var ativas = elegiveis(pessoas);
    if (ativas.length < 2) return true;
    var c = ativas.map(function (e) { return conta(pessoas[e], chave); });
    return Math.max.apply(null, c) === Math.min.apply(null, c);
  }

  /* A marca em que a rodada fecha: a contagem de quem está na frente. É nela que quem
     estava esperando entra. */
  function nivelDaFila(pessoas, chave) {
    var ativas = elegiveis(pessoas);
    if (!ativas.length) return 0;
    return Math.max.apply(null, ativas.map(function (e) { return conta(pessoas[e], chave); }));
  }

  /* Quantas idas ainda faltam para a fila zerar. Serve para a tela dizer à pessoa que
     voltou quanto falta para ela entrar, em vez de deixá-la achando que foi esquecida. */
  function faltaParaZerar(pessoas, criterio) {
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    var ativas = elegiveis(pessoas);
    if (ativas.length < 2) return 0;
    var alvo = nivelDaFila(pessoas, chave);
    return ativas.reduce(function (t, e) { return t + (alvo - conta(pessoas[e], chave)); }, 0);
  }

  /* Marca que a pessoa voltou ao trabalho. Ela NÃO volta para a fila na hora: fica
     esperando a rodada atual fechar.

     Foi a regra que a loja pediu, e é mais justa do que o nivelamento por média que
     estava aqui antes: quem ficou não perde a vez acumulada — se a Ialey tem três vezes
     para ir, ela vai as três — e quem voltou não pega a porta inteira por dois dias
     para emparelhar. Quando ninguém deve mais vez, a fila recomeça com todo mundo.   */
  function voltou(estado, email) {
    var novo = JSON.parse(JSON.stringify(estado));
    var p = novo.pessoas[email];
    if (!p) return novo;
    p.afast = null;
    delete p.ferias;
    p.esperando = true;
    return liberar(novo);          /* se a fila já estiver zerada, entra agora mesmo */
  }

  /* Faz entrar quem estava esperando, se a fila zerou. Roda depois de cada registro e
     em toda revalidação — é o único lugar que mexe em 'base'.

     ultimaEm fica como estava, de propósito: ela é, de fato, quem está há mais tempo
     sem ir, e o desempate da casa é justamente esse. Então a rodada nova começa por
     ela.                                                                             */
  function liberar(estado) {
    var novo = estado;
    var esperando = Object.keys(novo.pessoas).filter(function (e) { return novo.pessoas[e].esperando; });
    if (!esperando.length) return novo;
    if (!filaZerada(novo.pessoas, novo.criterio)) return novo;
    var nIdas = nivelDaFila(novo.pessoas, 'idas');
    var nVendas = nivelDaFila(novo.pessoas, 'vendas');
    esperando.forEach(function (e) {
      var p = novo.pessoas[e];
      /* negativa de propósito: ela está ATRÁS, e a contagem de fila dela precisa SUBIR
         até a marca das outras. base = o que ela tem de verdade menos onde ela entra. */
      p.base = { idas: (p.idas || 0) - nIdas, vendas: (p.vendas || 0) - nVendas };
      p.esperando = false;
    });
    return novo;
  }

  /* A próxima da vez. criterio: 'idas' (cada ida à porta) ou 'vendas' (vez concluída).
     Devolve o e-mail, ou null se não há ninguém disponível. */
  function proximaDaVez(pessoas, criterio) {
    return ordenarAptas(pessoas, criterio)[0] || null;
  }

  /* Todas as aptas, da primeira à última a ser chamada se ninguém mais fosse à porta.
     Vive separado de proximaDaVez porque a ordem inteira também é usada como desempate
     de quem sobrou, lá em ordemDistinta. */
  function ordenarAptas(pessoas, criterio) {
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    return elegiveis(pessoas).sort(function (a, b) {
      var pa = pessoas[a], pb = pessoas[b];
      /* menos vezes primeiro: é o que faz quem voltou do almoço emparelhar sozinha */
      if (conta(pa, chave) !== conta(pb, chave)) return conta(pa, chave) - conta(pb, chave);
      /* empate: quem está há mais tempo sem ir. Nunca foi (0) vem antes de todas. */
      if ((pa.ultimaEm || 0) !== (pb.ultimaEm || 0)) return (pa.ultimaEm || 0) - (pb.ultimaEm || 0);
      return (pa.nome || '').localeCompare(pb.nome || '');
    });
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

    if (desfecho === 'venda') p.vendas = (p.vendas || 0) + 1;

    /* esta ida pode ter sido a que fechou a rodada: quem estava esperando entra ANTES
       de a próxima ser escolhida, senão ela perderia a primeira vez da rodada nova */
    novo = liberar(novo);

    novo.daVez = (desfecho === 'venda')
      ? proximaDaVez(novo.pessoas, novo.criterio)   /* vendeu: passa */
      : email;                                      /* não vendeu: continua com ela */
    novo.atualizadoEm = agora;
    return novo;
  }

  /* Marcar presença/ausência ou entrada/saída do revezamento pode deixar a vez com
     alguém que não está mais apta. Recalcula sem mexer em contador nenhum. */
  function revalidar(estado) {
    var novo = liberar(JSON.parse(JSON.stringify(estado)));
    if (!novo.daVez || !apta(novo.pessoas[novo.daVez])) {
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
    var atual = (daVez && apta(copia[daVez])) ? daVez : proximaDaVez(copia, criterio);
    var relogio = Date.now();
    while (atual && ordem.length < limite) {
      ordem.push(atual);
      /* supõe que ela foi e vendeu, para descobrir quem viria depois. Soma no total
         mesmo: a base não muda, então a contagem de fila anda junto. */
      copia[atual][chave] = (copia[atual][chave] || 0) + 1;
      copia[atual].ultimaEm = ++relogio;
      atual = proximaDaVez(copia, criterio);
    }
    return ordem;
  }

  /* A mesma ordem, mas com cada pessoa aparecendo UMA vez — é o que a tela mostra.

     ordemDaFila devolve a sequência crua de chamadas, e quem está atrás na contagem
     aparece várias vezes seguidas antes de a terceira entrar. Mostrar isso cru fazia
     a fila exibir duas pessoas quando são três, e a pergunta que elas fazem o dia
     inteiro é justamente "eu venho depois de quem?".

     Então roda a simulação até fechar UMA rodada — o instante em que a última das
     aptas é chamada pela primeira vez — e devolve [{email, vezes}] na ordem da
     primeira chamada. 'vezes' é quantas vezes a pessoa é chamada dentro dessa
     rodada: 2 significa "ela vai duas antes de a fila girar", que é o mecanismo de
     emparelhamento aparecendo, não defeito.                                        */
  function ordemDistinta(pessoas, criterio, daVez) {
    var aptas = elegiveis(pessoas);
    if (!aptas.length) return [];
    var chave = (criterio === 'vendas') ? 'vendas' : 'idas';
    var contas = aptas.map(function (e) { return conta(pessoas[e], chave); });
    /* teto de simulação: no pior caso a mais atrasada é chamada uma vez por unidade
       de diferença antes de a última entrar. Com folga, e limitado — isto roda a
       cada repintura de tela. */
    var folga = Math.max.apply(null, contas) - Math.min.apply(null, contas);
    var seq = ordemDaFila(pessoas, criterio, daVez, aptas.length * (folga + 2));

    var vistos = {}, ordem = [];
    for (var i = 0; i < seq.length; i++) {
      var e = seq[i];
      if (!vistos[e]) { vistos[e] = { email: e, vezes: 0 }; ordem.push(vistos[e]); }
      vistos[e].vezes++;
      if (ordem.length === aptas.length) break;   /* rodada fechada */
    }
    /* Rede de segurança: se o teto acabou antes de todas entrarem, ninguém some da
       tela — as que faltam vão para o fim, na ordem em que seriam chamadas. */
    ordenarAptas(pessoas, criterio).forEach(function (e) {
      if (!vistos[e]) ordem.push({ email: e, vezes: 1 });
    });
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
    var n = function (e) { return conta(pessoas[e], chave); };
    var ordenadas = aptas.slice().sort(function (a, b) { return n(a) - n(b); });
    var atras = ordenadas[0], naFrente = ordenadas[ordenadas.length - 1];
    return { diferenca: n(naFrente) - n(atras), atras: atras, naFrente: naFrente };
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
              elegiveis: elegiveis, ordemDaFila: ordemDaFila, ordemDistinta: ordemDistinta,
              conversao: conversao, desequilibrio: desequilibrio, resumoPorDia: resumoPorDia,
              conta: conta, voltou: voltou, liberar: liberar,
              filaZerada: filaZerada, faltaParaZerar: faltaParaZerar, nivelDaFila: nivelDaFila,
              afastada: afastada, AFASTAMENTOS: AFASTAMENTOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.VezRegra = api;
})(typeof window !== 'undefined' ? window : this);
