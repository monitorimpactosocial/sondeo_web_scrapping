# 🔍 Sondeo Web Scrapping — Paracel Monitor de Opinión

**Sistema de monitoreo automatizado de menciones web sobre PARACEL (planta de celulosa, Paraguay).**

Recolecta, filtra, clasifica y visualiza menciones desde Google News RSS, Reddit y medios paraguayos. Incluye dashboard interactivo con filtros, gráficos y KPIs.

---

## ✨ Características

| Módulo | Descripción |
|--------|-------------|
| 📡 Ingesta RSS | Google News RSS + Reddit Atom (sin scraping frágil) |
| 🛡️ Gate Semántico | Filtra solo menciones reales de PARACEL Paraguay (5 pasos) |
| 📊 Sentimiento | Análisis léxico mejorado (negaciones, bigramas, español) |
| 🏷️ Temas | Clasificación automática: Ambiental, Laboral, Comunidad, Inversión, Operación |
| 🇵🇾 Medios PY | Clasificación de medios paraguayos (ABC Color, Última Hora, La Nación…) |
| 🔗 URL Resolver | Resolución de redirects con cache (6h TTL) |
| 🧹 Deduplicación | SHA-256 sobre URL canonicalizada |
| 📈 Dashboard | Web App con pestañas, filtros reales, Chart.js, KPIs |
| ⏰ Automatización | Trigger diario (Apps Script) |
| 📧 Email | Reporte diario HTML |

---

## 📁 Estructura del Repositorio

```
sondeo_web_scrapping/
├── README.md                 ← Este archivo
├── CHANGELOG.md              ← Historial de versiones
├── .gitignore                ← Archivos ignorados por git
├── src/
│   ├── Code.gs               ← Backend completo (Apps Script)
│   ├── PaginaWeb.html         ← Web App (Búsqueda + Tablero)
│   └── ReporteEmail.html      ← Plantilla email diario
└── docs/
    └── DEPLOY.md              ← Guía extendida de despliegue
```

---

## 🚀 Despliegue Rápido (5 pasos)

### Paso 1 — Preparar Google Sheets

1. Abrir el spreadsheet destino:  
   [Google Sheets](https://docs.google.com/spreadsheets/d/1vwlWjcqvrAjKbCuSyeCl4ql5U7LMRlV7NDLVJyhfKAE/edit)

2. No es necesario crear hojas manualmente — el sistema las crea automáticamente al ejecutar `initAllSheets()`.

### Paso 2 — Crear Proyecto Apps Script

1. Ir a [script.google.com](https://script.google.com) → **Nuevo Proyecto**
2. Renombrar a: `Sondeo Web Scrapping Paracel`
3. Borrar el contenido por defecto de `Code.gs`
4. Pegar el contenido completo de `src/Code.gs`
5. Crear archivo HTML: **Archivo → Nuevo → Archivo HTML** → nombrar `PaginaWeb` → pegar `src/PaginaWeb.html`
6. Crear archivo HTML: **Archivo → Nuevo → Archivo HTML** → nombrar `ReporteEmail` → pegar `src/ReporteEmail.html`
7. **Guardar** (Ctrl+S)

### Paso 3 — Inicializar Hojas

1. En el editor de Apps Script, seleccionar función `initAllSheets` en el dropdown
2. Click ▶ **Ejecutar**
3. Autorizar permisos (Spreadsheets, UrlFetch, Script Triggers, Mail)
4. Verificar en Google Sheets que se crearon las hojas: `PARACEL_OPINION`, `KEYWORDS`, `LOG`, `PARAMS`, `MEDIOS_PY`

### Paso 4 — Desplegar Web App

1. Click **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo (tu email)**
4. Quién tiene acceso: **Cualquier persona** (o restringir según necesidad)
5. Click **Implementar** → copiar la URL generada
6. Abrir la URL en el navegador → verificar que las dos pestañas funcionan

### Paso 5 — Activar Trigger Diario

1. En el editor, ejecutar la función `createDailyTrigger()`
2. Verificar en **Activadores** (ícono reloj) que aparece el trigger diario
3. Alternativamente, crear trigger manual: Editar → Activadores del proyecto actual → Agregar

---

## 🧪 Verificación

```javascript
// En el editor de Apps Script, ejecutar:
pingDashboard()
// Debe retornar: { status: "ok", sheetsOk: true, rssOk: true, ... }
```

### Checklist de Verificación

- [ ] `initAllSheets()` crea las 5 hojas con headers correctos
- [ ] `pingDashboard()` retorna `status: "ok"`
- [ ] Web App carga correctamente (ambas pestañas)
- [ ] "Ejecutar Búsqueda" trae menciones y las escribe en PARACEL_OPINION
- [ ] Gate filtra correctamente (Islas Paracel → GateOK=NO)
- [ ] Filtros del tablero funcionan (fuente, sentimiento, fecha, etc.)
- [ ] Gráficos se renderizan con datos reales
- [ ] Trigger diario aparece en la lista de activadores
- [ ] Hoja LOG registra cada ejecución

---

## ⚙️ Configuración

### Hoja KEYWORDS
| Keyword | Activa |
|---------|--------|
| PARACEL Paraguay celulosa | SI |
| PARACEL Concepción planta | SI |
| Paracel pulp mill Paraguay | SI |
| PARACEL eucalipto Paraguay | SI |
| planta celulosa Concepción | SI |

### Hoja PARAMS
| Parametro | Valor | Descripcion |
|-----------|-------|-------------|
| GATE_ACTIVO | SI | Activar filtro de contexto Paraguay |
| MAX_RESULTS_PER_KEYWORD | 30 | Máximo de resultados por keyword |
| SLEEP_MS_ENTRE_REQUESTS | 1500 | Pausa entre requests (anti rate-limit) |
| RESOLVER_TIMEOUT_MS | 5000 | Timeout para resolver URLs |
| RESOLVER_CACHE_HORAS | 6 | TTL de cache de resolución de URLs |
| EMAIL_REPORTE | (tu email) | Email para recibir reporte diario |
| EMAIL_ACTIVO | NO | Activar envío de email diario |
| SOLO_GATE_OK | NO | Mostrar solo menciones que pasan gate |
| SOLO_MEDIOS_PY | NO | Filtrar solo medios paraguayos |

---

## 📋 Consideraciones de Cuotas

| Recurso | Límite gratuito | Mitigación |
|---------|-----------------|------------|
| UrlFetch calls/día | 20,000 | Cache de URLs, sleep entre requests |
| Script runtime | 6 min/ejecución | Pipeline optimizado, límite de keywords |
| Spreadsheet writes | 10M cells/mes | Deduplicación, schema fijo |
| Triggers | 20/usuario | Un solo trigger diario |
| HTML Service | 500KB/página | Assets vía CDN (Chart.js) |

---

## 📄 Licencia

Proyecto interno — PARACEL S.A. — Todos los derechos reservados.

---

## 📞 Soporte

Para dudas o problemas, contactar al equipo de Monitoreo de Impacto Social.
