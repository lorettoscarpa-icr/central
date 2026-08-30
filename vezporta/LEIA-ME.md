# Vez na Porta

Revezamento do atendimento na porta, entre Ialey, Michelly e Natália.
Jhennifer fica na lista com o botão "fora" ligado — entra na vez só quando quiser.

## As regras

- A **vez** é de quem foi **menos vezes**, entre as que estão na loja e no revezamento.
- Empate: vai quem está **há mais tempo sem ir**. Persistindo, ordem alfabética.
- A vez **só passa quando vende**.
- Cliente que não comprou: conta como ida à porta, mas **a vez continua com ela**.
- **Troca** não é cliente novo: não conta ida e não passa a vez.
- Voltar do almoço **não tira a vez** de quem já está com ela — ela pode estar
  atendendo agora. Quem voltou emparelha nas próximas.

## Afastamento: férias, folga e atestado

Quatro estados diferentes, de propósito:

| | O que é | Quem marca |
|---|---|---|
| **ausente** | almoço, saída rápida — volta no mesmo dia | a própria |
| **férias / folga / atestado** | dias ou semanas fora | gestão |
| **fora do revezamento** | não participa da vez (a supervisora, por exemplo) | gestão |

Gestão aqui é **a diretoria e a supervisora** — as três contas de `GESTORES`. Os três
tipos de afastamento se comportam igual na fila; o tipo existe para a tela dizer o
motivo e o histórico registrar por que a pessoa saiu.

Afastamento não é "ausente por muito tempo". São dois motivos:

1. **Ninguém religa por engano.** "Ausente" na manhã seguinte parece esquecimento de
   ontem e alguém desmarca.
2. **A volta precisa de nivelamento.** Quem some duas semanas volta com dezenas de
   idas a menos, e a regra de "vai quem foi menos vezes" a chamaria seguidas vezes por
   dias, monopolizando a porta. Há um teste que prova: sem nivelar, ela pega 9 dos 10
   clientes seguintes.

Ao marcar "voltou ao trabalho", o painel calcula o atraso e **pergunta** se quer
nivelar a contagem pela média de quem ficou. Recusar é escolha legítima e deixa o
comportamento cru. Perguntar, e não fazer calado, é regra: é contador de gente.

O nivelamento usa a média de **quem ficou**, excluindo a própria pessoa da conta — se
incluísse, o resultado dependeria de a tela limpar a marca antes ou depois, e a mesma
chamada daria número diferente conforme a ordem.

O formato antigo (`ferias: true`, booleano) continua reconhecido, para não perder
estado de quem já estivesse marcada.

## Os dois contadores

A tela mostra **idas à porta** e **vendas**. O botão do rodapé escolhe qual dos dois
governa a fila:

- **por idas** — todas vão à porta o mesmo número de vezes. Quem pega uma sequência
  ruim aparece à frente na contagem e demora a ser chamada de novo.
- **por vendas** — todas convertem o mesmo número de oportunidades. Azar não tira
  lugar na fila.

Comece por idas, teste uma semana e trave no que fizer mais sentido na prática.

## A fila visível e as fotos

A tela mostra a ordem inteira, não só de quem é a vez: `AGORA Ialey › DEPOIS Natália ×2`.
Quem está atrás na contagem aparece com `×2` porque vai mesmo ser chamada duas vezes
seguidas até emparelhar — é o mecanismo funcionando, e mostrar assim evita a leitura
de que o mesmo nome apareceu repetido por engano.

A foto é o botão: tocar no rosto de alguém abre a câmera ou a galeria e troca a foto
dela. A imagem é cortada em quadrado pelo centro e reduzida a 128px no próprio
celular antes de subir — a câmera manda 3 MB e o documento de estado tem 1 MB no total.
Sem foto, aparece a inicial em dourado.

## As cinco melhorias

**1. Motivo da não-venda.** "Não vendeu" abre os seis motivos e grava o registro no
painel **Vendas Perdidas**, no mesmo formato que ele já usa — ninguém digita duas
vezes. Dá para pular: exigir motivo faria a vendedora deixar de marcar a vez, que é o
dado mais importante desta tela. A lista de motivos é cópia da constante `MOTIVOS` do
painel Vendas Perdidas; mudou lá, mude aqui.

**2. Taxa de conversão** por pessoa, na terceira coluna. Sem ida nenhuma mostra `—`,
não `0%`: quem ainda não atendeu não converteu mal, apenas não atendeu.

**3. Movimento da loja.** Cada atendimento registrado já conta como cliente que
entrou. O botão "+ entrou e saiu" cobre quem entrou e saiu sem atendimento. Está
escrito na tela que o número só vale se alguém marcar — cliente que ninguém registra
não aparece, e ler esse total como verdade absoluta seria erro.

**4. Resumo por dia, 7 e 30 dias**, com quebra por pessoa e conversão. Em 7 e 30 dias
mostra o acumulado, que é o que responde "a Michelly ficou pra trás?".

**5. Aviso de desequilíbrio.** Passando de 3 de diferença, aparece uma faixa dizendo
quem está atrás e quanto. Quem está ausente fica fora da conta — senão viraria alarme
falso todo dia de folga.

## Quem vê o quê

O chão de loja fica com a operação; métrica de desempenho é de gestão.

| | Vendedora | Gestão |
|---|---|---|
| A vez, a fila e as três ações | sim | sim |
| Idas e vendas de cada uma | sim | sim |
| Marcar-se ausente (almoço) | sim | sim |
| Desfazer o último e ver os registros | sim | sim |
| Conversão de cada uma | sim | sim |
| **Movimento da loja** | não | sim |
| **Resumo de 7 e 30 dias** | não | sim |
| **Tirar alguém do revezamento** | não | sim |
| **Trocar o critério da fila** | não | sim |

Gestão = diretoria e supervisora, a mesma régua do `podeCriar()` da Central.

**Isto esconde, não bloqueia.** As regras do Firestore deixam qualquer conta logada ler
`ls_vez` e `ls_vez_hist` — pelo console do navegador os números aparecem igual. Para
virar barreira de verdade seriam precisas duas mudanças: `ls_vez_hist` com regra por
e-mail de gestão, e o desfazer guardando o último registro dentro de `ls_vez/estado`,
já que hoje ele depende de ler o histórico.

A conversão é visível para todas por decisão do dono — e faz sentido: ela é
`vendas ÷ idas`, uma divisão dos dois números que já estavam à vista de qualquer jeito.

## Onde mora

Em `central/vezporta/`, dentro do repositório da Central, e não em repositório
próprio: a sessão que criou isto não tinha permissão para criar repositório novo.
Virando repo depois, muda só a `url` do painel em `central/index.html`.

Firestore: `ls_vez/estado` (estado ao vivo) e `ls_vez_hist` (histórico e desfazer).

## Testes

```bash
node teste/regra.teste.js     # 24 casos da regra da fila
```

A regra fica isolada em `regra.js`, sem tela nem banco, justamente para ser testável.
Há um caso que prova a convergência: partindo de 11/4/0 idas, quarenta vendas depois
a diferença entre as três cai para no máximo 1, sem ninguém corrigir na mão.
