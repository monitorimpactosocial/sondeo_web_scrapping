/* =============================================================================
 * SONDEO WEB SCRAPPING — PARACEL MONITOR DE OPINIÓN
 * Versión: 1.0.0 | Fecha: 2026-02-26
 * Backend completo para Google Apps Script
 * ============================================================================= */

// ─── CONFIGURACIÓN GLOBAL ────────────────────────────────────────────────────
var CFG = {
  SPREADSHEET_ID: '1vwlWjcqvrAjKbCuSyeCl4ql5U7LMRlV7NDLVJyhfKAE',
  SHEETS: {
    OPINION: 'PARACEL_OPINION',
    KEYWORDS: 'KEYWORDS',
    LOG: 'LOG',
    PARAMS: 'PARAMS',
    MEDIOS: 'MEDIOS_PY'
  },
  HEADERS: {
    OPINION: ['ID','Hash','FechaCaptura','FechaPublicacion','Keyword','Fuente',
              'Titulo','Link','LinkFinal','Dominio','MedioPY','GateOK','GateReason',
              'Sentimiento','SentimientoScore','Tema','Snippet','Activo'],
    KEYWORDS: ['Keyword','Activa'],
    LOG: ['Timestamp','Duracion_seg','Keywords_usadas','Total_fetch','Nuevas','Duplicadas',
          'GateOK_count','GateNO_count','Errores','Detalle'],
    PARAMS: ['Parametro','Valor','Descripcion'],
    MEDIOS: ['Dominio','Nombre','Pais','Tipo']
  },
  DEFAULT_KEYWORDS: [
    ['PARACEL Paraguay celulosa','SI'],
    ['PARACEL Concepción planta','SI'],
    ['Paracel pulp mill Paraguay','SI'],
    ['PARACEL eucalipto Paraguay','SI'],
    ['planta celulosa Concepción Paraguay','SI']
  ],
  DEFAULT_PARAMS: [
    ['GATE_ACTIVO','SI','Activar filtro de contexto Paraguay'],
    ['MAX_RESULTS_PER_KEYWORD','30','Máximo resultados por keyword'],
    ['SLEEP_MS_ENTRE_REQUESTS','1500','Pausa entre requests HTTP'],
    ['RESOLVER_TIMEOUT_MS','5000','Timeout resolución de URL'],
    ['RESOLVER_CACHE_HORAS','6','TTL cache de URLs resueltas'],
    ['EMAIL_REPORTE','','Email para reporte diario'],
    ['EMAIL_ACTIVO','NO','Activar envío de email diario'],
    ['SOLO_GATE_OK','NO','Mostrar solo menciones gate=SI'],
    ['SOLO_MEDIOS_PY','NO','Filtrar solo medios paraguayos']
  ],
  DEFAULT_MEDIOS: [
    ['abc.com.py','ABC Color','Paraguay','Diario'],
    ['ultimahora.com','Última Hora','Paraguay','Diario'],
    ['lanacion.com.py','La Nación','Paraguay','Diario'],
    ['hoy.com.py','Diario Hoy','Paraguay','Diario'],
    ['5dias.com.py','5 Días','Paraguay','Diario'],
    ['extra.com.py','Extra','Paraguay','Diario'],
    ['ip.gov.py','IP Paraguay','Paraguay','Agencia'],
    ['presidencia.gov.py','Presidencia','Paraguay','Gobierno'],
    ['mades.gov.py','MADES','Paraguay','Gobierno'],
    ['infobae.com','Infobae','Argentina','Diario'],
    ['efe.com','EFE','España','Agencia'],
    ['reuters.com','Reuters','Internacional','Agencia'],
    ['bloomberg.com','Bloomberg','Internacional','Agencia'],
    ['mongabay.com','Mongabay','Internacional','Ambiental']
  ]
};

// ─── ANCLAS Y LISTAS PARA GATE ───────────────────────────────────────────────
var GATE = {
  GEO_ANCHORS: ['paraguay','concepción','concepcion','asunción','asuncion',
    'chaco','san pedro','caaguazú','caaguazu','itapúa','itapua','alto paraná',
    'alto parana','central','amambay','canindeyú','canindeyu','presidente hayes',
    'boquerón','boqueron','misiones','ñeembucú','neembucu','guairá','guaira',
    'cordillera','paraguarí','paraguari','caazapá','caazapa','rio paraguay',
    'paraguayo','paraguaya','paraguayos','paraguayas','guaraní','guarani'],
  PLANT_ANCHORS: ['celulosa','planta','fábrica','fabrica','pulp','mill','eucalipto',
    'eucalyptus','forestal','forestación','forestacion','deforestación','deforestacion',
    'papel','paper','biomasa','biomass','pasteras','pastera','industrial','industria',
    'inversión','inversion','medioambiental','ambiental','impacto'],
  EXCLUSIONS: ['islas paracel','paracel islands','spratly','south china sea',
    'mar de china','mer de chine','hainan','vietnam','filipinas','philippines',
    'spratlys','paracelso','paracelsus','paracel logistics','paracel group']
};

