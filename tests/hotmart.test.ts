import { describe, it, expect } from 'vitest';
import { withSrc, cleanSrc, LY_CHECKOUT, SY_CHECKOUT } from '../src/lib/hotmart';

describe('withSrc', () => {
  it('añade src al checkout', () => {
    expect(withSrc(LY_CHECKOUT, 'web_home')).toBe('https://pay.hotmart.com/P104306248S?src=web_home');
    expect(withSrc(SY_CHECKOUT, 'web_sy')).toBe('https://pay.hotmart.com/K105569601Q?src=web_sy');
  });

  it('reemplaza un src previo y conserva otros parámetros', () => {
    const out = new URL(withSrc('https://pay.hotmart.com/P104306248S?off=abc&src=old', 'pin_x'));
    expect(out.searchParams.get('src')).toBe('pin_x');
    expect(out.searchParams.get('off')).toBe('abc');
  });
});

describe('cleanSrc', () => {
  it('normaliza a minúsculas, guiones y 50 caracteres', () => {
    expect(cleanSrc('Blog_Mi Post Ñ!')).toBe('blog_mi-post-');
    expect(cleanSrc('a'.repeat(80))).toHaveLength(50);
  });
});
