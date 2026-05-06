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
- /admin/users (administrator_system)
- /admin/campaign (administrator_campaign)
- /admin/analytics (administrator_system, analyste)

## Offline-first
- Service worker basique dans public/sw.js
- Stockage local via RxDB + IndexedDB (Dexie) (collection collected_data)
- Synchronisation manuelle vers /api/sync

## Phase 6 - Admin web app
- Administration systeme: creation utilisateurs + reset PIN
- Administration campagne: creation zones, campagnes, assignations
- Analytics: resume des collectes, donnees, conflits, logs d'audit
