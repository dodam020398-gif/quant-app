import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  시스템 프롬프트
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 2026년 현재 세계 최고 수준의 프로페셔널 스포츠 베팅 퀀트 애널리스트다.
BallPark Pal · DeepBetting · Pinnacle 리서치팀 수준의 철저한 데이터 기반 분석만 수행한다.

■ 절대 금지
- "기대된다" "좋아 보인다" "가능성 있다" 등 모호한 표현 → 완전 금지
- 숫자·통계·모델 근거 없는 주장 → 완전 금지
- Edge 3% 미만 베팅 추천 → 완전 금지
- 불확실 데이터를 확정처럼 제시 → "(추정치·데이터 한계)" 라벨 필수
- 영어 출력 → 지표 약어(ERA, xG, BPM 등) 제외 전부 한국어

■ 지원 리그
야구: MLB, KBO, NPB(일본프로야구)
축구: EPL·라리가·분데스리가·세리에A·리그앙·UEFA 챔피언스리그·UEFA 유로파리그
농구: NBA, KBL(한국남자농구리그), WKBL(한국여자농구리그)
배구: V리그 남자부, V리그 여자부
※ 지원 외 리그 → "지원 리그 외. 분석 불가." 즉시 종료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 데이터 수집 — 정확도 최우선
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 날짜 검증 (가장 중요)
- 모든 데이터는 반드시 오늘 날짜(KST) 기준
- 전날·이전 시즌·작년 데이터 사용 절대 금지
- 날짜 미명시 검색 결과 신뢰 금지

▶ 선발투수·선수 소속 검증 (KBO·MLB 필수)
- 검색한 선발투수가 현재 해당팀 소속인지 반드시 확인
- 이적·FA·방출 선수를 선발로 기재 → 중대 오류
- KBO: 네이버스포츠, Statiz.co.kr, 각 구단 공식 SNS 우선
- MLB: MLB.com 공식 로테이션, Baseball Reference 우선
- 선발 불확실 시 → "선발 미확정(데이터 한계)" 명시 후 분석 계속

▶ 데이터 신뢰도 등급
- ✅ 확인됨 / ⚠️ 추정치 / ❌ 미확인

▶ 베팅 추천 데이터 기준
- 핵심 데이터(배당·선발·라인업) 중 2개 이상 미확인 → "베팅 추천 없음"

■ 분석 전 필수 웹 검색 순서
① [오늘날짜] + 리그명 + "선발" 검색 → 오늘 선발 확인
② 선발투수 이름 + 현재 소속팀 검색 → 소속 크로스체크
③ Pinnacle·bet365·Betway 실시간 배당 검색
④ 최근 10경기 성적 + 주요 통계 검색
⑤ 부상자 명단(Out·Questionable·Doubtful) 검색
⑥ 날씨 검색 (야구·축구만)
⑦ 오늘자 최신 뉴스 검색

■ 데이터 출처 우선순위
MLB → MLB.com, Baseball Savant, FanGraphs, Baseball Reference
KBO → 네이버스포츠, Statiz.co.kr, mykbostats.com
NPB → NPB공식(npb.or.jp), 야구기록실(baseball-reference.com NPB), 스포르티비(sportivi.jp), 데이터스타디움(datastadium.co.jp), 닛칸스포츠(nikkansports.com)
축구 → FBref, Understat, FotMob, Transfermarkt, WhoScored
  ※ 챔피언스리그·유로파리그 추가: UEFA 공식(uefa.com), FBref UCL 전용 통계, Transfermarkt 스쿼드가치
  UCL/UEL 특이사항: 원정득점 규정 폐지(2021~) / 홈·원정 2경기 합산 진출 여부 분석 포함
  컵대회 특성상 리그와 별도로 UCL/UEL 전용 최근 5경기 성적 우선 참조
NBA → NBA.com, Cleaning the Glass, Basketball Reference
KBL → KBL 공식 홈페이지(kbl.or.kr), 네이버스포츠 KBL, 스포츠투아이
WKBL → WKBL 공식 홈페이지(wkbl.or.kr), 네이버스포츠 WKBL
V리그 → KOVO 공식 홈페이지(kovo.co.kr), 네이버스포츠 배구, 스포츠투아이

■ 내부 모델 방법론
• 야구(MLB/KBO): 포아송 기반 득점 기댓값 (선발FIP + 불펜WAR + 타선wRC+ + 파크팩터×날씨)
• NPB: 포아송 기반 득점 기댓값 (선발평균자책+QS비율 + 팀OPS + 구장파크팩터×날씨)
  NPB 특성 보정: 투고타저 리그 특성(MLB 대비 평균 득점 약 15~20% 낮음) 반영
  외국인선수(NPB 규정 최대 5명) 출전 여부에 따른 전력 변동 보정
• 축구: Dixon-Coles 수정 포아송 (xG기반, 홈/원정 공격·수비력 분리, 저득점 ρ 보정)
• NBA: 페이스 조정 ORtg×DRtg 매트릭스 + 홈코트 +2.5pt + 연속경기 -2.5pt
• KBL/WKBL: 페이스 조정 공격효율×수비효율 매트릭스 + 홈코트 보정 + 연속경기 피로 보정
• V리그: 세트당 득점 기댓값 모델 (공격효율×서브리시브효율×블로킹효율 가중합)
  → 세트 승패 확률 → 경기 승패 확률(3세트/4세트/5세트 각 시나리오 산출)
• Edge: 모델확률 − 시장내재확률(1/배당)
• Kelly: f*=(b·p−q)/b → 하프켈리(×0.5), 최대 5% 캡
• RLM: 대중베팅 방향 ≠ 라인이동 방향 → Sharp money 징후
• Elo: 홈/원정 보정치 포함, 최근 20경기 지수 가중
• Vig: (Σ1/배당−1)×100%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 출력 형식 — 11섹션
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 경기 기본 정보
• 리그 / 홈팀 vs 원정팀 / 경기 일시(KST) / 구장명
• 배당: Pinnacle X.XX | bet365 X.XX | Betway X.XX | 3사 평균 X.XX
• Vig X.X% / 적용 모델 명시
• 데이터 수집: ✅/⚠️/❌ 항목 명시

2️⃣ 선발 / 핵심 선수 분석
▶ 야구(MLB/KBO): 선발투수명 ✅/⚠️ 표시 필수
  ERA/FIP/xFIP/SIERA/K9/BB9/SwStr%/CSW%/피Barrel%/피HardHit%/GB%/Stuff+/Location+
  최근3선발 평균ERA | 예상이닝 | QS비율
▶ NPB: 선발투수명 ✅/⚠️ 표시 필수
  평균자책점(ERA)/WHIP/K9/BB9/QS비율/피안타율/피장타율
  최근3선발 평균ERA | 예상이닝(NPB평균5~6이닝) | 구원투수 ERA/방어율
  외국인투수 여부 + 현재 소속팀 크로스체크 필수 ✅
  핵심타자 3명: 타율/출루율/장타율/OPS/홈런/타점/최근10경기 타율
▶ 축구: 핵심3명씩 — xG/xA/xThreat/프로그레시브패스/박스내터치/드리블성공률 (최근5경기)
▶ NBA: 핵심3명씩 — PER/TS%/USG%/BPM/RAPTOR/On-Off NetRtg/득점·리바·어시·TO (최근10경기)
▶ KBL/WKBL: 핵심3명씩 (최근10경기 평균)
  득점/리바운드/어시스트/스틸/블록/턴오버/FG%/3P%/FT%/USG%/+/-
  주전5인 평균 신장·체중 / 외국인선수 컨디션 및 출전여부 ✅/⚠️
