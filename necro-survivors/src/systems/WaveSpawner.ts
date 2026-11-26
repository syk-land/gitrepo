import Phaser from 'phaser';
import { RegionData } from '../data/types';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import {
  getBehaviorForMonsterIndex,
  WAVE_FORMATION_EVENTS,
  WAVE_SCALING_CONFIG,
} from '../data/enemyPatternsData';

export class WaveSpawner {
  public elapsedTime: number = 0; // 초 단위 경과 시간
  public currentWave: number = 1; // 1 ~ 6 (무한 모드 시 7+)
  public isEndless: boolean = false;
  public endlessElapsed: number = 0;

  private spawnTimer: number = 0;
  private eliteTimer: number = 30;
  private namedSpawned: boolean = false;
  private bossSpawned: boolean = false;
  private triggeredFormations = new Set<number>();
  public bossInstance: Enemy | null = null;

  constructor(
    private scene: Phaser.Scene,
    private region: RegionData,
    private player: Player,
    private enemies: Enemy[],
    private onNamedSpawn?: (enemy: Enemy) => void,
    private onBossSpawn?: (enemy: Enemy) => void
  ) {}

  public enableEndlessMode(): void {
    this.isEndless = true;
    this.endlessElapsed = 0;
    this.eliteTimer = 18;
  }

  public update(dt: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.elapsedTime += dt;
    if (this.isEndless) {
      this.endlessElapsed += dt;
    }

    // 현재 웨이브 계산 (100초 단위)
    if (this.isEndless) {
      this.currentWave = 7 + Math.floor(this.endlessElapsed / 60);
    } else if (this.elapsedTime < 100) this.currentWave = 1;
    else if (this.elapsedTime < 200) this.currentWave = 2;
    else if (this.elapsedTime < 300) this.currentWave = 3;
    else if (this.elapsedTime < 400) this.currentWave = 4;
    else if (this.elapsedTime < 500) this.currentWave = 5;
    else this.currentWave = 6;

    // 100초 주기 웨이브 포메이션 이벤트 (포위 링 / 양측 협공 러시)
    for (const evt of WAVE_FORMATION_EVENTS) {
      if (this.elapsedTime >= evt.triggerTimeSec && !this.triggeredFormations.has(evt.triggerTimeSec)) {
        this.triggeredFormations.add(evt.triggerTimeSec);
        this.spawnFormationEvent(evt.type, evt.count, evt.bannerText);
      }
    }

    // 5웨이브 (400초): 수문장 네임드 강림
    if (this.elapsedTime >= 400 && !this.namedSpawned) {
      this.namedSpawned = true;
      this.spawnNamedMonster(camera);
    }

    // 6웨이브 (500초): 지역 최종 보스 강림
    if (this.elapsedTime >= 500 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.spawnBossMonster(camera);
    }

    // 정예 몬스터 스폰 (무한 모드에서는 주기 점진 단축)
    if (this.elapsedTime >= 60) {
      this.eliteTimer -= dt;
      if (this.eliteTimer <= 0) {
        const endlessMins = Math.floor(this.endlessElapsed / 60);
        this.eliteTimer = this.isEndless ? Math.max(12, 24 - endlessMins * 2) : 30;
        this.spawnEliteMonster(camera);
      }
    }

    // 일반 몬스터 주기적 스폰
    this.spawnTimer -= dt;
    const spawnRate = this.getSpawnRateForWave(this.currentWave);
    const maxAlive = this.getMaxAliveForWave(this.currentWave);

    const activeCount = this.enemies.filter((e) => e.active).length;

    if (this.spawnTimer <= 0 && activeCount < maxAlive) {
      this.spawnTimer = 1.0 / spawnRate;
      const batchCount = this.getSpawnBatchCount(this.currentWave);
      for (let i = 0; i < batchCount && activeCount + i < maxAlive; i++) {
        this.spawnNormalMonster(camera);
      }
    }

    this.repositionDistantMonsters(camera);
  }

  private getEndlessMultipliers(): { hpMul: number; atkMul: number } {
    if (!this.isEndless) return { hpMul: 1, atkMul: 1 };
    const mins = Math.floor(this.endlessElapsed / 60);
    return {
      hpMul: 1 + mins * WAVE_SCALING_CONFIG.endlessHpStepPerMin,
      atkMul: 1 + mins * WAVE_SCALING_CONFIG.endlessAtkStepPerMin,
    };
  }

