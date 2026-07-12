const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://seojin080429-crypto.github.io', 'http://localhost:3000'],
  credentials: true
}));

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NAVER_ID     = process.env.NAVER_CLIENT_ID;
const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
const GROQ_KEY     = process.env.GROQ_API_KEY;
const NEIS_KEY     = process.env.NEIS_API_KEY;

// 부광고등학교 (인천광역시교육청) — NEIS 학교기본정보에서 확인한 고정값
const NEIS_OFCDC_CODE = 'E10';
const NEIS_SCHUL_CODE = 'E100000215';

// ── HTTP 요청 헬퍼 ──
function httpGet(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── 네이버 뉴스 검색 ──
async function naverSearch(query) {
  const q = encodeURIComponent(query);
  const data = await httpGet({
    hostname: 'openapi.naver.com',
    path: `/v1/search/news.json?query=${q}&display=5&sort=date`,
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': NAVER_ID,
      'X-Naver-Client-Secret': NAVER_SECRET,
    }
  });
  return JSON.parse(data);
}

function stripHtml(str) {
  return (str||'').replace(/<[^>]*>/g, '').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#039;/g,"'").trim();
}

// ── Groq 요약 ──
async function summarizeWithGroq(articles) {
  const articleText = articles.slice(0, 10).map((a,i) =>
    `${i+1}. [${a.category}] ${a.title}`
  ).join('\n');

  const prompt = `고3 수험생을 위한 오늘의 입시 뉴스 요약을 작성해주세요.

[뉴스 목록]
${articleText}

위 뉴스를 바탕으로:
1. 전체 요약 (2문장, 수험생 눈높이로 친근하게)
2. 주목할 뉴스 3개 한 줄 핵심

한국어로 간결하게 작성해주세요. 이모지나 특수문자는 사용하지 마세요.`;

  try {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.3
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Groq timeout')), 30000)
    );

    const fetchPromise = new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    const data = await Promise.race([fetchPromise, timeoutPromise]);
    const result = JSON.parse(data);

    if(result.error) {
      console.error('Groq API 에러:', result.error.message);
      return null;
    }

    const text = result?.choices?.[0]?.message?.content;
    console.log('Groq 요약 완료:', text?.slice(0,50));
    return text || null;
  } catch(e) {
    console.error('Groq 요약 실패:', e.message);
    return null;
  }
}

// ── 뉴스 수집 및 저장 ──
const NEWS_QUERIES = [
  { keyword: '2026 수능 입시', category: '수능' },
  { keyword: '대학 수시 모집', category: '수시' },
  { keyword: '대학 정시 모집', category: '정시' },
  { keyword: '수능 모의고사', category: '모의고사' },
  { keyword: '대입 학생부종합', category: '학종' },
];

async function fetchAndSaveNews() {
  console.log('뉴스 수집 시작:', new Date().toLocaleString('ko-KR'));
  const today = new Date().toISOString().slice(0, 10);

  // 오늘 뉴스 초기화
  await sb.from('news').delete().gte('created_at', today + 'T00:00:00Z');
  await sb.from('news_summary').delete().gte('created_at', today + 'T00:00:00Z');

  const allNews = [];
  for (const q of NEWS_QUERIES) {
    try {
      const result = await naverSearch(q.keyword);
      const items = (result.items || []).map(item => ({
        title: stripHtml(item.title),
        url: item.originallink || item.link,
        source: stripHtml(item.description || '').slice(0, 200),
        category: q.category,
        published_at: new Date(item.pubDate).toISOString(),
      }));
      allNews.push(...items);
    } catch(e) {
      console.error(`${q.keyword} 수집 실패:`, e.message);
    }
  }

  if (allNews.length > 0) {
    // URL 기준 중복 제거
    const seen = new Set();
    const deduped = allNews.filter(n => {
      if(seen.has(n.url)) return false;
      seen.add(n.url);
      return true;
    });
    const { error } = await sb.from('news').insert(deduped);
    if (error) console.error('뉴스 DB 저장 실패:', error.message);
    else console.log(`뉴스 ${deduped.length}개 저장 완료 (중복 ${allNews.length - deduped.length}개 제거)`);

    // Groq로 요약 생성
    console.log('Groq 요약 생성 중...');
    const summary = await summarizeWithGroq(deduped);
    if (summary) {
      await sb.from('news_summary').insert({ summary, date: today });
      console.log('요약 저장 완료');
    }
  }
}