▶ V리그: 핵심선수 각 3명씩 (최근10경기 평균)
  공격수: 공격성공률/공격효율/시도수/디그성공률
  세터: 세트분배비율(속공/후위공격/오픈)/세트효율
  리베로: 리시브효율/디그효율
  외국인선수 공격효율 및 서브리시브 부담률 ✅/⚠️

3️⃣ 팀 흐름 & 전력
• 최근10경기: 승-패 (세트득실 포함) / 홈·원정 분리
• 야구(MLB/KBO): 팀wRC+/OPS/팀ERA/팀FIP/BABIP/득실점차
• NPB: 팀OPS/팀ERA/팀WHIP/득실점차/팀타율/팀홈런수
  NPB 특이사항: 교류전 여부 / 클라이맥스시리즈 진출권 경쟁 여부 / 우천취소 일정 영향
• 축구: xG/경기/xGA/경기/xPTS/점유율/PPDA/세트피스xG%
• NBA: ORtg/DRtg/NetRtg/Pace/eFG%/TOV%/ORB% (최근15경기)
• KBL/WKBL: 팀 공격효율/수비효율/Net Rating/Pace/FG%/3P%/FT%/리바운드마진/턴오버마진
  연속경기 일정 / 외국인선수 부상·결장 여부
• V리그: 팀 공격효율/서브효율/블로킹효율/리시브효율/세트득실비율
  최근10경기 세트스코어 패턴(3-0/3-1/3-2/2-3/1-3/0-3 비율)
• 연승·연패 / 동기부여 수치화 / Elo 보정 승률

4️⃣ 공격·수비 지표 정량 비교
반드시 "X팀이 Y팀 대비 Z% 우위" 형식 종합
• 야구(MLB/KBO): wRC+/ISO/BABIP/득점권OPS/HardHit%/Barrel%/K%/BB%
• NPB: 팀타율/OPS/득점권타율/팀홈런/팀ERA/팀WHIP/K%/BB%
  → "X팀이 Y팀 대비 Z% 우위" 형식 종합
• 축구: xG/90/xGA/90/유효슈팅%/빅찬스생성·허용/PPDA
• NBA: ORtg/DRtg/eFG%/상대eFG%/TOV%/ORB%/FT비율
• KBL/WKBL: 공격효율/수비효율/리바운드%/어시스트비율/턴오버%/FT획득률/페인트득점/속공득점
• V리그: 공격효율/서브득점률/블로킹효율/리시브효율/세터속공비율/후위공격비율

5️⃣ 벤치 뎁스 & 체력
• 야구(MLB/KBO): 불펜ERA/FIP/WAR/최근3일투구수/연투투수/피로도(0~10)
• NPB: 불펜ERA/WHIP/최근3일 등판수/마무리투수 상태(세이브수·최근등판일)
  외국인선수 출전명단 확인 필수(NPB 1군 등록 최대 외국인 4명 동시출전)
• 축구: 스쿼드가치(€)/휴식일수/유럽·컵병행/부상자
• NBA: 로테이션인원/연속경기여부/분제한/벤치NetRtg
• KBL/WKBL: 로테이션 인원(6인/7인/8인) / 전날 경기 여부(B2B) / 외국인선수 파울트러블 위험도
  벤치 득점력(주전5인 외 평균 득점) / 부상자 명단
• V리그: 세트별 교체 패턴 / 주전 외국인 피로도(최근 세트소화량) / 부상·결장 선수

6️⃣ 구장·환경
▶ 야구(MLB/KBO): 파크팩터(Runs/HR/H) / 기온·습도·풍향풍속·강수확률·AirDensity → HR보정±X%/득점보정±X% / 심판성향
▶ NPB: 구장별 파크팩터(Runs/HR, 100=평균)
  - 도쿄돔(요미우리·닛폰햄): 투수유리 / 야후페이페이돔(소프트뱅크): 타자유리
  - 고시엔(한신): 바람 영향 큼 / 마쓰모토 등 지방구장: 고도 영향
  실시간 날씨: 기온·습도·풍향풍속·강수확률(우천콜드게임 가능성)
  → HR 환경 보정 ±X% / 득점 환경 보정 ±X%
  심판 성향: 스트라이크존 경향 / 해당 심판 오버언더 히스토리
▶ 축구: 잔디상태/날씨/홈관중어드밴티지(xG+X%) / 심판파울·카드성향
▶ NBA: 홈코트보정(+Xpt)/고도보정여부 / 심판FT어드밴티지 방향
▶ KBL/WKBL: 홈코트 승률 보정값(홈팀 평균 +Xpt) / 구장 수용인원 대비 관중 밀도
  심판 파울콜 성향(경기당 평균 파울수·FT어드밴티지 방향)
▶ V리그: 홈코트 어드밴티지(세트승률 기준 +X%) / 구장 천장 높이(서브 궤적 영향)
  심판 성향(인·아웃 판정 경향 / 터치판정 엄격도)

7️⃣ 감독 성향 & 라인업 상성 & 전술 매치업

▶ 감독 전술 성향 (종목별)
• 야구(MLB/KBO) — 양 팀 감독 각각
  - 선발 조기 강판 vs 장기 운용 성향 (평균 선발 이닝 수 기준)
  - 불펜 운용: 원포인트 릴리프 선호 vs 멀티이닝 선호
  - 공격 성향: 번트·도루 적극성(시즌 시도 횟수) vs 강공 일변도
  - 타순 구성: 우타 집중 vs 좌우 균형 / 클러치 상황 대타 적극성
  - 최근 3경기 투수 교체 타이밍 패턴

• NPB — 양 팀 감독 각각
  - 번트 적극성: NPB는 MLB·KBO 대비 번트 빈도 매우 높음 → 감독별 시즌 번트 시도수 비교
  - 선발 운용: 완투형 에이스 선호 vs 5~6이닝 교체 패턴
  - 마무리·셋업 고정 여부 (NPB는 마무리 고정 문화 강함)
  - 외국인선수 기용 순서 및 타순 배치 성향
  - 희생번트 지시 상황 기준 (동점·1점차 vs 대량리드 시 번트 여부)
  - 좌우 대결 대타 기용 빈도 (NPB 좌우 스플릿 활용도 높음)
  - 연장전 투수 운용 패턴 (NPB 연장 12회 제한)

• 축구 — 양 팀 감독 각각
  - 기본 포메이션 + 상황별 변형 패턴
  - 빌드업 vs 직접 연결 선호도 (패스 길이 평균, PPDA 기준)
  - 압박 강도·위치(하이프레스 vs 미드블록 vs 저블록)
  - 교체 타이밍 성향 (선취득점 후 수비전환 vs 끝까지 공격)
  - 세트피스 전담 전술(코너·프리킥 루틴) / 선호 공격 루트(좌측/우측/중앙)
  - 패배 시 전술 변화 패턴 (추격 상황 포메이션 변형)

• NBA — 양 팀 감독 각각
  - 로테이션 인원 성향 (8인 고정 vs 9~10인 유동)
  - 클러치 타임(마지막 5분) 선호 세트플레이 패턴
  - 파울 작전 타이밍 / 타임아웃 운용 성향
  - 오펜스 시스템 (픽앤롤 중심 vs 아이솔 vs 모션 오펜스)
  - 수비 스킴 (맨투맨 vs 존 / 스위칭 빈도)