// ─── LÉXICO DE SENTIMIENTO (Español) ─────────────────────────────────────────
var SENTIMENT = {
  POSITIVE: {
    'bueno':1,'buena':1,'positivo':1,'positiva':1,'excelente':1.5,'gran':0.8,
    'beneficio':1,'beneficios':1,'progreso':1,'avance':1,'desarrollo':1,
    'oportunidad':1,'oportunidades':1,'empleo':1.2,'empleos':1.2,'trabajo':0.8,
    'inversión':1,'crecimiento':1,'innovación':1,'mejora':0.8,'mejoras':0.8,
    'éxito':1.2,'logro':1,'aprobación':0.8,'apoyo':0.8,'favorable':1,
    'acuerdo':0.7,'compromiso':0.8,'sostenible':0.8,'sustentable':0.8,
    'prosperidad':1,'bienestar':1,'esperanza':0.7,'optimismo':1,
    'inauguración':0.8,'inaugurar':0.8,'impulso':0.8,'impulsar':0.8
  },
  NEGATIVE: {
    'malo':1,'mala':1,'negativo':1,'negativa':1,'problema':1,'problemas':1,
    'riesgo':0.8,'riesgos':0.8,'peligro':1,'contaminación':1.2,'contaminar':1,
    'deforestación':1.2,'destrucción':1.2,'daño':1,'daños':1,'conflicto':1,
    'protesta':1,'protestas':1,'rechazo':1,'oposición':1,'denuncia':1,
    'denuncias':1,'ilegal':1.2,'irregular':0.8,'violación':1.2,'amenaza':1,
    'desastre':1.5,'crisis':1,'corrupción':1.2,'fraude':1.2,'pérdida':0.8,
    'preocupación':0.7,'preocupante':0.8,'crítica':0.7,'críticas':0.7,
    'multa':1,'sanción':1,'prohibición':1,'cancelación':1,'demanda':0.8,
    'impacto negativo':1.2,'desplazamiento':1,'muerte':1.2,'enfermedad':1
  },
  NEGATORS: ['no','ni','sin','nunca','jamás','jamas','tampoco','ningún','ningun',
    'ninguna','ninguno','apenas','nada'],
  AMPLIFIERS: ['muy','mucho','bastante','extremadamente','sumamente','totalmente',
    'completamente','enormemente','gravemente','fuertemente','altamente']
};

// ─── TAXONOMÍA DE TEMAS ──────────────────────────────────────────────────────
var TOPICS_REGEX = {
  'Ambiental': /\b(ambiental|medioambient|contaminaci[oó]n|deforestaci[oó]n|ecolog[ií]|ecosistema|biodiversidad|eucalipt|forestal|forestaci[oó]n|agua|r[ií]o|humedal|residuo|emisi[oó]n|carbono|sustentab|sostenib|impacto ambiental|fauna|flora)\b/i,
  'Laboral': /\b(empleo|empleos|trabajo|trabajador|obrero|sindicat|salar|contrataci[oó]n|despido|laboral|mano de obra|capacitaci[oó]n|seguridad laboral|accidente laboral|huelga)\b/i,
  'Comunidad': /\b(comunidad|comunidades|poblaci[oó]n|vecin|habitant|desplazamiento|reasentamiento|consulta|participaci[oó]n|social|sociedad|ind[ií]gena|campesino|aldeano|local|lugare[ñn])\b/i,
  'Inversión': /\b(inversi[oó]n|inversiones|capital|financ|millones|d[oó]lares|presupuest|econom[ií]|negoci|mercado|exportaci[oó]n|producci[oó]n|rentab|ganancia|costo|gasto)\b/i,
  'Operación': /\b(operaci[oó]n|construcci[oó]n|infraestructura|planta|f[aá]brica|maquinaria|tecnolog[ií]|proces|producci[oó]n|capacidad|tonelada|inauguraci[oó]n|obra|logística|transporte)\b/i
};

// ─── UTILIDADES GENERALES ────────────────────────────────────────────────────

