export const LY_CHECKOUT = 'https://pay.hotmart.com/P104306248S';
export const SY_CHECKOUT = 'https://pay.hotmart.com/K105569601Q';

export function cleanSrc(src: string): string {
  return src.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 50);
}

export function withSrc(url: string, src: string): string {
  const u = new URL(url);
  u.searchParams.set('src', cleanSrc(src));
  return u.toString();
}
