# Handoff: Cartão da Gestante (DoctorSuite App — módulo paciente)

## Visão geral
Módulo do app DoctorSuite voltado à gestante: substitui o cartão físico de pré-natal e funciona como hub de informações da gestação (idade gestacional, consultas, exames laboratoriais e de imagem, vacinas, plano de parto, sinais de alerta e maternidade de referência). Inclui também uma versão **PDF A4** imprimível com o mesmo conteúdo.

## Sobre os arquivos deste bundle
Os arquivos HTML/JSX deste pacote são **referências de design** — protótipos que comunicam look-and-feel e comportamento pretendidos. Eles **não são código de produção** e não devem ser colados como estão.

A tarefa é **recriar esses designs dentro do ambiente já existente do DoctorSuite** (React Native / React Web / Flutter — o stack usado no app móvel da paciente), utilizando os componentes, design tokens, ícones e padrões já estabelecidos no codebase. Onde o protótipo usa um componente cru (ex.: `Card` desenhado em CSS), troque pelo equivalente do design system do DoctorSuite.

## Fidelidade
**High-fidelity (hi-fi).** Cores, tipografia, espaçamentos, raios e estados estão definidos. O developer deve buscar paridade visual com os mocks, mas usando os primitives do DoctorSuite.

## Estrutura de telas (versão final, híbrida)

A versão a ser implementada é a **Versão Final** — primeira seção do canvas, identificada com ✦. Bottom nav com 5 itens: `Início · Pré-natal · Exames · Vacinas · Plano`. Sinais de alerta acessados por atalho na tela Início.

> **Importante (regra de UX):** o cabeçalho não tem mais tab strip — quem navega entre seções é a bottom nav. Não duplicar menus horizontais.

### Tela 01 — Início
**Arquivo de referência:** `variation-final.jsx → VF_Capa`
**Propósito:** Visão de cabeceira para a paciente. Glanceable, emocional, com os dados clínicos essenciais que antes ficavam só no cartão físico.

Layout (top → bottom):
1. **Header warm** sobre gradiente `linear-gradient(180deg, #fce7d3 0%, #fdf3e8 60%, #f6f7fb 100%)` — eyebrow `CARTÃO DA GESTANTE`, saudação `Olá, Ana` em Fraunces italic 30, avatar 44px, RiskBadge.
2. **Anel de IG** (`<ProgressRing size=196 stroke=12>`) — track translúcido, progresso `#e89976`, número grande Fraunces 50 + "d" em Inter Tight.
3. **Grid 2×2 de chips** — Tipo sanguíneo / Próxima consulta / Peso atual / DPP.
4. **Paridade** — card com 5 mini-tiles (G / P / A / P.N. / P.C.) sobre `#fde8d8`, valores em Inter Tight 16/800; texto descritivo abaixo (`G2P1A0 · 1 parto normal`).
5. **Medicamentos em uso** — lista `nome (dose) · frequência · desde · indicação`. Bullet em terracota.
6. **Comorbidades** — lista bullet. Quando vazia, mostrar "Sem comorbidades crônicas".
7. **Antecedentes** — grid 2 col: Obstétricos (linhas livres com ano/IG/RN) | Pessoais (bullets); Familiares como pills full-width abaixo.
8. **Intercorrências da gestação** — lista cronológica `IG | descrição`. Vazio → "Sem intercorrências registradas até o momento".
9. **Atalho de Sinais de alerta** — card vermelho-claro com ícone 🚨 + chevron, abre tela 06.

### Tela 02 — Pré-natal
**Arquivo de referência:** `variation-final.jsx → VF_PreNatal`
1. **Header VF warm** (sem tab strip)
2. **Card Peso (kg)** — valor grande, sub-blocos `Pré`, `Ganho`, `Esperado`, sparkline pêssego.
3. **Card Pressão arterial** — `120/78`, dual sparkline (sistólica `#b85d3f`, diastólica `#3a2336`).
4. **Card "Histórico de aferições"** — tabela Data | IG | Peso | PA | BCF, ordenada da mais recente para a mais antiga; IG em terracota.