// ── 스케줄러 (매일 오전 7시 KST = UTC 22시) ──
function scheduleDaily() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(22, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const delay = next - now;
  console.log(`다음 뉴스 수집: ${next.toLocaleString('ko-KR')} (${Math.round(delay/60000)}분 후)`);
  setTimeout(() => {
    fetchAndSaveNews();
    setInterval(fetchAndSaveNews, 24 * 60 * 60 * 1000);
  }, delay);
}

// ── NEIS 급식 정보 수집 ──
function ymdToday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function neisMealFetch(ymd) {
  const path = `/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=${NEIS_OFCDC_CODE}&SD_SCHUL_CODE=${NEIS_SCHUL_CODE}&MLSV_YMD=${ymd}&Type=json&KEY=${NEIS_KEY}`;
  const data = await httpGet({
    hostname: 'open.neis.go.kr',
    path,
    method: 'GET',
  });
  return JSON.parse(data);
}

// DDISH_NM 예: "쌀밥1.5.6.<br/>된장찌개5.6.9.<br/>..." → 줄 단위로 분리 (알레르기 번호는 그대로 유지)
function parseMenuText(ddishNm) {
  return (ddishNm || '')
    .split(/<br\s*\/?>/i)
    .map(s => s.trim())
    .filter(Boolean);
}

async function fetchAndSaveMeal(ymd) {
  ymd = ymd || ymdToday();
  if (!NEIS_KEY) { console.error('NEIS_API_KEY가 설정되지 않았습니다'); return { ok: false, error: 'NEIS_API_KEY 미설정' }; }
  console.log('급식 수집 시작:', ymd);
  try {
    const json = await neisMealFetch(ymd);
    if (json?.RESULT?.CODE === 'INFO-200') {
      console.log('해당 날짜 급식 정보 없음(주말/방학 등):', ymd);
      return { ok: true, count: 0 };
    }
    const rows = json?.mealServiceDietInfo?.[1]?.row || [];
    if (!rows.length) { console.log('급식 데이터 없음:', ymd); return { ok: true, count: 0 }; }

    const meals = rows.map(r => ({
      date: `${r.MLSV_YMD.slice(0,4)}-${r.MLSV_YMD.slice(4,6)}-${r.MLSV_YMD.slice(6,8)}`,
      meal_type: r.MMEAL_SC_NM,          // 조식/중식/석식
      menu: parseMenuText(r.DDISH_NM),
      calorie: r.CAL_INFO || null,
      origin_info: r.ORPLC_INFO ? parseMenuText(r.ORPLC_INFO) : null,
    }));

    const { error } = await sb.from('meals').upsert(meals, { onConflict: 'date,meal_type' });
    if (error) { console.error('급식 저장 실패:', error.message); return { ok: false, error: error.message }; }
    console.log(`급식 저장 완료 (${ymd}): ${meals.length}건`);
    return { ok: true, count: meals.length };
  } catch(e) {
    console.error('급식 수집 실패:', e.message);
    return { ok: false, error: e.message };
  }
}

// 매일 오늘 급식 + 앞으로 6일치(이번 주) 미리 수집
async function fetchAndSaveMealWeek() {
  for (let i = 0; i < 7; i++) {
    await fetchAndSaveMeal(ymdToday(i));
  }
}

// ── 급식 스케줄러 (매일 오전 6시 KST = UTC 21시) ──
function scheduleMealDaily() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(21, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const delay = next - now;
  console.log(`다음 급식 수집: ${next.toLocaleString('ko-KR')} (${Math.round(delay/60000)}분 후)`);
  setTimeout(() => {
    fetchAndSaveMealWeek();
    setInterval(fetchAndSaveMealWeek, 24 * 60 * 60 * 1000);
  }, delay);
}