function getSpreadsheet_() {
  return SpreadsheetApp.openById(CFG.SPREADSHEET_ID);
}

function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1a237e')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getParam_(ss, key, fallback) {
  var sheet = ss.getSheetByName(CFG.SHEETS.PARAMS);
  if (!sheet) return fallback;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return fallback;
}

function generateId_() {
  return 'MEN-' + Utilities.formatDate(new Date(), 'America/Asuncion', 'yyyyMMddHHmmss')
    + '-' + Math.floor(Math.random() * 9000 + 1000);
}

function canonicalUrl_(url) {
  try {
    url = url.trim().toLowerCase();
    url = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    url = url.replace(/[#?].*$/, '').replace(/\/+$/, '');
    return url;
  } catch (e) { return url; }
}

function computeHash_(url) {
  var canon = canonicalUrl_(url);
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canon);
  return raw.map(function(b) {
    return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2);
  }).join('');
}

function extractDomain_(url) {
  try {
    var m = url.match(/^https?:\/\/([^\/]+)/i);
    if (m) return m[1].replace(/^www\./, '').toLowerCase();
  } catch (e) {}
  return '';
}

function sleepMs_(ms) { Utilities.sleep(ms); }

function safeString_(v) { return (v == null || v === undefined) ? '' : String(v).trim(); }

function nowISO_() {
  return Utilities.formatDate(new Date(), 'America/Asuncion', "yyyy-MM-dd'T'HH:mm:ss");
}

// ─── INICIALIZACIÓN DE HOJAS ─────────────────────────────────────────────────

function initAllSheets() {
  var ss = getSpreadsheet_();
  getOrCreateSheet_(ss, CFG.SHEETS.OPINION, CFG.HEADERS.OPINION);
  var kwSheet = getOrCreateSheet_(ss, CFG.SHEETS.KEYWORDS, CFG.HEADERS.KEYWORDS);
  getOrCreateSheet_(ss, CFG.SHEETS.LOG, CFG.HEADERS.LOG);
  var paramsSheet = getOrCreateSheet_(ss, CFG.SHEETS.PARAMS, CFG.HEADERS.PARAMS);
  var mediosSheet = getOrCreateSheet_(ss, CFG.SHEETS.MEDIOS, CFG.HEADERS.MEDIOS);

  // Seed defaults if empty
  if (kwSheet.getLastRow() < 2) {
    kwSheet.getRange(2, 1, CFG.DEFAULT_KEYWORDS.length, 2).setValues(CFG.DEFAULT_KEYWORDS);
  }
  if (paramsSheet.getLastRow() < 2) {
    paramsSheet.getRange(2, 1, CFG.DEFAULT_PARAMS.length, 3).setValues(CFG.DEFAULT_PARAMS);
  }
  if (mediosSheet.getLastRow() < 2) {
    mediosSheet.getRange(2, 1, CFG.DEFAULT_MEDIOS.length, 4).setValues(CFG.DEFAULT_MEDIOS);
  }
  Logger.log('initAllSheets: OK — todas las hojas creadas/verificadas');
}

// ─── RESOLUCIÓN DE URL ───────────────────────────────────────────────────────

function resolveUrl_(url) {
  if (!url) return { finalUrl: url, domain: '' };
  var cache = CacheService.getScriptCache();
  var cacheKey = 'url_' + computeHash_(url).substring(0, 40);
  var cached = cache.get(cacheKey);
  if (cached) {
    var obj = JSON.parse(cached);
    return obj;
  }
  var finalUrl = url;
  try {
    var resp = UrlFetchApp.fetch(url, {
      followRedirects: true,
      muteHttpExceptions: true,
      validateHttpsCertificates: false
    });
    finalUrl = resp.getResponseCode() < 400 ? resp.getHeaders()['Location'] || url : url;
    // UrlFetchApp follows redirects automatically, so the response URL is the final
    // We get the final URL from the response content URL if possible
    var content = resp.getContentText().substring(0, 2000);
    var ogUrl = content.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
    if (ogUrl && ogUrl[1]) finalUrl = ogUrl[1];
    else finalUrl = url; // UrlFetchApp already followed redirects
  } catch (e) {
    finalUrl = url;
  }
  var domain = extractDomain_(finalUrl);
  var result = { finalUrl: finalUrl, domain: domain };
  try {
    cache.put(cacheKey, JSON.stringify(result), 21600); // 6h
  } catch (e) {}
  return result;
}

// ─── CLASIFICACIÓN DE MEDIOS ─────────────────────────────────────────────────

