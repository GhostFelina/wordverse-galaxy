# Wordverse desktop atlas

## Masaüstü atlas geliştirmesi · 2026-10-12 · 1.16.0

Kullanıcı devam istedi; masaüstü ürün/görsel önceliği sürer, mobil/giriş ertelidir. Atlas500–620px, daha kompakt başlık ve arama, serif kayıt adları, küçük dört uçlu ışıklar, kayıt tarihleri ve sakin ayırıcılar. Tümü/kelimeler/bağlaçlar filtresi; gerçek createdAt'a göre en yeni/en eski ve doğal alfabetik sıralama. NFC ve locale-aware kelime/anlam araması. Filtre/sort/search ephemeral, öğrenme deposuna yazılmaz. Kaydı açınca Atlasa dön aynı filtre/sort'u korur; owner/aktif galaksi değişiminde sıfırlanır.

- WebGL başlangıç hatası veya ana context loss: masaüstü kalıcı ve sade atlas erişimi; immersive güvenli çıkış, kamera eylemleri kapalı, atlas/detay/tekrar kullanılabilir. Restore sonrası aynı sahne devam eder; kullanıcı kayıtları değişmez. Yeni mobil arayüz yok. Preview context kayıpken visibility yeniden çizimi de engellendi.
- Son kaynak123unit/lint/typecheck/build/format/release geçti. Son genel38tarayıcı (atlas3+graphics2+camera8+smoke25)1.5m geçti; sahne hazır beklemesi sonrası atlas3/3 (14.7s) kanıt yenilendi. Önceki10hedefli atlas/grafik/yıldız turu54.6s geçti. Tam97remote gate push sonrası izlenir; eski92remote başarı8ad9614’e aittir.
- Kanıtlar: atlas1440TR/1280EN/1024ES; grafik yokken1440sentetik. Gerçek5360 Chrome atlas/filtre manuel incelendi; özel ekran/kayıt dışa aktarılmadı.
- Uygulama5a00d01. [1.16.0 preview](https://wordverse-galaxy-54l4qhw44-mustafas-projects-92e683a9.vercel.app) READY;aynı Git SHA/project doğrulandı. Mevcut Vercel CLI auth ileHTML/JS/CSS HTTP200; ana JS/CSS SHA256 yerel derlemeyle eşleşti. İnteraktif preview/hesap kabulü yapılmadı.
- Masaüstü sentetik frame-time kanıtı:1440×900,3kadraj×5s/2s warmup; hareketli gaz ve12/1kelime yıldızı. Default Chromium153 SwiftShader:genel/yan p95~16.8ms, yakın~33.4ms. Ayrı ephemeral Chrome154 ANGLE/D3D11, WebGL renderer NVIDIA RTX5060Ti:üç kadraj p95~7.1ms (~144RAF/s), errors0/storage0. Browser profile/headless fixture; GPU timer query değildir, görünür kullanıcı Chrome/5000kayıt/uzun seans kabulü değildir. İki JSON evidence içinde; tarayıcı ayarı kalıcı değiştirilmedi.
- Preview hedefi; production1.14.1/main/tag değişmedi. U2 görsel kabulü açık. Renderer fallback kabulü gerçekGPU p95 veya donanım kabulü değildir.
- Sıradaki: remote97gate/preview → gerçek masaüstüGPU p95 ve görsel kabul → kalıcı tekrar/offline/owner tasarımı. Kapalı katalogları yeniden açma.
