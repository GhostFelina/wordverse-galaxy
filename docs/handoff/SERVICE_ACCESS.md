# Codex / Claude servis erişimi ve kurtarma

Bu rehber iki ajan ve Windows/macOS için ortaktır. Hesap token'ları cihazda güvenli depoda kalır; repoya kopyalanmaz. Eksik araç veya public env nedeniyle işi bırakma: ilgili kurulum komutunu uygula. Şifre/2FA/ilk yetkilendirme kullanıcı adımıdır; tamamlandıktan sonra aynı göreve devam et.

| İhtiyaç | Kaynak / adım | Kontrol |
| --- | --- | --- |
| Kod ve görev durumu | Public `GhostFelina/wordverse-galaxy`, STATE.json aktif dalı; HANDOFF tek durum kaynağı | `git status`, `git pull --ff-only` (temizse) |
| GitHub yazma/PR/CI | `gh auth login --hostname github.com --web --git-protocol https --scopes workflow`; GhostFelina hesabıyla kullanıcı giriş yapar. Ardından `gh auth setup-git --hostname github.com` | `npm run doctor -- --push-check`; `gh api repos/GhostFelina/wordverse-galaxy` permissions pull/push olmalı |
| Codex | Eksikse `npm install -g @openai/codex`, ilk giriş `codex login` | `codex --version`, `codex login status` |
| Claude Code | Eksikse `npm install -g @anthropic-ai/claude-code`, ilk giriş `claude auth login` | `claude --version`, `claude auth status` |
| Uygulama Supabase bağlantısı | `setup:device` MASTER_PROMPT'ta kullanıcı tarafından verilen **public** client yapılandırmasından eksik .env.local isimlerini oluşturur | Doctor env **isimlerini** kontrol eder; değerleri yazdırmaz |
| Supabase yönetimi | Hedef **mrkmtcpzyvooreeokmkp**. CLI için `npx supabase --help`, `npx supabase login`; doğru hesaba kullanıcı giriş yapar. Dashboard: https://supabase.com/dashboard/project/mrkmtcpzyvooreeokmkp | Yanlış hesap/projede migration çalıştırma. Mevcut iki migration Dashboard'da uygulanmış; link/list/repair ile geçmişi eşleştir, körlemesine db push yapma |
| Vercel preview/env | `npx vercel --help`, gerekiyorsa `npx vercel login`, hedef team mustafas-projects-92e683a9 / wordverse-galaxy | `npx vercel ls wordverse-galaxy`, `npx vercel env ls`; üç public env adı üç ortamda mevcut |
| Yerel görsel kabul | Repodaki Playwright/Chromium; kullanıcının uygulamasını görünür tarayıcıda aç | `npm run check`, evidence; dış servislerde CDP kullanma |

## Yetki durumu (2026-10-03)

Windows'ta GitHub GhostFelina hesabı etkin; repo API'sinde pull/push/admin izinleri doğrulandı, gerçek commit/push geçti. Doctor Codex/Claude kurulum/giriş/yönlendirme ve **git push --dry-run** kontrollerini geçti. MacBook'ta bu izinler, kullanıcı o cihazda giriş yaptıktan sonra ayrıca doğrulanır. Public repo okunabilir olması push izni olduğu anlamına gelmez.

Windows Codex uygulama connector'ları ve tarayıcı bağlantıları başka CLI'ya otomatik aktarılmış sayılmaz. Claude/CLI kod, SQL, test ve devir dosyalarını doğrudan kullanır; servis için kendi CLI girişi/API veya erişilebilir Dashboard kullanılabilir. Aynı görev için yeni servis hesabı/ücretli plan açma. Google Client Secret yalnız Supabase'de hazır; geliştirme cihazlarına gerekmez. service_role ve DB şifresi istemci geliştirmenin gereksinimi değildir.

## Limit ve devri kurtarma

- Her anlamlı adımın ardından HANDOFF/TASKS/session güncelle, küçük commit ve push yap. Limit biteceği zaman son 30–45 dakikanın işi yalnız yerelde kalmamalı.
- Aynı cihazda limit aniden biterse diğer ajan **kirli git ağacını önce inceleyerek** kaydedilmemiş çalışmayı devralır; dosyaları silmez veya reset etmez. Aynı cihazın push edilmiş olması gerekmez; diğer cihazın görebilmesi için push gerekir.
- Diğer cihazda ağ/GitHub girişi yoksa yerel klondaki bağımsız işi sürdür; uzak işlere ilişkin eksik erişimi somut giriş adımıyla kaydet. Veri veya ücret gerektiren izinleri varsayma.
- Faz/branch değişince STATE.json, HANDOFF ve CROSS_DEVICE'i birlikte güncelle. İlk Mac bootstrap URL'si aktif dala işaret eder; yeni faza geçildiğinde örnekteki URL/dal da yenilenmelidir.
- Kaybolan vendor konuşmasını kurtarmaya çalışmak gerekmez: görev tanımı, kararlar, testler ve sıradaki adımlar Git'tedir. Her ajan kendi limitinde kaldığı işi ortak belgelerde bırakır.

Resmî kaynaklar: [GitHub cihaz girişi](https://cli.github.com/manual/gh_auth_login), [Git credential helper](https://cli.github.com/manual/gh_auth_setup-git), [Claude global/project talimatları](https://code.claude.com/docs/en/memory), [Claude kurulum](https://code.claude.com/docs/en/setup), [Codex talimatları](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
