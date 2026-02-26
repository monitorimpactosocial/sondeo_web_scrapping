# Guía Extendida de Despliegue

## Requisitos Previos

- Cuenta Google con acceso al spreadsheet destino
- Permisos de Editor en el spreadsheet
- Navegador web moderno (Chrome recomendado)

## 1. Configuración del Spreadsheet

### 1.1 Verificar Acceso
Abrir: https://docs.google.com/spreadsheets/d/1vwlWjcqvrAjKbCuSyeCl4ql5U7LMRlV7NDLVJyhfKAE/edit

Confirmar que tienes rol de **Editor**.

### 1.2 Inicialización Automática
El sistema crea automáticamente las hojas necesarias al ejecutar `initAllSheets()`. No modifiques manualmente los headers.

**Hojas creadas:**
- `PARACEL_OPINION` — Tabla principal (18 columnas)
- `KEYWORDS` — Palabras clave con toggle SI/NO
- `LOG` — Bitácora de ejecución
- `PARAMS` — Configuración operativa
- `MEDIOS_PY` — Catálogo de medios paraguayos

## 2. Proyecto Apps Script

### 2.1 Crear Proyecto
1. Navegar a https://script.google.com
2. Click **Nuevo Proyecto**
3. Renombrar: "Sondeo Web Scrapping Paracel"

### 2.2 Copiar Archivos
**Code.gs:**
1. En el archivo `Código.gs` que aparece por defecto, borrar todo el contenido
2. Pegar el contenido completo de `src/Code.gs`

**PaginaWeb.html:**
1. Menú **Archivo → Nuevo → Archivo HTML**
2. Nombrar: `PaginaWeb` (sin extensión, Apps Script la agrega)
3. Borrar contenido por defecto
4. Pegar contenido de `src/PaginaWeb.html`

**ReporteEmail.html:**
1. Menú **Archivo → Nuevo → Archivo HTML**
2. Nombrar: `ReporteEmail`
3. Pegar contenido de `src/ReporteEmail.html`

### 2.3 Guardar y Autorizar
1. Ctrl+S para guardar
2. Seleccionar `initAllSheets` en el dropdown de funciones
3. Click ▶ Ejecutar
4. Aparecerá diálogo de autorización → **Revisar permisos**
5. Seleccionar tu cuenta Google
6. Click "Avanzado" → "Ir a Sondeo Web Scrapping Paracel (no seguro)"  
   *(esto es normal para scripts sin verificar)*
7. Click **Permitir**

**Permisos requeridos:**
- Ver y administrar hojas de cálculo de Google (Spreadsheets)
- Conectar a un servicio externo (UrlFetch)
- Gestionar activadores (Script Triggers)
- Enviar correos en tu nombre (Gmail) — solo si activas reportes por email

## 3. Despliegue Web App

### 3.1 Implementar
1. Click **Implementar → Nueva implementación**
2. Click ⚙️ junto a "Seleccionar tipo" → **Aplicación web**
3. Descripción: "Monitor de Opinión PARACEL v1.0"
4. **Ejecutar como:** Yo (tu email)
5. **Quién tiene acceso:** Cualquier persona (o "Cualquier persona con cuenta Google" para restringir)
6. Click **Implementar**
7. Copiar la **URL de la aplicación web**

### 3.2 Verificar
Abrir la URL en el navegador. Debe mostrar:
- Pestaña "Búsqueda" con botón "Ejecutar Búsqueda"
- Pestaña "Tablero" con filtros y gráficos (vacíos inicialmente)

### 3.3 Actualizar Deployment
Cuando modifiques el código:
1. **Implementar → Administrar implementaciones**
2. Click ✏️ en la implementación existente
3. Versión: **Nueva versión**
4. Click **Implementar**

## 4. Trigger Diario

### 4.1 Creación Automática
Ejecutar la función `createDailyTrigger()` desde el editor.

### 4.2 Creación Manual (alternativa)
1. En el editor, click ⏰ **Activadores** (barra izquierda)
2. Click **+ Agregar activador**
3. Función: `scheduledRun`
4. Implementación: Head
5. Fuente del evento: **Basado en el tiempo**
6. Tipo: **Temporizador por día**
7. Hora: **06:00 a 07:00** (o la hora preferida)
8. Click **Guardar**

### 4.3 Verificar
En la sección de Activadores, debe aparecer:
- `scheduledRun` — Basado en el tiempo — Diario

## 5. Primera Ejecución Manuel

1. En el editor, ejecutar `runManualSearch()`
2. Esperar ~1-3 minutos (depende de la cantidad de keywords)
3. Verificar en Google Sheets:
   - `PARACEL_OPINION`: filas con menciones
   - `LOG`: entrada con la ejecución

## 6. Smoke Test

```javascript
// Ejecutar en el editor:
pingDashboard()
// Ver resultado en Logs (Ver → Registros)
```

Resultado esperado:
```json
{
  "status": "ok",
  "sheetsOk": true,
  "rssOk": true,
  "sheetsExist": ["PARACEL_OPINION","KEYWORDS","LOG","PARAMS","MEDIOS_PY"],
  "totalMentions": 0,
  "timestamp": "2026-02-26T..."
}
```

## 7. Troubleshooting

| Problema | Solución |
|----------|----------|
| Error de permisos | Re-autorizar: ejecutar cualquier función → permitir accesos |
| Web App no carga | Verificar que esté desplegada y la URL sea correcta |
| No trae resultados | Verificar KEYWORDS tiene al menos una keyword activa |
| Muchos falsos positivos | Verificar que GATE_ACTIVO=SI en PARAMS |
| Error "Quota exceeded" | Reducir MAX_RESULTS_PER_KEYWORD en PARAMS |
| Trigger no ejecuta | Verificar en Activadores que no haya errores |
| Gráficos vacíos | Ejecutar búsqueda primero para tener datos |
