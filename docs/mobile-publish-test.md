# Publicação e testes do app mobile (contexto para agentes)

Este documento descreve **como o app `doctorsuite-app` é construído, testado e publicado**. É contexto
para agentes de código (Codex/Claude) — não é tutorial de usuário final. Config de **conteúdo/runtime**
(branding multi-clínica, features por paciente) fica em [`mobile-config.md`](./mobile-config.md); aqui é só
o pipeline de build/distribuição.

## Stack e identidade

- **Expo** (SDK `~54`) + **React Native** `0.81`, **expo-router** (typed routes), TypeScript/JS misto.
- Navegação em abas por papel: **paciente**, **secretária**, **médico** (`app/(...)/`).
- Repositório próprio (separado do backend web): `doctorsuite-app`, branch de trabalho **`main`**.
- **Backend/API:** todos os builds apontam para a **produção** — `services/api.js` resolve `API_BASE` de
  `expoConfig.extra.apiBaseUrl` (= `https://doctorsuite.app`), com fallback para a mesma URL. **Não há
  ambiente de staging separado no app**; dev e produção falam com o mesmo backend web.
- **Auth:** token em `expo-secure-store` (`ds_auth_token`); no Expo Web cai para `localStorage`.
- **EAS project:** owner `doctorsuite`, `projectId 5b2eba52-93ce-4064-a5e0-fa377ca6e56f`.
- **iOS:** bundle `app.doctorsuite.mobile`, deployment target 16.0, App Store Connect **appId `6781105529`**.
- **Android:** ícones/permissões (localização p/ ponto) configurados; **ainda sem perfil de submit** (Play
  Store não está no fluxo — publicação hoje é **iOS-first**).
- **Módulos nativos custom:** `modules/liquid-glass` (Liquid Glass via `expo-glass-effect`). Por causa disso,
  **não roda no Expo Go** — testes nativos exigem *dev client* ou build EAS.

## Ambientes = canais EAS (`eas.json`)

Três perfis de build, cada um amarrado a um **canal de EAS Update** de mesmo nome:

| Perfil | Distribuição | Canal | Uso |
|---|---|---|---|
| `development` | interna, `developmentClient: true`, iOS simulator | `development` | dev diário com Metro/dev client |
| `preview` | interna (`distribution: internal`) | `preview` | build instalável para testar em device real sem loja |
| `production` | loja, `autoIncrement: true` | `production` | build oficial p/ App Store / TestFlight |

- `cli.appVersionSource: "remote"` → **o EAS gerencia o build number remotamente** (não versionamos build
  number à mão); `production.autoIncrement` sobe o build a cada build de produção.
- `runtimeVersion.policy: "appVersion"` (app.json) → **OTA só se aplica a builds com a MESMA `version`** do
  `app.json` (hoje `1.0.0`). Mudou dependência nativa/SDK ou a `version` → precisa de **novo build** (OTA não
  cobre). Mudou só JS/assets dentro da mesma `version` → dá para enviar **OTA** (`eas update`).

## Como testamos

1. **Local (Metro):** `npm start` (`expo start`); `npm run ios` / `android` / `web`. Para features nativas
   (Liquid Glass, câmera, localização, notificações) use um **dev client** (perfil `development`), não Expo Go.
2. **Dev client build:** `eas build --profile development --platform ios|android` (iOS gera build de
   simulador; instala e conecta ao Metro).
3. **Preview (device real, sem loja):** `eas build --profile preview --platform ios|android` → distribuição
   **interna** (link/QR do EAS). É o canal para o dono/testadores validarem em aparelho antes de subir para a loja.
4. **TestFlight:** o build de `production` submetido ao App Store Connect fica disponível no **TestFlight**
   para teste antes de liberar para review público.

## Como publicamos (iOS)

1. `eas build --profile production --platform ios` (build number auto-incrementado; versão vem do `app.json`).
2. `eas submit --profile production --platform ios` → **EAS Submit** envia ao App Store Connect usando a
   **ASC API key** (definida em `eas.json > submit.production.ios`; o `.p8` fica em `credentials/`, **gitignored**).
3. Distribuição via **TestFlight** → envio para **App Review** da Apple → release.

## OTA (EAS Update)

- Correções **só de JS/assets** (mesma `version`/runtime) podem ir sem passar pela loja:
  `eas update --channel <development|preview|production> -m "mensagem"` (ou via branch mapeado ao canal).
- Endpoint de updates: `https://u.expo.dev/5b2eba52-93ce-4064-a5e0-fa377ca6e56f` (app.json `updates.url`).
- **Regra de ouro:** se tocou em módulo nativo, plugin de config, permissões ou subiu a `version`/SDK →
  **rebuild + resubmit**; caso contrário, **OTA** resolve.

## Credenciais e segredos

- `credentials/` (chave `.p8` da Apple) e `.env` são **gitignored** (repo privado no GitHub — ver commit
  `82c63f4`). **Nunca** commitar chaves. As credenciais de assinatura iOS/Android são geridas pelo EAS.

## Conta DEMO para App Review

- Existe uma **clínica isolada** com contas de **paciente** e **médico** e laudos fictícios, criada só para o
  **revisor da Apple** avaliar o app sem dados reais. As credenciais ficam fora deste repositório (não
  versionar senha); a clínica demo deve ser **limpa após a aprovação**.

## Gotchas para o agente

- **App aponta para produção** (`https://doctorsuite.app`) em qualquer perfil — cuidado ao testar fluxos que
  gravam dados; use as contas/clínica demo.
- **Sem Expo Go** (módulo nativo Liquid Glass) — precisa de dev client/build.
- **Versão da UI** vive no `app.json` (`expo.version`); o **build number** é remoto (EAS). Não confundir.
- **Android não está no fluxo de publicação** ainda (só iOS tem `submit`); para Play Store faltam
  `android.package`/service account + perfil de submit.
- Paridade de features com o web é intencional (prontuário, laudos, ponto, cartão da gestante); a fonte da
  verdade de conteúdo é a API (`/api/mobile-config` + endpoints), não mocks.
