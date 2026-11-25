# Changelog

## triagem-email-base-conhecimento

### v1 · 2026-11-25
- Primeira versão da skill.
- Árvore de decisão: lixo → caso → resultado → informativo → assunto → confiança.
- Formato de saída: um Markdown por conversa, com frontmatter YAML (`versao_schema: 1`).
- Código de setor `<DD><NN>-<SETOR>` com os 52 setores da estrutura organizacional.
- Etiquetas `IA/…` no Gmail; modos `simulacao`, `aplicar` e descoberta.
- Pseudonimização estável (`PES-xxxxxx`) e mascaramento de dados sensíveis.
- Taxonomias de assunto iniciais por área, a validar com cada setor.
