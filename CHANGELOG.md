# Changelog

## infraestrutura

### 2026-11-25 · ambiente de equipe
- Planilha de controle com abas Setores, Taxonomia, Lotes, Revisoes, Decisoes e Log.
- Apps Script de auditoria: registra quem aprovou e quando; bloqueia aprovacao pelo proprio executor e com revisoes pendentes.
- Apps Script extrator: ID da conversa por Message-ID, pseudonimos com sal centralizado, limpeza e mascaramento antes da skill.

## triagem-email-base-conhecimento

### v1.1 · 2026-11-25
- Regra de escrita: tudo que a skill gera fica sem acento e sem cedilha (so ASCII).
- Texto seco: frases curtas, sem saudacao e sem cortesia; secao "Justificativa" com 1-2 linhas.
- SKILL.md reescrito no mesmo padrao: 36% menor (15,7 KB -> 10,0 KB), mesmas regras.
- Checklist ganhou a verificacao de caracteres nao-ASCII.
- Titulo do Markdown passa a usar `|` como separador: `# [CODIGO | tipo | resultado] Titulo`.

### v1 · 2026-11-25
- Primeira versão da skill.
- Árvore de decisão: lixo → caso → resultado → informativo → assunto → confiança.
- Formato de saída: um Markdown por conversa, com frontmatter YAML (`versao_schema: 1`).
- Código de setor `<DD><NN>-<SETOR>` com os 52 setores da estrutura organizacional.
- Etiquetas `IA/…` no Gmail; modos `simulacao`, `aplicar` e descoberta.
- Pseudonimização estável (`PES-xxxxxx`) e mascaramento de dados sensíveis.
- Taxonomias de assunto iniciais por área, a validar com cada setor.
