# Windows ↔ MacBook devam düzeni

## Tek güncel kaynak

- Repo: https://github.com/GhostFelina/wordverse-galaxy
- Aktif dal: `phase/2-auth-sync`; Faz 0/1 bitti, Faz 2 sürüyor. Son durum ve sıradaki işler **HANDOFF.md** içindedir.
- Windows klasörü: `C:\Users\User\Desktop\Projeler\kelime-evreni`. Mevcut klasörü taşıma.
- MacBook klasörü ilk kurulumda gerçek Masaüstü altında seçilir. Windows yolu, kullanıcı adı veya iCloud eşitlemesi varsayılmaz.
- GitHub kodu, testleri ve devir belgelerini taşır. Codex konuşma geçmişi, `.env.local`, oturum token'ları ve tarayıcı IndexedDB/localStorage verileri GitHub üzerinden taşınmaz.

## İlk MacBook oturumu (bir kez)

Bu Windows oturumu MacBook'a erişemez. MacBook'ta yönlendirme henüz kurulmadıysa Codex'e bir kez şu tam mesajı ver:

> Wordverse kaldığın yerden devam et. Repo https://github.com/GhostFelina/wordverse-galaxy, aktif dal phase/2-auth-sync. Gerçek işletim sistemi, kabuk ve Masaüstü yolunu kontrol et. Önce mevcut Wordverse klonunu bul; yoksa Masaüstü/Projeler altında klonla. Mevcut değişiklikleri koru. docs/handoff/CROSS_DEVICE.md ve HANDOFF.md'yi oku; gerekli rutin araç kurulumlarını yap, npm run setup:device çalıştır ve projeyi yerelde görünür tarayıcıda aç. Bu proje için Codex global yönlendirmesini ekleme yetkisi verdim. Sonra HANDOFF.md'deki ilk görevden devam et.

Alternatif: **yalnız macOS terminalinde**, Node 24 ve Git mevcutken, henüz klon yoksa:

```sh
desktop_dir="$(cd "$HOME/Desktop" && pwd -P)"
mkdir -p "$desktop_dir/Projeler"
git clone --branch phase/2-auth-sync https://github.com/GhostFelina/wordverse-galaxy.git "$desktop_dir/Projeler/wordverse-galaxy"
cd "$desktop_dir/Projeler/wordverse-galaxy"
npm run setup:device
codex -C "$PWD" "wordverse kaldığın yerden devam et"
```

Masaüstü yolu erişilemiyorsa gerçek yolu bulmadan devam etme. Klon zaten varsa klon komutunu tekrar çalıştırma; mevcut klasöre geç. GitHub/Codex giriş, 2FA veya işletim sistemi izni gerekirse kullanıcı tamamlar. Node yoksa mevcut cihaz yöneticisiyle Node 24 kur; rastgele uzak betikleri kabuğa pipe etme.

`setup:device` gerçek OS/CPU/kabuk ve repo yolunu gösterir, `npm ci` ve Chromium kurulumu yapar. Ana görevde kullanıcı tarafından verilmiş **public** Supabase yapılandırmasından yalnız eksik `.env.local` isimlerini ekler; mevcut değerleri korur. Google Secret, service_role veya DB şifresi gerekmez. Mevcut global Codex talimatlarını koruyarak Wordverse bloğunu ekler; ilk değişiklikten önce `.wordverse-backup` kopyası alır. `CODEX_HOME` ve dolu `AGENTS.override.md` varsa bunları esas alır. Shell profiline dokunmaz.

Seçenekler: `npm run setup:device -- --dry-run` dosya değiştirmez; `--register-only` yalnız yönlendirme ekler; `--skip-browser` Chromium kurulumunu atlar. Repo taşınırsa betiği yeniden çalıştır; eski yol aynı blokta güncellenir.

## Sonraki açılışlar

Yeni Codex oturumunda **“wordverse kaldığın yerden devam et”** de. Global blok doğru repo yolunu buldurur. Güvenilir doğrudan alternatif: `codex -C <bu-cihazdaki-proje-yolu> "wordverse kaldığın yerden devam et"`. Codex izin profili farklı bir dizinde çalışmayı engellerse bu doğrudan komutu kullan; izin mekanizmasını kapatma.

Her ajan başlangıcı:

1. OS/kabuk, repo origin, aktif dal ve `git status` kontrolü. Temizse `git pull --ff-only`; cihaz değişiminde dalı HANDOFF.md ile eşleştir. Kirli ağaçta reset/force/stash ile işi gizleme.
2. HANDOFF → MASTER_PROMPT → KNOWN_ISSUES → TASKS → ENVIRONMENT oku. Yeni klonda `npm run setup:device`, güncellenen lock dosyasında `npm ci`. Cihazlar arasında node_modules kopyalama.
3. `npm run check` ve `npm run format:check`; yerel uygulamayı `npm run dev -- --port 5360` ile aç, `http://127.0.0.1:5360/` görünür tarayıcıda doğrula. Port doluysa önce çalışan sunucunun bu repo olduğunu kontrol et; kullanıcı sekmesini koru.
4. HANDOFF ilk üç adımdan devam et; şifre/2FA/Google Secret gereken adımlar kullanıcıya bırakılır.

## Cihazı bırakmadan önce

Anlamlı değişiklikleri doğrula → HANDOFF/TASKS/session güncelle → commit/push → uzak CI ve preview kontrol et. Commit hash, branch, sıradaki iş ve doğrulanmamış kısmı yaz. Aynı dalı iki cihazda aynı anda değiştirme; önce önceki cihazın push'unu al. Oturumlar birbirlerinin yerel dosyalarını kendiliğinden görmez.

## Kullanıcının evreni

Hesapla girişte yalnız buluta onaylanmış veriler başka cihazda görünür; Windows'taki senkron göstergesi “Eşitlendi” olmalı. MacBook'ta aynı Google hesabıyla giriş yap. İlk hesap açılışında merge penceresi gösterilebilir: mevcut Mac misafir verisini koruyarak birleştir veya yalnız bulut evrenini kullan. Çevrimdışı bekleyen Windows kayıtları Windows yeniden bağlanmadan buluta geçmez. Misafir verisi için JSON dışa aktar/içe aktar kullan. Yerel `127.0.0.1:5360` ile prod farklı origin olduğundan ayrı tarayıcı depolarıdır. Faz 2 henüz prod'a alınmadı.

## Doğrulama sınırı ve kaynak

Kurulum bu oturumda Windows üzerinde denenir; **macOS kurulumu henüz gerçek cihazda çalıştırılmadı**. İlk Mac oturumunda gerçek doğrulama yapılıp HANDOFF'a eklenmeli. Codex global talimat keşfi: [resmî AGENTS.md rehberi](https://learn.chatgpt.com/docs/agent-configuration/agents-md); çalışma dizini seçimi: [resmî CLI referansı](https://learn.chatgpt.com/docs/developer-commands?surface=cli). Konuşmanın otomatik cihazlar arası sürmesi yerine Git ve devir dosyalarıyla görev sürdürülür.
