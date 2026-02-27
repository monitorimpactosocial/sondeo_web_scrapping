# Changelog

## [2.0.0] - 2025-02-27

### Major Upgrade — Based on Reference Architecture Analysis

#### Backend (`Code.gs`)
- **Enhanced schema**: Expanded to 25 columns with Confidence, RelevanceScore, Category, Entities, AlertSent
- **New RSS source**: Added Bing News RSS alongside Google News and Reddit
- **Improved gate filter**: Now computes relevance score (0-1) based on geo/plant anchor match density
- **Confidence scoring**: Sentiment analysis returns confidence (0-1) based on lexicon match ratio
- **Entity extraction**: Regex-based extraction of organizations, places, media names from text
- **Alert system**: Auto-detects negative sentiment spikes above configurable threshold
- **CSV export**: `exportToCSV(filters)` generates downloadable CSV with all columns
- **Execution history**: `getExecutionHistory(limit)` with summary stats (total, successful, mentions)
- **Keyword management**: Added `deleteKeyword()`, keyword usage count tracking
- **Seed function**: `seedDatabase()` populates all default data in one call
- **Expanded lexicon**: +40% more Spanish sentiment words with domain-specific terms
- **Expanded media catalog**: Added NPY, Telefuturo, Bloomberg, Mongabay, SNN
- **Expanded gate anchors**: Added more Paraguayan cities and historical terms
- **Expanded exclusions**: Added `paracel logistics`, `paracel group`, `paracel shipping`

#### Frontend (`PaginaWeb.html`)
- **4-tab system**: Dashboard, Búsqueda, Menciones, Alertas (was 2 tabs)
- **Animated counters**: KPI values animate with cubic easeOut on load
- **KPI cards**: 6 gradient cards with icons, trend indicators, and sub-metrics
- **Radar chart**: Multi-dimensional analysis (Coverage, Relevance, Confidence, Sentiment, Gate Pass, Media PY)
- **Stacked bar chart**: Weekly trend with sentiment breakdown (Positivo, Neutral, Negativo stacked)
- **Mention cards**: Rich card layout with gate indicator, source badge, PY flag, sentiment badge with score+confidence, topic badges, clickable title, snippet
- **Alert cards**: Severity-colored (critical/high/medium) for negative sentiment mentions
- **CSV export button**: Download filtered data as CSV from any tab
- **Progress bar**: Animated progress indicator during search execution
- **Background effects**: Animated gradient blobs with blur
- **Donut charts**: Sentiment distribution and media origin (PY vs International)
- **Keyword management**: Toggle, delete, add keywords inline with usage count display

#### Email Template (`ReporteEmail.html`)
- Added alert summary section in email body
- Updated column indices for 25-column schema
- Added sentiment score display in mention rows

---

## [1.0.0] - 2025-02-26

### Initial Release
- Google News RSS ingestion
- Reddit JSON ingestion
- Semantic gate filter (Paraguay context)
- Lexicographic sentiment analysis (Spanish)
- Regex-based topic classification
- URL resolver with CacheService
- Paraguayan media catalog
- SHA-256 deduplication
- 2-tab web app (Búsqueda + Tablero)
- Chart.js visualizations
- Daily trigger automation
- Email reporting
- Repository documentation (README.md, DEPLOY.md)