function loadMediaCatalog_(ss) {
  var sheet = ss.getSheetByName(CFG.SHEETS.MEDIOS);
  if (!sheet || sheet.getLastRow() < 2) return {};
  var data = sheet.getDataRange().getValues();
  var catalog = {};
  for (var i = 1; i < data.length; i++) {
    catalog[String(data[i][0]).toLowerCase()] = String(data[i][1]);
  }
  return catalog;
}

function classifyMedia_(domain, catalog) {
  if (!domain) return '';
  domain = domain.toLowerCase();
  if (catalog[domain]) return catalog[domain];
  // Try partial match
  var keys = Object.keys(catalog);
  for (var i = 0; i < keys.length; i++) {
    if (domain.indexOf(keys[i]) >= 0 || keys[i].indexOf(domain) >= 0) {
      return catalog[keys[i]];
    }
  }
  return '';
}

// ─── GATE: FILTRO DE CONTEXTO PARAGUAY ───────────────────────────────────────

function applyParaguayGate_(text) {
  var result = { gateOK: 'NO', gateReason: 'unknown' };
  if (!text) { result.gateReason = 'no_text'; return result; }
  var lower = text.toLowerCase();

  // Step 1: Must mention "paracel"
  if (lower.indexOf('paracel') < 0) {
    result.gateReason = 'no_paracel';
    return result;
  }

  // Step 2: Check exclusions
  var hasPYAnchor = false;
  for (var g = 0; g < GATE.GEO_ANCHORS.length; g++) {
    if (lower.indexOf(GATE.GEO_ANCHORS[g]) >= 0) { hasPYAnchor = true; break; }
  }
  for (var e = 0; e < GATE.EXCLUSIONS.length; e++) {
    if (lower.indexOf(GATE.EXCLUSIONS[e]) >= 0) {
      if (!hasPYAnchor) {
        result.gateReason = 'excluded';
        return result;
      }
      // Has PY anchor override → continue
      break;
    }
  }

  // Step 3: Must have PY geographic anchor
  if (!hasPYAnchor) {
    result.gateReason = 'no_geo';
    return result;
  }

  // Step 4: Must have plant/industry anchor
  var hasPlant = false;
  for (var p = 0; p < GATE.PLANT_ANCHORS.length; p++) {
    if (lower.indexOf(GATE.PLANT_ANCHORS[p]) >= 0) { hasPlant = true; break; }
  }
  if (!hasPlant) {
    result.gateReason = 'no_plant';
    return result;
  }

  // All checks passed
  result.gateOK = 'SI';
  result.gateReason = 'ok';
  return result;
}

// ─── ANÁLISIS DE SENTIMIENTO ─────────────────────────────────────────────────

function analyzeSentiment_(text) {
  if (!text) return { label: 'Neutral', score: 0 };
  var lower = text.toLowerCase().replace(/[^\wáéíóúüñ\s]/g, ' ');
  var words = lower.split(/\s+/).filter(function(w) { return w.length > 1; });
  var score = 0;
  var negateNext = false;
  var amplifyNext = false;

  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (SENTIMENT.NEGATORS.indexOf(w) >= 0) { negateNext = true; continue; }
    if (SENTIMENT.AMPLIFIERS.indexOf(w) >= 0) { amplifyNext = true; continue; }

    var val = 0;
    if (SENTIMENT.POSITIVE[w]) val = SENTIMENT.POSITIVE[w];
    else if (SENTIMENT.NEGATIVE[w]) val = -SENTIMENT.NEGATIVE[w];

    // Check bigrams
    if (i < words.length - 1) {
      var bigram = w + ' ' + words[i + 1];
      if (SENTIMENT.POSITIVE[bigram]) val = SENTIMENT.POSITIVE[bigram];
      else if (SENTIMENT.NEGATIVE[bigram]) val = -SENTIMENT.NEGATIVE[bigram];
    }

    if (val !== 0) {
      if (negateNext) { val = -val * 0.75; negateNext = false; }
      if (amplifyNext) { val = val * 1.5; amplifyNext = false; }
      score += val;
    } else {
      negateNext = false;
      amplifyNext = false;
    }
  }

  var normalized = Math.max(-1, Math.min(1, score / Math.max(words.length * 0.1, 1)));
  var label = 'Neutral';
  if (normalized > 0.1) label = 'Positivo';
  else if (normalized < -0.1) label = 'Negativo';
  return { label: label, score: Math.round(normalized * 100) / 100 };
}

// ─── CLASIFICACIÓN DE TEMAS ──────────────────────────────────────────────────