### Tela 03 — Exames
**Arquivo de referência:** `variation-final.jsx → VF_Exames`
1. **Header VF warm**
2. **Laboratoriais** — agrupados por trimestre e por **sessão de coleta**. Cada sessão tem cabeçalho `data + IG (+ nota opcional)` e lista de itens. Um mesmo trimestre pode conter múltiplas sessões (ex.: T2 com hemograma inicial + controle de Hb 4 semanas depois). Cada item: `<StatusDot>` + nome + resultado.
3. **Itens com histórico de evolução** recebem badge `EVOLUÇÃO` em cápsula terracota e chevron `›` no fim da linha — toque abre a tela **03b · Detalhe do exame** (gráfico). Itens sem série temporal não são tocáveis.
4. **Ultrassonografias** — lista com tipo, IG, data, achado.
5. **Ecocardiografia fetal** — bloco separado (apenas a ecocardiografia fetal — não confundir com USG morfológica).

### Tela 03b — Detalhe do exame (gráfico de evolução)
**Arquivo de referência:** `variation-final.jsx → VF_LabDetail`
**Propósito:** quando a paciente toca em um exame com múltiplas medições no tempo (ex.: hemoglobina), abrir uma tela que mostra a evolução visual ao longo da gestação.

1. **Mini header warm** com botão voltar (`‹`), nome do exame em Fraunces italic 22, último valor (Inter Tight 24) e faixa de referência (`refMin – refMax unidade`).
2. **Card com gráfico de linha** SVG:
   - Faixa de referência sombreada em verde-claro (`rgba(16,185,129,0.10)`) com linhas tracejadas `rgba(16,185,129,0.5)` em `refMin` e `refMax`.
   - Linha terracota `#b85d3f` com `stroke-width: 2.5`, pontos brancos com borda terracota; pontos com `flag: 'attn'` ficam com borda âmbar `#f59e0b`.
   - Labels do eixo X: IG da coleta (`5s5d`, `21s5d`, etc.).
3. **Histórico** — lista cronológica reversa: `data + IG | (nota) | valor unidade`. Bullet âmbar quando `flag: 'attn'`, terracota nos demais.

Exames com `LAB_SERIES` definida no mock: hemograma (Hb), glicemia. No backend, qualquer exame com 2+ medições históricas no mesmo paciente deve ser elegível para esta tela.

### Tela 04 — Vacinas
**Arquivo de referência:** `variation-final.jsx → VF_Vacinas`
1. **Header VF warm**
2. **Título Fraunces italic** `Vacinas tomadas na gravidez` + subtítulo `N aplicações realizadas durante a gestação atual`.
3. **Lista de vacinas aplicadas na gestação** — cada item: caixa verde 36px com `✓`, nome + IG (Inter Tight terracota), data e nota descritiva. Vacinas atuais: dTpa, Influenza, COVID-19 (reforço).
4. **Imunizações pré-gestacionais** — bloco secundário com bullet cinza, esquemas confirmados antes da gestação (ex.: Hepatite B).
5. **Card warm informativo** — quando todas as recomendadas para a gestação foram aplicadas, mostrar `Todas as vacinas recomendadas para esta gestação foram aplicadas. ✓`. Caso contrário, listar as pendentes.

### Tela 05 — Plano de parto
**Arquivo de referência:** `variation-final.jsx → VF_Plano`
1. **Header VF warm**
2. **Plano de parto** — linhas `chave: valor` (Via, Analgesia, Acompanhante, Pós-nascimento, Aleitamento) + bloco "Notas" sobre fundo `#fef7f0`.
3. **Maternidade de referência** — card com nome, endereço, CTA "Ligar · {telefone}" (terracota) + "Rota".

### Tela 06 — Sinais de alerta
**Arquivo de referência:** `variation-a.jsx → VA_Alertas`
1. Header warm rose com Fraunces italic `Quando procurar a maternidade`
2. **SOS card** vermelho com ícone, nome da maternidade, distância, telefone e botão LIGAR branco.
3. **Lista "Procure imediatamente se"** — cards com ícone + título + detalhe para cada sinal de alerta.

