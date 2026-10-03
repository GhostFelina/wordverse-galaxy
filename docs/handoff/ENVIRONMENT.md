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
- Bulut yedekleme planı aşağıda; henüz zamanlanmış dump veya restore tatbikatı yapılmadı.

## Yedekleme ve kurtarma planı

- Wordverse Dashboard şu anda FREE organizasyonunda. Free projede günlük yönetilen yedek garantisi varsayma. [Supabase yedek belgeleri](https://supabase.com/docs/guides/platform/backups) düzenli CLI export ve cihaz dışı kopya öneriyor; ücretli plan/PITR açılmadı.
- Kullanıcı kurtarma katmanı: önemli düzenleme ve cihaz geçişi öncesi hesapta “Eşitlendi” durumunu kontrol et, Galaksilerim → JSON indir. Misafir için de indir. Dosyayı kullanıcının özel cihaz dışı deposunda sakla; GitHub'a yükleme. JSON hesabın oturum bilgilerini içermez, fakat kelimeler kişisel veridir.
- Operasyon hedefi (ölçülmüş SLA değildir): günlük ve her şema değişikliğinden önce dump; son 7 günlük ve 4 haftalık şifreli özel kopya. Hedef RPO 24 saat / RTO 4 saat. Zamanlama, özel depolama ve gerçek restore denemesi henüz kurulmadı; bu hedefler garanti değildir.
- CLI doğru Supabase hesabına bağlandıktan sonra proje ref'i **mrkmtcpzyvooreeokmkp** ve bağlantı hedefini doğrula. `npx supabase@2.119.0 db dump --help` kontrol edildi. Parola yalnız yerel `SUPABASE_DB_PASSWORD` ortamında; komut satırına veya log'a yazma. Docker/pg_dump gereksinimini o cihazda kontrol et.
- Repo içindeki `private-backups/` Git tarafından dışlanır. Klasör oluşturulduktan sonra aynı komutlar Windows/macOS'ta kullanılabilir:

```text
npx supabase@2.119.0 db dump --linked --schema public --file private-backups/public-schema.sql
npx supabase@2.119.0 db dump --linked --schema public --data-only --use-copy --file private-backups/public-data.sql
```

- Bunlar uygulama tablolarını kurtarma kopyasıdır; tam proje/Auth yedeği değildir. Tam felaket kurtarma için Auth kullanıcıları/kimlikler ve yetkili rol ayarlarının özel yedeği ayrıca gerekir. Sağlayıcı şemalarının desteklenen restore sırası güncel [backup/restore rehberi](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) üzerinden seçilir. OAuth/SMTP sırları Git yerine hesapların güvenli yönetiminde kalır.
- Veritabanı dump'ı Storage dosyalarının yalnız metadata'sını içerir. `wordverse-avatars` dosya içeriği ayrıca yetkili Storage API ile özel yedeklenmeli; avatar kullanımı henüz başlamadı. Bucket private, 2 MiB, JPEG/PNG/WebP; kullanıcı folder'ı ve `owner_id` birlikte denetlenir.
- Restore önce izole yerel/test projede denenir: migration sürümleri, iki hesaplı RLS, canlı satır/tombstone sayıları ve geçmiş, uygulama JSON import/export, avatar erişimi doğrulanır. Prod geri yükleme mevcut kullanıcı verisini değiştireceği için kullanıcı onayı gerekir. Eski JSON'dan geri alma birleştirme yapar; bulutun tamamını veya Auth'u restore etmez.

## Cihazlar arası geliştirme

[CROSS_DEVICE.md](CROSS_DEVICE.md) ilk MacBook kurulumu ve Codex/Claude limit devri düzenidir. `setup:device` bağımlılıkları cihazda kurar, eksik public env isimlerini ve iki global ajan yönlendirmesini önceki metni koruyarak ekler. `npm run doctor -- --push-check` GitHub yazma/giriş/araç/env kontrolü; `resume:codex` ve `resume:claude` ajanı güncel repo kökünde açar. STATE.json aktif faz/dal, [SERVICE_ACCESS.md](SERVICE_ACCESS.md) servis giriş/kurtarma rehberidir. Node 24 önerilir (`.nvmrc` / `.node-version`), en az 22.13. Windows doğrulaması macOS doğrulaması yerine geçmez. Tarayıcı verisi Git ile taşınmaz; hesap verisi Supabase, misafir evreni JSON yedekle aktarılır.
