/* =============================================================================
 * SONDEO WEB SCRAPPING — PARACEL MONITOR DE OPINIÓN v2.0
 * Backend completo para Google Apps Script
 * Basado en análisis del proyecto de referencia sondeo_webscrappin_zai
 * ============================================================================= */

// ─── CONFIGURACIÓN GLOBAL ────────────────────────────────────────────────────
var CFG = {
  SPREADSHEET_ID: '1vwlWjcqvrAjKbCuSyeCl4ql5U7LMRlV7NDLVJyhfKAE',
  SHEETS: { OPINION:'PARACEL_OPINION', KEYWORDS:'KEYWORDS', LOG:'LOG', PARAMS:'PARAMS', MEDIOS:'MEDIOS_PY' },
  HEADERS: {
    OPINION: ['ID','Hash','FechaCaptura','FechaPublicacion','Keyword','Fuente',
      'Titulo','Link','LinkFinal','Dominio','MedioPY','MedioPais','MedioTipo',
      'GateOK','GateReason','RelevanceScore','Sentimiento','SentimientoScore',
      'Confidence','Tema','Categoria','Entities','Snippet','AlertSent','Activo'],
    KEYWORDS: ['Keyword','Activa','UsoCount','UltimoUso'],
    LOG: ['Timestamp','Estado','Duracion_seg','Keywords_usadas','Total_fetch',
      'Nuevas','Duplicadas','GateOK_count','GateNO_count','Errores','Detalle'],
    PARAMS: ['Parametro','Valor','Descripcion'],
    MEDIOS: ['Dominio','Nombre','Pais','Tipo','Confiabilidad','Activo']
  },
  DEFAULT_KEYWORDS: [
    ['"Paracel" Paraguay','SI',0,''],
    ['"Paracel" celulosa','SI',0,''],
    ['"Paracel" Concepción','SI',0,''],
    ['"Paracel" Zapag','SI',0,''],
    ['"Paracel" Heinzel','SI',0,''],
    ['"Paracel" forestal','SI',0,''],
    ['"Paracel" eucalipto','SI',0,''],
    ['"Paracel" inversión','SI',0,'']
  ],
  DEFAULT_PARAMS: [
    ['GATE_ACTIVO','SI','Activar filtro de contexto Paraguay'],
    ['MAX_RESULTS_PER_KEYWORD','30','Máximo resultados por keyword'],
    ['SLEEP_MS_ENTRE_REQUESTS','1500','Pausa entre requests HTTP (ms)'],
    ['RESOLVER_TIMEOUT_MS','5000','Timeout resolución de URL (ms)'],
    ['RESOLVER_CACHE_HORAS','6','TTL cache de URLs resueltas'],
    ['EMAIL_REPORTE','','Email para reporte diario'],
    ['EMAIL_ACTIVO','NO','Activar envío de email diario'],
    ['SOLO_GATE_OK','NO','Mostrar solo menciones gate=SI'],
    ['SOLO_MEDIOS_PY','NO','Filtrar solo medios paraguayos'],
    ['ALERT_SENTIMENT_THRESHOLD','-0.5','Score de sentimiento para alerta negativa'],
    ['ALERT_VOLUME_THRESHOLD','10','Menciones/día para alerta de volumen']
  ],
  DEFAULT_MEDIOS: [
    ['abc.com.py','ABC Color','Paraguay','Diario','0.9','SI'],
    ['ultimahora.com','Última Hora','Paraguay','Diario','0.9','SI'],
    ['lanacion.com.py','La Nación','Paraguay','Diario','0.85','SI'],
    ['hoy.com.py','Diario Hoy','Paraguay','Diario','0.8','SI'],
    ['5dias.com.py','5 Días','Paraguay','Diario','0.8','SI'],
    ['extra.com.py','Extra','Paraguay','Diario','0.7','SI'],
    ['ip.gov.py','IP Paraguay','Paraguay','Agencia','0.85','SI'],
    ['presidencia.gov.py','Presidencia','Paraguay','Gobierno','0.9','SI'],
    ['mades.gov.py','MADES','Paraguay','Gobierno','0.85','SI'],
    ['snn.gov.py','SNN','Paraguay','Gobierno','0.8','SI'],
    ['npyv.com','NPY','Paraguay','TV','0.75','SI'],
    ['telefuturo.com.py','Telefuturo','Paraguay','TV','0.75','SI'],
    ['infobae.com','Infobae','Argentina','Internacional','0.8','SI'],
    ['efe.com','EFE','España','Internacional','0.9','SI'],
    ['reuters.com','Reuters','Internacional','Internacional','0.95','SI'],
    ['bloomberg.com','Bloomberg','Internacional','Internacional','0.9','SI'],
    ['mongabay.com','Mongabay','Internacional','Ambiental','0.85','SI']
  ]
};

// ─── GATE ANCHORS ────────────────────────────────────────────────────────────
var GATE = {
  GEO_ANCHORS: ['paraguay','concepción','concepcion','asunción','asuncion',
    'chaco','san pedro','caaguazú','caaguazu','itapúa','itapua','alto paraná',
    'alto parana','central','amambay','canindeyú','canindeyu','presidente hayes',
    'boquerón','boqueron','misiones','ñeembucú','neembucu','guairá','guaira',
    'cordillera','paraguarí','paraguari','caazapá','caazapa','rio paraguay',
    'paraguayo','paraguaya','paraguayos','paraguayas','guaraní','guarani',
    'itaipu','yacyreta','villa hayes','limpio','luque','san lorenzo',
    'fernando de la mora','lambare','mariano roque alonso','capiata',
    'paso horqueta','belén','belen','loreto','puerto rosario','ruta bioceánica','bioceanica'],
  PLANT_ANCHORS: ['celulosa','planta','fábrica','fabrica','pulp','mill',
    'eucalipto','eucalyptus','forestal','forestación','forestacion',
    'deforestación','deforestacion','papel','paper','biomasa','biomass',
    'pasteras','pastera','industrial','industria','inversión','inversion',
    'medioambiental','ambiental','impacto','tonelada','producción','produccion',
    'exportación','exportacion','materia prima','madera','plantación','plantacion',
    'zapag','heinzel','girindus','sylvamo','copetrol'],
  EXCLUSIONS: ['islas paracel','paracel islands','spratly','south china sea',
    'mar de china','mer de chine','hainan','vietnam','filipinas','philippines',
    'spratlys','paracelso','paracelsus','paracel logistics','paracel group',
    'paracel shipping','îles paracel','quần đảo hoàng sa','xisha','hoang sa',
    'taiwan','beijing','mar meridional','pekin','pekín','china','chinas']
};