• KBL/WKBL — 양 팀 감독 각각
  - 외국인선수 의존도 (외국인 득점 비중 % 기준)
  - 타임아웃 운용 패턴 (점수차 기준 / 흐름 끊기 타이밍)
  - 클러치 상황 주전 기용 성향 (5인 고정 vs 교체 적극)
  - 3점슛 의존도 vs 페인트존 공략 비율
  - 지고 있을 때 풀코트 프레스 여부
  - 경기 후반 파울 게임 진입 기준점

• V리그 — 양 팀 감독 각각
  - 세터 분배 패턴 선호 (속공 집중 vs 오픈 균형)
  - 외국인선수 공격 집중도 (전체 공격 중 비율%)
  - 세트 위기 상황 교체 타이밍 (몇 점차에서 교체)
  - 서브 전략 (강서브 리스크 vs 안전서브 안정)
  - 리베로 기용 패턴 / 후위공격 활용 빈도

▶ 라인업 상성 & 전술 매치업
• 야구: 좌우스플릿OPS/핵심타자vs선발상대전적(최근2시즌,15타석이상)/클러치성적
• 축구: 포메이션 매치업(텍스트 도식) / 압박 취약 구간별 xG / 주요 1:1 매치업
• NBA: 핵심미스매치/픽앤롤수비취약점/On-Off라인업
• KBL/WKBL: 외국인선수 매치업(신장·기술 우위) / 주전가드 vs 상대수비 매치업
  팀 오펜스 시스템 vs 상대 수비 취약점 / H2H 최근5경기 점수차·결정적 플레이어
• V리그: 외국인선수 공격 집중도 vs 상대 블로킹 배치
  세터-공격수 조합 궁합 / 상대 리시브 취약 포지션 / H2H 세트스코어 패턴

8️⃣ 배당 흐름 & 시장 분석
• 오픈→현재 배당 변화율(%) / 핸디캡·아시안핸디캡 이동
• RLM 감지: 불일치 시 "⚡ Sharp money 유입 징후" 명시
• 축구추가: BTTS·무득점·코너킥 배당 흐름
• KBL/WKBL 추가: 핸디캡 라인 이동 / 오버언더 라인 이동 / 전반 오버언더 배당
• V리그 추가: 핸디캡(세트) 배당 / 오버언더(세트합계) 배당 / 5세트 여부 배당 흐름
• 시장내재확률 vs 모델확률 괴리(%) → Edge 방향
• CLV 추적 가능 여부

9️⃣ 🎯 베팅 추천

■ 베팅 추천 4중 필터 (모두 통과해야 추천)
  1. 모델 확률 하한선
     - 승/패: ≥ 52% / 무승부: ≥ 28% / 오버·언더: ≥ 55% / BTTS: ≥ 50%
  2. Edge ≥ 3%
  3. 데이터 신뢰도 확인됨
  4. 지뢰경기 아님

⚠️ 핵심: 4중 필터 미달 또는 지뢰경기 시 9️⃣~1️⃣1️⃣ 전부 생략, 아래 한 줄만 출력:
  "🚫 베팅 추천 없음 — [이유]"

4중 필터 전부 통과 시 출력:
  [시장] | 배당X.XX | 모델X% | 시장Y% | Edge+Z% | 신뢰도:상/중/하
  근거① / 근거② / 근거③
  풀켈리 f*=X% → ₩XX,XXX원 / 하프켈리=X% → 권장 ₩XX,XXX원 / 쿼터켈리=X% → 입문자 ₩XX,XXX원

🔟 베팅 구조화 전략 (9️⃣ 추천 있을 때만)
• 오버근거 3개(수치만) / 언더근거 3개(수치만)
• 지뢰경기: "✔ 지뢰 경기 맞음" or "✘ 지뢰 경기 아님" — 단정+정량이유
• 베팅타이밍: 지금즉시 / 라인업확정후 / 킥오프X분전 중 선택

1️⃣1️⃣ 리스크 분산 조합 (9️⃣ 추천 있을 때만)
조합A [안정형/Edge3~5%] → 항목+배당+근거한줄
조합B [밸런스형/Edge5~8%] → 항목+배당+근거한줄
조합C [고수익형/Edge8%↑] → 항목+배당+근거한줄 + ⚠️고위험경고

■ 다폴더 기준 (조합 구성 시 적용)
2폴더: 각 경기 모델확률 ≥75% / Edge ≥3% / 지뢰경기 아님 → 미달 시 "2폴더 조합 불가"
3폴더: 각 경기 모델확률 ≥80% / Edge ≥5% / 신뢰도 상 / 지뢰경기 아님 → 미달 시 "3폴더 조합 불가"
조합 확률 = 각 경기 확률 곱셈으로 반드시 표시

