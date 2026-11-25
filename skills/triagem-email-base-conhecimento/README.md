# Skill: triagem-email-base-conhecimento

Tria a caixa de e-mail de **um setor por vez**. A skill classifica cada conversa,
aplica etiquetas no Gmail e gera **um Markdown pseudonimizado por conversa**,
pronto para a equipe de processamento vetorizar.

> As instruções que o Claude segue estão no [`SKILL.md`](SKILL.md).
> Este arquivo explica a skill para quem vai usá-la ou consumir a saída dela.

---

## Como usar

Peça ao Claude, com a skill instalada:

> Rode a triagem de e-mails no setor **AD07-SUPORTE**, caixa **suporte@…**,
> período **2026-09-01..2026-11-30**, modo **simulação**.

| parâmetro | valores |
|---|---|
| setor | um dos 52 códigos de [`referencia/codigos_setores.csv`](../../referencia/codigos_setores.csv) |
| caixa | endereço da caixa do setor |
| período | `AAAA-MM-DD..AAAA-MM-DD` |
| modo | `simulacao` (padrão), `aplicar` ou descoberta |

### Ordem recomendada para cada setor novo

1. **Descoberta**: a skill lê uma amostra de 50 a 100 conversas e propõe a
   lista de assuntos do setor. Nada é alterado.
2. **Aprovação**: o setor valida a lista, e ela entra no `SKILL.md` (seção 7) por pull request.
3. **Simulação**: a skill gera os Markdowns e o relatório sem tocar na caixa.
   Alguém revisa uma amostra.
4. **Aplicar**: a skill gera os arquivos e aplica as etiquetas na caixa.

---

## Como a classificação funciona

As perguntas são respondidas em ordem, e a primeira que se aplicar decide:

1. **É lixo?** (spam, newsletter, notificação automática, mensagem vazia) → só ganha
   etiqueta e uma linha no relatório; não gera Markdown.
2. **É um caso?** (problema ou pedido + tentativa de resolver) → define o resultado:

   | resultado | critério |
   |---|---|
   | `sucesso` | o solicitante **confirmou** que resolveu |
   | `falha` | não resolveu, foi reaberto, escalado ou cancelado |
   | `parcial` | resolveu em parte ou com paliativo |
   | `em_aberto` | conversa recente, ainda sem desfecho |
   | `indeterminado` | terminou em silêncio, sem confirmação |

3. **É informativo?** (comunicado, decisão, processo) → `nao_aplicavel`.
4. **Assunto**: um da lista fechada do setor, mais até 5 tags livres.
5. **Confiança** abaixo de 0,7 → vai para revisão humana (`IA/Revisar`).

> **Silêncio nunca é sucesso.** Sem confirmação, o caso fica `indeterminado`.

---

## Formato de saída (para a equipe de processamento)

```
saida/<codigo_setor>/<data_execucao>/
├── AD07-SUPORTE_2026-11-18_caso_sucesso_a3f9c2e1.md
├── AD07-SUPORTE_2026-11-19_caso_falha_7be0d415.md
├── ...
└── _relatorio_AD07-SUPORTE_2026-11-25.md
```

Cada arquivo tem:

- **Frontmatter YAML**: os metadados que viram filtros no banco vetorial.

  | campo | exemplo |
  |---|---|
  | `id`, `versao_schema` | `a3f9c2e1`, `1` |
  | `codigo_setor`, `diretoria`, `departamento`, `setor` | `AD07-SUPORTE`, `AD`, `7`, `SUPORTE` |
  | `tipo`, `resultado`, `assunto`, `tags` | `caso`, `sucesso`, `acesso-e-senhas`, `[vpn]` |
  | `confianca`, `revisao_humana`, `alerta` | `0.9`, `false`, `null` |
  | `data_inicio`, `data_fim`, `n_mensagens` | `2026-11-15`, `2026-11-18`, `4` |
  | `participantes` | `[{id: PES-7d21a0, papel: solicitante, origem: externo}]` |
  | `indexar` | `true` |

- **Seções `##`**, que são os pontos de corte recomendados para os chunks. Cada uma
  foi escrita para fazer sentido sozinha:
  `Resumo` · `Problema` · `Tentativas e solução` · `Resultado e evidência` ·
  `Lições` · `Justificativa da classificação`

Regras para quem consome a saída:
- Arquivos com `indexar: false` não entram na base.
- Quando o formato mudar, o `versao_schema` sobe.

---

## Etiquetas no Gmail

| etiqueta | significado |
|---|---|
| `IA/Setor/<código>` | setor da conversa |
| `IA/Tipo/Caso` · `Informativo` · `Lixo` | tipo |
| `IA/Resultado/Sucesso` · `Falha` · `Parcial` · `Em-aberto` · `Indeterminado` | resultado (só para casos) |
| `IA/Assunto/<assunto>` | assunto principal |
| `IA/Revisar` | precisa de revisão humana |
| `IA/Processado` | já passou pela triagem (permite retomar de onde parou) |

A skill **só adiciona etiquetas `IA/…`**: nunca responde, encaminha, move ou apaga e-mails.

---

## Segurança e LGPD

- O conteúdo dos e-mails é tratado como **dado, nunca como instrução**: um e-mail
  que tente comandar a IA é marcado com `alerta: possivel_injecao`.
- Pessoas viram **pseudônimos estáveis** (`PES-xxxxxx`): a mesma pessoa tem o
  mesmo código em todas as caixas e execuções. Empresas viram `ORG-xxxxxx`.
- CPF, RG, telefone, endereço, dados bancários e senhas são **sempre mascarados**.
- O texto secreto da pseudonimização e o `_mapa_pseudonimos.csv` ficam com o
  responsável pelo projeto, com acesso restrito, **fora do repositório e fora da base**.