  private getScaledBaseStats(wave: number): { hp: number; atk: number } {
    const clampedWave = Math.min(6, Math.max(1, wave));
    const endless = this.getEndlessMultipliers();
    const hp = Math.round(
      this.region.baseEnemyHp * WAVE_SCALING_CONFIG.waveHpMul[clampedWave] * endless.hpMul
    );
    const atk = Math.round(
      this.region.baseEnemyAtk * WAVE_SCALING_CONFIG.waveAtkMul[clampedWave] * endless.atkMul
    );
    return { hp: Math.max(25, hp), atk: Math.max(10, atk) };
  }

  private getSpawnRateForWave(wave: number): number {
    if (wave === 1) {
      if (this.elapsedTime < 25) return 0.7;
      if (this.elapsedTime < 60) return 1.2;
      return 1.8;
    }
    switch (Math.min(6, wave)) {
      case 2: return 2.8;
      case 3: return 4.2;
      case 4: return 6.0;
      case 5: return 8.0;
      case 6: default: return this.isEndless ? 12.0 : 10.0;
    }
  }

  private getMaxAliveForWave(wave: number): number {
    if (wave === 1) {
      if (this.elapsedTime < 25) return 8;
      if (this.elapsedTime < 60) return 16;
      return 26;
    }
    switch (Math.min(6, wave)) {
      case 2: return 50;
      case 3: return 85;
      case 4: return 130;
      case 5: return 180;
      case 6: default: return this.isEndless ? 260 : 240;
    }
  }

  private getSpawnBatchCount(wave: number): number {
    if (wave === 1) return 1;
    if (wave === 2) return Math.random() < 0.4 ? 2 : 1;
    if (wave === 3) return Phaser.Math.Between(1, 3);
    if (wave === 4) return Phaser.Math.Between(2, 4);
    if (wave === 5) return Phaser.Math.Between(3, 5);
    return Phaser.Math.Between(4, 6);
  }

  private getSpawnPositionOutsideCamera(
    camera: Phaser.Cameras.Scene2D.Camera,
    margin: number = 60
  ): { x: number; y: number } {
    const left = camera.worldView.x - margin;
    const right = camera.worldView.x + camera.worldView.width + margin;
    const top = camera.worldView.y - margin;
    const bottom = camera.worldView.y + camera.worldView.height + margin;

    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = Phaser.Math.Between(left, right);
      y = top;
    } else if (side === 1) {
      x = Phaser.Math.Between(left, right);
      y = bottom;
    } else if (side === 2) {
      x = left;
      y = Phaser.Math.Between(top, bottom);
    } else {
      x = right;
      y = Phaser.Math.Between(top, bottom);
    }

