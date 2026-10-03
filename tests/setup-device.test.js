import { describe, expect, it } from 'vitest';
import { publicEnvironment, routeInstructions } from '../scripts/setup-device.mjs';

describe('cihaz kurulumu veri koruması', () => {
  it('Claude aynı devam komutuyla kendi başlangıç belgesine yönlenir', () => {
    const text = routeInstructions(
      '# Claude kişisel tercihler\n',
      '/Users/mustafa/Desktop/Projeler/wordverse-galaxy',
      'claude',
    );
    expect(text).toContain("CLAUDE.md'yi oku");
    expect(text).toContain('wordverse projemize kaldığımız yerden devam et');
    expect(text).toContain('HANDOFF.md tek güncel görev kaynağıdır');
    expect(text.startsWith('# Claude kişisel tercihler\n')).toBe(true);
  });
  it('mevcut global talimatları korur ve taşınan proje yolunu tek blokta günceller', () => {
    const original = '# Tercihler\r\nTürkçe konuş.\r\n';
    const first = routeInstructions(original, 'C:\\Users\\User\\Desktop\\Projeler\\kelime-evreni');
    const second = routeInstructions(first, '/Users/mustafa/Desktop/Projeler/wordverse-galaxy');
    expect(second.startsWith(original)).toBe(true);
    expect(second.match(/wordverse-routing:start/g)).toHaveLength(1);
    expect(second).not.toContain('C:\\\\Users');
    expect(routeInstructions(second, '/Users/mustafa/Desktop/Projeler/wordverse-galaxy')).toBe(second);
  });
  it('eksik veya ters işaretlerde global dosyayı değiştirmeyi reddeder', () => {
    expect(() => routeInstructions('<!-- wordverse-routing:start -->', '/repo')).toThrow();
    expect(() =>
      routeInstructions('<!-- wordverse-routing:end --><!-- wordverse-routing:start -->', '/repo'),
    ).toThrow();
  });
  it('mevcut env ve token değerlerini korur; yalnız eksik public isimleri ekler', () => {
    const master = "Proje URL'si: `https://example.supabase.co`\nPublishable key: `sb_publishable_test_fixture`";
    const previous =
      'VERCEL_OIDC_TOKEN=fixture\nVITE_SUPABASE_URL=https://other.supabase.co\nVITE_GOOGLE_AUTH_ENABLED=false\n';
    const result = publicEnvironment(master, previous);
    expect(result.startsWith(previous)).toBe(true);
    expect(result).not.toContain('VITE_SUPABASE_URL=https://example.supabase.co');
    expect(result.match(/VITE_GOOGLE_AUTH_ENABLED=/g)).toHaveLength(1);
    expect(publicEnvironment(master, result)).toBe(result);
  });
});
