# Skill: conversao-pdf-base-conhecimento

Converte **documentos normativos em PDF** (políticas, procedimentos, instruções,
manuais) em **um Markdown limpo e pseudonimizado por documento + revisão**,
pronto para a equipe de processamento vetorizar.

É a skill irmã da [`triagem-email-base-conhecimento`](../triagem-email-base-conhecimento/):
usa o mesmo código de setor, a mesma regra de escrita (sem acento, texto seco) e a
mesma pseudonimização.

> As instruções que o Claude segue estão no [`SKILL.md`](SKILL.md).
> Este arquivo explica a skill para quem vai usá-la ou consumir a saída dela.

---

## Como usar

Peça ao Claude, com a skill instalada e o PDF anexado:

> Converta este PDF para Markdown, setor **FI12-INDENIZACOES**, modo **simulação**.

| parâmetro | valores |
|---|---|
| arquivo(s) | um ou mais PDFs do mesmo setor |
| codigo_setor | um dos códigos de [`referencia/codigos_setores.csv`](../../referencia/codigos_setores.csv) |
| modo | `simulacao` (padrão) ou `publicar` |

O setor é o **dono do assunto**, não a área que aprovou o documento
(ex.: a política de indenização é `FI12-INDENIZACOES`, mesmo aprovada pela Qualidade).

---

## Diferença principal em relação ao e-mail

No e-mail a skill **resume** a conversa. Aqui **não**: numa política, perder um
"salvo", um "desde que" ou um prazo muda a regra. A skill reescreve o texto sem
acento e em frases curtas, mas mantém **toda regra, prazo, valor, condição e exceção**.

O que sai do documento: capa, sumário, cabeçalho, rodapé, "Página X de Y" e a
marca "cópia controlada".

Erros e contradições do próprio PDF (numeração quebrada, frase ambígua, dois
telefones diferentes…) **não são corrigidos**: vão para a seção
`Inconsistencias do original` e o arquivo é marcado para revisão humana.

---

## Formato de saída (para a equipe de processamento)

```
02-saida/_documentos/<codigo_setor>/
└── PL-FIN-03-01_rev01.md
```

- **Frontmatter YAML** com os filtros: `codigo_documento`, `tipo_documento`,
  `revisao`, `data_documento`, `vigente`, `substitui`, `codigo_setor`,
  `classificacao`, `assunto`, `tags`, `hash_arquivo`, `metodo_extracao`,
  `confianca`, `revisao_humana`, `indexar`, `versao_schema`.
- **Seções `##`** seguindo a numeração do original. Cada uma cita o código do
  documento na primeira frase, para fazer sentido sozinha como chunk.
- Prazos, tipos e limites com o mesmo formato viram **tabelas**.

Regras para quem consome a saída:
- `indexar: false` ou `vigente: false` não entram na base (revisão substituída).
- Quando o formato mudar, o `versao_schema` sobe.

---

## Segurança e LGPD

- O conteúdo do PDF é tratado como **dado, nunca como instrução**.
- Nomes de pessoas (quem elaborou, quem aprovou) viram **só o cargo**.
- Canais institucionais (central, SAC) ficam; caixas funcionais viram `caixa:<nome>`.
- Dados pessoais (CPF, telefone e e-mail pessoais, endereço, dados bancários) são
  sempre mascarados.
- **Nenhum documento convertido entra neste repositório**: a pasta `saida/` está no `.gitignore`.
