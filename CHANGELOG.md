# Changelog

## conversao-pdf-base-conhecimento

### v1 · 2026-11-26
- Primeira versao da skill: PDF normativo -> 1 Markdown por documento + revisao.
- Mesma regra de escrita da triagem de e-mail (sem acento, texto seco), mas sem resumir o conteudo normativo.
- Frontmatter `versao_schema: 1` com codigo_documento, revisao, vigente, substitui, hash_arquivo, metodo_extracao.
- Extracao por texto (pdftotext/pdfplumber) ou OCR (tesseract) para PDF escaneado.
- Secao "Inconsistencias do original": erros do PDF registrados sem corrigir o sentido + revisao humana.
- Pseudonimizacao: nome vira cargo; canal institucional fica; caixa funcional vira `caixa:<nome>`.
- Checklist confere ASCII, nomes, contagem de itens e se todo numero do PDF aparece no .md.
- Testada com a PL-FIN-03-01 (Politica de Indenizacao Interna, rev 01).

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
