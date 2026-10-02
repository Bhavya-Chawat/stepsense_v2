export type ConnectionState = 'LIVE' | 'STALE' | 'DEMO';

export function getConnectionState(
  lastRowTimestamp: string | null,
  now: Date = new Date()
): ConnectionState {
  if (!lastRowTimestamp) {
    return 'DEMO';
  }

  const lastTime = new Date(lastRowTimestamp).getTime();
  if (isNaN(lastTime)) {
    return 'DEMO';
  }

  const elapsedSeconds = (now.getTime() - lastTime) / 1000;

  if (elapsedSeconds < 5) {
    return 'LIVE';
  }
  if (elapsedSeconds <= 8) {
    return 'STALE';
  }

  return 'DEMO';
}
