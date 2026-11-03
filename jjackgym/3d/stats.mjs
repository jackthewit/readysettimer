// ONLINE GYM 접속 통계 보기 (관리자용). node stats.mjs [며칠, 기본 14] [--json]
// supabase.config.json(주소·anon 키)과 admin.local.json(관리자 열쇠)이 있어야 한다. 둘 다 저장소에는 올리지 않는다.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(DIR, 'supabase.config.json'), 'utf8'));
const { statsKey } = JSON.parse(fs.readFileSync(path.join(DIR, 'admin.local.json'), 'utf8'));
const days = Number(process.argv.find((a) => /^\d+$/.test(a)) || 14);

const res = await fetch(`${cfg.url}/rest/v1/rpc/gym_stats`, {
  method: 'POST',
  headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_key: statsKey, p_days: days }),
});
if (!res.ok) {
  const t = await res.text();
  console.error(res.status === 404 || /gym_stats/.test(t) && /not find|does not exist/.test(t)
    ? '통계 함수가 아직 없어요. stats-setup.local.sql을 Supabase SQL 편집기에서 한 번 실행해 주세요.'
    : `통계를 못 가져왔어요 (${res.status}): ${t.slice(0, 200)}`);
  process.exit(1);
}
const s = await res.json();
if (process.argv.includes('--json')) { console.log(JSON.stringify(s, null, 1)); process.exit(0); }

const SHOP = { weight: '웨이트샵', pilates: '필라테스샵' };
const shops = (o) => Object.entries(o || {}).map(([k, n]) => `${SHOP[k] || k} ${n}`).join(', ') || '없음';
const peak = Object.fromEntries((s.peak || []).map((p) => [p.day, p]));
console.log(`ONLINE GYM 접속 통계 (최근 ${days}일, 한국 시간)`);
console.log(`지금 접속 ${s.online}명 (${shops(s.online_by_shop)})`);
console.log(`전체 누적: 방문자 ${s.all_time.visitors}명, 방문 ${s.all_time.sessions}번${s.all_time.first ? `, ${s.all_time.first.slice(0, 10)}부터` : ''}`);
console.log(`이 기간 새 방문자 ${s.new_visitors}명, 이틀 이상 온 사람 ${s.return_visitors}명\n`);
console.log('날짜        방문자  방문  평균(분)  총(시간)  최대 동시(시각)  운동 횟수  기구 위(분)  PT  휴대폰');
for (const d of s.daily || []) {
  const pk = peak[d.day];
  console.log([d.day, String(d.visitors).padStart(6), String(d.sessions).padStart(5), String(d.avg_min).padStart(8), String(d.total_hours).padStart(8),
    (pk?.peak ? `${String(pk.peak).padStart(6)}(${pk.at})` : '-').padStart(15), String(d.reps).padStart(9), String(d.work_min).padStart(11), String(d.pt_calls).padStart(4), String(d.mobile_sessions).padStart(6)].join('  '));
}
const hours = s.hours || {};
const top = Math.max(1, ...Object.values(hours));
console.log('\n들어온 시각');
for (let h = 0; h < 24; h++) if (hours[h]) console.log(`${String(h).padStart(2)}시 ${'■'.repeat(Math.ceil(hours[h] / top * 30))} ${hours[h]}`);
console.log(`\n샵별 방문: ${shops(s.shops)}`);
console.log(`많이 쓴 기구: ${(s.stations || []).map((x) => `${x.id} ${x.n}`).join(', ') || '없음'}`);
console.log(`들어온 곳: ${(s.refs || []).map((x) => `${x.ref} ${x.n}`).join(', ') || '없음'}`);
