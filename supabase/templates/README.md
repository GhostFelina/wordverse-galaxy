# Auth e-posta şablonları

`node scripts/generate-auth-emails.mjs`: locales içindeki email metinlerinden confirmation/recovery Go şablonları ve altı sır içermeyen yerel görsel preview üretir. Kaynak metinleri HTML escape edilir. İzleme pikseli, JavaScript ve harici font/görsel yoktur.

Kayıtta gönderilen `user_metadata.ui_locale` EN/ES seçer; diğer/eksik değer TR. Bu metadata yalnız e-posta dili içindir, yetkilendirmede kullanılmaz. Google kullanıcısı veya kayıtlı tercih olmadan gelen recovery TR'dir; sıfırlama ekranında seçilmiş dil, kullanıcının kayıtlı metadata'sını değiştirmez.

Supabase `ConfirmationURL` ile PKCE akışı kullanılır. Link yalnız ilgili sağlayıcının doğrulama uç noktasına gider; yeni parola Wordverse'te kullanıcı tarafından girilir. Bağlantıyı/token'ı Git, log veya screenshot'a koyma. Mail linkini aynı tarayıcıda aç; PKCE doğrulayıcısı cihazda kalır. E-posta tarayıcıları linki tüketebilir; gerçek teslimat/link tıklama kabulü bekliyor.

Hosted ayarlar config.toml ile otomatik deploy edilmez. Hedef yalnız mrkmtcpzyvooreeokmkp → Authentication → Emails. 2026-10-03 Dashboard artık düzenleme için custom SMTP veya Pro gerektiriyor; şablonlar hosted'e henüz uygulanmadı. Ücretli plan açılmadı. SMTP sağlayıcısı/girişi/sırrı kullanıcı tarafından güvenli Dashboard alanına girilmeli. Subject için kısa üç dilli marka başlığı kullanılabilir; gerçek sunucu şablon derleme/teslimat kabulü henüz yok.

Kaynaklar: [E-posta şablonları](https://supabase.com/docs/guides/auth/auth-email-templates), [Yerel config](https://supabase.com/docs/guides/local-development/customizing-email-templates).
