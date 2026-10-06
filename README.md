# market-agent

Mini agente con LLM construido con [eve](https://eve.dev), el framework de agentes de Vercel.

## Qué hace

- **Cotizaciones**: última cotización intradía de empresas por símbolo bursátil (TwelveData).
- **Meteorología**: tiempo actual y pronóstico por ubicación (Open-Meteo, sin API key).
- **Archivos del proyecto**: listar, leer y escribir archivos locales con protecciones anti path-traversal (cada escritura requiere aprobación humana).

## Puesta en marcha

```bash
npm install
cp .env.example .env   # y rellena TWELVE_DATA_API_KEY y GROQ_API_KEY
eve dev
```

El TUI de desarrollo abre una sesión interactiva con el agente. Las tools viven en `agent/tools/`, la identidad y el tono en `agent/instructions.md` y el modelo en `agent/agent.ts`.

## Modelo

- En desarrollo local (`eve dev`) usa tu suscripción de ChatGPT (`chatgpt("gpt-6-luna")`).
- En producción (Vercel) usa Groq vía `GROQ_API_KEY` (modelo configurable con `GROQ_MODEL`).

## Despliegue

```bash
eve deploy
```

Antes de desplegar, define en Vercel (Settings → Environment Variables) `GROQ_API_KEY` y `TWELVE_DATA_API_KEY`.

En producción, sustituye `placeholderAuth()` en `agent/channels/eve.ts` por un proveedor de autenticación real.
