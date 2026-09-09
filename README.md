# Dashboard de Producción Científica - UNESUM

Este proyecto visualiza la producción científica institucional (artículos, libros y capítulos) de la UNESUM, con filtrado interactivo por carreras, docentes, tipos y métricas CACES.

## Estructura del Proyecto

- `Code.gs`: Backend optimizado en Google Apps Script con caché multinivel (chunks), enriquecimiento de datos de docentes y auto-detección de encabezados.
- `frontend/`: Aplicación frontend moderna construida con **Astro** y **Svelte 5** (runes, componentes desacoplados y carga diferida `LazySection`).
- `data.json`: Respaldo local de datos normalizados.

## Conexión con Hoja de Cálculo Real

El backend extrae la información directamente de la hoja de cálculo institucional de Google Sheets:
- **ID de la Hoja:** `1Juf-kboGLYMiuuJsipB6s2cKXFinx5kcv2_tKJtev_o` (configurado en `Code.gs`).
- **Pestañas leídas:** `REVISTAS`, `LIBROS`, `CAPITULOS`.

### Despliegue de Apps Script (Backend)

1. En Google Drive o desde tu hoja de cálculo, abre `Extensiones > Apps Script`.
2. Pega el código de `Code.gs`.
3. Verifica que `SPREADSHEET_ID` sea `'1Juf-kboGLYMiuuJsipB6s2cKXFinx5kcv2_tKJtev_o'` (o el ID de tu hoja).
4. Haz clic en **Implementar > Nueva implementación**.
5. Selecciona tipo **Aplicación web**:
   - **Ejecutar como:** `Yo` (tu cuenta)
   - **Quién tiene acceso:** `Cualquier usuario` (público)
6. Copia la URL de ejecución (`https://script.google.com/macros/s/.../exec`).
7. Configura la URL en `frontend/src/lib/config.js` o mediante la variable de entorno `PUBLIC_API_URL`.

## Desarrollo del Frontend

```bash
cd frontend
npm install
npm run dev
```

Para producción:
```bash
npm run build
```
Los archivos optimizados se generarán en `frontend/dist/`.
