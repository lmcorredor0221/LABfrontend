# Frontend Lean Agent Builder

Frontend productivo del proyecto, construido con `Next.js 16`, `React 19`, `TypeScript` y `Tailwind CSS 4`.

## Setup local

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm.cmd run dev
```

App disponible en:

- `http://127.0.0.1:3200`

## Variables de entorno

Archivo base:

- `frontend/.env.local.example`

Valores por defecto:

```env
NEXT_PUBLIC_USE_API_PROXY=true
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_API_TIMEOUT_MS=10000
BACKEND_API_ORIGIN=http://127.0.0.1:8000
```

La ruta recomendada es mantener `NEXT_PUBLIC_USE_API_PROXY=true` para que el navegador hable con Next y Next proxyee hacia el backend.

`npm.cmd run dev` usa `webpack` por defecto. En esta base actual eso evita un fallo de `next dev` con Turbopack donde `/api/*` puede responder el `404` HTML de App Router en lugar del proxy JSON esperado.

## Comandos utiles

```powershell
npm.cmd run dev
npm.cmd run dev:turbo
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run start -- --hostname 127.0.0.1 --port 3113
```

## Cobertura actual

- `Boot`, `Login`, `Dashboard`
- journey por sesion: `Discover`, `Define`, `Design`, `Tools`, `Memory`, `Evaluate`, `Security`, `Build`, `Operate`
- workspaces top-level: `Agents`, `Templates`, `Evaluations`, `Monitoring`, `Library`, `Integrations`, `Settings`

## Validacion final

Para la validacion completa de producto usa el gate de Phase 7 desde la raiz del repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\tmp\run_phase9_release_gate.ps1
```
