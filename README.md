# Dashboard de Producción Científica - UNESUM Educación 2026

Este proyecto visualiza la producción científica (artículos, libros y capítulos) de la carrera de Educación de la UNESUM.

## Estructura del Proyecto

- `Code.gs`: Script de Google Apps Script que actúa como backend, extrayendo datos de una hoja de cálculo de Google.
- `frontend/`: Aplicación frontend moderna construida con **Astro** y **Svelte 5**.
- `index.html`: Versión original (monolítica) del dashboard (ahora deprecada por la versión en `frontend/`).

## Requisitos

- Node.js
- Una hoja de cálculo de Google configurada con las columnas especificadas en `Code.gs`.

## Desarrollo del Frontend

```bash
cd frontend
npm install
npm run dev
```

## Despliegue

1. Desplegar `Code.gs` como una Web App en Google Apps Script.
2. Actualizar la constante `API_URL` en `frontend/src/components/Dashboard.svelte` con la URL de ejecución del script.
3. Construir el frontend:
   ```bash
   cd frontend
   npm run build
   ```
4. Los archivos estáticos se generarán en `frontend/dist/`.
