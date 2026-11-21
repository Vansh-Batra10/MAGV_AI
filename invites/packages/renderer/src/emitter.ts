export type Handler<T = unknown> = (payload: T) => void;
export class Emitter<E extends string = string> {
  private map = new Map<E, Set<Handler<any>>>();
  on<T = unknown>(e: E, h: Handler<T>): () => void {
    if (!this.map.has(e)) this.map.set(e, new Set());
    this.map.get(e)!.add(h);
    return () => this.map.get(e)?.delete(h);
  }
  emit<T = unknown>(e: E, p?: T): void { this.map.get(e)?.forEach((h) => { try { h(p); } catch (err) { console.error(err); } }); }
  clear(): void { this.map.clear(); }
}