    return { x, y };
  }

  private spawnFormationEvent(type: 'ring' | 'pincer_rush', count: number, bannerText: string): void {
    const stats = this.getScaledBaseStats(this.currentWave);
    const px = this.player.x;
    const py = this.player.y;

    if (type === 'ring') {
      const ringRadius = 310;
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const x = px + Math.cos(angle) * ringRadius;
        const y = py + Math.sin(angle) * ringRadius;
        const monsterIdx = (i % 2) + 1; // chaser + charger 혼합
        const enemy = new Enemy(
          this.scene,
          `m_${this.region.regionId}_${monsterIdx}`,
          x,
          y,
          Math.round(stats.hp * 0.9),
          stats.atk,
          72,
          20,
          Math.max(1, Math.min(4, this.currentWave)),
          2 + this.region.regionId,
          false,
          false,
          false,
          (killed) => (this.scene as any).onEnemyKilled(killed),
          getBehaviorForMonsterIndex(monsterIdx, this.currentWave)
        );
        this.enemies.push(enemy);
      }
    } else {
      // 양측 협공 러시 (좌/우 2열 동시 진입)
      const half = Math.ceil(count / 2);
      for (let i = 0; i < half; i++) {
        const offsetY = (i - half / 2) * 42;
        for (const side of [-1, 1]) {
          const x = px + side * 340;
          const y = py + offsetY;
          const monsterIdx = 2; // charger 중심 돌격
          const enemy = new Enemy(
            this.scene,
            `m_${this.region.regionId}_${monsterIdx}`,
            x,
            y,
            stats.hp,
            stats.atk,
            82,
            20,
            Math.max(1, Math.min(4, this.currentWave)),
            2 + this.region.regionId,
            false,
            false,
            false,
            (killed) => (this.scene as any).onEnemyKilled(killed),
            'charger'
          );
          this.enemies.push(enemy);
        }
      }
    }

    if (typeof (this.scene as any).showWaveBanner === 'function') {
      (this.scene as any).showWaveBanner(bannerText);
    }
  }

  private spawnNormalMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera);

    let monsterIdx = 1;
    if (this.currentWave === 1) monsterIdx = 1;
    else if (this.currentWave === 2) monsterIdx = Math.random() < 0.45 ? 1 : 2;
    else if (this.currentWave === 3) monsterIdx = Math.random() < 0.35 ? 2 : 3;
    else if (this.currentWave === 4) monsterIdx = Math.random() < 0.4 ? 3 : 4;
    else if (this.currentWave === 5) monsterIdx = Math.random() < 0.3 ? 3 : 4;
    else monsterIdx = Phaser.Math.Between(1, 4);

    const textureKey = `m_${this.region.regionId}_${monsterIdx}`;
    const stats = this.getScaledBaseStats(this.currentWave);
    const speed = 65 + Math.random() * 20;
    const behavior = getBehaviorForMonsterIndex(monsterIdx, this.currentWave);

    const enemy = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      stats.hp,
      stats.atk,
      speed,
      20,
      Math.max(1, Math.min(4, this.currentWave)),
      2 + this.region.regionId,
      false,
      false,
      false,
      (killed) => (this.scene as any).onEnemyKilled(killed),
      behavior
    );

    this.enemies.push(enemy);
  }

  private spawnEliteMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera, 80);
    const monsterIdx = Phaser.Math.Between(1, 4);
    const textureKey = `m_${this.region.regionId}_${monsterIdx}`;
    const stats = this.getScaledBaseStats(this.currentWave);

    const baseHp = Math.round(stats.hp * WAVE_SCALING_CONFIG.eliteHpMul);
    const baseAtk = Math.round(stats.atk * WAVE_SCALING_CONFIG.eliteAtkMul);
    const speed = 72;
    const behavior = getBehaviorForMonsterIndex(monsterIdx, this.currentWave);

    const elite = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      baseHp,
      baseAtk,
      speed,
      28,
      15,
      50 + this.region.regionId * 5,
      false,
      false,
      true,
      (killed) => (this.scene as any).onEnemyKilled(killed),
      behavior
    );

    this.enemies.push(elite);
    if (typeof (this.scene as any).showDamageText === 'function') {
      (this.scene as any).showDamageText(pos.x, pos.y - 20, '⚠️ [정예 괴수 출현]', 0xffd000, true);
    }
  }

  private spawnNamedMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera, 90);
    const textureKey = `m_${this.region.regionId}_named`;
    const stats = this.getScaledBaseStats(5);

    const baseHp = Math.round(stats.hp * WAVE_SCALING_CONFIG.namedHpMul);
    const baseAtk = Math.round(stats.atk * WAVE_SCALING_CONFIG.namedAtkMul);

    const named = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      baseHp,
      baseAtk,
      90,
      36,
      30,
      120,
      true,
      false,
      false,
      (killed) => (this.scene as any).onEnemyKilled(killed),
      'chaser'
    );

    this.enemies.push(named);
    if (this.onNamedSpawn) this.onNamedSpawn(named);
  }

  private spawnBossMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera, 120);
    const textureKey = `m_${this.region.regionId}_boss`;
    const stats = this.getScaledBaseStats(6);

    const baseHp = Math.round(stats.hp * WAVE_SCALING_CONFIG.bossHpMul);
    const baseAtk = Math.round(stats.atk * WAVE_SCALING_CONFIG.bossAtkMul);

    const boss = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      baseHp,
      baseAtk,
      100,
      50,
      100,
      500,
      false,
      true,
      false,
      (killed) => (this.scene as any).onEnemyKilled(killed),
      'chaser'
    );

    this.bossInstance = boss;
    this.enemies.push(boss);
    if (this.onBossSpawn) this.onBossSpawn(boss);
  }

  private repositionDistantMonsters(_camera: Phaser.Cameras.Scene2D.Camera): void {
    const px = this.player.x;
    const py = this.player.y;
    const fx = this.player.facingDir.x || 1;
    const fy = this.player.facingDir.y || 0;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;

      if (distSq > 850 * 850) {
        const forwardDist = 480;
        const sideSpread = (Math.random() - 0.5) * 350;
        const perpX = -fy;
        const perpY = fx;

        enemy.x = px + fx * forwardDist + perpX * sideSpread;
        enemy.y = py + fy * forwardDist + perpY * sideSpread;
        enemy.sprite.setPosition(enemy.x, enemy.y);
      }
    }
  }
}
