# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

## [1.0.0] — 2026-02-26

### Agregado
- Ingesta RSS: Google News RSS y Reddit Atom feeds
- Gate semántico de contexto Paraguay (5 pasos: paracel → exclusiones → geo → planta → OK)
- Análisis de sentimiento léxico mejorado (negaciones, bigramas, español)
- Clasificación temática por regex (Ambiental, Laboral, Comunidad, Inversión, Operación)
- Resolución de URL final con cache (CacheService, TTL 6h)
- Catálogo de medios paraguayos (ABC Color, Última Hora, La Nación, etc.)
- Deduplicación por SHA-256 de URL canonicalizada
- Web App con dos pestañas: Búsqueda y Tablero
- Dashboard interactivo con Chart.js (tendencia diaria, sentimiento, fuentes, medios PY, temas)
- Filtros funcionales: fuente, medioPY, sentimiento, tema, fecha, texto libre, gate
- KPIs dinámicos: total menciones, menciones hoy, % positivas, top medio PY
- Automatización diaria con triggers de Apps Script
- Reporte por email HTML (ReporteEmail.html)
- Hoja LOG con bitácora de ejecución, errores y métricas
- Hoja PARAMS con parámetros operativos configurables
- Hoja KEYWORDS con palabras clave activas (SI/NO)
- Hoja MEDIOS_PY con catálogo editable de medios
- Función `pingDashboard()` como smoke test
- Documentación completa (README.md, DEPLOY.md)
