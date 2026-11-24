// =========================================================================
// High-performance spatial hash grid with numeric keys & pooled buckets
// =========================================================================

export interface SpatialEntity {
  x: number;
  y: number;
  radius: number;
  hp: number;
}

const COORD_OFFSET = 32768;
const COORD_STRIDE = 65536;
const MAX_CACHED_CELLS = 512;

export class SpatialHashGrid<T extends SpatialEntity> {
  private cells = new Map<number, T[]>();
  private activeBuckets: T[][] = [];

  constructor(private cellSize: number = 128) {}

  private getKey(cx: number, cy: number): number {
    return (cx + COORD_OFFSET) * COORD_STRIDE + (cy + COORD_OFFSET);
  }

  public clear(): void {
    if (this.cells.size > MAX_CACHED_CELLS) {
      this.cells.clear();
      this.activeBuckets.length = 0;
      return;
    }
    for (let i = 0; i < this.activeBuckets.length; i++) {
      this.activeBuckets[i].length = 0;
    }
    this.activeBuckets.length = 0;
  }

  public insert(entity: T): void {
    if (entity.hp <= 0) return;
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const key = this.getKey(cx, cy);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    if (bucket.length === 0) {
      this.activeBuckets.push(bucket);
    }
    bucket.push(entity);
  }

  // Query all active entities within radius; optional `out` array avoids per-call allocation
  public queryRadius(x: number, y: number, radius: number, out?: T[]): T[] {
    const result = out ?? [];
    result.length = 0;
    const rSq = radius * radius;
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.getKey(cx, cy));
        if (!bucket || bucket.length === 0) continue;
        for (let i = 0; i < bucket.length; i++) {
          const entity = bucket[i];
          if (entity.hp <= 0) continue;
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= rSq) {
            result.push(entity);
          }
        }
      }
    }
    return result;
  }

  public findNearest(x: number, y: number, maxRange: number = 550): T | null {
    const rSq = maxRange * maxRange;
    const minCx = Math.floor((x - maxRange) / this.cellSize);
    const maxCx = Math.floor((x + maxRange) / this.cellSize);
    const minCy = Math.floor((y - maxRange) / this.cellSize);
    const maxCy = Math.floor((y + maxRange) / this.cellSize);

    let best: T | null = null;
    let bestDistSq = rSq;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.getKey(cx, cy));
        if (!bucket || bucket.length === 0) continue;
        for (let i = 0; i < bucket.length; i++) {
          const c = bucket[i];
          if (c.hp <= 0) continue;
          const dx = c.x - x;
          const dy = c.y - y;
          const dSq = dx * dx + dy * dy;
          if (dSq <= bestDistSq) {
            bestDistSq = dSq;
            best = c;
          }
        }
      }
    }
    return best;
  }

  public findHighestHp(x: number, y: number, maxRange: number = 600): T | null {
    const rSq = maxRange * maxRange;
    const minCx = Math.floor((x - maxRange) / this.cellSize);
    const maxCx = Math.floor((x + maxRange) / this.cellSize);
    const minCy = Math.floor((y - maxRange) / this.cellSize);
    const maxCy = Math.floor((y + maxRange) / this.cellSize);

    let best: T | null = null;
    let maxHp = -1;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.getKey(cx, cy));
        if (!bucket || bucket.length === 0) continue;
        for (let i = 0; i < bucket.length; i++) {
          const c = bucket[i];
          if (c.hp <= 0) continue;
          const dx = c.x - x;
          const dy = c.y - y;
          if (dx * dx + dy * dy <= rSq && c.hp > maxHp) {
            maxHp = c.hp;
            best = c;
          }
        }
      }
    }
    return best;
  }
}
