# Auth e-posta şablonları

`node scripts/generate-auth-emails.mjs`: locales içindeki email metinlerinden confirmation/recovery Go şablonları ve altı sır içermeyen yerel görsel preview üretir. Kaynak metinleri HTML escape edilir. İzleme pikseli, JavaScript ve harici font/görsel yoktur.

Kayıtta gönderilen `user_metadata.ui_locale` EN/ES seçer; diğer/eksik değer TR. Bu metadata yalnız e-posta dili içindir, yetkilendirmede kullanılmaz. Google kullanıcısı veya kayıtlı tercih olmadan gelen recovery TR'dir; sıfırlama ekranında seçilmiş dil, kullanıcının kayıtlı metadata'sını değiştirmez.

Supabase `ConfirmationURL` ile PKCE akışı kullanılır. Link yalnız ilgili sağlayıcının doğrulama uç noktasına gider; yeni parola Wordverse'te kullanıcı tarafından girilir. Bağlantıyı/token'ı Git, log veya screenshot'a koyma. Mail linkini aynı tarayıcıda aç; PKCE doğrulayıcısı cihazda kalır. E-posta tarayıcıları linki tüketebilir; gerçek teslimat/link tıklama kabulü bekliyor.

Hosted ayarlar config.toml ile otomatik deploy edilmez. Hedef yalnız mrkmtcpzyvooreeokmkp → Authentication → Emails. 2026-10-03 Dashboard artık düzenleme için custom SMTP veya Pro gerektiriyor; şablonlar hosted'e henüz uygulanmadı. Ücretli plan açılmadı. SMTP sağlayıcısı/girişi/sırrı kullanıcı tarafından güvenli Dashboard alanına girilmeli. Subject için kısa üç dilli marka başlığı kullanılabilir; gerçek sunucu şablon derleme/teslimat kabulü henüz yok.

Kaynaklar: [E-posta şablonları](https://supabase.com/docs/guides/auth/auth-email-templates), [Yerel config](https://supabase.com/docs/guides/local-development/customizing-email-templates).


## Gerçek Go motoruyla yerel kontrol

`npm run emails:check:go` Go CLI varsa `html/template` ile 24 confirmation/recovery senaryosunu çalıştırır: TR/EN/ES, eksik Data, eksik/null/yanlış türde locale ve tam URL query kaçışı. CI actions/setup-go ile Go 1.27.1 kurup bu kapıyı zorunlu çalıştırır. Bu hosted Supabase/Auth veya SMTP teslimatı kabulü değildir.

Şablonda önce güvenli locale string'i atanır, `with .Data` eksik metadata'yı atlar; sayı/bool/nesne/dizi locale TR'ye düşer. İlk gerçek Go denemesi nil Data halinde eski `.Data.ui_locale` ifadesinin hata verdiğini yakaladı ve düzeltildi. Metadata yine sadece dil sunumudur.

Görsel Go çıktısı üretmek için `go run scripts/verify-auth-emails.go --preview-dir tests/fixtures/emails/go-rendered`; bu yapay callback içerir ve çıktı Git dışıdır. Yerel Vite'de o klasördeki HTML açılır. Go uygulama geliştirme/build bağımlılığı değildir; yalnız bu ek template gate için gerekir. Mac'te Go yoksa rutin resmi Go kurulumu tamamlanır veya CI sonucundan devam edilir; npm run check Go istemez.

Windows'ta bu kontrol için resmi SHA256 doğrulanmış portable Go `.tools/go1.27.1/go/bin/go.exe` kullanıldı; sistem PATH'i/profili değiştirilmedi, `.tools/` Git dışıdır. Diğer cihaza binary taşınmaz. [Go html/template](https://pkg.go.dev/html/template), [resmi indirmeler](https://go.dev/dl/).