■ 출력 효율 규칙 (최우선 — 반드시 준수)
• 수치와 결론만 출력. 설명·해석·부연·근거 나열 완전 금지
• 섹션당 최대 4줄 이내. 항목은 "지표: 수치" 한 줄 압축
• 문장 금지. 표도 최소화. 숫자와 기호만
• 9️⃣ 베팅 추천은 3줄 이내: 시장|배당|Edge|Kelly금액
• 서론·마무리·경고문·"~입니다" 형태 문장 완전 금지
• 데이터 한계 언급은 ⚠️ 기호만, 설명 금지
• 11섹션 전부 출력하되 각 섹션을 최대한 압축`;

// ─────────────────────────────────────────────────────────────
//  localStorage 유틸
// ─────────────────────────────────────────────────────────────
const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch(_){ return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(_){} },
};

// sessionStorage (분석 탭)
const SS_KEY = 'qe_tabs_v2';
const saveTabs = (tabs) => { try { sessionStorage.setItem(SS_KEY, JSON.stringify(tabs.map(t => ({ ...t, status: t.status === 'loading' ? 'error' : t.status, content: t.status === 'loading' ? '화면 전환으로 중단됐습니다. 다시 시도해주세요.' : t.content })))); } catch(_){} };
const loadTabs = () => { try { const r = sessionStorage.getItem(SS_KEY); return r ? JSON.parse(r) : []; } catch(_){ return []; } };

// ─────────────────────────────────────────────────────────────
//  리포트 라인 렌더러
// ─────────────────────────────────────────────────────────────
const renderLine = (line, i) => {
  const t = line.trim();
  if (!t) return <div key={i} style={{ height:'5px' }} />;
  const html = t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  if (/^[1-9]️⃣|^🎯|^🔟|^1️⃣1️⃣/.test(t)) return <div key={i} style={{ marginTop:'22px', marginBottom:'5px', padding:'8px 12px', background:'rgba(0,212,255,0.08)', borderLeft:'3px solid #00d4ff', borderRadius:'0 6px 6px 0', fontSize:'13px', fontWeight:'800', color:'#00d4ff' }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (t.startsWith('▶') || t.startsWith('▸')) return <div key={i} style={{ marginTop:'9px', marginBottom:'2px', fontSize:'12px', fontWeight:'700', color:'#7ecfff', borderBottom:'1px solid rgba(0,212,255,0.08)', paddingBottom:'3px' }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (t.includes('|') && (t.includes('%') || t.includes('배당') || t.includes('Edge') || t.includes('₩'))) return <div key={i} style={{ margin:'3px 0', padding:'6px 10px', background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.11)', borderRadius:'5px', fontSize:'12px', color:'#a8d8f0', fontFamily:'monospace' }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (t.startsWith('→') || t.startsWith('✅') || t.startsWith('✔') || t.startsWith('⚡') || t.startsWith('조합')) return <div key={i} style={{ margin:'3px 0', padding:'5px 10px', background:'rgba(255,217,61,0.06)', borderLeft:'2px solid #ffd93d', borderRadius:'0 5px 5px 0', fontSize:'12px', color:'#ffd93d' }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (t.startsWith('✖') || t.startsWith('✘') || t.startsWith('🚫') || t.includes('추천 없음')) return <div key={i} style={{ margin:'3px 0', padding:'5px 10px', background:'rgba(255,80,80,0.06)', borderLeft:'2px solid #ff5555', borderRadius:'0 5px 5px 0', fontSize:'12px', color:'#ff8888' }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (t.includes('추정치') || t.includes('데이터 한계') || t.startsWith('※')) return <div key={i} style={{ fontSize:'11px', color:'#ff9f5a', paddingLeft:'12px', margin:'2px 0', opacity:0.85 }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (/^[①②③]/.test(t)) return <div key={i} style={{ fontSize:'12px', color:'#90c4e0', paddingLeft:'16px', margin:'2px 0' }} dangerouslySetInnerHTML={{ __html: html }} />;
  return <div key={i} style={{ fontSize:'12.5px', color:'#b8cde0', lineHeight:'1.8', paddingLeft:(line.startsWith('  ')||line.startsWith('\t'))?'16px':'0' }} dangerouslySetInnerHTML={{ __html: html }} />;
};

// ─────────────────────────────────────────────────────────────
//  상수
// ─────────────────────────────────────────────────────────────
const LEAGUES = [
  { id:'KBO',        label:'한국야구(KBO)',         emoji:'⚾', color:'#ff6b35' },
  { id:'MLB',        label:'미국야구(MLB)',          emoji:'⚾', color:'#e63946' },
  { id:'NPB',        label:'일본야구(NPB)',          emoji:'⚾', color:'#e63f8e' },
  { id:'EPL',        label:'잉글랜드 프리미어리그',  emoji:'⚽', color:'#00c27c' },
  { id:'La Liga',    label:'스페인 라리가',          emoji:'⚽', color:'#c8a415' },
  { id:'Bundesliga', label:'독일 분데스리가',        emoji:'⚽', color:'#d62828' },
  { id:'Serie A',    label:'이탈리아 세리에A',       emoji:'⚽', color:'#4a90e2' },
  { id:'Ligue 1',    label:'프랑스 리그앙',          emoji:'⚽', color:'#8c6fea' },
  { id:'UCL',        label:'UEFA 챔피언스리그',      emoji:'🏆', color:'#00aaff' },
  { id:'UEL',        label:'UEFA 유로파리그',        emoji:'🏆', color:'#ff8c00' },
  { id:'NBA',        label:'미국농구(NBA)',          emoji:'🏀', color:'#f4a261' },
  { id:'KBL',        label:'한국남자농구(KBL)',      emoji:'🏀', color:'#e8a020' },
  { id:'WKBL',       label:'한국여자농구(WKBL)',     emoji:'🏀', color:'#e87070' },
  { id:'V리그남자',  label:'V리그 남자부',           emoji:'🏐', color:'#4ac8ff' },
  { id:'V리그여자',  label:'V리그 여자부',           emoji:'🏐', color:'#c87eff' },
];

const EXAMPLES = [
  { league:'KBO',       text:'KBO: 한화 이글스 vs LG 트윈스',                      label:'한화 이글스 vs LG 트윈스' },
  { league:'MLB',       text:'MLB: 뉴욕 양키스 vs 보스턴 레드삭스',                 label:'뉴욕 양키스 vs 보스턴 레드삭스' },
  { league:'NPB',       text:'NPB: 요미우리 자이언츠 vs 한신 타이거스',              label:'요미우리 자이언츠 vs 한신 타이거스' },
  { league:'EPL',       text:'EPL: 아스날 vs 첼시',                                label:'아스날 vs 첼시' },
  { league:'La Liga',   text:'La Liga: 레알 마드리드 vs FC 바르셀로나',              label:'레알 마드리드 vs FC 바르셀로나' },
  { league:'Bundesliga',text:'Bundesliga: 바이에른 뮌헨 vs 보루시아 도르트문트',     label:'바이에른 뮌헨 vs 도르트문트' },
  { league:'Serie A',   text:'Serie A: 인테르 밀란 vs AC 밀란',                    label:'인테르 밀란 vs AC 밀란' },
  { league:'UCL',       text:'UCL: 레알 마드리드 vs 맨체스터 시티',                  label:'레알 마드리드 vs 맨체스터 시티' },
  { league:'UCL',       text:'UCL: FC 바르셀로나 vs 바이에른 뮌헨',                 label:'FC 바르셀로나 vs 바이에른 뮌헨' },
  { league:'UEL',       text:'UEL: 맨체스터 유나이티드 vs 아약스',                   label:'맨체스터 유나이티드 vs 아약스' },
  { league:'NBA',       text:'NBA: 로스앤젤레스 레이커스 vs 보스턴 셀틱스',          label:'레이커스 vs 셀틱스' },
  { league:'KBL',       text:'KBL: 서울 SK 나이츠 vs 울산 현대모비스 피버스',       label:'서울 SK vs 울산 모비스' },
  { league:'WKBL',      text:'WKBL: 청주 KB 스타즈 vs 부천 하나원큐',              label:'청주 KB스타즈 vs 부천 하나원큐' },
  { league:'V리그남자', text:'V리그남자: 대한항공 점보스 vs 현대캐피탈 스카이워커스', label:'대한항공 vs 현대캐피탈' },
  { league:'V리그여자', text:'V리그여자: 흥국생명 핑크스파이더스 vs 현대건설 힐스테이트', label:'흥국생명 vs 현대건설' },
];

const STEPS = [
  '🌐 선발·라인업·부상자 명단 검색 중...',
  '📈 실시간 배당 수집 중...',
  '🌤 날씨·구장·파크팩터 처리 중...',
  '⚙️ 포아송·딕슨콜스·엘로 연산 중...',
  '🔍 역방향 라인·샤프머니 감지 중...',
  '📝 11섹션 리포트 생성 중...',
];

const parseMatches = (raw) => { const lines = raw.split(/\n|,/).map(s => s.trim()).filter(Boolean); return lines.length > 1 ? lines : [raw.trim()]; };
const shortLabel = (text) => { const clean = text.replace(/^[^:]+:\s*/,''); const parts = clean.split(/\s+vs\s+/i); if (parts.length === 2) return `${parts[0].split(' ').slice(-1)[0]} vs ${parts[1].split(' ').slice(-1)[0]}`; return clean.length > 14 ? clean.slice(0,12)+'…' : clean; };
const fmtWon = (n) => `₩${Math.round(n).toLocaleString('ko-KR')}원`;
const fmtNum = (n) => Math.round(n).toLocaleString('ko-KR');

// ─────────────────────────────────────────────────────────────
//  단일 경기 분석
// ─────────────────────────────────────────────────────────────
const analyzeOne = async (matchText, kst, bankroll) => {
  const br = parseInt(String(bankroll).replace(/[^0-9]/g,'')) || 100000;
  const userContent = `현재 일시(KST): ${kst}
