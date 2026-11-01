// 샵별 루틴. 큐(cue)는 '짹짹이 카드뉴스' 1~4회차의 부리부리 쌤 멘트를 바탕으로 썼다.
// anim: 클라이언트 아바타 애니메이션 종류 (breathe | nod | wave | twist | stretch | lift | hinge | squat | row | press | bob)

export const SHOPS = {
  pilates: {
    id: 'pilates',
    name: '필라테스샵',
    tagline: '매트 필라테스 · 바른자세 가동성',
    work: 45,
    rest: 30,
    roundBreak: 90,
    routine: [
      { name: '흉곽 호흡', anim: 'breathe', cue: '숨 들이마실 때 갈비뼈를 옆으로 넓혀봐~ 어깨는 올라가면 안 돼!' },
      { name: '노즈노드', anim: 'nod', cue: '턱을 너무 세게 당기지 마! 코끝으로 작게 끄덕끄덕~' },
      { name: '캣 / 카우', anim: 'wave', cue: '목만 까딱하면 안 돼! 척추 전체를 움직여봐' },
      { name: '흉추 회전', anim: 'twist', cue: '골반은 고정! 목 말고 등을 돌려봐' },
      { name: '내전근 스트레칭', anim: 'stretch', cue: '허리 구부리지 말고~ 허벅지 안쪽부터 열어~' },
      { name: '힙 브릿지', anim: 'lift', cue: '허리로 들어 올리지 마! 엉덩이로 밀어 올려~' },
      { name: '데드버그', anim: 'bob', cue: '허리가 바닥에서 뜨지 않게! 배에 힘 꽉!' },
      { name: '장요근 스트레칭', anim: 'stretch', cue: '허리 꺾어서 밀지 말고~ 고관절 앞쪽부터 펴보자~' },
    ],
  },
  weight: {
    id: 'weight',
    name: '웨이트샵',
    tagline: '프리웨이트 · 엉덩이로 움직이는 근력',
    work: 40,
    rest: 40,
    roundBreak: 90,
    routine: [
      { name: '스탠딩 니 업', anim: 'bob', cue: '허리를 세우고 무릎을 들어봐! 균형 어려우면 벽 잡아도 좋아~' },
      { name: '월 힙힌지', anim: 'hinge', cue: '허리를 숙이는 게 아니라 고관절을 접는 느낌! 엉덩이로 뒷벽을 찾아봐!' },
      { name: '케틀벨 데드리프트', anim: 'lift', cue: '케틀벨은 몸에 가까이! 엉덩이가 할 일을 허리가 대신 하지 않도록!' },
      { name: '고블릿 스쿼트', anim: 'squat', cue: '무릎은 발끝 방향으로, 가슴은 활짝!' },
      { name: '덤벨 로우', anim: 'row', cue: '어깨 으쓱 말고~ 날개뼈를 뒤로 모아!' },
      { name: '푸시업 (무릎 대고 OK)', anim: 'bob', cue: '엉덩이 처지지 않게 몸통 일자로!' },
      { name: '덤벨 숄더 프레스', anim: 'press', cue: '허리 꺾지 말고 갈비뼈 닫고 밀어 올려!' },
      { name: '플랭크', anim: 'breathe', cue: '엉덩이 들지 말고 배꼽 당겨! 숨은 참지 마~' },
    ],
  },
};

export const SHOP_IDS = Object.keys(SHOPS);
