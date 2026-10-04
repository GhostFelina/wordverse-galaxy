# Windows / MacBook · Codex / Claude ortak devam düzeni

## Güncel cihaz / ajan devri · 2026-10-04

Kullanıcı ileride Claude veya MacBook ile devam etmek için güncel devir istedi. Aktif dal phase/4-universe, geliştirme sürümü1.14.1; HANDOFF başındaki2026-10-04 checkpoint geçerlidir. “Wordverse projemize kaldığımız yerden devam et” yeni cihazda devam yetkisidir. Mevcut klonu koru; temizse aktif dalı pull et, doctor ve ilgili resume komutunu çalıştır. Mac gerçek kurulumu bu Windows oturumunda doğrulanamadı; gerekli hesap girişleri cihazda tamamlanır.

## Tarihsel cihaz durdurma · 2026-10-03

Kullanıcı MacBook çalışmasını durdurdu ve Windows'ta devam edeceğini bildirdi.
Kullanıcı Faz 2 kabulünü sonraya bırakarak Faz 3–9 geliştirmeye geçilmesini istedi (ADR012). Faz 2 tamamlandı sayılmaz. Aktif geliştirme cihazı **Windows**; dal **`phase/4-universe`**. Önce mevcut Windows
klonunda değişiklikleri koruyarak temiz ağaçta `git fetch origin`,
`git switch phase/4-universe`, `git pull --ff-only` çalıştır; güncel `HANDOFF.md`
başındaki Windows devir bloğunu oku. Bu eski durdurma kaydı, kullanıcının yeni devam komutunu engellemez.
Mac'in yanlış eski main tabanındaki alternatif denemesi yalnız arşiv dalındadır:
`checkpoint/mac-2026-10-03-paused` (`0f94672`); merge veya cloud migration için kullanma.
Mac'in yeni yerel test veritabanı yedeği korunarak durduruldu.

Mac mevcut klonu `/Users/felina/Projects/wordverse-galaxy` olarak bildirildi; yeniden Mac'e geçilirse bu mevcut klasörü koru, Masaüstü'ne kendiliğinden taşıma. Aşağıdaki ilk kurulum betiği mevcut `~/Projects/wordverse-galaxy` klonunu da arar. Güncel Windows devir/kurulum commit'lerini pull etmeden eski main/alternatif şemadan devam etme.

## Ortak görev kaynağı

Repo https://github.com/GhostFelina/wordverse-galaxy; aktif dal `phase/4-universe`. STATE.json makine tarafından okunan dal/faz kaydıdır; HANDOFF.md tek güncel görev kaynağıdır. Faz 0/1 yeniden başlatılmaz. İki ajan da MASTER_PROMPT, HANDOFF, TASKS, KNOWN_ISSUES, DECISIONS ve session dosyalarını kullanır. Codex AGENTS.md, Claude CLAUDE.md aynı belgeleri gösterir.

Windows mevcut proje `C:\Users\User\Desktop\Projeler\kelime-evreni` taşınmaz. Mac gerçek Masaüstü/Projeler altında mevcut klonu korur veya yeni klon oluşturur.

## İlk MacBook kurulumu (bir kez)

Windows oturumu MacBook'a erişemez. Mac terminalinde bu iki satır public repodan kurulum dosyasını indirip çalıştırır:

```sh
curl -fL https://raw.githubusercontent.com/GhostFelina/wordverse-galaxy/phase/4-universe/scripts/setup-mac.sh -o "${TMPDIR:-/tmp}/wordverse-setup.sh"
bash "${TMPDIR:-/tmp}/wordverse-setup.sh"
```

Betiğin yaptığı işler:

1. macOS ve gerçek Masaüstü yolunu doğrular; mevcut doğru origin'li klonu korur, yoksa aktif dalı klonlar.
2. Homebrew mevcutsa eksik Git/Node 24/GitHub CLI kurar; Codex/Claude eksikse resmî npm paketlerinden kurar. Homebrew yoksa mevcut ajan resmî araç kurulumunu tamamlayıp betiği yeniden çalıştırır. Zorunlu OS izinlerini kullanıcı verir.
3. Temiz git ağacında fetch/switch/pull --ff-only; kirli ağaç korunur ve ajan önce mevcut değişiklikleri birleştirir. Reset/force kullanılmaz.
4. npm ci, Chromium ve eksik public .env.local isimleri kurulur. Mevcut env korunur. Google Secret/service_role/DB şifresi gerekmez.
5. Codex global AGENTS ve Claude global CLAUDE dosyasına aynı devam komutunu tanıyan repo yönlendirmesi eklenir; önceki metin korunur/yedeklenir. CODEX_HOME, dolu AGENTS.override.md ve CLAUDE_CONFIG_DIR esas alınır. Homebrew Node 24 yolu yeni terminalde bulunmayacaksa zsh/bash profiline yalnız PATH satırı eklenir, önce yedek alınır.
6. Gerekirse GitHub (GhostFelina), Codex ve Claude ilk giriş akışları açılır. **Giriş/2FA'yı kullanıcı bir kez tamamlar.** gh auth setup-git sonrası doctor repo okuma/yazma, git push --dry-run, iki ajan girişi, talimatlar ve env isimlerini kontrol eder. Token'lar repoya girmez.

