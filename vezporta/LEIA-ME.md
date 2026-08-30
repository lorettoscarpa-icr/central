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

## Os dois contadores

A tela mostra **idas à porta** e **vendas**. O botão do rodapé escolhe qual dos dois
governa a fila:

- **por idas** — todas vão à porta o mesmo número de vezes. Quem pega uma sequência
  ruim aparece à frente na contagem e demora a ser chamada de novo.
- **por vendas** — todas convertem o mesmo número de oportunidades. Azar não tira
  lugar na fila.

Comece por idas, teste uma semana e trave no que fizer mais sentido na prática.

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
