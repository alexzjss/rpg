# A Forja do Mestre — Reformulação total do RPG-Codex

**Data:** 2026-06-23
**Status:** Spec aprovada (aguardando revisão do usuário antes do plano)
**Direção escolhida:** Mistura A + C — "brasa disciplinada"

---

## 1. Contexto

O RPG-Codex é um organizador de mestre de RPG (React 19 + Vite + TypeScript) com 7 abas
(Combate, Jornada, Personagens, Habilidades, Itens, Selos, Extras) e dois climas visuais
(escuro-ardente ↔ pergaminho). A direção de arte "óleo épico-ardente + manuscrito iluminado"
já foi totalmente implementada num redesign anterior.

Os problemas reais hoje **não** são de identidade, e sim de **estrutura, peso e manutenção**:

- `App.tsx` é um monólito de **9.865 linhas / 631 KB**.
- `index.html` carrega **3.612 linhas de CSS** num único bloco, com regras duplicadas
  (ex.: duas `.mp-skill-title`) e hacks frágeis de override por substring
  (`[style*="rgba(22, 27, 38, 0.95)"]`) na Jornada.
- **Três sistemas de estilo** competem: Tailwind utilitário + objetos `style` inline gigantes + `mp-*`.
- Navbar horizontal com 7 abas em `overflow-x-auto` (scroll lateral em telas estreitas).
- **31 erros de `tsc`** tolerados como baseline.
- Movimento caro: `backdrop-filter: blur(28px)` + brasas contínuas em toda a tela.

O usuário usa o app em **desktop/notebook** (mouse + teclado) e deu licença para
**reinício radical se for claramente melhor**. Escolheu a mistura das direções
**A ("O Anel do Mestre")** e **C ("Forja Lúcida")**.

## 2. Conceito: "brasa disciplinada"

O app fica **calmo, escuro, nítido e rápido por padrão** (clareza de C). O calor e o espetáculo
ficam **concentrados nos momentos-assinatura** — o anel de navegação, a virada de clima e o
combate (alma de A). **Uma fonte de drama por vez**, com respiro no resto. A identidade ardente
permanece, mas passa a ter hierarquia: o medalhão de navegação é a "fornalha" da interface;
o resto respira.

Princípios:

- **Concentrar o drama**, não espalhá-lo. Brasa = acento de ação, não tapete de fundo.
- **Respiro e hierarquia** acima de densidade dramática.
- **Reaproveitar o que já existe** (TabSweep, `applyAtmosphere`, `atmosphereForTab`,
  `motionPref`, primitivos `components/ui/`, tokens em `utils/theme.ts`).
- **Incremental, nunca big-bang**: cada aba é redesenhada e extraída isoladamente; o app
  permanece funcional a cada commit.

## 3. O coração — "O Anel do Mestre" (navegação radial)

Substitui a navbar horizontal e o cabeçalho com marca d'água gigante.

### 3.1 Hub central — medalhão de duas faces (o toggle)
- Face de **brasa** = Combate · face de **pergaminho** = Jornada.
- Acionar (clique, `Espaço` ou `Q`) **gira o medalhão** e troca o clima do app inteiro,
  reaproveitando a transição-espetáculo existente (`TabSweep` + `applyAtmosphere`).
- O medalhão é o **único** elemento que sempre carrega calor pleno (a fornalha da UI).
- Estado atual visível na face exposta.

### 3.2 Anel — 5 abas-satélite
- Personagens, Habilidades, Itens, Selos, Extras orbitam o hub como **selos gravados em latão**.
- A aba ativa sobe ao topo / acende; inativas ficam quietas (latão escurecido).

### 3.3 Dois modos de invocação (a fusão A + C)
1. **Dock-joia persistente** — versão compacta do anel num canto, sempre visível, discreta,
   mostra onde você está e permite troca em 1 clique. (alma de A)
2. **Roda de comando** — segurar `Tab` (ou tecla dedicada configurável) faz o **anel inteiro
   surgir grande no cursor**; escolhe e solta. Gesto-assinatura, rápido no desktop. (gesto de C)

### 3.4 Teclado e acessibilidade
- `1–7` vão direto às abas; setas giram o anel; `Espaço`/`Q` no hub alterna Combate↔Jornada;
  `Esc` fecha a roda de comando.
- `role="tablist"`/`role="tab"`/`aria-selected`, foco visível, ordem de tab lógica.
- Tudo respeita `prefers-reduced-motion` e o toggle de movimento existente.

### 3.5 Geometria (referência inicial, ajustável na implementação)
- Hub central ~96–120 px; anel de satélites a ~140–170 px de raio; 5 itens distribuídos no arco
  superior (≈ −100° a +100°) para não cair atrás do dock.
- A roda de comando abre centralizada no cursor com os 7 destinos (hub + 5 satélites tratados
  como setores), animação de "leque" < 180 ms.

## 4. Sistema visual

- **Paleta:** escuro-base mais neutro e profundo (menos ruído de óleo). **Brasa (`--ember`,
  `#f97316`) como ÚNICO acento de ação**, usada com parcimônia. Latão/ouro para molduras,
  selos e o anel. `auraPurple` reservado a estados especiais. Pergaminho permanece como o
  **clima diegético exclusivo da Jornada** (a exceção que respira) — mas executado limpo,
  sem hacks de substring.