// ─── SENTIMIENTO LÉXICO ──────────────────────────────────────────────────────
var SENTIMENT = {
  POSITIVE: {
    'bueno':1,'buena':1,'excelente':1.5,'positivo':1,'positiva':1,'gran':0.8,
    'beneficio':1,'beneficios':1,'progreso':1,'avance':1,'desarrollo':1.2,
    'oportunidad':1,'oportunidades':1,'empleo':1.2,'empleos':1.2,'trabajo':0.6,
    'inversión':1,'crecimiento':1.2,'innovación':1,'mejora':0.8,'mejoras':0.8,
    'éxito':1.3,'logro':1,'aprobación':0.8,'apoyo':0.8,'favorable':1,
    'acuerdo':0.7,'compromiso':0.8,'sostenible':0.9,'sustentable':0.9,
    'prosperidad':1.2,'bienestar':1,'esperanza':0.7,'optimismo':1,
    'inauguración':0.9,'inaugurar':0.9,'impulso':0.8,'impulsar':0.8,
    'fortalece':0.9,'fortalecimiento':0.9,'avanza':0.8,'consolida':0.9,
    'destaca':0.7,'promueve':0.7,'garantiza':0.8,'alianza':0.8,
    'transparencia':0.7,'eficiencia':0.8,'competitivo':0.7,'rentable':0.8,
    'histórico':0.6,'récord':0.8,'hito':0.9,'modelo':0.6,'líder':0.7,
    'genera':0.6,'generación':0.7,'creación':0.7,'modernización':0.8
  },
  NEGATIVE: {
    'malo':1,'mala':1,'negativo':1,'negativa':1,'problema':1,'problemas':1,
    'riesgo':0.8,'riesgos':0.8,'peligro':1.1,'contaminación':1.3,'contaminar':1.1,
    'deforestación':1.3,'destrucción':1.3,'daño':1,'daños':1,'conflicto':1.1,
    'protesta':1.1,'protestas':1.1,'rechazo':1.1,'oposición':1,'denuncia':1.1,
    'denuncias':1.1,'ilegal':1.3,'irregular':0.9,'violación':1.3,'amenaza':1.1,
    'desastre':1.5,'crisis':1.2,'corrupción':1.3,'fraude':1.3,'pérdida':0.9,
    'preocupación':0.7,'preocupante':0.8,'crítica':0.7,'críticas':0.7,
    'multa':1.1,'sanción':1.1,'prohibición':1.1,'cancelación':1,'demanda':0.9,
    'desplazamiento':1.1,'muerte':1.3,'enfermedad':1.1,'tóxico':1.3,
    'contaminante':1.2,'radiación':1.2,'vertido':1.2,'derrame':1.3,
    'incumplimiento':1,'impedimento':0.8,'obstáculo':0.8,'paralización':0.9,
    'colapso':1.3,'fracaso':1.2,'escándalo':1.2,'atraso':0.8,'retraso':0.7,
    'pobreza':0.9,'desigualdad':0.8,'injusticia':1,'abuso':1.2,
    'abandono':0.9,'deterioro':1,'degradación':1.1,'erosión':0.9
  },
  NEGATORS: ['no','ni','sin','nunca','jamás','jamas','tampoco','ningún','ningun',
    'ninguna','ninguno','apenas','nada','nadie','lejos de'],
  AMPLIFIERS: ['muy','mucho','bastante','extremadamente','sumamente','totalmente',
    'completamente','enormemente','gravemente','fuertemente','altamente',
    'profundamente','drásticamente','considerablemente','significativamente']
};

// ─── TEMAS ───────────────────────────────────────────────────────────────────
var TOPICS_REGEX = {
  'Ambiental': /\b(ambiental|medioambient|contaminaci[oó]n|deforestaci[oó]n|ecolog[ií]|ecosistema|biodiversidad|eucalipt|forestal|forestaci[oó]n|agua|r[ií]o|humedal|residuo|emisi[oó]n|carbono|sustentab|sostenib|impacto ambiental|fauna|flora|reciclaje|biomasa)\b/i,
  'Laboral': /\b(empleo|empleos|trabajo|trabajador|obrero|sindicat|salar|contrataci[oó]n|despido|laboral|mano de obra|capacitaci[oó]n|seguridad laboral|accidente laboral|huelga|derecho laboral)\b/i,
  'Comunidad': /\b(comunidad|comunidades|poblaci[oó]n|vecin|habitant|desplazamiento|reasentamiento|consulta|participaci[oó]n|social|sociedad|ind[ií]gena|campesino|aldeano|local|lugare[ñn]|responsabilidad social)\b/i,
  'Inversión': /\b(inversi[oó]n|inversiones|capital|financ|millones|d[oó]lares|presupuest|econom[ií]|negoci|mercado|exportaci[oó]n|producci[oó]n|rentab|ganancia|costo|gasto|PIB|divisa)\b/i,
  'Operación': /\b(operaci[oó]n|construcci[oó]n|infraestructura|planta|f[aá]brica|maquinaria|tecnolog[ií]|proces|producci[oó]n|capacidad|tonelada|inauguraci[oó]n|obra|log[ií]stica|transporte|maquinaria)\b/i
};
var TOPIC_COLORS = { Ambiental:'#10b981', Laboral:'#3b82f6', Comunidad:'#8b5cf6', 'Inversión':'#f59e0b', 'Operación':'#ef4444' };
var SENT_COLORS = { Positivo:'#10b981', Neutral:'#6b7280', Negativo:'#ef4444' };

