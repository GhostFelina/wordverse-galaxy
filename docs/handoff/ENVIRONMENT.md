# Geliştirme ortamı

- Windows 11 Pro, PowerShell 7.6.6, Node 24.20.0, npm 11.19.0.
- Proje: `C:\Users\User\Desktop\Projeler\kelime-evreni`.
- Repo: `https://github.com/GhostFelina/wordverse-galaxy`; canlı site: `https://wordverse-galaxy.vercel.app`.
- Kurulum: `npm ci`; geliştirme: `npm run dev` (127.0.0.1:5350); test ve build: `npm run check`.
- Bugün bulut env anahtarı gerekmiyor. Faz 2 için planlanan adlar: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Değerler yalnız `.env.local` ve Vercel ortamında tutulacak.
- `main` v1.10.0 kullanıcı verisi: localStorage `wordverse.universe.v3`, eski kayıt `wordverse.words.v2`. Faz 1 dalında yeni yazma anahtarı `wordverse.universe.v4`; v3 ve v2 kayıtları silinmeden taşınır. IndexedDB `wordverse-local-backup` arşiv ve ayna kopyası var. JSON dışa aktarma, cihaz dışı yedek yöntemidir.
- Bulut veritabanı yedekleme stratejisi Faz 2 şema ve hosting seçimi netleştiğinde yazılacak.