function classifyTopics_(text) {
  if (!text) return '';
  var topics = [];
  var keys = Object.keys(TOPICS_REGEX);
  for (var i = 0; i < keys.length; i++) {
    if (TOPICS_REGEX[keys[i]].test(text)) topics.push(keys[i]);
  }
  return topics.join(', ');
}

// ─── INGESTA RSS: GOOGLE NEWS ────────────────────────────────────────────────

function fetchGoogleNewsRSS_(keyword, maxResults) {
  var items = [];
  try {
    var q = encodeURIComponent(keyword);
    var url = 'https://news.google.com/rss/search?q=' + q + '&hl=es-419&gl=PY&ceid=PY:es-419';
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) return items;
    var xml = XmlService.parse(resp.getContentText());
    var root = xml.getRootElement();
    var channel = root.getChild('channel');
    if (!channel) return items;
    var entries = channel.getChildren('item');
    var count = Math.min(entries.length, maxResults || 30);
    for (var i = 0; i < count; i++) {
      var entry = entries[i];
      var title = safeString_(entry.getChildText('title'));
      var link = safeString_(entry.getChildText('link'));
      var pubDate = safeString_(entry.getChildText('pubDate'));
      var desc = safeString_(entry.getChildText('description'));
      // Strip HTML tags from description
      desc = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      items.push({
        titulo: title,
        link: link,
        fechaPub: parseDateSafe_(pubDate),
        snippet: desc.substring(0, 300),
        fuente: 'GoogleNews',
        keyword: keyword
      });
    }
  } catch (e) {
    Logger.log('fetchGoogleNewsRSS_ error: ' + e.message);
  }
  return items;
}

// ─── INGESTA RSS: REDDIT ─────────────────────────────────────────────────────

function fetchRedditRSS_(keyword, maxResults) {
  var items = [];
  var subs = ['Paraguay', 'Latinoamerica', 'sustainability', 'environment'];
  for (var s = 0; s < subs.length; s++) {
    try {
      var q = encodeURIComponent(keyword);
      var url = 'https://www.reddit.com/r/' + subs[s] + '/search.json?q=' + q
        + '&restrict_sr=1&sort=new&limit=' + (maxResults || 10);
      var resp = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: { 'User-Agent': 'ParacelMonitor/1.0' }
      });
      if (resp.getResponseCode() !== 200) continue;
      var json = JSON.parse(resp.getContentText());
      var posts = (json.data && json.data.children) ? json.data.children : [];
      for (var i = 0; i < posts.length; i++) {
        var d = posts[i].data;
        if (!d) continue;
        items.push({
          titulo: safeString_(d.title),
          link: 'https://www.reddit.com' + safeString_(d.permalink),
          fechaPub: d.created_utc ? new Date(d.created_utc * 1000) : new Date(),
          snippet: safeString_(d.selftext).substring(0, 300),
          fuente: 'Reddit',
          keyword: keyword
        });
      }
      sleepMs_(1000);
    } catch (e) {
      Logger.log('fetchRedditRSS_ error (' + subs[s] + '): ' + e.message);
    }
  }
  return items;
}

function parseDateSafe_(str) {
  if (!str) return new Date();
  try {
    var d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch (e) { return new Date(); }
}

// ─── DEDUPLICACIÓN ───────────────────────────────────────────────────────────

function loadExistingHashes_(ss) {
  var sheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  if (!sheet || sheet.getLastRow() < 2) return {};
  var hashCol = CFG.HEADERS.OPINION.indexOf('Hash') + 1;
  var data = sheet.getRange(2, hashCol, sheet.getLastRow() - 1, 1).getValues();
  var hashes = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i][0]) hashes[data[i][0]] = true;
  }
  return hashes;
}

// ─── PIPELINE PRINCIPAL ──────────────────────────────────────────────────────