// ─── UTILIDADES ──────────────────────────────────────────────────────────────
function getSpreadsheet_() { return SpreadsheetApp.openById(CFG.SPREADSHEET_ID); }
function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#e2e8f0');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function getParam_(ss, key, fallback) {
  var sheet = ss.getSheetByName(CFG.SHEETS.PARAMS);
  if (!sheet) return fallback;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (data[i][0] === key) return data[i][1]; }
  return fallback;
}
function generateId_() {
  return 'MEN-' + Utilities.formatDate(new Date(),'America/Asuncion','yyyyMMddHHmmss')
    + '-' + Math.floor(Math.random()*9000+1000);
}
function canonicalUrl_(url) {
  try { url = url.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/[#?].*$/,'').replace(/\/+$/,''); } catch(e) {}
  return url;
}
function computeHash_(url) {
  var canon = canonicalUrl_(url);
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canon);
  return raw.map(function(b) { return ('0'+(b<0?b+256:b).toString(16)).slice(-2); }).join('');
}
function extractDomain_(url) {
  try { var m = url.match(/^https?:\/\/([^\/]+)/i); if (m) return m[1].replace(/^www\./,'').toLowerCase(); } catch(e) {}
  return '';
}
function sleepMs_(ms) { Utilities.sleep(ms); }
function safeStr_(v) { return (v==null||v===undefined)?'':String(v).trim(); }
function nowISO_() { return Utilities.formatDate(new Date(),'America/Asuncion',"yyyy-MM-dd'T'HH:mm:ss"); }
function todayStr_() { return Utilities.formatDate(new Date(),'America/Asuncion','yyyy-MM-dd'); }

// ─── INIT ────────────────────────────────────────────────────────────────────
function initAllSheets() {
  var ss = getSpreadsheet_();
  getOrCreateSheet_(ss, CFG.SHEETS.OPINION, CFG.HEADERS.OPINION);
  var kw = getOrCreateSheet_(ss, CFG.SHEETS.KEYWORDS, CFG.HEADERS.KEYWORDS);
  getOrCreateSheet_(ss, CFG.SHEETS.LOG, CFG.HEADERS.LOG);
  var pr = getOrCreateSheet_(ss, CFG.SHEETS.PARAMS, CFG.HEADERS.PARAMS);
  var md = getOrCreateSheet_(ss, CFG.SHEETS.MEDIOS, CFG.HEADERS.MEDIOS);
  if (kw.getLastRow()<2) kw.getRange(2,1,CFG.DEFAULT_KEYWORDS.length,4).setValues(CFG.DEFAULT_KEYWORDS);
  if (pr.getLastRow()<2) pr.getRange(2,1,CFG.DEFAULT_PARAMS.length,3).setValues(CFG.DEFAULT_PARAMS);
  if (md.getLastRow()<2) md.getRange(2,1,CFG.DEFAULT_MEDIOS.length,6).setValues(CFG.DEFAULT_MEDIOS);
  Logger.log('initAllSheets: OK');
}

function seedDatabase() {
  initAllSheets();
  return { success: true, message: 'Database seeded' };
}

// ─── URL RESOLVER ────────────────────────────────────────────────────────────
function resolveUrl_(url) {
  if (!url) return { finalUrl: url, domain: '' };
  var cache = CacheService.getScriptCache();
  var ck = 'url_' + computeHash_(url).substring(0,40);
  var cached = cache.get(ck);
  if (cached) return JSON.parse(cached);
  var finalUrl = url;
  try {
    var resp = UrlFetchApp.fetch(url, { followRedirects:true, muteHttpExceptions:true, validateHttpsCertificates:false });
    var ct = resp.getContentText().substring(0,3000);
    var og = ct.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
    if (og && og[1]) finalUrl = og[1];
  } catch(e) { finalUrl = url; }
  var domain = extractDomain_(finalUrl);
  var result = { finalUrl: finalUrl, domain: domain };
  try { cache.put(ck, JSON.stringify(result), 21600); } catch(e) {}
  return result;
}

// ─── MEDIA ───────────────────────────────────────────────────────────────────
function loadMediaCatalog_(ss) {
  var sheet = ss.getSheetByName(CFG.SHEETS.MEDIOS);
  if (!sheet || sheet.getLastRow()<2) return {};
  var data = sheet.getDataRange().getValues();
  var cat = {};
  for (var i=1; i<data.length; i++) {
    cat[String(data[i][0]).toLowerCase()] = { name:String(data[i][1]), country:String(data[i][2]), type:String(data[i][3]) };
  }
  return cat;
}
function classifyMedia_(domain, catalog) {
  if (!domain) return { name:'', country:'', type:'Otro', isPY:false };
  domain = domain.toLowerCase();
  if (catalog[domain]) {
    var m = catalog[domain];
    return { name:m.name, country:m.country, type:m.type, isPY:m.country==='Paraguay' };
  }
  var keys = Object.keys(catalog);
  for (var i=0; i<keys.length; i++) {
    if (domain.indexOf(keys[i])>=0 || keys[i].indexOf(domain)>=0) {
      var m2 = catalog[keys[i]];
      return { name:m2.name, country:m2.country, type:m2.type, isPY:m2.country==='Paraguay' };
    }
  }
  return { name:'', country:'', type:'Otro', isPY:false };
}

// ─── GATE FILTER ─────────────────────────────────────────────────────────────
function applyParaguayGate_(text) {
  var result = { gateOK:'NO', gateReason:'unknown', relevance:0 };
  if (!text) { result.gateReason='no_text'; return result; }
  var lower = text.toLowerCase();

  // Step 1: Must mention "paracel"
  if (lower.indexOf('paracel')<0) { result.gateReason='no_paracel'; return result; }

  // Step 2: Check exclusions
  var geoCount = 0;
  for (var g=0; g<GATE.GEO_ANCHORS.length; g++) {
    if (lower.indexOf(GATE.GEO_ANCHORS[g])>=0) geoCount++;
  }
  for (var e=0; e<GATE.EXCLUSIONS.length; e++) {
    if (lower.indexOf(GATE.EXCLUSIONS[e])>=0) {
      if (geoCount===0) { result.gateReason='excluded'; return result; }
      break;
    }
  }

  // Step 3: Geo anchor
  if (geoCount===0) { result.gateReason='no_geo'; return result; }

  // Step 4: Plant anchor
  var plantCount = 0;
  for (var p=0; p<GATE.PLANT_ANCHORS.length; p++) {
    if (lower.indexOf(GATE.PLANT_ANCHORS[p])>=0) plantCount++;
  }
  if (plantCount===0) { result.gateReason='no_plant'; return result; }

  // Compute relevance score (0-1)
  var maxGeo = Math.min(geoCount, 5);
  var maxPlant = Math.min(plantCount, 5);
  result.relevance = Math.round(((maxGeo/5)*0.4 + (maxPlant/5)*0.4 + 0.2) * 100) / 100;
  result.gateOK = 'SI';
  result.gateReason = 'ok';
  return result;
}

// ─── SENTIMENT ───────────────────────────────────────────────────────────────
function analyzeSentiment_(text) {
  if (!text) return { label:'Neutral', score:0, confidence:0.3 };
  var lower = text.toLowerCase().replace(/[^\wáéíóúüñ\s]/g,' ');
  var words = lower.split(/\s+/).filter(function(w) { return w.length>1; });
  var score = 0, matchCount = 0, negateNext = false, amplifyNext = false;
  for (var i=0; i<words.length; i++) {
    var w = words[i];
    if (SENTIMENT.NEGATORS.indexOf(w)>=0) { negateNext=true; continue; }
    if (SENTIMENT.AMPLIFIERS.indexOf(w)>=0) { amplifyNext=true; continue; }
    var val = 0;
    if (SENTIMENT.POSITIVE[w]) val = SENTIMENT.POSITIVE[w];
    else if (SENTIMENT.NEGATIVE[w]) val = -SENTIMENT.NEGATIVE[w];
    // Bigrams
    if (i<words.length-1) {
      var bi = w+' '+words[i+1];
      if (SENTIMENT.POSITIVE[bi]) val = SENTIMENT.POSITIVE[bi];
      else if (SENTIMENT.NEGATIVE[bi]) val = -SENTIMENT.NEGATIVE[bi];
    }
    if (val!==0) {
      if (negateNext) { val = -val*0.75; negateNext=false; }
      if (amplifyNext) { val = val*1.5; amplifyNext=false; }
      score += val; matchCount++;
    } else { negateNext=false; amplifyNext=false; }
  }
  var norm = Math.max(-1, Math.min(1, score / Math.max(words.length*0.1, 1)));
  // Confidence based on matches vs text length
  var confidence = Math.min(1, matchCount / Math.max(words.length*0.05, 1));
  confidence = Math.round(Math.max(0.1, Math.min(1, confidence)) * 100) / 100;
  var label = 'Neutral';
  if (norm>0.1) label='Positivo';
  else if (norm<-0.1) label='Negativo';
  return { label:label, score:Math.round(norm*100)/100, confidence:confidence };
}

// ─── TOPICS ──────────────────────────────────────────────────────────────────
function classifyTopics_(text) {
  if (!text) return { topics:'', category:'' };
  var topics = [], keys = Object.keys(TOPICS_REGEX);
  for (var i=0; i<keys.length; i++) { if (TOPICS_REGEX[keys[i]].test(text)) topics.push(keys[i]); }
  return { topics:topics.join(', '), category:topics[0]||'' };
}

// ─── ENTITY EXTRACTION ───────────────────────────────────────────────────────
function extractEntities_(text) {
  if (!text) return '[]';
  var entities = [];
  var orgPatterns = [/\b(PARACEL|ANDE|MADES|INFONA|SENAVE|DINAC|MIC)\b/g,
    /\b(ABC Color|Última Hora|La Nación|Infobae)\b/gi];
  var placePatterns = [/\b(Concepción|Asunción|Paraguay|San Pedro|Alto Paraná)\b/gi];
  for (var o=0; o<orgPatterns.length; o++) {
    var m; while ((m=orgPatterns[o].exec(text))!==null) {
      if (entities.indexOf(m[1])<0) entities.push(m[1]);
    }
  }
  for (var p=0; p<placePatterns.length; p++) {
    var m2; while ((m2=placePatterns[p].exec(text))!==null) {
      if (entities.indexOf(m2[1])<0) entities.push(m2[1]);
    }
  }
  return JSON.stringify(entities.slice(0,10));
}

// ─── RSS INGESTION ───────────────────────────────────────────────────────────
function fetchGoogleNewsRSS_(keyword, maxResults) {
  var items = [];
  try {
    var q = encodeURIComponent(keyword);
    var url = 'https://news.google.com/rss/search?q='+q+'&hl=es-419&gl=PY&ceid=PY:es-419';
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions:true });
    if (resp.getResponseCode()!==200) return items;
    var xml = XmlService.parse(resp.getContentText());
    var channel = xml.getRootElement().getChild('channel');
    if (!channel) return items;
    var entries = channel.getChildren('item');
    var count = Math.min(entries.length, maxResults||30);
    for (var i=0; i<count; i++) {
      var e = entries[i];
      var title = safeStr_(e.getChildText('title'));
      var link = safeStr_(e.getChildText('link'));
      var pubDate = safeStr_(e.getChildText('pubDate'));
      var desc = safeStr_(e.getChildText('description')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      items.push({ titulo:title, link:link, fechaPub:parseDateSafe_(pubDate), snippet:desc.substring(0,500), fuente:'GoogleNews', keyword:keyword });
    }
  } catch(e) { Logger.log('fetchGoogleNews error: '+e.message); }
  return items;
}