### Header VF (compartilhado nas telas 02–05)
**Arquivo:** `variation-final.jsx → VF_Header`
- Gradiente terracota: `linear-gradient(135deg, #b85d3f 0%, #d97757 50%, #e89976 100%)`
- Halo radial branco translúcido no canto superior direito
- Avatar (iniciais) + nome em Fraunces italic 16 / Inter 11 (idade · sangue) + RiskBadge à direita
- Linha grande: IG (Inter Tight 800 / 40) à esquerda, DPP à direita + linha `3º trim · {paridadeText}`
- Barra de progresso branca sobre `rgba(255,255,255,0.22)` com ticks em 12s e 27s
- **Sem tab strip** — a navegação entre seções é a bottom nav.

### PDF A4 (versão imprimível)
**Arquivo:** `pdf-preview.jsx → PDFPreview`
A4 retrato (594×840 unidades de design). Toda informação da paciente em uma página. Renderizar via biblioteca de PDF do stack do DoctorSuite. O QR no rodapé deve embutir um deeplink autenticado para o cartão da paciente.

## Design tokens

### Cores warm (Versão Final)

| Token | Hex | Uso |
|---|---|---|
| `accent` | `#e89976` | Cor primária — anel de IG, sparkline peso |
| `accentDeep` | `#b85d3f` | Terracota — header, IG nas tabelas, CTA "Ligar", badge EVOLUÇÃO, linha do gráfico de evolução |
| `accentSoft` | `#fde8d8` | Botões secundários, fundos sutis, mini-tiles de paridade |
| `rose` | `#3a2336` | Fraunces (títulos humanos), sparkline diastólica |
| `cream` | `#fef7f0` | Bloco "Notas", fundos warm |
| `headerGradient` | `linear-gradient(135deg, #b85d3f 0%, #d97757 50%, #e89976 100%)` | Header VF (telas 02–05) |
| `coverGradient` | `linear-gradient(180deg, #fce7d3 0%, #fdf3e8 60%, #f6f7fb 100%)` | Header da Capa (tela 01) |

### Cores clínicas (sistema)

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#0f172a` | Texto principal |
| `slate` | `#475569` | Texto auxiliar |
| `slateLight` | `#94a3b8` | Texto desabilitado |
| `border` / `borderSoft` | `#e2e8f0` / `#eef2f7` | Bordas |
| `bg` | `#f6f7fb` | Background de tela |
| `ok` | `#10b981` / soft `#d1fae5` | Vacinas aplicadas, exames OK |
| `attn` | `#f59e0b` / soft `#fef3c7` | Atenção (Hb 11.4 g/dL → flag attn) |
| `warn` | `#ef4444` / soft `#fee2e2` | SOS, sinais de alerta |
| `info` | `#0ea5e9` | Informativo |

### Tipografia

| Família | Uso |
|---|---|
| **Inter** (400/500/600/700/800) | UI geral, body, rótulos |
| **Inter Tight** (600/700/800) | Números (IG, peso, PA, valores de exames, datas) |
| **Fraunces** (italic 500/600) | Saudação, títulos humanos, nome do exame na tela de detalhe |

## Comportamento

- **RiskBadge** — `baixo` (verde) / `habitual` (azul) / `alto` (vermelho). Calculado server-side.
- **Lab item tocável** — só se houver `series` com 2+ pontos. Affordance: badge `EVOLUÇÃO` + chevron.
- **Gráfico de evolução** — eixo Y dinâmico (10% de folga); X distribui pontos uniformemente; faixa de referência sempre desenhada.
- **CTA "Ligar"** — abre `tel:` direto.
- **CTA "Rota"** — abre Maps com endereço da maternidade.
- **Tabela de aferições** — ordenada da mais recente para a mais antiga.
- **Estados de exames** — `ok` / `attn` / `pend` / `info` / `warn` mapeados pelo backend.

## Modelo de dados esperado (referência)

Este módulo é **read-only para a paciente**. Shape esperado (sugestão; ajustar ao prontuário real):

