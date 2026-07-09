export function getGameId(): string | null {
  return new URLSearchParams(window.location.search).get('game');
}

export function navigateTo(gameId: string): void {
  window.location.href = `${window.location.pathname}?game=${gameId}`;
}

export function navigateHome(): void {
  window.location.href = window.location.pathname;
}
