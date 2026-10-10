import type { Response } from 'express';

/**
 * In-process fan-out for chat events over Server-Sent Events. Each open stream is one browser tab.
 * A single API instance holds all streams; with several instances, the client's polling fallback still delivers messages.
 */
const streams = new Map<string, Set<Response>>();
const HEARTBEAT_MS = 25_000;

export function openStream(userId: string, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');
  const set = streams.get(userId) ?? new Set<Response>();
  set.add(res);
  streams.set(userId, set);
  return () => {
    set.delete(res);
    if (set.size === 0) streams.delete(userId);
  };
}

/** Sends an event to every open tab of each user. Users without a stream are skipped. */
export function publish(userIds: string[], event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const id of userIds) {
    for (const res of streams.get(id) ?? []) res.write(payload);
  }
}

// Keeps idle connections open through proxies that close quiet sockets
setInterval(() => {
  for (const set of streams.values()) for (const res of set) res.write(': ping\n\n');
}, HEARTBEAT_MS).unref();
