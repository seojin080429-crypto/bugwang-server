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

// 학교 정보
const SCHOOL_CODE = 'E100000215'; // 부광고등학교
const EDU_CODE    = 'J10';        // 인천광역시교육청

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

한국어로 간결하게 작성해주세요.`;

  try {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.3
    });

    // timeout 30초 설정
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
    const { error } = await sb.from('news').insert(allNews);
    if (error) console.error('뉴스 DB 저장 실패:', error.message);
    else console.log(`뉴스 ${allNews.length}개 저장 완료`);

    // Groq로 요약 생성
    console.log('Groq 요약 생성 중...');
    const summary = await summarizeWithGroq(allNews);
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

// ── API: 급식 정보 ──
app.get('/api/meal', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0,10).replace(/-/g,'');
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${EDU_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${date}&KEY=${NEIS_KEY}`;

    const data = await new Promise((resolve, reject) => {
      https.get(url, r => {
        let d = '';
        r.on('data', chunk => d += chunk);
        r.on('end', () => resolve(d));
      }).on('error', reject);
    });

    const json = JSON.parse(data);

    // 급식 없는 날
    if (json.RESULT?.CODE === 'INFO-000' || !json.mealServiceDietInfo) {
      return res.json({ meals: [] });
    }

    const rows = json.mealServiceDietInfo[1]?.row || [];
    const meals = rows.map(r => ({
      type: r.MMEAL_SC_NM,   // 조식/중식/석식
      menu: r.DISH_NM.split('<br/>').map(s => s.replace(/\d+\./g,'').trim()).filter(Boolean),
      cal: r.CAL_INFO,
      allergy: r.ORPLC_INFO
    }));

    res.json({ meals, date });
  } catch(e) {
    console.error('급식 API 오류:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`부광 서버 실행 중 :${PORT}`);
  scheduleDaily();
  fetchAndSaveNews().catch(console.error);
});
