# Geliştirme ortamı

- Windows 11 Pro, PowerShell 7.6.6, Node 24.20.0, npm 11.19.0.
- Proje: `C:\Users\User\Desktop\Projeler\kelime-evreni`.
- Repo: `https://github.com/GhostFelina/wordverse-galaxy`; canlı site: `https://wordverse-galaxy.vercel.app`.
- Kurulum: `npm ci`; geliştirme: `npm run dev` (127.0.0.1:5350; kullanıcıya açık oturum şu an 5360); test ve build: `npm run check`. Kanonik dil yolları `/`, `/en/`, `/es/` ve Hakkında eşleridir.
- Faz 2 yerel env adları: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GOOGLE_AUTH_ENABLED`. Yerelde Google flag etkin; üç isim Vercel Production/Preview/Development ortamlarına eklendi. Değerleri log'a veya devir belgelerine yazma.
- `main` v1.11.0 kullanıcı verisi: yeni yazma anahtarı localStorage `wordverse.universe.v4`; eski `wordverse.universe.v3` ve `wordverse.words.v2` kayıtları silinmeden taşınır. IndexedDB `wordverse-local-backup` arşiv ve ayna kopyası var. JSON dışa aktarma, cihaz dışı yedek yöntemidir.
- Faz 2 dalı: IndexedDB `wordverse-offline` / `state` birincil depo; localStorage v4 ve `wordverse.local.revision` eşzamanlı kurtarma kopyası. Eski arşiv/ayna korunuyor.
- Hesap çekirdeği: IndexedDB `wordverse-accounts` / `accounts`, kullanıcı kimliğiyle ayrı kayıt ve atomik evren/bekleyen işlem listesi. Main/auth UI bağlı; gerçek Google oturumu ve senkron yerelde doğrulandı. TypeScript 6.0.3 + typescript-eslint 8.71.0 tam sürümler; TS7 parser destek aralığının dışında olduğundan uyumlu çift seçildi.
- Supabase Site URL prod. Dönüş kalıpları: prod `/**`, yalnız `wordverse-galaxy-*-mustafas-projects-92e683a9.vercel.app/**`, localhost ve 127.0.0.1 üzerinde 5350/5360 `/**`.
- Hedef Supabase Dashboard erişimi mevcut. CLI/MCP hesapları farklı olduğundan SQL migration Dashboard'da uygulandı; CLI link/repair henüz yapılmadı. Aynı migration'ı `db push` ile körlemesine tekrar uygulama; önce geçmişi eşleştir.
- Bulut veritabanı yedekleme stratejisi Faz 2 şema ve hosting seçimi netleştiğinde yazılacak.

## Cihazlar arası geliştirme

[CROSS_DEVICE.md](CROSS_DEVICE.md) ilk MacBook kurulumu ve sonraki oturumların devam düzenidir. `npm run setup:device` bağımlılıkları cihazda yeniden kurar, eksik public env isimlerini ekler ve global Codex talimatlarına repo yönlendirmesini mevcut metni koruyarak kaydeder. Node 24 önerilir (`.nvmrc` / `.node-version`); en az Node 22.13. Windows'taki doğrulama macOS doğrulaması yerine geçmez. Tarayıcı verisi Git ile taşınmaz; hesap verisi Supabase, misafir evreni JSON yedekle aktarılır.
