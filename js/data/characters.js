/**
 * StelLive Characters - Pro-Balanced Asymmetric Design
 * 
 * DESIGN PHILOSOPHY:
 * ═══════════════════════════════════════════════════
 * Nana  = Heavy Gunslinger. Slow cooldown, BIG damage per shot.
 *         Each hit chunks 10% HP. She's the burst queen.
 * 
 * Shibuki = Rapid Poke Assassin. Lightning fast cooldown, small per-hit damage.
 *           Death by a thousand cuts. Constant horn barrage.
 * 
 * Both deal ~55 DPS averaged → fights last ~22-28 seconds.
 * Ultimates swing ~25-35% of max HP → dramatic turning points.
 * ═══════════════════════════════════════════════════
 */

const STELLIVE_CHARACTERS = [
  {
    id: 'nana',
    name: '하나코 나나',
    romanName: 'Hanako Nana',
    group: 'gen3',
    groupName: '3기 Cliché',
    role: '원거리 딜러 / 건슬링거',
    title: '환각 포자와 사랑이의 총잡이',
    color: '#ff69b4',
    glowColor: '#ec4899',
    emoji: '🌸',

    // ── Combat Stats ──
    hp: 1400,          // Standard pool
    atk: 60,
    def: 14,
    speed: 3.2,        // Slower — she's a turret sniper

    // ── Skill 1: Heavy Single Shot ──
    skill1Name: '사랑이 사격',
    skill1Desc: '강력한 핑크 에너지탄 1발. 묵직하지만 장전이 오래 걸린다.',
    skill1Cooldown: 3.8, // SLOW cooldown, BIG payoff

    // ── Ultimate: Machine Gun Burst ──
    ultName: '사랑이 난사',
    ultDesc: '기관총처럼 16연발 탄환을 [뚜루루룰루~] 쏟아붓습니다!',
    ultCooldown: 14.0,   // Meaningful wait → hype moment

    avatarUrl: 'assets/nana_avatar.png',
    fullArtUrl: 'assets/nana_full.png',
    gunImg: 'assets/sarangi_gun_bright.png',
    skillType: 'nana_sarangi'
  },
  {
    id: 'shibuki',
    name: '텐코 시부키',
    romanName: 'Tenko Shibuki',
    group: 'gen3',
    groupName: '3기 Cliché',
    role: '돌격 짤짤이 / 변신수',
    title: '신비로운 뿔과 캥캥이 여우 요괴',
    color: '#a855f7',
    glowColor: '#8b5cf6',
    emoji: '🦊',

    // ── Combat Stats ──
    hp: 1600,          // Slightly tankier (melee-ish fighter)
    atk: 48,
    def: 18,
    speed: 3.7,        // Faster — darting in and out

    // ── Skill 1: Rapid Double Horn Poke ──
    skill1Name: '뿔 발사',
    skill1Desc: '뿔 2개를 [똑, 똑] 빠르게 연사. 약하지만 쉴 새 없이 날아간다!',
    skill1Cooldown: 1.6,  // FAST poke spam

    // ── Ultimate: Fox Transform & Dash ──
    ultName: '캥캥이',
    ultDesc: '3.5초간 여우 폼 변신! 초고속 대쉬 & 할큄 연타!',
    ultCooldown: 12.0,    // Meaningful wait → hype moment

    avatarUrl: 'assets/shibuki_avatar.png',
    fullArtUrl: 'assets/shibuki_full.png',
    foxImg: 'assets/shibuki_fox.png',
    hornImg: 'assets/shibuki_horn_bright.png',
    skillType: 'shibuki_fox'
  }
];
