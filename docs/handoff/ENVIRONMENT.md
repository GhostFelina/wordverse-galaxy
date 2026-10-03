# Geliştirme ortamı

- Windows 11 Pro, PowerShell 7.6.6, Node 24.20.0, npm 11.19.0.
- Proje: `C:\Users\User\Desktop\Projeler\kelime-evreni`.
- Repo: `https://github.com/GhostFelina/wordverse-galaxy`; canlı site: `https://wordverse-galaxy.vercel.app`.
- Kurulum: `npm ci`; geliştirme: `npm run dev` (127.0.0.1:5350; kullanıcıya açık oturum şu an 5360); test ve build: `npm run check`. Kanonik dil yolları `/`, `/en/`, `/es/` ve Hakkında eşleridir.
- Bugün bulut env anahtarı gerekmiyor. Faz 2 için planlanan adlar: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Değerler yalnız `.env.local` ve Vercel ortamında tutulacak.
- `main` v1.11.0 kullanıcı verisi: yeni yazma anahtarı localStorage `wordverse.universe.v4`; eski `wordverse.universe.v3` ve `wordverse.words.v2` kayıtları silinmeden taşınır. IndexedDB `wordverse-local-backup` arşiv ve ayna kopyası var. JSON dışa aktarma, cihaz dışı yedek yöntemidir.
- Faz 2 dalı: IndexedDB `wordverse-offline` / `state` birincil depo; localStorage v4 ve `wordverse.local.revision` eşzamanlı kurtarma kopyası. Eski arşiv/ayna korunuyor.
- Hedef Supabase Dashboard erişimi mevcut. CLI/MCP hesapları farklı olduğundan SQL migration Dashboard'da uygulandı; CLI link/repair henüz yapılmadı. Aynı migration'ı `db push` ile körlemesine tekrar uygulama; önce geçmişi eşleştir.
- Bulut veritabanı yedekleme stratejisi Faz 2 şema ve hosting seçimi netleştiğinde yazılacak.