function fetchRedditRSS_(keyword, maxResults) {
  var items = [], subs = ['Paraguay','Latinoamerica','sustainability','environment'];
  for (var s=0; s<subs.length; s++) {
    try {
      var q = encodeURIComponent(keyword);
      var url = 'https://www.reddit.com/r/'+subs[s]+'/search.json?q='+q+'&restrict_sr=1&sort=new&limit='+(maxResults||10);
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions:true, headers:{'User-Agent':'ParacelMonitor/2.0'} });
      if (resp.getResponseCode()!==200) continue;
      var json = JSON.parse(resp.getContentText());
      var posts = (json.data&&json.data.children)?json.data.children:[];
      for (var i=0; i<posts.length; i++) {
        var d = posts[i].data;
        if (!d) continue;
        items.push({ titulo:safeStr_(d.title), link:'https://www.reddit.com'+safeStr_(d.permalink), fechaPub:d.created_utc?new Date(d.created_utc*1000):new Date(), snippet:safeStr_(d.selftext).substring(0,500), fuente:'Reddit', keyword:keyword });
      }
      sleepMs_(1000);
    } catch(e) { Logger.log('fetchReddit error ('+subs[s]+'): '+e.message); }
  }
  return items;
}

function fetchBingNewsRSS_(keyword, maxResults) {
  var items = [];
  try {
    var q = encodeURIComponent(keyword);
    var url = 'https://www.bing.com/news/search?q='+q+'&format=rss&mkt=es-419';
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions:true });
    if (resp.getResponseCode()!==200) return items;
    var xml = XmlService.parse(resp.getContentText());
    var channel = xml.getRootElement().getChild('channel');
    if (!channel) return items;
    var entries = channel.getChildren('item');
    var count = Math.min(entries.length, maxResults||20);
    for (var i=0; i<count; i++) {
      var e = entries[i];
      var title = safeStr_(e.getChildText('title'));
      var link = safeStr_(e.getChildText('link'));
      var pubDate = safeStr_(e.getChildText('pubDate'));
      var desc = safeStr_(e.getChildText('description')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      items.push({ titulo:title, link:link, fechaPub:parseDateSafe_(pubDate), snippet:desc.substring(0,500), fuente:'BingNews', keyword:keyword });
    }
  } catch(e) { Logger.log('fetchBingNews error: '+e.message); }
  return items;
}

