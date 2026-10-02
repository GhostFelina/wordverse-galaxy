# Faz 0 başlangıç denetimi — 2026-10-02

## Kod ve yığın

- Vite 7.3.6, Three.js 0.180 aralığı, vanilla JavaScript; iki HTML girişi (`index.html`, `about.html`).
- `src/main.js` yaklaşık 945 satır; DOM, WebGL sahnesi, form, arama, veri yazımı aynı modülde.
- Render: Three.js `WebGLRenderer`, shader noktaları, sprite/mesh katmanları. 80 yıldızdan itibaren üç `InstancedMesh` katmanı. Canvas 2D yalnız doku üretimi için.
- `src/universe-data.js` şema v3: `galaxies`, `activeGalaxyId`, `words`, `events`. V2 kelimeler yüklemede İngilizce galaksiye taşınıyor. Kayıt türü `kind` alanında; boş/eksik değer kelime sayılıyor. JSON merge yalnız v3 kabul ediyor.
- Kalıcılık: v3 localStorage birincil, IndexedDB ayna ikincil. Açılışta bozuk ana veri aynadan kurtarılabiliyor; mevcut ham verinin dönüşüm öncesi arşivi yoktu.
- Erişilebilirlik ve diller: UI Türkçe sabit metin; `prefers-reduced-motion` okunuyor. Giriş ve senkron yok.

## Ölçümler ve riskler

- Başlangıç `npm test`: 11/11 geçti; `npm run build` geçti.
- Minify JS: 534.37 kB, gzip 139.30 kB; Vite büyük parça uyarısı.
- Önceki README'deki 200 yıldız bulgusu 644→20 çizim çağrısı; FPS 5.000 yıldızda doğrulanmamış.
- `mergeUniverse` yalnız v3 JSON kabul ediyor; v2 dosya içe alma için ayrı sürümlü dönüşüm gerekiyor.
- Ayna kayıt asenkron; sekme hemen kapanırsa son yazıma yetişmeyebilir. JSON dışa aktarma korunmalı.

## Hedef

ADR-001 ve ADR-002 geçerlidir. Faz 0: veri arşivi, test/CI ve devir; Faz 1–2: modüler TypeScript veri modeli, çok dilli UI ve IndexedDB birincil depoya kontrollü geçiş. Her aşamada eski v3 ve v2 veriler için fixture testleri.
