import { AsyncLocalStorage } from "async_hooks";

const traceStore = new AsyncLocalStorage<string>();

export function withTrace<T>(fn: () => T | Promise<T>): Promise<T> {
  return Promise.resolve(traceStore.run(crypto.randomUUID(), fn));
}

function emit(level: "info" | "warn" | "error", event: string, fields?: Record<string, unknown>) {
  const traceId = traceStore.getStore();
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(traceId && { traceId }),
    ...fields,
  };
  if (process.env.NODE_ENV === "production") {
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const { ts: _ts, level: _lv, event: _ev, traceId: _tid, ...rest } = entry;
    console[level](`[${String(_ev)}]`, Object.keys(rest).length ? rest : "");
  }
}

export const log = {
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
