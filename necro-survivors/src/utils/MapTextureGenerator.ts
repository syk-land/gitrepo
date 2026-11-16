import Phaser from 'phaser';

/**
 * 14개 차원문 지역별 뱀파이어 서바이버즈 전용 360도 무한 타일 텍스처 생성기
 * - 256x256 해상도의 완벽한 이음새 없는(Seamless) 탑다운 바닥 타일
 * - 각 맵의 명칭과 설정에 맞춘 고유 색상, 타일 격자, 오브젝트 모티브(철도 레일, 단풍잎, 용암 균열, 얼음 등)
 */
export class MapTextureGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    for (let r = 1; r <= 14; r++) {
      const key = `battle_tile_${r}`;
      if (scene.textures.exists(key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      this.renderRegionTile(ctx, r);
      scene.textures.addCanvas(key, canvas);
    }
  }

  private static renderRegionTile(ctx: CanvasRenderingContext2D, regionId: number): void {
    const W = 256;
    const H = 256;

    switch (regionId) {
      case 1: // 서울 지하철 미궁 & 석회 동굴: 어두운 지하철 승강장 석재 타일 + 녹슨 복선 철길 + 석회 유독 이끼
        ctx.fillStyle = '#1e1c24';
        ctx.fillRect(0, 0, W, H);
        // 바닥 석재 그리드
        ctx.strokeStyle = '#2d2836';
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0); ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 64) {
          ctx.beginPath();
          ctx.moveTo(0, y); ctx.lineTo(W, y);
          ctx.stroke();
        }
        // 철도 침목 및 레일 (중앙 통과)
        ctx.fillStyle = '#3a2b22';
        for (let y = 16; y < H; y += 32) {
          ctx.fillRect(96, y, 64, 10);
        }
        ctx.fillStyle = '#6b666a';
        ctx.fillRect(106, 0, 6, H);
        ctx.fillRect(144, 0, 6, H);
        // 석회/유독성 녹색 이끼 얼룩
        ctx.fillStyle = 'rgba(34, 139, 34, 0.28)';
        ctx.beginPath();
        ctx.arc(40, 48, 22, 0, Math.PI * 2);
        ctx.arc(210, 180, 26, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 2: // 북한산 성역 은빛 침엽수림: 울창한 침엽수 토양 + 은빛 이끼 박석
        ctx.fillStyle = '#18241b';
        ctx.fillRect(0, 0, W, H);
        // 솔잎 흩뿌림
        ctx.strokeStyle = '#2d4432';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 70; i++) {
          const px = (i * 37) % W;
          const py = (i * 73) % H;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 8, py + 4);
          ctx.stroke();
        }
        // 은빛 성역 바닥 룬 박석
        ctx.fillStyle = '#314739';
        ctx.fillRect(24, 24, 48, 48);
        ctx.fillRect(152, 152, 48, 48);
        ctx.strokeStyle = '#6ee3a3';
        ctx.lineWidth = 1;
        ctx.strokeRect(26, 26, 44, 44);
        ctx.strokeRect(154, 154, 44, 44);
        break;

      case 3: // 인천항 부두 해안 암초 & 갯바위: 젖은 항구 목재 갑판 + 해안 갯바위
        ctx.fillStyle = '#211e1b';
        ctx.fillRect(0, 0, W, H);
        // 목재 플랭크
        ctx.strokeStyle = '#38322c';
        ctx.lineWidth = 2;
        for (let y = 0; y < H; y += 32) {
          ctx.fillStyle = y % 64 === 0 ? '#2a241f' : '#231e19';
          ctx.fillRect(0, y, W, 32);
          ctx.beginPath();
          ctx.moveTo(0, y); ctx.lineTo(W, y);
          ctx.stroke();
        }
        // 못/리벳 및 암초 따개비
        ctx.fillStyle = '#5c5245';
        for (let x = 16; x < W; x += 64) {
          for (let y = 16; y < H; y += 32) {
            ctx.fillRect(x, y, 3, 3);
          }
        }
        ctx.fillStyle = 'rgba(50, 110, 130, 0.25)';
        ctx.fillRect(80, 70, 70, 45);
        break;

      case 4: // 설악산 대청봉 만년설 암벽: 서리 낀 빙하 얼음 & 빙벽 석판
        ctx.fillStyle = '#1b2a3a';
        ctx.fillRect(0, 0, W, H);
        // 얼음 균열 및 빙판 그리드
        ctx.strokeStyle = '#436d8f';
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x += 128) {
          for (let y = 0; y < H; y += 128) {
            ctx.strokeRect(x + 4, y + 4, 120, 120);
          }
        }
        // 서리 눈꽃 및 얼음 파편
        ctx.fillStyle = '#7acaff';
        ctx.beginPath();
        for (let i = 0; i < 40; i++) {
          const px = (i * 47) % W;
          const py = (i * 89) % H;
          ctx.rect(px, py, 4, 4);
        }
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(30, 160, 80, 50);
        break;

      case 5: // 평양 지하 50미터 암반 석순 미로: 지하 깊은 현무암 + 발광 호박석 광맥
        ctx.fillStyle = '#17151a';
        ctx.fillRect(0, 0, W, H);
        // 바위 균열 그리드
        ctx.strokeStyle = '#2f2838';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 80); ctx.lineTo(W, 80);
        ctx.moveTo(0, 190); ctx.lineTo(W, 190);
        ctx.moveTo(110, 0); ctx.lineTo(110, H);
        ctx.stroke();
        // 발광 주황빛 광맥
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 30); ctx.lineTo(60, 50); ctx.lineTo(90, 35);
        ctx.moveTo(140, 210); ctx.lineTo(180, 230); ctx.lineTo(230, 200);
        ctx.stroke();
        break;

      case 6: // 부산 광안리 마도 결계 백사장: 보랏빛 황혼 모래사장 + 파도 룬 결계
        ctx.fillStyle = '#2d2238';
        ctx.fillRect(0, 0, W, H);
        // 모래 결 무늬
        ctx.fillStyle = '#3a2d47';
        for (let y = 0; y < H; y += 16) {
          ctx.fillRect(0, y, W, 8);
        }
        // 마도 결계 룬 서클
        ctx.strokeStyle = '#d66eff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(128, 128, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeRect(108, 108, 40, 40);
        break;

      case 7: // 백두산 천지 칼데라 화산 용암지대: 검게 그을린 현무암 + 붉은 용암 균열
        ctx.fillStyle = '#1c0f0a';
        ctx.fillRect(0, 0, W, H);
        // 현무암 블록
        ctx.strokeStyle = '#361c12';
        ctx.lineWidth = 4;
        for (let x = 0; x < W; x += 64) {
          ctx.strokeRect(x + 2, 2, 60, H - 4);
        }
        // 타오르는 붉은 마그마 균열
        ctx.strokeStyle = '#ff3b00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 128); ctx.lineTo(60, 140); ctx.lineTo(130, 110); ctx.lineTo(200, 150); ctx.lineTo(W, 130);
        ctx.moveTo(128, 0); ctx.lineTo(110, 70); ctx.lineTo(140, 170); ctx.lineTo(128, H);
        ctx.stroke();
        // 용암 코어 발광 노란색
        ctx.strokeStyle = '#ffdd33';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 8: // 철원 DMZ 오염 벙커 지하 통로: 군용 철제 그레이팅 + 위험 경고 사선 타일
        ctx.fillStyle = '#181e18';
        ctx.fillRect(0, 0, W, H);
        // 철망 그레이팅 패턴
        ctx.strokeStyle = '#2d382d';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 16) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 16) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 경고 사선 스트라이프 바 (하단/상단 경계선)
        ctx.fillStyle = '#b59a24';
        ctx.fillRect(0, 116, W, 24);
        ctx.fillStyle = '#181818';
        for (let x = -24; x < W + 24; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 116);
          ctx.lineTo(x + 16, 116);
          ctx.lineTo(x + 32, 140);
          ctx.lineTo(x + 16, 140);
          ctx.fill();
        }
        break;

      case 9: // 지리산 노고단 붉은 단풍 암자: 고찰 돌마당 박석 + 흩날린 붉은 단풍잎
        ctx.fillStyle = '#262423';
        ctx.fillRect(0, 0, W, H);
        // 전통 돌마당 석판 그리드
        ctx.strokeStyle = '#3d3a37';
        ctx.lineWidth = 3;
        for (let x = 0; x < W; x += 64) {
          for (let y = 0; y < H; y += 64) {
            ctx.strokeRect(x + 3, y + 3, 58, 58);
          }
        }
        // 붉은 단풍잎 낙엽
        ctx.fillStyle = '#cc2b1d';
        for (let i = 0; i < 24; i++) {
          const px = (i * 59) % W;
          const py = (i * 97) % H;
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.arc(px + 4, py - 3, 3, 0, Math.PI * 2);
          ctx.arc(px - 4, py - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 10: // 울릉도 독도 심해 해구 마력 웅덩이: 심해 암흑 해저 + 청록빛 산호 룬
        ctx.fillStyle = '#0a1622';
        ctx.fillRect(0, 0, W, H);
        // 심해 해구 격자
        ctx.strokeStyle = '#122a3d';
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x += 85) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 85) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 청록빛 발광 마력 웅덩이
        ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.beginPath();
        ctx.arc(60, 60, 35, 0, Math.PI * 2);
        ctx.arc(190, 190, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 11: // 만주 벌판 흑토 고대 성벽 잔해: 기름진 흑토양 + 무너진 고구려 석벽
        ctx.fillStyle = '#1c1712';
        ctx.fillRect(0, 0, W, H);
        // 흑토 질감
        ctx.fillStyle = '#261f18';
        for (let i = 0; i < 50; i++) {
          const px = (i * 43) % W;
          const py = (i * 83) % H;
          ctx.fillRect(px, py, 14, 8);
        }
        // 성벽 석재 잔해
        ctx.fillStyle = '#473d32';
        ctx.fillRect(40, 40, 52, 28);
        ctx.fillRect(160, 130, 60, 30);
        ctx.strokeStyle = '#635647';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, 40, 52, 28);
        ctx.strokeRect(160, 130, 60, 30);
        break;

      case 12: // 제주 한라산 백록담 영기 안개 분지: 화산암 현무암 구멍돌 + 신령한 푸른 이끼
        ctx.fillStyle = '#191b1a';
        ctx.fillRect(0, 0, W, H);
        // 제주 현무암 돌담 블록
        ctx.strokeStyle = '#2e3330';
        ctx.lineWidth = 3;
        for (let y = 0; y < H; y += 64) {
          const offsetX = (y % 128 === 0) ? 0 : 32;
          for (let x = -32; x < W + 32; x += 64) {
            ctx.strokeRect(x + offsetX + 2, y + 2, 60, 60);
          }
        }
        // 신비한 영기 푸른 이끼
        ctx.fillStyle = '#246b4e';
        ctx.beginPath();
        ctx.arc(80, 140, 18, 0, Math.PI * 2);
        ctx.arc(200, 50, 22, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 13: // 차원의 틈새 왜곡된 시공간 균열: 시공의 보랏빛 공허 + 차원 좌표 격자
        ctx.fillStyle = '#120b1f';
        ctx.fillRect(0, 0, W, H);
        // 아스트랄 좌표 그리드
        ctx.strokeStyle = '#321c54';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < W; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 32) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 시공간 균열 파편
        ctx.strokeStyle = '#bf55ec';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 20); ctx.lineTo(80, 90); ctx.lineTo(60, 140);
        ctx.moveTo(180, 110); ctx.lineTo(230, 180); ctx.lineTo(200, 240);
        ctx.stroke();
        break;

      case 14: // 심연의 옥좌 사령신 강림 제단: 흑요석 대리석 + 진홍빛 사령 마법진
      default:
        ctx.fillStyle = '#0f0b12';
        ctx.fillRect(0, 0, W, H);
        // 광택 흑요석 타일
        ctx.strokeStyle = '#2b1b36';
        ctx.lineWidth = 3;
        for (let x = 0; x < W; x += 64) {
          for (let y = 0; y < H; y += 64) {
            ctx.strokeRect(x + 2, y + 2, 60, 60);
          }
        }
        // 사령 군주 오망성 진홍 룬
        ctx.strokeStyle = '#e60049';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(128, 128, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = 128 + Math.cos(angle) * 48;
          const y = 128 + Math.sin(angle) * 48;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
    }
  }
}