function runFullPipeline() {
  var startTime = new Date();
  var ss = getSpreadsheet_();
  var stats = { total: 0, nuevas: 0, duplicadas: 0, gateOK: 0, gateNO: 0, errores: [] };

  // Load config
  var gateActivo = getParam_(ss, 'GATE_ACTIVO', 'SI') === 'SI';
  var maxPerKw = parseInt(getParam_(ss, 'MAX_RESULTS_PER_KEYWORD', '30'), 10);
  var sleepMs = parseInt(getParam_(ss, 'SLEEP_MS_ENTRE_REQUESTS', '1500'), 10);

  // Load keywords
  var kwSheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  var keywords = [];
  if (kwSheet && kwSheet.getLastRow() > 1) {
    var kwData = kwSheet.getRange(2, 1, kwSheet.getLastRow() - 1, 2).getValues();
    for (var k = 0; k < kwData.length; k++) {
      if (String(kwData[k][1]).toUpperCase() === 'SI') keywords.push(String(kwData[k][0]));
    }
  }
  if (keywords.length === 0) {
    logExecution_(ss, startTime, keywords.join(', '), stats);
    return { status: 'warning', message: 'No hay keywords activas' };
  }

  // Load existing hashes and media catalog
  var existingHashes = loadExistingHashes_(ss);
  var mediaCatalog = loadMediaCatalog_(ss);
  var opinionSheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  var newRows = [];

  for (var ki = 0; ki < keywords.length; ki++) {
    var kw = keywords[ki];
    try {
      // Fetch from Google News
      var gnItems = fetchGoogleNewsRSS_(kw, maxPerKw);
      sleepMs_(sleepMs);
      // Fetch from Reddit
      var rdItems = fetchRedditRSS_(kw, 10);
      sleepMs_(sleepMs);

      var allItems = gnItems.concat(rdItems);
      stats.total += allItems.length;

      for (var j = 0; j < allItems.length; j++) {
        var item = allItems[j];
        try {
          var hash = computeHash_(item.link);
          if (existingHashes[hash]) { stats.duplicadas++; continue; }
          existingHashes[hash] = true;

          var fullText = item.titulo + ' ' + item.snippet;

          // Gate
          var gate = gateActivo ? applyParaguayGate_(fullText) : { gateOK: 'SI', gateReason: 'gate_disabled' };
          if (gate.gateOK === 'SI') stats.gateOK++; else stats.gateNO++;

          // Resolve URL
          var resolved = resolveUrl_(item.link);

          // Media
          var medioPY = classifyMedia_(resolved.domain, mediaCatalog);

          // Sentiment
          var sent = analyzeSentiment_(fullText);

          // Topics
          var topics = classifyTopics_(fullText);

          var row = [
            generateId_(),                    // ID
            hash,                             // Hash
            nowISO_(),                         // FechaCaptura
            Utilities.formatDate(item.fechaPub, 'America/Asuncion', "yyyy-MM-dd'T'HH:mm:ss"), // FechaPublicacion
            kw,                               // Keyword
            item.fuente,                      // Fuente
            item.titulo,                      // Titulo
            item.link,                        // Link
            resolved.finalUrl,                // LinkFinal
            resolved.domain,                  // Dominio
            medioPY,                          // MedioPY
            gate.gateOK,                      // GateOK
            gate.gateReason,                  // GateReason
            sent.label,                       // Sentimiento
            sent.score,                       // SentimientoScore
            topics,                           // Tema
            item.snippet,                     // Snippet
            'SI'                              // Activo
          ];
          newRows.push(row);
          stats.nuevas++;
        } catch (itemErr) {
          stats.errores.push('Item error: ' + itemErr.message);
        }
      }
    } catch (kwErr) {
      stats.errores.push('KW "' + kw + '": ' + kwErr.message);
    }
  }

  // Write new rows  
  if (newRows.length > 0) {
    opinionSheet.getRange(opinionSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
      .setValues(newRows);
  }

  logExecution_(ss, startTime, keywords.join(', '), stats);

  // Email report if active
  var emailActivo = getParam_(ss, 'EMAIL_ACTIVO', 'NO') === 'SI';
  var emailDest = getParam_(ss, 'EMAIL_REPORTE', '');
  if (emailActivo && emailDest && stats.nuevas > 0) {
    sendEmailReport_(emailDest, stats, newRows);
  }

  return { status: 'ok', nuevas: stats.nuevas, duplicadas: stats.duplicadas, total: stats.total };
}

// ─── LOGGING ─────────────────────────────────────────────────────────────────

function logExecution_(ss, startTime, kwUsed, stats) {
  var endTime = new Date();
  var durSec = Math.round((endTime - startTime) / 1000);
  var logSheet = ss.getSheetByName(CFG.SHEETS.LOG);
  if (!logSheet) return;
  logSheet.appendRow([
    nowISO_(),
    durSec,
    kwUsed,
    stats.total,
    stats.nuevas,
    stats.duplicadas,
    stats.gateOK,
    stats.gateNO,
    stats.errores.length,
    stats.errores.join(' | ').substring(0, 500)
  ]);
}

// ─── EMAIL ───────────────────────────────────────────────────────────────────

function sendEmailReport_(email, stats, newRows) {
  try {
    var tpl = HtmlService.createTemplateFromFile('ReporteEmail');
    tpl.stats = stats;
    tpl.rows = newRows.slice(0, 20); // Top 20
    tpl.fecha = nowISO_();
    var html = tpl.evaluate().getContent();
    MailApp.sendEmail({
      to: email,
      subject: '📊 Monitor PARACEL — ' + stats.nuevas + ' nuevas menciones — ' + nowISO_().substring(0, 10),
      htmlBody: html
    });
  } catch (e) {
    Logger.log('sendEmailReport_ error: ' + e.message);
  }
}

// ─── TRIGGERS ────────────────────────────────────────────────────────────────

function createDailyTrigger() {
  deleteTriggers();
  ScriptApp.newTrigger('scheduledRun')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  Logger.log('Trigger diario creado: scheduledRun a las 06:00');
}

function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'scheduledRun') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function scheduledRun() {
  runFullPipeline();
}