- `pregnancy.current` — DUM, DPP, IG calculada server-side, trimestre, GPA `{ g, p, a, pn, pc }`, paridadeText.
- `pregnancy.visits[]` — `{ date, ig, weight, pa, au, bcf, edema, notes }`.
- `pregnancy.labs.byTrimester` — `{ T1, T2, T3 }`. Cada trimestre: `{ label, sessions: [{ date, ig, note?, items: [{ id, name, result, status, unit? }] }] }`. **Suportar múltiplas sessões por trimestre** (ex.: controle de anemia).
- `pregnancy.labs.series[examId]` — `{ name, unit, refMin, refMax, points: [{ date, ig, value, flag?, note? }] }` para exames com evolução.
- `pregnancy.imaging.usg[]` — ultrassonografias `{ kind, date, ig, finding }`.
- `pregnancy.imaging.ecoFetal[]` — ecocardiografia fetal (mesmo shape).
- `pregnancy.vaccines[]` — `{ name, status: 'done' | 'prev' | 'pending', date, ig, note }`. `done` = aplicada na gestação atual; `prev` = pré-gestacional.
- `pregnancy.medications[]` — `{ name, dose, freq, since, why }`.
- `pregnancy.comorbidades[]`, `pregnancy.intercorrencias[]` — strings ou `{ ig, desc }`.
- `pregnancy.history` — `{ obstetric: [{ kind, year, ig, baby, notes }], personal: [], family: [] }`.
- `pregnancy.birthPlan` — `{ preference, pain, companion, contact, feeding, notes }`.
- `pregnancy.alerts[]` — lista editorial de sinais de alerta.
- `patient.maternity` — `{ name, address, phone, distance }`.

## Integração no DoctorSuite — passo a passo sugerido

1. **Identificar o stack** do app paciente (React Native / Flutter / etc — confirmar). Toda implementação deve usar os componentes nativos desse stack.
2. **Criar branch** `feat/cartao-gestante`.
3. **Adicionar tokens warm** ao theme provider existente. Tokens clínicos provavelmente já existem.
4. **Carregar fonts**: Inter, Inter Tight, Fraunces.
5. **Implementar primitives** (`Card`, `Chip`, `RiskBadge`, `ProgressRing`, `Spark`, `StatusDot`, `SectionTitle`) usando equivalentes do design system. Ver `shared.jsx`.
6. **Implementar `<VF_Header>`** — header reutilizável das telas 02–05 (sem tab strip).
7. **Implementar telas** na ordem 01 (Início) → 02 (Pré-natal) → 03 (Exames) → **03b (Detalhe do exame, com gráfico SVG)** → 04 (Vacinas) → 05 (Plano) → 06 (Alertas).
8. **Bottom nav** com 5 itens. Roteamento padrão do app.
9. **Endpoint do PDF**: gerar server-side via lib do stack (Puppeteer, react-pdf, etc.) usando `pdf-preview.jsx` como referência. QR com deeplink autenticado.
10. **Permissionamento**: apenas a própria paciente vê seu cartão. Compartilhamento via QR/link gera token efêmero (24h).
11. **Acessibilidade**: alvos de toque ≥ 44px, contraste AA verificado nas cores warm sobre branco/cream.

## Arquivos neste pacote

- `Cartão Gestante.html` — entry point com canvas das variações
- `variation-final.jsx` — **versão a implementar** (`VF_Capa`, `VF_Header`, `VF_PreNatal`, `VF_Exames`, `VF_LabDetail`, `VF_Vacinas`, `VF_Plano`, `VF_NavWarm`)
- `variation-a.jsx` — Alertas (`VA_Alertas`) reaproveitado na versão final
- `variation-b.jsx` — versão original densa indigo (referência histórica)
- `pdf-preview.jsx` — referência visual para o PDF A4
- `shared.jsx` — primitives
- `data.jsx` — dados de exemplo (mock; não é o shape final do backend). `LABS` é a forma flat (compat); `LABS_GROUPED` é a forma com sessões usada por `VF_Exames`
- `ios-frame.jsx`, `android-frame.jsx`, `design-canvas.jsx` — chrome do canvas; ignorar na implementação

## Observações finais

- Os dados em `data.jsx` (Ana Paula, IG 31s 1d) são fictícios — apenas para preencher o mock visual.
- Em caso de dúvida sobre comportamento não documentado, abrir o `Cartão Gestante.html` no navegador — o protótipo é navegável.
