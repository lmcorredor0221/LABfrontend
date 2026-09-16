# Lean Agent Builder Frontend

Frontend Next.js del proyecto. La documentación central está en [../Docs/README.md](../Docs/README.md), especialmente [manual-tecnico.md](../Docs/manual-tecnico.md) y [manual-usuario.md](../Docs/manual-usuario.md).

## Setup

```powershell
npm install
Copy-Item .env.local.example .env.local
npm.cmd run dev
```

La aplicación queda en `http://127.0.0.1:3200`. El proxy recomendado usa `NEXT_PUBLIC_USE_API_PROXY=true`, `NEXT_PUBLIC_API_BASE_URL=/api` y `BACKEND_API_ORIGIN=http://127.0.0.1:8000`.

## Comandos

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
```