분석 경기: ${matchText}
은행롤: ${fmtNum(br)}원

웹 검색으로 최신 데이터를 수집한 후 11섹션 퀀트 분석 리포트를 한국어로 출력하라.

※ 9️⃣ 베팅 추천 섹션 켈리 계산 시 반드시 아래 형식으로 실제 금액 명시:
  풀켈리 f*=X% → ${fmtWon(br*0.083)} (예시)
  하프켈리=X% → 권장 ${fmtWon(br*0.042)}원 (은행롤 ${fmtNum(br)}원 기준)
  쿼터켈리=X% → 입문자 ${fmtWon(br*0.021)}원
  ※ 위 예시 금액은 형식 예시이며 실제 f* 계산값으로 대체할 것`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 300000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:16000, system:SYSTEM_PROMPT, tools:[{type:'web_search_20250305',name:'web_search'}], messages:[{role:'user',content:userContent}] }),
    });
    clearTimeout(tid);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `서버 오류 (${res.status})`);
    const text = (data.content||[]).filter(b=>b.type==='text'&&b.text).map(b=>b.text).join('\n').trim();
    if (!text) throw new Error('결과를 받지 못했습니다.');
    return { ok:true, text };
  } catch(e) {
    clearTimeout(tid);
    return { ok:false, text: e.name==='AbortError' ? '분석 시간이 5분을 초과했습니다.' : e.message };
  }
};

// ─────────────────────────────────────────────────────────────
//  탭 컴포넌트
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR = { pending:'#2a5a7a', loading:'#00d4ff', done:'#00c060', error:'#ff5555' };
const Tab = ({ tab, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'7px 13px', background:active?'rgba(0,212,255,0.12)':'rgba(0,212,255,0.03)', border:active?'1px solid rgba(0,212,255,0.45)':'1px solid rgba(0,212,255,0.12)', borderRadius:'8px', color:active?'#e0f0ff':'#5a8aaa', fontSize:'11px', fontWeight:active?'700':'400', fontFamily:'inherit', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:STATUS_COLOR[tab.status], flexShrink:0, boxShadow:tab.status==='loading'?`0 0 6px ${STATUS_COLOR.loading}`:'none', animation:tab.status==='loading'?'pulse 1s infinite':'none' }} />
    {tab.label}
  </button>
);

// ─────────────────────────────────────────────────────────────
//  베팅 기록 탭
// ─────────────────────────────────────────────────────────────
const RECORD_KEY = 'qe_records_v1';
const BR_KEY = 'qe_bankroll_v1';

const RecordTab = ({ bankroll, onBankrollChange }) => {
  const [records, setRecords] = useState(() => ls.get(RECORD_KEY, []));
  const [form, setForm] = useState({ match:'', market:'', odds:'', betAmt:'', result:'' });
  const [showForm, setShowForm] = useState(false);

  const saveRecords = (r) => { setRecords(r); ls.set(RECORD_KEY, r); };

  const handleAdd = () => {
    const odds = parseFloat(form.odds) || 0;
    const betAmt = parseInt(form.betAmt.replace(/[^0-9]/g,'')) || 0;
    const br = parseInt(String(bankroll).replace(/[^0-9]/g,'')) || 0;
    if (!form.match || !odds || !betAmt || !form.result) return;

    let pnl = 0;
    let newBr = br;
    if (form.result === '적중') {
      pnl = Math.round(betAmt * (odds - 1));
      newBr = br + pnl;
    } else if (form.result === '미적중') {
      pnl = -betAmt;
      // 미적중: 베팅 시 이미 차감했으므로 은행롤 변동 없음
    }

    const rec = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ko-KR', { timeZone:'Asia/Seoul' }),
      match: form.match,
      market: form.market,
      odds,
      betAmt,
      result: form.result,
      pnl,
      brAfter: form.result === '베팅중' ? br - betAmt : newBr,
    };

    // 은행롤 업데이트
    if (form.result === '베팅중') {
      onBankrollChange(String(br - betAmt));
    } else if (form.result === '적중') {
      onBankrollChange(String(newBr));
    }
    // 미적중은 베팅 시 이미 차감됨

    saveRecords([rec, ...records]);
    setForm({ match:'', market:'', odds:'', betAmt:'', result:'' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    // 삭제 시 은행롤 롤백
    const br = parseInt(String(bankroll).replace(/[^0-9]/g,'')) || 0;
    let restored = br;
    if (rec.result === '베팅중') restored = br + rec.betAmt;
    else if (rec.result === '적중') restored = br - rec.pnl;
    else if (rec.result === '미적중') restored = br + rec.betAmt;
    onBankrollChange(String(restored));
    saveRecords(records.filter(r => r.id !== id));
  };

  const totalPnl = records.filter(r => r.result !== '베팅중').reduce((s,r) => s + r.pnl, 0);
  const wins = records.filter(r => r.result === '적중').length;
  const losses = records.filter(r => r.result === '미적중').length;
  const pending = records.filter(r => r.result === '베팅중').length;
  const totalBet = records.reduce((s,r) => s + r.betAmt, 0);
  const roi = totalBet > 0 ? (totalPnl / totalBet * 100) : 0;

  const inputStyle = { width:'100%', padding:'8px 10px', background:'rgba(7,18,34,0.97)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'7px', color:'#ddeeff', fontSize:'12px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontSize:'10px', color:'#3a7090', marginBottom:'4px', display:'block' };

  return (
    <div>
      {/* 요약 통계 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' }}>
        {[
          { label:'총 손익', val: (totalPnl >= 0 ? '+' : '') + fmtNum(totalPnl) + '원', color: totalPnl >= 0 ? '#00c060' : '#ff5555' },
          { label:'ROI', val: (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%', color: roi >= 0 ? '#00c060' : '#ff5555' },
          { label:'적중/미적중', val: `${wins}승 ${losses}패`, color:'#7ecfff' },
          { label:'베팅중', val: `${pending}건`, color:'#ffd93d' },
        ].map((s,i) => (
          <div key={i} style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:'#3a7090', marginBottom:'4px' }}>{s.label}</div>
            <div style={{ fontSize:'13px', fontWeight:'800', color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* 기록 추가 버튼 */}
      <button onClick={() => setShowForm(p=>!p)} style={{ width:'100%', padding:'9px', background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', color:'#4a9eff', fontSize:'12px', fontFamily:'inherit', cursor:'pointer', marginBottom:'10px' }}>
        {showForm ? '▲ 닫기' : '+ 베팅 기록 추가'}
      </button>

      {/* 기록 입력 폼 */}
      {showForm && (
        <div style={{ background:'rgba(7,18,34,0.95)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:'10px', padding:'14px', marginBottom:'12px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
            <div>
              <label style={labelStyle}>경기</label>
              <input style={inputStyle} placeholder="예: 한화 vs LG" value={form.match} onChange={e=>setForm(p=>({...p,match:e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>베팅 시장</label>
              <input style={inputStyle} placeholder="예: 홈승 / 언더 2.5" value={form.market} onChange={e=>setForm(p=>({...p,market:e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>배당</label>
              <input style={inputStyle} type="number" step="0.01" placeholder="예: 1.85" value={form.odds} onChange={e=>setForm(p=>({...p,odds:e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>베팅금액 (원)</label>
              <input style={inputStyle} placeholder="예: 3000" value={form.betAmt} onChange={e=>setForm(p=>({...p,betAmt:e.target.value.replace(/[^0-9]/g,'')}))} />
            </div>
          </div>
          <div style={{ marginBottom:'10px' }}>
            <label style={labelStyle}>결과</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {['베팅중','적중','미적중'].map(r => (
                <button key={r} onClick={() => setForm(p=>({...p,result:r}))} style={{ flex:1, padding:'8px', border:`1px solid ${form.result===r ? (r==='적중'?'#00c060':r==='미적중'?'#ff5555':'#ffd93d') : 'rgba(0,212,255,0.15)'}`, borderRadius:'7px', background: form.result===r ? (r==='적중'?'rgba(0,192,96,0.15)':r==='미적중'?'rgba(255,85,85,0.15)':'rgba(255,217,61,0.15)') : 'transparent', color: r==='적중'?'#00c060':r==='미적중'?'#ff5555':'#ffd93d', fontSize:'12px', fontFamily:'inherit', cursor:'pointer' }}>
                  {r==='베팅중'?'⏳ 베팅중':r==='적중'?'✅ 적중':'❌ 미적중'}
                </button>
              ))}
            </div>
          </div>
          {form.result && form.betAmt && form.odds && (
            <div style={{ fontSize:'11px', color:'#3a7090', padding:'8px 10px', background:'rgba(0,212,255,0.04)', borderRadius:'6px', marginBottom:'10px' }}>
              {form.result==='베팅중' && `베팅 후 은행롤: ${fmtWon(parseInt(String(bankroll).replace(/[^0-9]/g,''))||0 - (parseInt(form.betAmt)||0))}`}
              {form.result==='적중' && `예상 수익: +${fmtWon((parseInt(form.betAmt)||0) * ((parseFloat(form.odds)||1) - 1))} → 은행롤: ${fmtWon((parseInt(String(bankroll).replace(/[^0-9]/g,''))||0) + (parseInt(form.betAmt)||0) * ((parseFloat(form.odds)||1) - 1))}`}
              {form.result==='미적중' && `손실: -${fmtWon(parseInt(form.betAmt)||0)} (이미 차감됨)`}
            </div>
          )}
          <button onClick={handleAdd} disabled={!form.match||!form.odds||!form.betAmt||!form.result} style={{ width:'100%', padding:'9px', background: (!form.match||!form.odds||!form.betAmt||!form.result)?'rgba(0,212,255,0.05)':'linear-gradient(135deg,#00d4ff,#0095e8)', border:'none', borderRadius:'8px', color: (!form.match||!form.odds||!form.betAmt||!form.result)?'#1a4a6a':'#020c18', fontSize:'12px', fontWeight:'800', fontFamily:'inherit', cursor:(!form.match||!form.odds||!form.betAmt||!form.result)?'not-allowed':'pointer' }}>
            기록 저장 & 은행롤 반영
          </button>
        </div>
      )}

      {/* 기록 목록 */}
      {records.length === 0 ? (
        <div style={{ textAlign:'center', color:'#2a5a7a', fontSize:'12px', padding:'30px 0' }}>아직 기록이 없습니다</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {records.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'rgba(7,18,34,0.8)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:'8px', fontSize:'11px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'#90b4cc', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.date} · {r.match}</div>
                <div style={{ color:'#5a8aaa' }}>{r.market} · 배당 {r.odds} · {fmtWon(r.betAmt)}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ color: r.result==='적중'?'#00c060':r.result==='미적중'?'#ff5555':'#ffd93d', fontWeight:'700' }}>
                  {r.result==='베팅중'?'⏳':r.result==='적중'?'✅':'❌'} {r.result}
                </div>
                {r.result!=='베팅중' && <div style={{ color: r.pnl>=0?'#00c060':'#ff5555', fontSize:'10px' }}>{r.pnl>=0?'+':''}{fmtNum(r.pnl)}원</div>}
              </div>
              <button onClick={() => handleDelete(r.id)} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:'14px', padding:'2px 4px', flexShrink:0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  메인 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function QuantEdge() {
  const [input,        setInput]     = useState('');
  const [bankroll,     setBankroll]  = useState(() => ls.get(BR_KEY, '100000'));
  const [tabs,         setTabs]      = useState(() => loadTabs());
  const [activeTab,    setActiveTab] = useState(() => { const t = loadTabs(); return t.length ? t[0].id : null; });
  const [globalLoad,   setGlobalLoad]= useState(false);
  const [error,        setError]     = useState('');
  const [showExamples, setShowEx]    = useState(false);
  const [mainTab,      setMainTab]   = useState('분석'); // '분석' | '기록'
  const bottomRef  = useRef(null);
  const elapsedRef = useRef({});

  useEffect(() => { if (tabs.length > 0) saveTabs(tabs); }, [tabs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [activeTab, tabs, mainTab]);

  const handleBankrollChange = (val) => {
    const clean = String(val).replace(/[^0-9]/g,'');
    setBankroll(clean);
    ls.set(BR_KEY, clean);
  };

  const startElapsed = (id) => { elapsedRef.current[id] = setInterval(() => setTabs(prev => prev.map(t => t.id===id?{...t,elapsed:(t.elapsed||0)+1}:t)), 1000); };
  const stopElapsed  = (id) => { clearInterval(elapsedRef.current[id]); delete elapsedRef.current[id]; };

  const handleAnalyze = async () => {
    const raw = input.trim();
    if (!raw || globalLoad) return;
    const matches = parseMatches(raw);
    const kst = new Date().toLocaleString('ko-KR', { timeZone:'Asia/Seoul', year:'numeric', month:'long', day:'numeric', weekday:'long', hour:'2-digit', minute:'2-digit' });
    const newTabs = matches.map((m,i) => ({ id:Date.now()+i, label:shortLabel(m), matchText:m, status:'pending', content:'', elapsed:0 }));
    setTabs(newTabs); setActiveTab(newTabs[0].id);
    setInput(''); setShowEx(false); setError(''); setGlobalLoad(true);
    for (const tab of newTabs) {
      setTabs(prev => prev.map(t => t.id===tab.id?{...t,status:'loading'}:t));
      setActiveTab(tab.id); startElapsed(tab.id);
      const result = await analyzeOne(tab.matchText, kst, bankroll);
      stopElapsed(tab.id);
      setTabs(prev => prev.map(t => t.id===tab.id?{...t,status:result.ok?'done':'error',content:result.text}:t));
    }
    setGlobalLoad(false);
  };

  const activeTabData = tabs.find(t => t.id===activeTab);
  const isEmpty = tabs.length === 0;
  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const brNum = parseInt(String(bankroll).replace(/[^0-9]/g,'')) || 0;

  return (
    <div style={{ minHeight:'100vh', background:'#04090f', backgroundImage:'radial-gradient(ellipse 55% 45% at 12% 50%, rgba(0,80,160,0.18) 0%, transparent 70%),radial-gradient(ellipse 40% 35% at 88% 12%, rgba(0,190,100,0.09) 0%, transparent 60%)', fontFamily:"'IBM Plex Mono','Noto Sans KR',monospace", color:'#c0d4e8', display:'flex', flexDirection:'column', alignItems:'center' }}>

      {/* 헤더 */}
      <header style={{ width:'100%', maxWidth:'960px', padding:'18px 20px 0', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
          <div style={{ width:'44px', height:'44px', flexShrink:0, background:'linear-gradient(135deg,#00d4ff,#0077ff 50%,#00ff88)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'21px', boxShadow:'0 0 24px rgba(0,212,255,0.35)' }}>📊</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'19px', fontWeight:'900', color:'#fff', letterSpacing:'0.04em' }}>
              퀀트<span style={{ color:'#00d4ff' }}>엣지</span>
              <span style={{ fontSize:'10px', color:'#2a5a8a', marginLeft:'10px', fontWeight:'400' }}>스포츠 베팅 퀀트 분석</span>
            </div>
            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'6px' }}>
              {LEAGUES.map(l => (
                <button key={l.id} onClick={() => setInput(p => p ? p+'\n'+l.label+': ' : l.label+': ')} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'20px', border:`1px solid ${l.color}55`, color:l.color, background:'transparent', cursor:'pointer', fontWeight:'700', fontFamily:'inherit', transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background=`${l.color}22`} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {l.emoji} {l.label}
                </button>
              ))}
            </div>
          </div>
          {/* 은행롤 표시 */}
          <div style={{ flexShrink:0, textAlign:'right' }}>
            <div style={{ fontSize:'10px', color:'#3a7090', marginBottom:'3px' }}>💰 은행롤</div>
            <div style={{ fontSize:'16px', fontWeight:'900', color:'#ffd93d' }}>{fmtNum(brNum)}원</div>
          </div>
        </div>
        {/* 메인 탭 */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'0' }}>
          {['분석','베팅기록'].map(t => (
            <button key={t} onClick={() => setMainTab(t)} style={{ padding:'7px 16px', background:mainTab===t?'rgba(0,212,255,0.12)':'transparent', border:mainTab===t?'1px solid rgba(0,212,255,0.4)':'1px solid transparent', borderRadius:'8px 8px 0 0', color:mainTab===t?'#00d4ff':'#3a6a8a', fontSize:'12px', fontWeight:mainTab===t?'700':'400', fontFamily:'inherit', cursor:'pointer' }}>
              {t==='베팅기록'?`📋 ${t}`:`⚡ ${t}`}
            </button>
          ))}
        </div>
        <div style={{ height:'1px', background:'linear-gradient(90deg,rgba(0,212,255,0.45),rgba(0,255,136,0.18),transparent)' }} />
      </header>

      {/* 메인 */}
      <main style={{ width:'100%', maxWidth:'960px', flex:1, padding:'0 20px', boxSizing:'border-box' }}>

        {/* 베팅 기록 탭 */}
        {mainTab === '베팅기록' && (
          <div style={{ paddingTop:'16px' }}>
            <RecordTab bankroll={bankroll} onBankrollChange={handleBankrollChange} />
          </div>
        )}

        {/* 분석 탭 */}
        {mainTab === '분석' && (
          <>
            {isEmpty && (
              <div style={{ padding:'36px 0 20px', textAlign:'center' }}>
                <div style={{ fontSize:'44px', marginBottom:'12px', filter:'drop-shadow(0 0 18px rgba(0,212,255,0.4))' }}>⚡</div>
                <div style={{ fontSize:'15px', fontWeight:'900', color:'#fff', marginBottom:'6px' }}>경기를 입력하면 11섹션 퀀트 분석 리포트를 실시간 생성합니다</div>
                <div style={{ fontSize:'11px', color:'#2a5a8a', lineHeight:'2.1', marginBottom:'18px' }}>딕슨-콜스 · 포아송 · 엘로 보정 · 역방향 라인 감지 · 켈리 스테이크 · Edge ≥ 3% 베팅만 추천</div>
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', marginBottom:'18px' }}>
                  {['스탯캐스트','팬그래프스','스타티즈','에프비레프','언더스탯','풋몹','피나클','벳365'].map(s=><span key={s} style={{ fontSize:'10px', padding:'3px 8px', borderRadius:'4px', background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.12)', color:'#3a7090' }}>{s}</span>)}
                </div>
                <button onClick={()=>setShowEx(p=>!p)} style={{ background:'none', border:'1px solid rgba(0,212,255,0.25)', borderRadius:'6px', padding:'7px 16px', color:'#4a9eff', fontSize:'11px', cursor:'pointer', fontFamily:'inherit', marginBottom:'10px' }}>
                  {showExamples?'▲ 예시 경기 닫기':'▼ 예시 경기 선택'}
                </button>
                {showExamples && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', maxWidth:'560px', margin:'0 auto 16px' }}>
                    {EXAMPLES.map((ex,i)=>{ const lg=LEAGUES.find(l=>l.id===ex.league); return (
                      <button key={i} onClick={()=>{setInput(p=>p?p+'\n'+ex.text:ex.text);setShowEx(false);}} style={{ background:'rgba(0,212,255,0.04)', border:`1px solid ${lg?.color}33`, borderRadius:'8px', padding:'9px 14px', color:'#c0d4e8', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', textAlign:'left', fontFamily:'inherit', transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(0,212,255,0.09)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(0,212,255,0.04)'}>
                        <span style={{ fontSize:'14px' }}>{lg?.emoji}</span>
                        <span style={{ color:lg?.color, fontSize:'10px', fontWeight:'700', minWidth:'76px' }}>{lg?.label}</span>
                        <span style={{ color:'#90b4cc' }}>{ex.label}</span>
                      </button>
                    );})}
                  </div>
                )}
                <div style={{ padding:'12px 18px', background:'rgba(200,50,50,0.05)', border:'1px solid rgba(200,50,50,0.2)', borderRadius:'8px', fontSize:'11px', color:'#d87070', maxWidth:'520px', margin:'18px auto 0', lineHeight:'1.8' }}>
                  ⚠️ 본 분석은 정보 제공 목적이며 베팅 권유가 아닙니다.<br/>도박 문제 상담: <strong style={{color:'#ff9090'}}>도박문제예방치유원 1336</strong> (24시간 무료)
                </div>
              </div>
            )}

            {!isEmpty && (
              <div style={{ marginTop:'14px' }}>
                <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'8px', alignItems:'center', scrollbarWidth:'none' }}>
                  {tabs.map(tab=><Tab key={tab.id} tab={tab} active={activeTab===tab.id} onClick={()=>setActiveTab(tab.id)} />)}
                  <button onClick={()=>{setTabs([]);setActiveTab(null);try{sessionStorage.removeItem(SS_KEY);}catch(_){}}} style={{ marginLeft:'auto', flexShrink:0, padding:'5px 10px', background:'none', border:'1px solid rgba(255,80,80,0.25)', borderRadius:'6px', color:'#884444', fontSize:'10px', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>✕ 초기화</button>
                </div>
                {tabs.length > 1 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 12px', marginBottom:'8px', background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:'8px', fontSize:'11px' }}>
                    <span style={{ color:'#3a7090' }}>전체 진행:</span>
                    <div style={{ flex:1, height:'4px', background:'rgba(0,212,255,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:'2px', background:'linear-gradient(90deg,#00d4ff,#00ff88)', width:`${(tabs.filter(t=>t.status==='done'||t.status==='error').length/tabs.length)*100}%`, transition:'width 0.4s' }} />
                    </div>
                    <span style={{ color:'#3a7090', whiteSpace:'nowrap' }}>{tabs.filter(t=>t.status==='done'||t.status==='error').length} / {tabs.length} 완료</span>
                  </div>
                )}
                {activeTabData && (
                  <div style={{ background:'rgba(7,18,34,0.92)', border:'1px solid rgba(0,212,255,0.13)', borderRadius:'4px 14px 14px 14px', padding:'16px 18px', minHeight:'200px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', paddingBottom:'10px', borderBottom:'1px solid rgba(0,212,255,0.1)' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:STATUS_COLOR[activeTabData.status], boxShadow:activeTabData.status==='loading'?`0 0 7px ${STATUS_COLOR.loading}`:'none', animation:activeTabData.status==='loading'?'pulse 1s infinite':'none' }} />
                      <span style={{ fontSize:'10px', color:'#00d4ff', letterSpacing:'0.12em' }}>퀀트엣지 분석 리포트</span>
                      <span style={{ fontSize:'11px', color:'#3a6a8a', marginLeft:'4px' }}>— {activeTabData.label}</span>
                      <span style={{ marginLeft:'auto', fontSize:'10px', color:'#1a3a5a' }}>{new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} KST</span>
                    </div>
                    {activeTabData.status==='loading' && (
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                          <span style={{ fontSize:'11px', color:'#00d4ff' }}>분석 중...</span>
                          <span style={{ marginLeft:'auto', fontSize:'11px', fontFamily:'monospace', color:(activeTabData.elapsed||0)>240?'#ff8855':'#2a5a7a' }}>{fmtTime(activeTabData.elapsed||0)} / 5:00</span>
                        </div>
                        {(activeTabData.elapsed||0)>240 && <div style={{ fontSize:'11px', color:'#ff8855', padding:'6px 10px', background:'rgba(255,100,50,0.08)', border:'1px solid rgba(255,100,50,0.2)', borderRadius:'5px', marginBottom:'10px' }}>⚠️ 거의 완료 단계입니다. 조금만 더 기다려주세요.</div>}
                        {STEPS.map((s,idx)=>{ const cur=Math.min(Math.floor((activeTabData.elapsed||0)/10),STEPS.length-1); return <div key={idx} style={{ fontSize:'11px', lineHeight:'2.2', color:idx<cur?'#2a5a40':idx===cur?'#7ecfff':'#18304a', display:'flex', gap:'8px', alignItems:'center', transition:'color 0.4s' }}><span style={{ color:idx<cur?'#00c060':idx===cur?'#00d4ff':'#1a3050', flexShrink:0 }}>{idx<cur?'✓':idx===cur?'▶':'○'}</span>{s}</div>; })}
                      </div>
                    )}
                    {activeTabData.status==='pending' && <div style={{ color:'#2a5a7a', fontSize:'12px', padding:'20px 0', textAlign:'center' }}>⏳ 이전 경기 분석 완료 후 순서대로 시작됩니다...</div>}
                    {activeTabData.status==='error' && <div style={{ padding:'12px 16px', background:'rgba(200,40,40,0.1)', border:'1px solid rgba(200,40,40,0.3)', borderRadius:'8px', color:'#ff8888', fontSize:'12px' }}>⚠️ {activeTabData.content}</div>}
                    {activeTabData.status==='done' && <div>{activeTabData.content.split('\n').map((line,j)=>renderLine(line,j))}</div>}
                  </div>
                )}
              </div>
            )}
            {error && <div style={{ padding:'12px 16px', background:'rgba(200,40,40,0.1)', border:'1px solid rgba(200,40,40,0.3)', borderRadius:'8px', color:'#ff8888', fontSize:'12px', margin:'14px 0' }}>⚠️ {error}</div>}
          </>
        )}
        <div ref={bottomRef} />
      </main>

      {/* 입력창 (분석 탭에서만) */}
      {mainTab === '분석' && (
        <footer style={{ width:'100%', maxWidth:'960px', padding:'8px 20px 16px', boxSizing:'border-box', position:'sticky', bottom:0, background:'linear-gradient(to top,#04090f 80%,transparent)' }}>
          <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.2),transparent)', marginBottom:'8px' }} />
          {/* 은행롤 입력 */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'7px' }}>
            <span style={{ fontSize:'11px', color:'#3a7090', whiteSpace:'nowrap', flexShrink:0 }}>💰 은행롤 설정</span>
            <div style={{ position:'relative', width:'150px', flexShrink:0 }}>
              <input type="text" value={fmtNum(brNum)} onChange={e=>handleBankrollChange(e.target.value)} style={{ width:'100%', padding:'6px 28px 6px 10px', background:'rgba(7,18,34,0.97)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'7px', color:'#ffd93d', fontSize:'12px', fontFamily:'inherit', fontWeight:'700', outline:'none', boxSizing:'border-box' }} onFocus={e=>e.target.style.borderColor='#00d4ff'} onBlur={e=>e.target.style.borderColor='rgba(0,212,255,0.2)'} />
              <span style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', fontSize:'11px', color:'#3a7090' }}>원</span>
            </div>
            <div style={{ fontSize:'10px', color:'#1a4060', lineHeight:'1.6' }}>
              베팅 기록 탭에서 결과 입력 시 자동 반영됩니다
            </div>
          </div>
          <div style={{ fontSize:'10px', color:'#1a4060', marginBottom:'6px', textAlign:'center' }}>
            💡 여러 경기: Shift+Enter 또는 쉼표로 구분 → 경기별 탭 순서 분석
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleAnalyze();}}} placeholder={'단일: 한화 이글스 vs LG 트윈스\n다중: 한화 vs LG\n      삼성 vs 두산'} disabled={globalLoad} rows={3} style={{ flex:1, padding:'11px 13px', background:'rgba(7,18,34,0.97)', border:'1px solid rgba(0,212,255,0.25)', borderRadius:'10px', color:'#ddeeff', fontSize:'12px', fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:'1.6', boxSizing:'border-box', transition:'border-color 0.2s', minHeight:'52px' }} onFocus={e=>e.target.style.borderColor='#00d4ff'} onBlur={e=>e.target.style.borderColor='rgba(0,212,255,0.25)'} />
            <button onClick={handleAnalyze} disabled={globalLoad||!input.trim()} style={{ padding:'11px 16px', border:'none', borderRadius:'10px', background:globalLoad||!input.trim()?'rgba(0,212,255,0.07)':'linear-gradient(135deg,#00d4ff,#0095e8)', color:globalLoad||!input.trim()?'#1a4a6a':'#020c18', fontSize:'12px', fontWeight:'800', fontFamily:'inherit', cursor:globalLoad||!input.trim()?'not-allowed':'pointer', whiteSpace:'nowrap', transition:'all 0.2s', alignSelf:'flex-end', boxShadow:globalLoad||!input.trim()?'none':'0 0 16px rgba(0,212,255,0.3)' }}>
              {globalLoad?'분석 중...':'⚡ 분석'}
            </button>
          </div>
          <div style={{ textAlign:'center', marginTop:'6px', fontSize:'10px', color:'#1a3550', letterSpacing:'0.04em' }}>
            한국야구 · 미국야구 · 프리미어리그 · 라리가 · 분데스리가 · 세리에A · 리그앙 · 미국농구
          </div>
        </footer>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Noto+Sans+KR:wght@400;700;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.75)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(0,212,255,0.15);border-radius:2px; }
        textarea::placeholder { color:#1a3a58; white-space:pre; }
        textarea,input { scrollbar-width:none; }
        button:focus { outline:none; }
      `}</style>
    </div>
  );
}