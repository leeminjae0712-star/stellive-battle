/**
 * StelLive Characters Data (Hanako Nana & Tenko Shibuki)
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
    atk: 54,
    def: 16,
    speed: 2.2, // Relaxed reels-style bounce speed
    skill1Name: '사랑이 정밀 사격',
    skill1Desc: '애총 [사랑이]로 적을 조준하여 강력한 핑크 탄환 1발을 발사합니다.',
    skill1Cooldown: 4.0,
    ultName: '사랑이 뚜루루룰루 난사!',
    ultDesc: '기관총처럼 18연발 탄환을 [뚜루루룰루~] 쏟아붓습니다!',
    ultCooldown: 14.0,
    avatarUrl: 'assets/nana_avatar.png',
    fullArtUrl: 'assets/nana_full.png',
    gunImg: 'assets/sarangi_gun_aim.png',
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
    hp: 1050,
    atk: 50,
    def: 18,
    speed: 2.3, // Relaxed reels-style bounce speed
    skill1Name: '도깨비 뿔 짤짤이',
    skill1Desc: '머리의 뿔 2개를 [똑, 똑] 시차를 두고 매우 자주 발사합니다.',
    skill1Cooldown: 2.2, // Fast poke cooldown
    ultName: '캥캥이 대변신!',
    ultDesc: '5.5초간 캥캥이(여우) 폼으로 변신! 거대화 + 초고속 돌격 + 접촉 시 날카로운 할큄 연타!',
    ultCooldown: 15.0,
    avatarUrl: 'assets/shibuki_avatar.png',
    fullArtUrl: 'assets/shibuki_full.png',
    foxImg: 'assets/shibuki_fox.png',
    hornImg: 'assets/shibuki_horn.png',
    skillType: 'shibuki_fox'
  }
];
