# Mimari kararlar

## ADR-001 — Çalışan Vite + Three.js tabanını koru

- **Bağlam:** Proje Vite 7, ES modülleri ve Three.js WebGL kullanıyor; 80+ yıldızda instancing var. 11 mevcut veri testi geçiyor.
- **Karar:** Faz 0'da render motoru yeniden yazılmayacak. TypeScript kademeli eklenecek; önce yeni veri ve senkron modülleri türlenip sonra büyük `main.js` bölünecek. IndexedDB gelecekte birincil depo, localStorage v3 geçiş kaynağı olacak.
- **Alternatifler:** Sıfırdan React/Canvas uygulaması veya mevcut tek JS dosyasını aynı biçimde büyütmek.
- **Sonuç:** Görsel davranış ve kullanıcı verisi korunur. Modülerleştirme ve 5.000 yıldız testi sonraki fazlarda zorunludur.

## ADR-002 — Migrasyondan önce ham yerel veriyi arşivle

- **Bağlam:** Açılıştaki `persist()` v3 anahtarını yazıyor; v2 dönüştürme ve v3 onarımından önceki baytlar ayrıca saklanmıyordu.
- **Karar:** v2 ve v3 raw string değerlerini IndexedDB `pre-migration` store içine anahtar başına ilk kez yaz; sonra `wordverse.schema.version` kaydını tut. Arşiv hiçbir açılışta üzerine yazılmayacak. JSON eski yedek içe aktarma v3 biçimini koruyacak.
- **Alternatifler:** localStorage içinde ikinci kopya (kota riski), yalnız mevcut ayna (ham v2 içermiyor).
- **Sonuç:** Geriye dönük kurtarma mümkün olur. IndexedDB engellenirse kullanıcıya yedek uyarısı gerekir.
