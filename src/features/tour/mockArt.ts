/**
 * Mock illustrations for the onboarding tour, generated as inline SVG data URLs
 * (pure strings — no DOM, no network, unit-testable). They give users a preview
 * of what each photo feature looks like before they've taken any real photos.
 */

function svgToDataUrl(svg: string): string {
  // encodeURIComponent keeps it valid in all browsers (no base64 needed).
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A stylized portrait placeholder (gradient backdrop + simple silhouette). */
function portrait(bg1: string, bg2: string): string {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg1}"/>
        <stop offset="1" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="160" cy="120" r="52" fill="rgba(255,255,255,0.92)"/>
    <path d="M80 250 Q160 170 240 250 L240 260 L80 260 Z" fill="rgba(255,255,255,0.92)"/>
  `;
}

/** A single sample photo (landscape 320×240). */
export function mockPhoto(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">${portrait(
    '#5eead4',
    '#a78bfa',
  )}</svg>`;
  return svgToDataUrl(svg);
}

/** A framed sample photo (white frame + caption), portrait card. */
export function mockFramed(caption = 'AirDeck'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="380" viewBox="0 0 320 380">
    <rect width="320" height="380" rx="14" fill="#ffffff"/>
    <g transform="translate(20,20)">
      <svg width="280" height="280" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice">${portrait(
        '#ff7e5f',
        '#feb47b',
      )}</svg>
    </g>
    <text x="160" y="350" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="26" font-weight="600" fill="#111827">${caption}</text>
  </svg>`;
  return svgToDataUrl(svg);
}

/** A 4-cut vertical photo strip sample. */
export function mockStrip(): string {
  const cellGrads: [string, string][] = [
    ['#5eead4', '#a78bfa'],
    ['#ff7e5f', '#feb47b'],
    ['#ffd1dc', '#fbc2eb'],
    ['#60a5fa', '#22d3ee'],
  ];
  const cells = cellGrads
    .map((g, i) => {
      const y = 24 + i * 116;
      return `<g transform="translate(24,${y})"><svg width="152" height="100" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice">${portrait(
        g[0],
        g[1],
      )}</svg></g>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="560" viewBox="0 0 200 560">
    <rect width="200" height="560" rx="12" fill="#0b0b0d"/>
    ${cells}
    <text x="100" y="540" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="600" fill="#f5f5f4">AirDeck · 4 cut</text>
  </svg>`;
  return svgToDataUrl(svg);
}

/** A portrait with a pair of (drawn) glasses, illustrating accessories. */
export function mockAccessory(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    ${portrait('#1f2937', '#0b0d12')}
    <g stroke="#5eead4" stroke-width="6" fill="rgba(94,234,212,0.18)" stroke-linejoin="round">
      <rect x="104" y="96" width="48" height="36" rx="10"/>
      <rect x="168" y="96" width="48" height="36" rx="10"/>
      <path d="M152 110 q8 -8 16 0" fill="none"/>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}
