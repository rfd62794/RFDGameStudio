export function getGameId(): string | null {
  return new URLSearchParams(window.location.search).get('game');
}

export function navigateTo(gameId: string): void {
  const base = window.location.href.split('?')[0];
  window.location.href = `${base}?game=${gameId}`;
}

export function getPageId(): string | null {
  return new URLSearchParams(window.location.search).get('page');
}

export function navigateToPage(pageId: string): void {
  const base = window.location.href.split('?')[0];
  window.location.href = `${base}?page=${pageId}`;
}

export function navigateHome(mode: 'arcade' | 'standalone' = 'arcade', arcadeBaseUrl?: string): void {
  if (mode === 'standalone' && arcadeBaseUrl) {
    window.open(arcadeBaseUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.href = window.location.href.split('?')[0];
}

/** True when the site's cabinet frames this app (`?embed=1`); the cabinet then owns navigation. */
export function isEmbed(): boolean {
  return new URLSearchParams(window.location.search).get('embed') === '1';
}