// ── 관리자 권한 확인 미들웨어 ──
async function requireAdmin(req, res, next) {
  const { student_id } = req.body;
  if (!student_id) return res.status(401).json({ error: '학번이 없습니다' });
  const { data } = await sb.from('user_roles').select('role').eq('student_id', student_id).single();
  const role = data?.role;
  if (role !== 'admin' && role !== 'owner') {
    return res.status(403).json({ error: '권한이 없습니다' });
  }
  req.callerRole = role;
  next();
}

// ── API: 급식 수동 수집 (이번 주 전체) ──
app.post('/api/fetch-meal', requireAdmin, async (req, res) => {
  fetchAndSaveMealWeek().catch(console.error);
  res.json({ success: true, message: '급식 정보 수집을 시작했습니다 (이번 주)' });
});

// ── API: 뉴스 수동 수집 ──
app.post('/api/fetch-news', requireAdmin, async (req, res) => {
  fetchAndSaveNews().catch(console.error);
  res.json({ success: true, message: '뉴스 수집을 시작했습니다' });
});

// ── API: 비밀번호 초기화 ──
app.post('/api/reset-password', requireAdmin, async (req, res) => {
  const { target_student_id } = req.body;
  if (!target_student_id) return res.status(400).json({ error: '대상 학번이 없습니다' });
  const email = `${target_student_id}@bugwang3-1.app`;
  const { data: users, error: listErr } = await sb.auth.admin.listUsers({ perPage: 200 });
  if (listErr) return res.status(500).json({ error: listErr.message });
  const user = users.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: '해당 학번의 계정을 찾을 수 없습니다' });
  const { error } = await sb.auth.admin.updateUserById(user.id, { password: '1234' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: `${target_student_id}번 비밀번호가 1234로 초기화되었습니다` });
});

// ── API: 계정 목록 ──
app.post('/api/users', requireAdmin, async (req, res) => {
  const { data: users, error } = await sb.auth.admin.listUsers({ perPage: 200 });
  if (error) return res.status(500).json({ error: error.message });
  const filtered = users.users
    .filter(u => u.email?.endsWith('@bugwang3-1.app'))
    .map(u => ({
      student_id: u.email.split('@')[0],
      name: u.user_metadata?.display_name || null,
      suneung_kor: u.user_metadata?.suneung_kor || null,
      suneung_math: u.user_metadata?.suneung_math || null,
      suneung_exp1: u.user_metadata?.suneung_exp1 || null,
      suneung_exp2: u.user_metadata?.suneung_exp2 || null,
      created_at: u.created_at,
    }));
  res.json({ users: filtered });
});

// ── API: 계정 생성 ──
app.post('/api/create-user', requireAdmin, async (req, res) => {
  if (req.callerRole !== 'owner') return res.status(403).json({ error: '운영자만 계정을 생성할 수 있습니다' });
  const { target_student_id, password = '1234' } = req.body;
  if (!target_student_id) return res.status(400).json({ error: '학번이 없습니다' });
  if (!/^\d{5}$/.test(target_student_id)) return res.status(400).json({ error: '학번은 5자리 숫자여야 합니다' });
  const email = `${target_student_id}@bugwang3-1.app`;
  const { data, error } = await sb.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { student_id: target_student_id }
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: `${target_student_id}번 계정이 생성되었습니다`, user: data.user });
});

// ── API: 계정 삭제 ──
app.post('/api/delete-user', requireAdmin, async (req, res) => {
  if (req.callerRole !== 'owner') return res.status(403).json({ error: '운영자만 계정을 삭제할 수 있습니다' });
  const { target_student_id } = req.body;
  if (!target_student_id) return res.status(400).json({ error: '학번이 없습니다' });
  const email = `${target_student_id}@bugwang3-1.app`;
  const { data: users, error: listErr } = await sb.auth.admin.listUsers({ perPage: 200 });
  if (listErr) return res.status(500).json({ error: listErr.message });
  const user = users.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: '해당 학번의 계정을 찾을 수 없습니다' });
  const { error } = await sb.auth.admin.deleteUser(user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: `${target_student_id}번 계정이 삭제되었습니다` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`부광 서버 실행 중 :${PORT}`);
  scheduleDaily();
  fetchAndSaveNews().catch(console.error);
  scheduleMealDaily();
  fetchAndSaveMealWeek().catch(console.error);
});