function parseDateSafe_(str) {
  if (!str) return new Date();
  try { var d = new Date(str); return isNaN(d.getTime())?new Date():d; } catch(e) { return new Date(); }
}

// ─── DEDUP ───────────────────────────────────────────────────────────────────
function loadExistingHashes_(ss) {
  var sheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  if (!sheet || sheet.getLastRow()<2) return {};
  var hashCol = CFG.HEADERS.OPINION.indexOf('Hash')+1;
  var data = sheet.getRange(2, hashCol, sheet.getLastRow()-1, 1).getValues();
  var hashes = {};
  for (var i=0; i<data.length; i++) { if (data[i][0]) hashes[data[i][0]]=true; }
  return hashes;
}

// ─── PIPELINE ────────────────────────────────────────────────────────────────
function runFullPipeline() {
  var startTime = new Date();
  var ss = getSpreadsheet_();
  var stats = { total:0, nuevas:0, duplicadas:0, gateOK:0, gateNO:0, errores:[] };
  var gateActivo = getParam_(ss,'GATE_ACTIVO','SI')==='SI';
  var maxPerKw = parseInt(getParam_(ss,'MAX_RESULTS_PER_KEYWORD','30'),10);
  var sleepMs = parseInt(getParam_(ss,'SLEEP_MS_ENTRE_REQUESTS','1500'),10);
  var alertThreshold = parseFloat(getParam_(ss,'ALERT_SENTIMENT_THRESHOLD','-0.5'));

  // Load keywords
  var kwSheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  var keywords = [];
  if (kwSheet && kwSheet.getLastRow()>1) {
    var kwData = kwSheet.getRange(2,1,kwSheet.getLastRow()-1,4).getValues();
    for (var k=0; k<kwData.length; k++) {
      if (String(kwData[k][1]).toUpperCase()==='SI') keywords.push({ text:String(kwData[k][0]), row:k+2 });
    }
  }
  if (keywords.length===0) {
    logExecution_(ss, startTime, 'completed', '', stats);
    return { status:'warning', message:'No hay keywords activas' };
  }

  var existingHashes = loadExistingHashes_(ss);
  var mediaCatalog = loadMediaCatalog_(ss);
  var opinionSheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  var newRows = [], alertMessages = [];

  for (var ki=0; ki<keywords.length; ki++) {
    var kw = keywords[ki].text;
    try {
      var gnItems = fetchGoogleNewsRSS_(kw, maxPerKw);
      sleepMs_(sleepMs);
      var bingItems = fetchBingNewsRSS_(kw, Math.floor(maxPerKw/2));
      sleepMs_(sleepMs);
      var rdItems = fetchRedditRSS_(kw, 10);
      sleepMs_(sleepMs);
      var allItems = gnItems.concat(bingItems).concat(rdItems);
      stats.total += allItems.length;

      // Update keyword usage
      kwSheet.getRange(keywords[ki].row, 3).setValue((kwSheet.getRange(keywords[ki].row,3).getValue()||0)+1);
      kwSheet.getRange(keywords[ki].row, 4).setValue(nowISO_());

      for (var j=0; j<allItems.length; j++) {
        var item = allItems[j];
        try {
          var hash = computeHash_(item.link);
          if (existingHashes[hash]) { stats.duplicadas++; continue; }
          existingHashes[hash] = true;
          var fullText = item.titulo+' '+item.snippet;
          var gate = gateActivo ? applyParaguayGate_(fullText) : { gateOK:'SI', gateReason:'gate_disabled', relevance:0.5 };
          if (gate.gateOK==='SI') stats.gateOK++; else stats.gateNO++;
          var resolved = resolveUrl_(item.link);
          var media = classifyMedia_(resolved.domain, mediaCatalog);
          var sent = analyzeSentiment_(fullText);
          var topicResult = classifyTopics_(fullText);
          var entities = extractEntities_(fullText);

          // Check for alerts
          var alertSent = 'NO';
          if (sent.score <= alertThreshold && gate.gateOK==='SI') {
            alertMessages.push('⚠️ Sentimiento negativo ('+sent.score+'): '+item.titulo.substring(0,80));
            alertSent = 'SI';
          }

          var row = [
            generateId_(), hash, nowISO_(),
            Utilities.formatDate(item.fechaPub,'America/Asuncion',"yyyy-MM-dd'T'HH:mm:ss"),
            kw, item.fuente, item.titulo, item.link,
            resolved.finalUrl, resolved.domain,
            media.name, media.country, media.type,
            gate.gateOK, gate.gateReason, gate.relevance,
            sent.label, sent.score, sent.confidence,
            topicResult.topics, topicResult.category, entities,
            item.snippet, alertSent, 'SI'
          ];
          newRows.push(row);
          stats.nuevas++;
        } catch(ie) { stats.errores.push('Item: '+ie.message); }
      }
    } catch(ke) { stats.errores.push('KW "'+kw+'": '+ke.message); }
  }

  if (newRows.length>0) {
    opinionSheet.getRange(opinionSheet.getLastRow()+1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  logExecution_(ss, startTime, 'completed', keywords.map(function(k){return k.text}).join(', '), stats);

  var emailActivo = getParam_(ss,'EMAIL_ACTIVO','NO')==='SI';
  var emailDest = getParam_(ss,'EMAIL_REPORTE','');
  if (emailActivo && emailDest && stats.nuevas>0) {
    sendEmailReport_(emailDest, stats, newRows, alertMessages);
  }

  return { status:'ok', nuevas:stats.nuevas, duplicadas:stats.duplicadas, total:stats.total, alerts:alertMessages.length };
}

// ─── LOG ─────────────────────────────────────────────────────────────────────
function logExecution_(ss, startTime, status, kwUsed, stats) {
  var durSec = Math.round((new Date()-startTime)/1000);
  var logSheet = ss.getSheetByName(CFG.SHEETS.LOG);
  if (!logSheet) return;
  logSheet.appendRow([
    nowISO_(), status, durSec, kwUsed, stats.total, stats.nuevas,
    stats.duplicadas, stats.gateOK, stats.gateNO, stats.errores.length,
    stats.errores.join(' | ').substring(0,500)
  ]);
}

// ─── EMAIL ───────────────────────────────────────────────────────────────────
function sendEmailReport_(email, stats, newRows, alerts) {
  try {
    var tpl = HtmlService.createTemplateFromFile('ReporteEmail');
    tpl.stats = stats; tpl.rows = newRows.slice(0,20); tpl.fecha = nowISO_(); tpl.alerts = alerts||[];
    var html = tpl.evaluate().getContent();
    MailApp.sendEmail({ to:email, subject:'📊 Monitor PARACEL — '+stats.nuevas+' menciones — '+todayStr_(), htmlBody:html });
  } catch(e) { Logger.log('sendEmailReport_ error: '+e.message); }
}

// ─── TRIGGERS ────────────────────────────────────────────────────────────────
function createDailyTrigger() {
  deleteTriggers();
  ScriptApp.newTrigger('scheduledRun').timeBased().everyDays(1).atHour(6).create();
  Logger.log('Trigger diario creado');
}
function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0; i<triggers.length; i++) { if (triggers[i].getHandlerFunction()==='scheduledRun') ScriptApp.deleteTrigger(triggers[i]); }
}
function scheduledRun() { runFullPipeline(); }

