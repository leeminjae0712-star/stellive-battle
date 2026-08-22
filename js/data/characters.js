/**
 * StelLive Characters Data (Hanako Nana & Tenko Shibuki)
 * Fast Action / Frequent Ultimates & Balanced Extended Combat
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
    hp: 1000,
    atk: 36,
    def: 12,
    speed: 3.4,
    skill1Name: '사랑이 사격',
    skill1Desc: '애총 [사랑이]로 적을 조준하여 핑크 탄환을 발사합니다.',
    skill1Cooldown: 2.6, // Fast poke
    ultName: '사랑이 난사',
    ultDesc: '기관총처럼 16연발 탄환을 [뚜루루룰루~] 쏟아붓습니다!',
    ultCooldown: 6.5, // Fast hype ultimate!
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
    hp: 1100,
    atk: 34,
    def: 15,
    speed: 3.5,
    skill1Name: '뿔 발사',
    skill1Desc: '머리의 뿔 2개를 [똑, 똑] 시차를 두고 매우 자주 발사합니다.',
    skill1Cooldown: 1.8, // Frequent poke
    ultName: '캥캥이',
    ultDesc: '3.5초간 캥캥이(여우) 폼으로 변신! 즉시 초고속 돌격 대쉬 + 접촉 시 할큄 연타!',
    ultCooldown: 7.0, // Fast hype ultimate!
    avatarUrl: 'assets/shibuki_avatar.png',
    fullArtUrl: 'assets/shibuki_full.png',
    foxImg: 'assets/shibuki_fox.png',
    hornImg: 'assets/shibuki_horn_bright.png',
    skillType: 'shibuki_fox'
  }
];
