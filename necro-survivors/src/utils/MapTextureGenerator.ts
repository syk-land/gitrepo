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

      case 6: // 교토 대나무 숲 & 고택 다다미방: 대나무 돗자리 다다미 격자 + 흩날린 푸른 대나무 잎
        ctx.fillStyle = '#141f18';
        ctx.fillRect(0, 0, W, H);
        // 고택 다다미 & 목재 마루 격자
        ctx.strokeStyle = '#293d2e';
        ctx.lineWidth = 3;
        for (let y = 0; y < H; y += 64) {
          for (let x = 0; x < W; x += 128) {
            ctx.strokeRect(x + 2, y + 2, 124, 60);
          }
        }
        // 금빛 테두리 & 대나무 잎 악센트
        ctx.strokeStyle = '#5c4b2a';
        ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 64) {
          ctx.beginPath();
          ctx.moveTo(0, y); ctx.lineTo(W, y);
          ctx.stroke();
        }
        ctx.fillStyle = '#388e4c';
        for (let i = 0; i < 28; i++) {
          const px = (i * 53 + 16) % W;
          const py = (i * 89 + 12) % H;
          ctx.beginPath();
          ctx.ellipse(px, py, 7, 2.5, (i % 4) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 7: // 상하이 마천루 옥상 & 네온 야경: 어두운 아스팔트 옥상 격자 + 사이버 네온 시안/마젠타 스트립
        ctx.fillStyle = '#12131c';
        ctx.fillRect(0, 0, W, H);
        // 옥상 콘크리트 패널 그리드
        ctx.strokeStyle = '#242738';
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x += 64) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 64) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 네온 시안 / 마젠타 라인 스트립
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.fillRect(0, 62, W, 3);
        ctx.fillStyle = 'rgba(255, 42, 109, 0.35)';
        ctx.fillRect(0, 190, W, 3);
        ctx.fillStyle = '#1d2130';
        ctx.fillRect(48, 96, 40, 40);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(48, 96, 40, 40);
        break;

      case 8: // 시베리아 툰드라 동토 설원: 영구동토 백설 지대 + 얼어붙은 서리 균열
        ctx.fillStyle = '#1b2633';
        ctx.fillRect(0, 0, W, H);
        // 툰드라 설원 음영 패치
        ctx.fillStyle = '#233345';
        for (let i = 0; i < 16; i++) {
          const px = (i * 61) % W;
          const py = (i * 97) % H;
          ctx.fillRect(px, py, 36, 18);
        }
        // 서리 빙결 균열
        ctx.strokeStyle = '#4e7596';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 64); ctx.lineTo(70, 82); ctx.lineTo(150, 56); ctx.lineTo(W, 64);
        ctx.moveTo(128, 0); ctx.lineTo(116, 90); ctx.lineTo(142, 170); ctx.lineTo(128, H);
        ctx.stroke();
        ctx.fillStyle = '#a8e2ff';
        for (let i = 0; i < 32; i++) {
          ctx.fillRect((i * 43) % W, (i * 71) % H, 3, 3);
        }
        break;

      case 9: // 마리아나 해구 심해 열수구: 심해 암흑 해저 + 청록빛 발광 마력 웅덩이
        ctx.fillStyle = '#0a1622';
        ctx.fillRect(0, 0, W, H);
        // 심해 해구 격자
        ctx.strokeStyle = '#122a3d';
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x += 64) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 64) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 청록빛 발광 열수구/마력 웅덩이
        ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.beginPath();
        ctx.arc(64, 64, 34, 0, Math.PI * 2);
        ctx.arc(192, 192, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 10: // 히말라야 에베레스트 설산 암봉: 고산 빙하 암석판 + 날카로운 서리 결정
        ctx.fillStyle = '#1c2836';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#38516b';
        ctx.lineWidth = 2.5;
        for (let x = 0; x < W; x += 64) {
          for (let y = 0; y < H; y += 64) {
            ctx.strokeRect(x + 3, y + 3, 58, 58);
          }
        }
        // 얼음 결정 파편
        ctx.fillStyle = '#7acaff';
        for (let i = 0; i < 36; i++) {
          const px = (i * 47 + 8) % W;
          const py = (i * 83 + 14) % H;
          ctx.fillRect(px, py, 4, 4);
        }
        ctx.fillStyle = 'rgba(220, 245, 255, 0.18)';
        ctx.fillRect(32, 144, 72, 44);
        break;

      case 11: // 타클라마칸 사막 모래지옥 & 풍화 사암: 황토 사막 사암 타일 + 모래 물결 & 황금 전갈 룬
        ctx.fillStyle = '#291e14';
        ctx.fillRect(0, 0, W, H);
        // 모래 바람 물결
        ctx.fillStyle = '#36271a';
        for (let y = 0; y < H; y += 32) {
          ctx.fillRect(0, y, W, 14);
        }
        // 풍화 사암 블록
        ctx.strokeStyle = '#523c28';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, 76, 48);
        ctx.strokeRect(148, 148, 84, 52);
        // 고대 황금빛 사막 룬
        ctx.strokeStyle = '#d4a338';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(128, 128, 36, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 12: // 로키산맥 화산 마그마 분화구: 검게 그을린 현무암 + 타오르는 붉은 용암 균열
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
        ctx.moveTo(0, 128); ctx.lineTo(60, 140); ctx.lineTo(130, 110); ctx.lineTo(200, 150); ctx.lineTo(W, 128);
        ctx.moveTo(128, 0); ctx.lineTo(110, 70); ctx.lineTo(140, 170); ctx.lineTo(128, H);
        ctx.stroke();
        // 용암 코어 발광 노란색
        ctx.strokeStyle = '#ffdd33';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 13: // 태평양 성층권 금문 운해(雲海) & 모함: 성층권 아스트랄 모함 갑판 + 황금/시안 라인
        ctx.fillStyle = '#101424';
        ctx.fillRect(0, 0, W, H);
        // 모함 외장 좌표 격자
        ctx.strokeStyle = '#25304d';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < W; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 32) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        // 금문 황금 & 플라즈마 시안 선체 에너지 라인
        ctx.strokeStyle = '#d4a338';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 96); ctx.lineTo(W, 96);
        ctx.stroke();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(32, 24); ctx.lineTo(96, 88); ctx.lineTo(64, 152);
        ctx.moveTo(160, 128); ctx.lineTo(224, 192); ctx.lineTo(192, 240);
        ctx.stroke();
        break;

      case 14: // 2070 성층권 다이아몬드 게이트 종언: 흑요석/다이아몬드 제단 바닥 + 진홍/청록 오망성 룬
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
        // 다이아몬드 코어 & 진홍 오망성 룬
        ctx.strokeStyle = '#70f3ff';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(120, 120, 16, 16);
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