// ─── WEB APP ─────────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('PaginaWeb')
    .setTitle('Monitor de Opinión — PARACEL')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}
function runManualSearch() { return runFullPipeline(); }

function getKeywords() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet || sheet.getLastRow()<2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues().map(function(r) {
    return { keyword:r[0], activa:r[1], useCount:r[2]||0, lastUsed:r[3]||'' };
  });
}
function toggleKeyword(keyword, activa) {
  var ss = getSpreadsheet_(), sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i=1; i<data.length; i++) { if (data[i][0]===keyword) { sheet.getRange(i+1,2).setValue(activa?'SI':'NO'); return true; } }
  return false;
}
function addKeyword(keyword) {
  var ss = getSpreadsheet_(), sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet) return false;
  sheet.appendRow([keyword,'SI',0,'']);
  return true;
}
function deleteKeyword(keyword) {
  var ss = getSpreadsheet_(), sheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i=1; i<data.length; i++) { if (data[i][0]===keyword) { sheet.deleteRow(i+1); return true; } }
  return false;
}

function resetKeywords() {
  var ss = getSpreadsheet_();
  var kwSheet = ss.getSheetByName(CFG.SHEETS.KEYWORDS);
  if (!kwSheet) return { success: false, message: 'La pestaña KEYWORDS no existe.' };
  
  if (kwSheet.getLastRow() > 1) {
    kwSheet.getRange(2, 1, kwSheet.getLastRow() - 1, 4).clearContent();
  }
  kwSheet.getRange(2, 1, CFG.DEFAULT_KEYWORDS.length, 4).setValues(CFG.DEFAULT_KEYWORDS);
  return { success: true, message: 'Keywords reseteadas a las por defecto exitosamente.' };
}