- **Tipografia:** Playfair Display / Cinzel **só** em títulos-momento (heróis de seção, o anel,
  combate). Escala Inter limpa e disciplinada para corpo e UI, com tamanhos/pesos consistentes
  (definir escala: ex. 12/14/16/20/28/40). Fim do "tudo dramático".
- **Espaço:** muito mais respiro; grid e espaçamento consistentes (escala de 4 px). Cards mais
  quietos — nenhum compete por atenção. Glaze/vinheta/brasas viram detalhe sutil de fundo,
  não camada dominante.
- **Profundidade tátil (de A):** molduras de latão e selos onde agregam (cabeçalhos de seção,
  o anel, momentos de combate), não em toda superfície.

## 5. Estrutura e código

### 5.1 Decomposição do `App.tsx` (pré-requisito, incremental)
Alvo de organização (nomes ajustáveis):

```
App.tsx                  → shell fino: estado global, qual aba/modo, providers, layout do anel
components/nav/
  MasterRing.tsx         → hub medalhão + anel de satélites + dock-joia
  CommandWheel.tsx       → roda de comando invocada por Tab
  useRadialNav.ts        → estado/teclado/posições do anel
tabs/
  CombatTab.tsx          → orquestra components/combat/* (já extraídos)
  JourneyTab.tsx         → ~1.700 linhas hoje inline no App
  CharactersTab.tsx
  AbilitiesTab.tsx       → (a aba "cards"/Habilidades)
  ItemsTab.tsx
  SealsTab.tsx
  ExtrasTab.tsx
```

Regra: extrair **uma aba por vez**, conforme ela é redesenhada; rodar testes e verificar no
preview a cada extração. Nunca mover tudo de uma vez.

### 5.2 CSS
- Separar o bloco de `index.html` por domínio (ex.: `styles/tokens.css`, `nav.css`,
  `combat.css`, `journey.css`, `primitives.css`) importados via Vite, **ou** manter em
  `index.html` mas claramente seccionado se a importação trouxer risco — decidir no plano.
- **Eliminar** regras duplicadas (consolidar as duas `.mp-skill-title`/`.mp-skill-header`).
- **Eliminar** os overrides por substring `[style*="…"]` da Jornada, substituindo por classes
  reais aplicadas no JSX da `JourneyTab`.

### 5.3 Unificar estilo
- Reduzir os 3 sistemas a 1 abordagem clara: **design tokens + classes do design system `mp-*`**,
  com Tailwind utilitário apenas para layout pontual. Eliminar objetos `style` inline gigantes
  conforme cada aba é tocada.

### 5.4 Qualidade
- Zerar os **31 erros de `tsc`** progressivamente (não introduzir novos; derrubar os antigos
  nas áreas tocadas).
- Manter a suíte de testes verde (hoje 35 testes) e adicionar testes para `useRadialNav`
  (teclado, troca de aba, toggle de clima).

## 6. Movimento e performance

- **Orçamento de movimento:** brasas, `backdrop-filter` pesado e animações contínuas só nos
  **momentos-assinatura** (anel, virada de clima, combate). Demais telas: transições leves.
- Respeitar o toggle de movimento e `prefers-reduced-motion` já existentes (`utils/motionPref.ts`,
  `animFx.prefersReducedMotion()`).
- Meta: reduzir o número de camadas com `blur` simultâneas fora do combate.

## 7. Faseamento de entrega

Cada fase é commitada, testada (`vitest`) e verificada no preview antes da próxima.

1. **Fase 1 — Fundação + Anel.** Novo sistema de tokens/escala/respiro; `MasterRing` +
   `CommandWheel` + `useRadialNav` funcionando e substituindo a navbar/cabeçalho.
   *(Maior impacto percebido; valida o conceito ao vivo.)*
2. **Fase 2 — Os dois modos.** Redesenhar **Combate** e **Jornada** com a nova gramática,
   extraindo `CombatTab`/`JourneyTab` e matando os hacks de CSS da Jornada.
3. **Fase 3 — Satélites.** Personagens, Habilidades, Itens, Selos, Extras: layout próprio,
   extração para arquivos, limpeza de inline/slate.

## 8. Critérios de sucesso

- Navegação por anel funcional no desktop: dock-joia + roda no `Tab`, toggle central de clima,
  `1–7` e setas, acessível (`role`/`aria`/foco).
- Navbar horizontal e marca d'água gigante removidas.
- `App.tsx` reduzido a um shell; cada aba em seu arquivo.
- Zero regras de CSS duplicadas e zero hacks `[style*="…"]`.
- Movimento pesado restrito aos momentos-assinatura; `prefers-reduced-motion` respeitado.
- Testes verdes; erros de `tsc` em queda (não subindo); sem regressão funcional.

## 9. Fora de escopo (YAGNI)

- Layout mobile/touch dedicado (foco é desktop; manter responsivo razoável, sem otimização
  touch do anel agora).
- Backend/persistência além do `localStorage` atual (`utils/database.ts`).
- Conteúdo de jogo novo (receitas, upgrades, personagens de exemplo).
- Internacionalização.

## 10. Riscos e mitigação

- **Anel radial é interação não-convencional** → manter sempre um caminho por teclado e o
  dock-joia clicável; nunca depender só do gesto da roda.
- **Decomposição de 9.865 linhas** → estritamente incremental, uma aba por vez, com testes e
  verificação no preview a cada passo; jamais um único commit gigante.
- **Regressão visual** → verificar cada fase no preview (porta de dev) antes de seguir;
  preservar o toggle de movimento como escape hatch.
