# projetoIA

Repositório de códigos e ferramentas do **projeto de IA interna da Atualtech**.

O objetivo do projeto é transformar o conhecimento que hoje está espalhado
pelas caixas de e-mail e pelos documentos normativos (políticas, procedimentos)
dos setores numa **base de conhecimento vetorizada**.
Com ela, a IA interna pode responder com base em casos reais da empresa: o que
funcionou, o que falhou e como cada assunto foi tratado.

---

## Visão geral

```
 ┌───────────────────┐   ┌────────────────────────┐   ┌─────────────────────┐   ┌──────────────┐
 │ Caixas de e-mail  │──▶│ Triagem (skill Claude) │──▶│ Markdown por        │──▶│ Banco        │
 │ por setor (Gmail) │   │ classifica e etiqueta  │   │ conversa (pseudon.) │   │ vetorizado   │
 └───────────────────┘   └────────────────────────┘   └─────────────────────┘   └──────────────┘
         1. coleta             2. classificação             3. entrega              4. processamento
                               + etiquetas IA/…                                    (chunks + embeddings)
```

| etapa | responsável | status |
|---|---|---|
| 1. Redirecionar as caixas para uma caixa unificada por setor | TI | planejado |
| 2. Triagem e classificação dos e-mails | skill [`triagem-email-base-conhecimento`](skills/triagem-email-base-conhecimento/) | v1, em teste |
| 3. Entrega dos Markdowns padronizados | skill (saída) | v1 |
| Documentos normativos (PDF) → Markdown | skill [`conversao-pdf-base-conhecimento`](skills/conversao-pdf-base-conhecimento/) | v1, em teste |
| 4. Chunks, embeddings e indexação | equipe de processamento | a definir |

---

## Estrutura do repositório

```
projetoIA/
├── README.md                     ← você está aqui
├── CHANGELOG.md                  ← histórico de versões das skills
├── skills/
│   ├── triagem-email-base-conhecimento/
│   │   ├── SKILL.md              ← instruções que o Claude segue
│   │   └── README.md             ← documentação da skill para pessoas
│   └── conversao-pdf-base-conhecimento/
│       ├── SKILL.md
│       └── README.md
└── referencia/
    ├── codigos_setores.csv       ← os 52 códigos de setor (fonte única)
    └── estrutura_codificada.xlsx ← árvore organizacional com os códigos
```

---

## Skills

Uma **skill** é uma pasta com um `SKILL.md`: um conjunto de instruções que o
Claude segue para executar uma tarefa sempre do mesmo jeito, com as mesmas
regras e o mesmo formato de saída.

| skill | o que faz | versão |
|---|---|---|
| [**triagem-email-base-conhecimento**](skills/triagem-email-base-conhecimento/) | Tria a caixa de e-mail de um setor, classifica cada conversa (caso de sucesso, falha, informativo ou lixo), aplica etiquetas `IA/…` no Gmail e gera um Markdown pseudonimizado por conversa para a base vetorizada | v1.1 |
| [**conversao-pdf-base-conhecimento**](skills/conversao-pdf-base-conhecimento/) | Converte documento normativo em PDF (política, procedimento, instrução, manual) em um Markdown limpo, sem acento e pseudonimizado, mantendo toda regra, prazo e exceção, e registra inconsistências do original | v1 |

### Instalar uma skill

- **Claude (claude.ai / app):** compacte a pasta da skill (por exemplo,
  `skills/triagem-email-base-conhecimento`) em `.zip` e envie em
  *Configurações → Capacidades → Skills*.
- **Claude Code:** copie a pasta para `~/.claude/skills/` (uso pessoal) ou para
  `.claude/skills/` dentro de um projeto.

---

## Código dos setores

Toda a classificação usa um código único por setor, derivado da árvore
organizacional: **tronco** (empresa) → **galhos** (diretorias) → **ramos**
(departamentos) → **folhas** (setores).

Formato: **`<DD><NN>-<SETOR>`**

- `DD`: 2 primeiras letras da diretoria
- `NN`: nº do departamento, de 01 a 15 (numeração única na empresa)
- `SETOR`: nome do setor em maiúsculas, sem acento, com hífen no lugar dos espaços

| diretoria | código | departamentos |
|---|---|---|
| Administrativa | `AD` | 01 Administrativo · 02 Customer Service · 03 Gente e Gestão · 04 Jurídico · 05 Marketing · 06 Qualidade · 07 Tecnologia e Inovação |
| Comercial | `CO` | 08 Comercial · 09 Vendas |
| Financeira | `FI` | 10 Contabilidade · 11 Controladoria · 12 Financeiro · 13 Suprimentos |
| Operacional | `OP` | 14 Operações · 15 Torre de Operações |

Exemplos: `AD07-SUPORTE` · `FI12-CONTAS-A-PAGAR` · `OP15-MONITORAMENTO`

A lista completa está em [`referencia/codigos_setores.csv`](referencia/codigos_setores.csv).
Setor ou departamento novo: acrescente-o na planilha e no CSV, com o próximo
número, e registre a mudança no [`CHANGELOG.md`](CHANGELOG.md).

---

## Privacidade e LGPD

- **Nenhum conteúdo de e-mail nem documento convertido entra neste repositório.** O `.gitignore` bloqueia
  a pasta `saida/`, os relatórios e o mapa de pseudônimos.
- Na base vetorizada, as pessoas aparecem só como pseudônimos estáveis
  (`PES-xxxxxx`). CPF, telefone, endereço, dados bancários e senhas são sempre
  mascarados.
- A chave da pseudonimização (o texto secreto e o mapa de pseudônimos) fica com o
  responsável pelo projeto, com acesso restrito, e nunca vai para o GitHub.

---

## Como contribuir

1. Crie uma branch a partir da `main` (`skill/<nome>`, `fix/<assunto>`…).
2. Altere o `SKILL.md` ou os arquivos de referência.
3. Registre a mudança no [`CHANGELOG.md`](CHANGELOG.md).
4. Se o formato do Markdown de saída mudar, suba o `versao_schema` e avise a
   equipe de processamento.
5. Abra um pull request para revisão.