function getLastExecution() {
  var ss = getSpreadsheet_(), logSheet = ss.getSheetByName(CFG.SHEETS.LOG);
  if (!logSheet || logSheet.getLastRow()<2) return null;
  var lr = logSheet.getLastRow();
  var d = logSheet.getRange(lr,1,1,CFG.HEADERS.LOG.length).getValues()[0];
  return { timestamp:d[0], estado:d[1], duracion:d[2], keywords:d[3], total:d[4], nuevas:d[5], duplicadas:d[6], gateOK:d[7], gateNO:d[8], errores:d[9] };
}

function getExecutionHistory(limit) {
  var ss = getSpreadsheet_(), logSheet = ss.getSheetByName(CFG.SHEETS.LOG);
  if (!logSheet || logSheet.getLastRow()<2) return { logs:[], summary:{ total:0, successful:0, totalMentions:0 } };
  var lastRow = logSheet.getLastRow();
  var lim = Math.min(limit||20, lastRow-1);
  var startR = Math.max(2, lastRow-lim+1);
  var data = logSheet.getRange(startR,1,lastRow-startR+1,CFG.HEADERS.LOG.length).getValues();
  var logs = [], totalMentions = 0, successful = 0;
  for (var i=data.length-1; i>=0; i--) {
    logs.push({ timestamp:data[i][0], estado:data[i][1], duracion:data[i][2], keywords:data[i][3],
      total:data[i][4], nuevas:data[i][5], duplicadas:data[i][6], gateOK:data[i][7], gateNO:data[i][8], errores:data[i][9] });
    totalMentions += (data[i][5]||0);
    if (data[i][1]==='completed') successful++;
  }
  return { logs:logs, summary:{ total:logs.length, successful:successful, totalMentions:totalMentions } };
}

function getFilteredData(filters) {
  var ss = getSpreadsheet_(), sheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  if (!sheet || sheet.getLastRow()<2) return { rows:[], total:0 };
  var data = sheet.getRange(2,1,sheet.getLastRow()-1,CFG.HEADERS.OPINION.length).getValues();
  var filtered = [];
  for (var i=0; i<data.length; i++) {
    var row = data[i];
    var gateOK=String(row[13]), medioPY=String(row[10]), fuente=String(row[5]),
        sentimiento=String(row[16]), tema=String(row[19]), titulo=String(row[6]),
        snippet=String(row[22]), fechaPub=row[3];
    if (filters.gateOnly && gateOK!=='SI') continue;
    if (filters.soloMediosPY && !medioPY) continue;
    if (filters.fuente && fuente!==filters.fuente) continue;
    if (filters.medioPY && medioPY!==filters.medioPY) continue;
    if (filters.sentimiento && sentimiento!==filters.sentimiento) continue;
    if (filters.tema && tema.indexOf(filters.tema)<0) continue;
    if (filters.fechaDesde) { if (new Date(fechaPub)<new Date(filters.fechaDesde)) continue; }
    if (filters.fechaHasta) { var fh=new Date(filters.fechaHasta); fh.setHours(23,59,59); if (new Date(fechaPub)>fh) continue; }
    if (filters.busqueda) { var s=filters.busqueda.toLowerCase(); if (titulo.toLowerCase().indexOf(s)<0 && snippet.toLowerCase().indexOf(s)<0) continue; }
    filtered.push({
      id:row[0], hash:row[1], fechaCaptura:row[2], fechaPub:row[3], keyword:row[4],
      fuente:fuente, titulo:titulo, link:row[7], linkFinal:row[8], dominio:row[9],
      medioPY:medioPY, medioPais:row[11], medioTipo:row[12],
      gateOK:gateOK, gateReason:row[14], relevance:row[15],
      sentimiento:sentimiento, sentimientoScore:row[17], confidence:row[18],
      tema:tema, categoria:row[20], entities:row[21], snippet:snippet
    });
  }
  filtered.sort(function(a,b) { return new Date(b.fechaPub)-new Date(a.fechaPub); });
  return { rows:filtered, total:filtered.length };
}

