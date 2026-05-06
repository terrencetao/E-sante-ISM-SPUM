# Frontend PWA (Phase 5)

## Lancer en local

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Vues livrees
- /login
- /dashboard
- /data-collection
- /sync-status

## Offline-first
- Service worker basique dans public/sw.js
- Stockage local via RxDB + IndexedDB (Dexie) (collection collected_data)
- Synchronisation manuelle vers /api/sync
