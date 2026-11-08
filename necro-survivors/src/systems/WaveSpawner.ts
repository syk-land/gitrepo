import Phaser from 'phaser';
import { RegionData } from '../data/types';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

export class WaveSpawner {
  public elapsedTime: number = 0; // 초 단위 경과 시간
  public currentWave: number = 1; // 1 ~ 6
  private spawnTimer: number = 0;
  private namedSpawned: boolean = false;
  private bossSpawned: boolean = false;
  public bossInstance: Enemy | null = null;

  constructor(
    private scene: Phaser.Scene,
    private region: RegionData,
    private player: Player,
    private enemies: Enemy[],
    private onNamedSpawn?: (enemy: Enemy) => void,
    private onBossSpawn?: (enemy: Enemy) => void
  ) {}

  public update(dt: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.elapsedTime += dt;

    // 현재 웨이브 계산 (100초 = 1분 40초 단위)
    if (this.elapsedTime < 100) this.currentWave = 1;
    else if (this.elapsedTime < 200) this.currentWave = 2;
    else if (this.elapsedTime < 300) this.currentWave = 3;
    else if (this.elapsedTime < 400) this.currentWave = 4;
    else if (this.elapsedTime < 500) this.currentWave = 5;
    else this.currentWave = 6;

    // 5웨이브 (400초, 6분 40초): 수문장 네임드 강림
    if (this.elapsedTime >= 400 && !this.namedSpawned) {
      this.namedSpawned = true;
      this.spawnNamedMonster(camera);
    }

    // 6웨이브 (500초, 8분 20초): 지역 최종 보스 강림
    if (this.elapsedTime >= 500 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.spawnBossMonster(camera);
    }

    // 일반 몬스터 주기적 스폰
    this.spawnTimer -= dt;
    const spawnRate = this.getSpawnRateForWave(this.currentWave);
    const maxAlive = this.getMaxAliveForWave(this.currentWave);

    const activeCount = this.enemies.filter((e) => e.active).length;

    if (this.spawnTimer <= 0 && activeCount < maxAlive) {
      this.spawnTimer = 1.0 / spawnRate;
      this.spawnNormalMonster(camera);
    }

    // 800px 이상 벌어진 몬스터 전방 재배치 (Despawn 방지)
    this.repositionDistantMonsters(camera);
  }

  private getSpawnRateForWave(wave: number): number {
    switch (wave) {
      case 1: return 2.5;
      case 2: return 4.0;
      case 3: return 5.5;
      case 4: return 7.5;
      case 5: return 8.5;
      case 6: default: return 9.0;
    }
  }

  private getMaxAliveForWave(wave: number): number {
    switch (wave) {
      case 1: return 40;
      case 2: return 75;
      case 3: return 110;
      case 4: return 160;
      case 5: return 200;
      case 6: default: return 230;
    }
  }

  private getSpawnPositionOutsideCamera(camera: Phaser.Cameras.Scene2D.Camera, margin: number = 60): { x: number; y: number } {
    const left = camera.worldView.x - margin;
    const right = camera.worldView.x + camera.worldView.width + margin;
    const top = camera.worldView.y - margin;
    const bottom = camera.worldView.y + camera.worldView.height + margin;

    // 4변(상/하/좌/우) 중 무작위 1변 선택
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) { // 상단
      x = Phaser.Math.Between(left, right);
      y = top;
    } else if (side === 1) { // 하단
      x = Phaser.Math.Between(left, right);
      y = bottom;
    } else if (side === 2) { // 좌측
      x = left;
      y = Phaser.Math.Between(top, bottom);
    } else { // 우측
      x = right;
      y = Phaser.Math.Between(top, bottom);
    }

    return { x, y };
  }

  private spawnNormalMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera);

    // 웨이브별 몬스터 종류 선택
    let monsterIdx = 1;
    if (this.currentWave === 1) monsterIdx = 1;
    else if (this.currentWave === 2) monsterIdx = Math.random() < 0.4 ? 1 : 2;
    else if (this.currentWave === 3) monsterIdx = Math.random() < 0.3 ? 2 : 3;
    else if (this.currentWave === 4) monsterIdx = Math.random() < 0.4 ? 3 : 4;
    else if (this.currentWave === 5) monsterIdx = 4;
    else monsterIdx = Phaser.Math.Between(1, 4);

    const textureKey = `m_${this.region.regionId}_${monsterIdx}`;

    // 괴수 스탯 스케일링 공식 (Section 6.3)
    const baseHp = (65 + this.region.regionId * 45 + this.currentWave * 30);
    const baseAtk = 18 + this.region.regionId * 9 + this.currentWave * 5;
    const speed = 75 + Math.random() * 20;

    const enemy = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      baseHp,
      baseAtk,
      speed,
      20, // radius
      10 + this.currentWave * 2, // exp
      2 + this.region.regionId // gold
    );

    this.enemies.push(enemy);
  }

  private spawnNamedMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera, 90);
    const textureKey = `m_${this.region.regionId}_named`;

    const baseHp = (65 + this.region.regionId * 45 + 5 * 30) * 18; // 일반몹의 18배
    const baseAtk = Math.round((18 + this.region.regionId * 9 + 5 * 5) * 1.5);

    const named = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      baseHp,
      baseAtk,
      95,
      36,
      250,
      120,
      true, // isNamed
      false
    );

    this.enemies.push(named);
    if (this.onNamedSpawn) this.onNamedSpawn(named);
  }

  private spawnBossMonster(camera: Phaser.Cameras.Scene2D.Camera): void {
    const pos = this.getSpawnPositionOutsideCamera(camera, 120);
    const textureKey = `m_${this.region.regionId}_boss`;

    const baseHp = (65 + this.region.regionId * 45 + 6 * 30) * 45; // 일반몹의 45배
    const baseAtk = Math.round((18 + this.region.regionId * 9 + 6 * 5) * 2.2);

    const boss = new Enemy(
      this.scene,
      textureKey,
      pos.x,
      pos.y,
      baseHp,
      baseAtk,
      110,
      50,
      1000,
      500,
      false,
      true // isBoss
    );

    this.bossInstance = boss;
    this.enemies.push(boss);
    if (this.onBossSpawn) this.onBossSpawn(boss);
  }

  // 800px 밖 적 전방 재배치 (Section 5.4 스폰 규칙)
  private repositionDistantMonsters(camera: Phaser.Cameras.Scene2D.Camera): void {
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
        // 플레이어 진행 방향 앞쪽 화면 밖(약 480px)으로 텔레포트
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
