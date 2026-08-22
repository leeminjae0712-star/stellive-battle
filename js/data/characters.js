/**
 * StelLive Characters & Presets Data
 * Domain: hanakonana.cloud
 */

const STELLIVE_CHARACTERS = [
  // 3기생: Cliché (클리셰)
  {
    id: 'nana',
    name: '하나코 나나',
    group: 'gen3',
    role: '맹독 마법사',
    title: '환각과 매혹의 버섯 소녀',
    color: '#c084fc',
    glowColor: '#a855f7',
    emoji: '🍄',
    hp: 1100,
    atk: 48,
    def: 18,
    speed: 5.2,
    skillType: 'spore',
    skillName: '환각 포자 살포',
    ultName: '황홀경 버섯 대폭발!',
    ultDesc: '아레나 전역에 버섯 폭탄을 터뜨려 모든 적에게 막대한 혼란 피해를 입힙니다.',
    avatarUrl: null
  },
  {
    id: 'riko',
    name: '유즈하 리코',
    group: 'gen3',
    role: '질풍 격투가',
    title: '에너제틱 질풍의 복서',
    color: '#fbbf24',
    glowColor: '#f59e0b',
    emoji: '🥊',
    hp: 1150,
    atk: 52,
    def: 22,
    speed: 5.6,
    skillType: 'punch',
    skillName: '질풍 펀치 러시',
    ultName: '메가 볼트 어퍼컷!',
    ultDesc: '폭풍처럼 회전하며 주변의 모든 적을 빨아들인 뒤 강력한 어퍼컷을 날립니다.',
    avatarUrl: null
  },
  {
    id: 'shibuki',
    name: '텐코 시부키',
    group: 'gen3',
    role: '구미호 닌자',
    title: '신비로운 붉은 여우 요괴',
    color: '#fb7185',
    glowColor: '#f43f5e',
    emoji: '🦊',
    hp: 1000,
    atk: 55,
    def: 15,
    speed: 6.0,
    skillType: 'fire',
    skillName: '여우불 유도탄',
    ultName: '백화요란 구미난무!',
    ultDesc: '여우불 9개를 사방으로 발사하여 적들을 추적 폭격합니다.',
    avatarUrl: null
  },
  {
    id: 'kanade',
    name: '히텐 카나데',
    group: 'gen3',
    role: '음파 마에스트로',
    title: '천상의 멜로디 연주자',
    color: '#38bdf8',
    glowColor: '#0284c7',
    emoji: '🎵',
    hp: 1050,
    atk: 50,
    def: 20,
    speed: 5.4,
    skillType: 'laser',
    skillName: '음파 쇼크 레이저',
    ultName: '심포니아 레퀴엠!',
    ultDesc: '전방향으로 뻗어나가는 거대한 음파 레이저 링을 전개합니다.',
    avatarUrl: null
  },

  // 2기생: Universe (유니버스)
  {
    id: 'hina',
    name: '시라유키 히나',
    group: 'gen2',
    role: '별빛 저격수',
    title: '청아한 보컬 & 비둘기 여왕',
    color: '#67e8f9',
    glowColor: '#06b6d4',
    emoji: '🕊️',
    hp: 950,
    atk: 58,
    def: 14,
    speed: 5.3,
    skillType: 'laser',
    skillName: '비둘기 별빛 레이저',
    ultName: '스텔라 하모니 저격!',
    ultDesc: '가장 강한 적을 타겟팅하여 초고속 극딜 저격 광선을 발사합니다.',
    avatarUrl: null
  },
  {
    id: 'lize',
    name: '아카네 리제',
    group: 'gen2',
    role: '뱀파이어 검사',
    title: '붉은 피의 귀족 검사',
    color: '#ef4444',
    glowColor: '#b91c1c',
    emoji: '🍷',
    hp: 1200,
    atk: 54,
    def: 24,
    speed: 4.9,
    skillType: 'vampire',
    skillName: '블러드 슬래시 (흡혈)',
    ultName: '진조의 핏빛 참격!',
    ultDesc: '거대한 피의 참격을 전방위로 휘둘러 적의 체력을 대량 흡수합니다.',
    avatarUrl: null
  },
  {
    id: 'mashiro',
    name: '네네코 마시로',
    group: 'gen2',
    role: '거대 해머 고양이',
    title: '앙큼 뽀짝 고양이 괴수',
    color: '#f472b6',
    glowColor: '#ec4899',
    emoji: '🐾',
    hp: 1250,
    atk: 46,
    def: 26,
    speed: 4.8,
    skillType: 'punch',
    skillName: '냥냥 해머 드롭',
    ultName: '기간틱 츄르 메테오!',
    ultDesc: '거대한 황금 츄르를 하늘에서 투하시켜 거대한 지진파와 광역 스턴을 일으킵니다.',
    avatarUrl: null
  },
  {
    id: 'rin',
    name: '아오쿠모 린',
    group: 'gen2',
    role: '질풍의 무사',
    title: '푸른 구름의 낭인 검객',
    color: '#2dd4bf',
    glowColor: '#0d9488',
    emoji: '🗡️',
    hp: 1080,
    atk: 56,
    def: 18,
    speed: 5.8,
    skillType: 'ice',
    skillName: '청운 발도술',
    ultName: '비검·풍운난무!',
    ultDesc: '초고속으로 적 사이를 베고 지나가며 참격 궤적을 폭발시킵니다.',
    avatarUrl: null
  },

  // 1기생: Mystic (미스틱)
  {
    id: 'kanna',
    name: '아이리 칸나',
    group: 'gen1',
    role: '청룡 보컬리스트',
    title: '푸른 용의 포효 & 화염',
    color: '#60a5fa',
    glowColor: '#2563eb',
    emoji: '🐲',
    hp: 1180,
    atk: 57,
    def: 22,
    speed: 5.2,
    skillType: 'fire',
    skillName: '용의 푸른 화염탄',
    ultName: '청룡 초신성 (Dragon Nova)!',
    ultDesc: '거대한 용의 화염구를 발사하여 아레나 중심부를 초토화시킵니다.',
    avatarUrl: null
  },
  {
    id: 'yuni',
    name: '아야츠노 유니',
    group: 'gen1',
    role: '빙결 유니콘',
    title: '귀여운 은하계 유니콘',
    color: '#a78bfa',
    glowColor: '#7c3aed',
    emoji: '🦄',
    hp: 1020,
    atk: 53,
    def: 16,
    speed: 6.2,
    skillType: 'ice',
    skillName: '유니콘 빙결 스탬프',
    ultName: '절대영도 블리자드!',
    ultDesc: '아레나 전체를 얼어붙게 만들어 모든 적을 얼리고 큰 동결 피해를 입힙니다.',
    avatarUrl: null
  }
];

// Helper to generate dynamic SVG avatar badge if image is not loaded
function createCharacterAvatarSvg(character) {
  const bg = encodeURIComponent(character.color);
  const glow = encodeURIComponent(character.glowColor);
  const emoji = character.emoji;
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="grad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="%23ffffff" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${glow}" stop-opacity="0.8"/>
      </radialGradient>
      <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${glow}"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="%23131524" stroke="url(%23ring)" stroke-width="4"/>
    <circle cx="50" cy="50" r="38" fill="url(%23grad)"/>
    <text x="50" y="62" font-size="36" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
}
