# Mobile Config

O app carrega configuracoes de `/api/mobile-config` e usa defaults locais quando a rota ainda nao existe.
O payload pode vir direto ou dentro de `{ "config": ... }`.

## Backend

- `GET /api/mobile-config`: autenticado, retorna `{ "config": ... }` para a clinica do usuario.
- `PUT /api/mobile-config`: admin, salva overrides JSON em `clinic_settings.mobile_config`.
- O backend deriva defaults de `clinics` e de chaves como `doc_clinic_name`, `doc_logo_url`, `clinic_state`, `clinic_phone`, `chat_obstetric_enabled` e `chat_response_sla_text`.
- Overrides pontuais tambem podem ser salvos em chaves simples: `mobile_app_name`, `mobile_subtitle`, `mobile_logo_url`, `mobile_privacy_url`, `mobile_specialty`, `mobile_specialty_label`, `mobile_exams_mode`, `mobile_emergency_*`.
- O app sempre faz merge com defaults locais para manter compatibilidade enquanto novas clinicas/especialidades sao configuradas.

## Exemplo

```json
{
  "brand": {
    "appName": "Clinica Exemplo",
    "subtitle": "Seu cuidado em um so lugar",
    "logoUrl": "https://cdn.exemplo.com/logo.png",
    "privacyUrl": "https://exemplo.com/privacidade"
  },
  "tenant": {
    "clinicId": "clinic_123",
    "clinicName": "Clinica Exemplo",
    "specialty": "obstetrics",
    "specialtyLabel": "Obstetricia"
  },
  "patient": {
    "examsMode": "pregnancy",
    "features": {
      "appointments": true,
      "reports": true,
      "documents": true,
      "exams": true,
      "profile": true,
      "chat": true,
      "pregnancy": true,
      "vaccines": true,
      "birthPlan": true,
      "alerts": true
    },
    "navigation": {
      "home": "Inicio",
      "pregnancy": "Pre-natal",
      "chat": "Mensagens",
      "exams": "Exames",
      "profile": "Perfil"
    },
    "chat": {
      "responseSlaText": "Resposta em ate 24h em dias uteis.",
      "inactiveReason": "Converse com sua clinica para ativar o atendimento.",
      "doctorFallbackLabel": "Profissional responsavel"
    },
    "emergency": {
      "enabled": true,
      "title": "Em caso de emergencia",
      "pageTitle": "Quando procurar atendimento",
      "listTitle": "Procure imediatamente se",
      "carePlaceLabel": "maternidade",
      "primaryLabel": "SAMU",
      "primaryPhone": "192",
      "callToAction": "LIGAR",
      "hint": "Em caso de piora importante, procure atendimento imediatamente.",
      "signs": [
        { "icon": "!", "title": "Sangramento intenso", "detail": "Principalmente se vier com dor ou tontura." }
      ]
    }
  },
  "clinicalModules": {
    "pregnancy": {
      "enabled": "auto",
      "labels": {
        "cardTitle": "Cartao da Gestante",
        "gestationalAge": "Idade gestacional",
        "dueDate": "DPP",
        "parity": "Paridade",
        "complications": "Intercorrencias da gestacao",
        "alerts": "Sinais de alerta"
      }
    }
  },
  "locale": {
    "defaultCrmUf": "TO"
  }
}
```

## Regras

- `features` controla se um modulo aparece para o paciente.
- `examsMode: "pregnancy"` mostra a aba de exames apenas quando ha gestacao ativa.
- `examsMode: "general"` libera a aba de exames para fluxos nao gestacionais, mas exige uma tela/endpoint generico.
- `clinicalModules.pregnancy.enabled: "auto"` mostra o modulo quando o backend retorna gestacao ativa.
- Contatos e sinais de emergencia devem vir do tenant/especialidade; a tela nao deve depender de mocks.