İlk kurulumu ajanla yapmak istersen Codex veya Claude'ye bir kez:

> Wordverse projemize kaldığımız yerden devam et. Repo https://github.com/GhostFelina/wordverse-galaxy, aktif dal phase/4-universe. Gerçek OS/kabuk/Masaüstü yolunu kontrol et; mevcut klonu koru veya Masaüstü/Projeler altında klonla. CROSS_DEVICE.md ve HANDOFF.md'yi oku; rutin araç kurulumu, setup:device ve doctor kontrollerini tamamla. Bu proje için Codex/Claude global yönlendirmesi ve GitHub bağlantı kurulumu yetkisi verdim. Kullanıcı ilk girişleri tamamlayınca projeyi yerelde görünür aç ve sıradaki görevden devam et.

## Sonraki açılışlar ve limitte ajan değiştirme

İki ajan için komut: **wordverse projemize kaldığımız yerden devam et**.

Global yönergeler repo yolunu gösterir. Doğru proje klasöründen doğrudan alternatifler:

```sh
npm run resume:codex
npm run resume:claude
```

Bu komutlar temiz git ağacını günceller, aktif dalı kontrol eder, eksik public env isimlerini tamamlar, yönlendirmeyi yeniler ve seçilen ajan/GitHub ön kontrolü sonrası ajanı proje kökünde açar. İzin profili başka dizinden çalışmayı engellerse bu komutları proje klasöründen çalıştır; korumaları kapatma. Codex doğrudan alternatif: `codex -C <proje-yolu>`; Claude: proje klasöründe `claude`.

Limit yaklaşmadan: doğrula → HANDOFF/TASKS/session → commit/push → CI/preview durumunu kaydet. Aynı cihazdaki diğer ajan kirli ağacı inceleyerek kaydedilmemiş işi devralabilir; diğer cihaz yalnız push edilen dosyaları görür. İki ajan/cihaz aynı dalı aynı anda değiştirmemeli. Faz değişince STATE.json ve ilk kurulum URL/dalını birlikte güncelle.

## Başlangıç kontrolü / servisler

`npm run doctor -- --push-check` hazırlığı kontrol eder. Eksik rutin kurulum [SERVICE_ACCESS.md](SERVICE_ACCESS.md) ile tamamlanır. Windows connector/tarayıcı araçları başka CLI'ya otomatik aktarılmış varsayılmaz; servis CLI girişleri kendi cihazında yapılır. Kod/test ve public Supabase bağlantısı için secret istenmez.

`setup:device` bağımlılıkları yeniden kurar; `--dry-run` önizleme, `--register-only` yalnız iki ajan yönlendirmesi, `--skip-browser` Chromium kurulumunu atlar. Repo taşınırsa register-only eski yolu yeniler. node_modules taşınmaz. Node 24 önerilir, en az 22.13.

Her başlangıçta OS/kabuk, git ve dalı kontrol et; temizse pull --ff-only. HANDOFF → MASTER_PROMPT → KNOWN_ISSUES → TASKS → ENVIRONMENT oku. `npm run check` ve `npm run format:check`; `npm run dev -- --port 5360` ile http://127.0.0.1:5360/ görünür aç. Port doluysa sunucunun bu repo olduğunu kontrol et; kullanıcı sekmesini koru.

## Evren verisi

Git kodu/görevleri taşır; vendor sohbeti, .env.local veya yerel tarayıcı depolarını taşımaz. Hesap verisi Supabase üzerinden gelir: Windows “Eşitlendi”, diğer cihaz aynı Google hesabı. İlk girişte birleştir veya yalnız bulut evrenini aç. Çevrimdışı pending veri Windows bağlanmadan buluta geçmez. Misafir evreni JSON yedekle taşınır. Yerel/prod/preview farklı origin ve ayrı depodur. Faz 2 prod'a henüz alınmadı.

## Doğrulama sınırı

Windows'ta iki CLI giriş/yönlendirme, GitHub pull/push/admin ve push dry-run doğrulandı. Preview gerçek Google girişi, ayrı origin'de aynı 6 kayıt ve reload doğrulandı. **Gerçek MacBook kurulumu henüz çalıştırılmadı**; ilk Mac oturumunda doctor/test/görsel kanıt tamamlanmalı. Ağ/hesap yetkisi/ajan limitleri için sıfır hata garantisi verilemez; somut kurtarma adımları hazırdır.

Kaynaklar: [Codex talimatları](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude talimatları](https://code.claude.com/docs/en/memory), [Claude kurulumu](https://code.claude.com/docs/en/setup), [GitHub giriş](https://cli.github.com/manual/gh_auth_login).
