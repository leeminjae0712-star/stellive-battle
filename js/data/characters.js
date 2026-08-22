/**
 * StelLive Characters Roster - Pro Balanced 3-Hero System
 * 1. 하나코 나나 (Hanako Nana) - Heavy Sniper Gunner
 * 2. 텐코 시부키 (Tenko Shibuki) - Rapid Poke & Fox Berserker (8.0s Fast Ult!)
 * 3. 유즈하 리코 (Yuzuha Riko) - Holy Sword Drop & Ultra Multi-Bounce Wall Slam
 * Domain: hanakonana.cloud
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

    // Combat Stats
    hp: 1200,
    atk: 60,
    def: 14,
    speed: 3.2,

    // Skill 1: Heavy Sniper Shot
    skill1Name: '사랑이 사격',
    skill1Desc: '애총 [사랑이]로 160 데미지의 묵직한 핑크 에너지탄을 조준 발사합니다.',
    skill1Cooldown: 4.0,

    // Ultimate: Machine Gun Barrage
    ultName: '사랑이 난사',
    ultDesc: '기관총처럼 16연발 탄환을 [뚜루루룰루~] 쏟아붓습니다! (발당 28딜, 총 448딜)',
    ultCooldown: 8.0,

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

    // Combat Stats
    hp: 1300,
    atk: 50,
    def: 18,
    speed: 3.7,

    // Skill 1: Fast Double Horn Poke
    skill1Name: '뿔 발사',
    skill1Desc: '머리의 뿔 2개를 [똑, 똑] 1.2초마다 빠르게 연사합니다. (30x2 = 60딜)',
    skill1Cooldown: 1.2,

    // Ultimate: 8.0s Fast Cooldown Fox Transform & Dash
    ultName: '캥캥이',
    ultDesc: '3.5초간 캥캥이(여우) 폼 변신! 초고속 대쉬 & 접촉 시 35딜 할큄 연타!',
    ultCooldown: 8.0,

    avatarUrl: 'assets/shibuki_avatar.png',
    fullArtUrl: 'assets/shibuki_full.png',
    foxImg: 'assets/shibuki_fox.png',
    hornImg: 'assets/shibuki_horn_bright.png',
    skillType: 'shibuki_fox'
  },
  {
    id: 'riko',
    name: '유즈하 리코',
    romanName: 'Yuzuha Riko',
    group: 'gen3',
    groupName: '3기 Cliché',
    role: '시공간 지배자 / 성검 마검사',
    title: '시간의 조율자와 에메랄드 성검',
    color: '#10b981',
    glowColor: '#34d399',
    emoji: '⚔️',

    // Combat Stats
    hp: 1450,
    atk: 56,
    def: 16,
    speed: 3.45,

    // Skill 1: Jarvan E style Holy Sword Drop at Center (Global Full Screen AOE)
    skill1Name: '성검 투하',
    skill1Desc: '맵 한가운데에 거대한 성검을 투하하여 맵 전체에 착탄 35딜 + 3초간 12딜 전역 파동 방출!',
    skill1Cooldown: 3.8,

    // Ultimate: Hit & 3-Bounce Super Wall Slam
    ultName: '초돌진 3단벽쾅',
    ultDesc: '적에게 돌진 닿으면 180딜 강타 후 초광속으로 날려 벽에 3연속 쿵쾅쿵쾅(총 150 추가딜) 튕깁니다!',
    ultCooldown: 10.5,

    avatarUrl: 'assets/riko_avatar.png',
    fullArtUrl: 'assets/riko_full.png',
    swordImg: 'assets/riko_sword.png',
    skillType: 'riko_timewarden'
  }
];