// ─── WEB APP ─────────────────────────────────────────────────────────────────

function doGet() {
  return HtmlService.createHtmlOutputFromFile('PaginaWeb')
    .setTitle('Monitor de Opinión — PARACEL')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function runManualSearch() {
  return runFullPipeline();
}

function getKeywords() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().map(function(r) {
    return { keyword: r[0], activa: r[1] };
  });
}

function toggleKeyword(keyword, activa) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === keyword) {
      sheet.getRange(i + 1, 2).setValue(activa ? 'SI' : 'NO');
      return true;
    }
  }
  return false;
}

function addKeyword(keyword) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet) return false;
  sheet.appendRow([keyword, 'SI']);
  return true;
}

function getLastExecution() {
  var ss = getSpreadsheet_();
  var logSheet = ss.getSheetByName(CFG.SHEETS.LOG);
  if (!logSheet || logSheet.getLastRow() < 2) return null;
  var lastRow = logSheet.getLastRow();
  var data = logSheet.getRange(lastRow, 1, 1, CFG.HEADERS.LOG.length).getValues()[0];
  return {
    timestamp: data[0],
    duracion: data[1],
    keywords: data[2],
    total: data[3],
    nuevas: data[4],
    duplicadas: data[5],
    gateOK: data[6],
    gateNO: data[7],
    errores: data[8]
  };
}

function getFilteredData(filters) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  if (!sheet || sheet.getLastRow() < 2) return { rows: [], total: 0 };

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, CFG.HEADERS.OPINION.length).getValues();
  var filtered = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var fechaPub = row[3]; // FechaPublicacion
    var fuente = String(row[5]);
    var titulo = String(row[6]);
    var dominio = String(row[9]);
    var medioPY = String(row[10]);
    var gateOK = String(row[11]);
    var sentimiento = String(row[13]);
    var tema = String(row[15]);
    var snippet = String(row[16]);

    // Filter: gateOnly
    if (filters.gateOnly && gateOK !== 'SI') continue;
    // Filter: soloMediosPY
    if (filters.soloMediosPY && !medioPY) continue;
    // Filter: fuente
    if (filters.fuente && fuente !== filters.fuente) continue;
    // Filter: medioPY
    if (filters.medioPY && medioPY !== filters.medioPY) continue;
    // Filter: sentimiento
    if (filters.sentimiento && sentimiento !== filters.sentimiento) continue;
    // Filter: tema
    if (filters.tema && tema.indexOf(filters.tema) < 0) continue;
    // Filter: date range
    if (filters.fechaDesde) {
      var fd = new Date(filters.fechaDesde);
      var rDate = new Date(fechaPub);
      if (rDate < fd) continue;
    }
    if (filters.fechaHasta) {
      var fh = new Date(filters.fechaHasta);
      fh.setHours(23, 59, 59);
      var rDate2 = new Date(fechaPub);
      if (rDate2 > fh) continue;
    }
    // Filter: free text
    if (filters.busqueda) {
      var search = filters.busqueda.toLowerCase();
      if (titulo.toLowerCase().indexOf(search) < 0 && snippet.toLowerCase().indexOf(search) < 0) continue;
    }

    filtered.push({
      id: row[0], hash: row[1], fechaCaptura: row[2], fechaPub: row[3],
      keyword: row[4], fuente: fuente, titulo: titulo, link: row[7],
      linkFinal: row[8], dominio: dominio, medioPY: medioPY,
      gateOK: gateOK, gateReason: row[12], sentimiento: sentimiento,
      sentimientoScore: row[14], tema: tema, snippet: snippet
    });
  }

  // Sort by date descending
  filtered.sort(function(a, b) {
    return new Date(b.fechaPub) - new Date(a.fechaPub);
  });

  return { rows: filtered, total: filtered.length };
}

