// =========================================================================
// 음수 좌표에서도 안전한 고성능 공간 해싱 그리드 (SpatialHashGrid.ts)
// =========================================================================

export interface SpatialEntity {
  x: number;
  y: number;
  radius: number;
  hp: number;
}

export class SpatialHashGrid<T extends SpatialEntity> {
  private cells = new Map<string, T[]>();

  constructor(private cellSize: number = 128) {}

  private getKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public clear(): void {
    this.cells.clear();
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
    bucket.push(entity);
  }

  // 반경(radius) 크기에 맞춰 필요한 모든 격자를 정확히 탐색 (3x3 고정 한계 해결)
  public queryRadius(x: number, y: number, radius: number): T[] {
    const result: T[] = [];
    const rSq = radius * radius;
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(this.getKey(cx, cy));
        if (!bucket) continue;
        for (const entity of bucket) {
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
    const candidates = this.queryRadius(x, y, maxRange);
    let best: T | null = null;
    let bestDistSq = Infinity;
    for (const c of candidates) {
      const dSq = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        best = c;
      }
    }
    return best;
  }

  public findHighestHp(x: number, y: number, maxRange: number = 600): T | null {
    const candidates = this.queryRadius(x, y, maxRange);
    let best: T | null = null;
    let maxHp = -1;
    for (const c of candidates) {
      if (c.hp > maxHp) {
        maxHp = c.hp;
        best = c;
      }
    }
    return best;
  }
}