function getDashboardStats(filters) {
  var result = getFilteredData(filters||{});
  var rows = result.rows;
  var stats = {
    total:rows.length, hoy:0, ayer:0, positivas:0, negativas:0, neutrales:0,
    avgSentiment:0, avgConfidence:0, avgRelevance:0,
    porFuente:{}, porMedioPY:{}, porTema:{},
    porSentimiento:{Positivo:0,Negativo:0,Neutral:0},
    tendenciaDiaria:{}, sentimentTrend:{},
    gate:{ passed:0, rejected:0 },
    mediaOrigin:{ paraguay:0, international:0 },
    topMedioPY:'', last7Days:[]
  };
  var hoyStr = todayStr_();
  var ayerDate = new Date(); ayerDate.setDate(ayerDate.getDate()-1);
  var ayerStr = Utilities.formatDate(ayerDate,'America/Asuncion','yyyy-MM-dd');
  var totalSent=0, totalConf=0, totalRel=0;

  for (var i=0; i<rows.length; i++) {
    var r = rows[i];
    var pubStr = String(r.fechaPub).substring(0,10);
    if (pubStr===hoyStr) stats.hoy++;
    if (pubStr===ayerStr) stats.ayer++;
    stats.porSentimiento[r.sentimiento] = (stats.porSentimiento[r.sentimiento]||0)+1;
    if (r.sentimiento==='Positivo') stats.positivas++;
    else if (r.sentimiento==='Negativo') stats.negativas++;
    else stats.neutrales++;
    totalSent += (r.sentimientoScore||0);
    totalConf += (r.confidence||0);
    totalRel += (r.relevance||0);
    stats.porFuente[r.fuente] = (stats.porFuente[r.fuente]||0)+1;
    if (r.medioPY) stats.porMedioPY[r.medioPY] = (stats.porMedioPY[r.medioPY]||0)+1;
    if (r.tema) { r.tema.split(', ').forEach(function(t){ if(t) stats.porTema[t]=(stats.porTema[t]||0)+1; }); }
    stats.tendenciaDiaria[pubStr] = (stats.tendenciaDiaria[pubStr]||0)+1;
    if (!stats.sentimentTrend[pubStr]) stats.sentimentTrend[pubStr] = {pos:0,neu:0,neg:0};
    if (r.sentimiento==='Positivo') stats.sentimentTrend[pubStr].pos++;
    else if (r.sentimiento==='Negativo') stats.sentimentTrend[pubStr].neg++;
    else stats.sentimentTrend[pubStr].neu++;
    if (r.gateOK==='SI') stats.gate.passed++; else stats.gate.rejected++;
    if (r.medioPY) stats.mediaOrigin.paraguay++; else stats.mediaOrigin.international++;
  }
  stats.avgSentiment = rows.length>0 ? Math.round(totalSent/rows.length*100)/100 : 0;
  stats.avgConfidence = rows.length>0 ? Math.round(totalConf/rows.length*100)/100 : 0;
  stats.avgRelevance = rows.length>0 ? Math.round(totalRel/rows.length*100)/100 : 0;

  // Top MedioPY
  var maxC=0; Object.keys(stats.porMedioPY).forEach(function(k) { if (stats.porMedioPY[k]>maxC) { maxC=stats.porMedioPY[k]; stats.topMedioPY=k; } });

  // Last 7 days
  for (var d=6; d>=0; d--) {
    var dd = new Date(); dd.setDate(dd.getDate()-d);
    var ds = Utilities.formatDate(dd,'America/Asuncion','yyyy-MM-dd');
    stats.last7Days.push({ date:ds, count:stats.tendenciaDiaria[ds]||0, sentiment:stats.sentimentTrend[ds]||{pos:0,neu:0,neg:0} });
  }
  return stats;
}

function getFilterOptions() {
  var ss = getSpreadsheet_(), sheet = ss.getSheetByName(CFG.SHEETS.OPINION);
  if (!sheet || sheet.getLastRow()<2) return { fuentes:[], mediosPY:[], temas:[], sentimientos:[] };
  var data = sheet.getRange(2,1,sheet.getLastRow()-1,CFG.HEADERS.OPINION.length).getValues();
  var fu={}, me={}, te={}, se={};
  for (var i=0; i<data.length; i++) {
    fu[String(data[i][5])]=true;
    if (data[i][10]) me[String(data[i][10])]=true;
    se[String(data[i][16])]=true;
    if (data[i][19]) { String(data[i][19]).split(', ').forEach(function(t){ if(t) te[t]=true; }); }
  }
  return { fuentes:Object.keys(fu).sort(), mediosPY:Object.keys(me).sort(), temas:Object.keys(te).sort(), sentimientos:Object.keys(se).sort() };
}

function exportToCSV(filters) {
  var result = getFilteredData(filters||{});
  var header = 'Título,Enlace,Fuente,Sentimiento,Score,Confidence,Relevance,Fecha,Gate,Medio,Temas\n';
  var csv = header;
  result.rows.forEach(function(r) {
    csv += '"'+String(r.titulo).replace(/"/g,'""')+'",'+r.link+','+r.fuente+','+r.sentimiento+','+
      r.sentimientoScore+','+r.confidence+','+r.relevance+','+String(r.fechaPub).substring(0,10)+','+
      r.gateOK+','+(r.medioPY||'')+',"'+(r.tema||'')+'"\n';
  });
  return csv;
}

// ─── SMOKE TEST ──────────────────────────────────────────────────────────────
function pingDashboard() {
  var result = { status:'ok', sheetsOk:false, rssOk:false, sheetsExist:[], totalMentions:0, timestamp:nowISO_() };
  try {
    var ss = getSpreadsheet_();
    var names = [CFG.SHEETS.OPINION,CFG.SHEETS.KEYWORDS,CFG.SHEETS.LOG,CFG.SHEETS.PARAMS,CFG.SHEETS.MEDIOS];
    for (var i=0; i<names.length; i++) { if (ss.getSheetByName(names[i])) result.sheetsExist.push(names[i]); }
    result.sheetsOk = result.sheetsExist.length===names.length;
    var op = ss.getSheetByName(CFG.SHEETS.OPINION);
    result.totalMentions = op ? Math.max(0, op.getLastRow()-1) : 0;
  } catch(e) { result.status='error'; result.sheetsError=e.message; }
  try {
    var tUrl = 'https://news.google.com/rss/search?q=test&hl=es-419&gl=PY&ceid=PY:es-419';
    result.rssOk = UrlFetchApp.fetch(tUrl,{muteHttpExceptions:true}).getResponseCode()===200;
  } catch(e) { result.rssError=e.message; }
  Logger.log(JSON.stringify(result,null,2));
  return result;
}