function getDashboardStats(filters) {
  var result = getFilteredData(filters || {});
  var rows = result.rows;
  var stats = {
    total: rows.length,
    hoy: 0,
    positivas: 0,
    negativas: 0,
    neutrales: 0,
    porFuente: {},
    porMedioPY: {},
    porTema: {},
    porSentimiento: { 'Positivo': 0, 'Negativo': 0, 'Neutral': 0 },
    tendenciaDiaria: {},
    topMedioPY: ''
  };

  var hoyStr = Utilities.formatDate(new Date(), 'America/Asuncion', 'yyyy-MM-dd');

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    // Hoy
    var pubStr = String(r.fechaPub).substring(0, 10);
    if (pubStr === hoyStr) stats.hoy++;
    // Sentimiento
    stats.porSentimiento[r.sentimiento] = (stats.porSentimiento[r.sentimiento] || 0) + 1;
    if (r.sentimiento === 'Positivo') stats.positivas++;
    else if (r.sentimiento === 'Negativo') stats.negativas++;
    else stats.neutrales++;
    // Fuente
    stats.porFuente[r.fuente] = (stats.porFuente[r.fuente] || 0) + 1;
    // MedioPY
    if (r.medioPY) stats.porMedioPY[r.medioPY] = (stats.porMedioPY[r.medioPY] || 0) + 1;
    // Temas
    if (r.tema) {
      var ts = r.tema.split(', ');
      for (var t = 0; t < ts.length; t++) {
        stats.porTema[ts[t]] = (stats.porTema[ts[t]] || 0) + 1;
      }
    }
    // Tendencia diaria
    stats.tendenciaDiaria[pubStr] = (stats.tendenciaDiaria[pubStr] || 0) + 1;
  }

  // Top MedioPY
  var maxCount = 0;
  var keys = Object.keys(stats.porMedioPY);
  for (var m = 0; m < keys.length; m++) {
    if (stats.porMedioPY[keys[m]] > maxCount) {
      maxCount = stats.porMedioPY[keys[m]];
      stats.topMedioPY = keys[m];
    }
  }

  return stats;
}

function getFilterOptions() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  if (!sheet || sheet.getLastRow() < 2) return { fuentes: [], mediosPY: [], temas: [], sentimientos: [] };

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, CFG.HEADERS.OPINION.length).getValues();
  var fuentes = {}, medios = {}, temas = {}, sents = {};

  for (var i = 0; i < data.length; i++) {
    fuentes[String(data[i][5])] = true;
    if (data[i][10]) medios[String(data[i][10])] = true;
    sents[String(data[i][13])] = true;
    if (data[i][15]) {
      var ts = String(data[i][15]).split(', ');
      for (var t = 0; t < ts.length; t++) temas[ts[t]] = true;
    }
  }
  return {
    fuentes: Object.keys(fuentes).sort(),
    mediosPY: Object.keys(medios).sort(),
    temas: Object.keys(temas).sort(),
    sentimientos: Object.keys(sents).sort()
  };
}

// ─── SMOKE TEST ──────────────────────────────────────────────────────────────

function pingDashboard() {
  var result = { status: 'ok', sheetsOk: false, rssOk: false, sheetsExist: [], totalMentions: 0, timestamp: nowISO_() };
  try {
    var ss = getSpreadsheet_();
    var names = [CFG.SHEETS.OPINION, CFG.SHEETS.KEYWORDS, CFG.SHEETS.LOG, CFG.SHEETS.PARAMS, CFG.SHEETS.MEDIOS];
    for (var i = 0; i < names.length; i++) {
      if (ss.getSheetByName(names[i])) result.sheetsExist.push(names[i]);
    }
    result.sheetsOk = result.sheetsExist.length === names.length;
    var opSheet = ss.getSheetByName(CFG.SHEETS.OPINION);
    result.totalMentions = opSheet ? Math.max(0, opSheet.getLastRow() - 1) : 0;
  } catch (e) {
    result.status = 'error';
    result.sheetsError = e.message;
  }
  try {
    var testUrl = 'https://news.google.com/rss/search?q=test&hl=es-419&gl=PY&ceid=PY:es-419';
    var resp = UrlFetchApp.fetch(testUrl, { muteHttpExceptions: true });
    result.rssOk = resp.getResponseCode() === 200;
  } catch (e) {
    result.rssError = e.message;
  }
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
