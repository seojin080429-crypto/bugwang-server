const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const CORS_ORIGINS = ['https://seojin080429-crypto.github.io', 'http://localhost:3000'];

const app = express();
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGINS,
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

// ── 캠스터디 영상통화 (JaaS / 8x8.vc) ──
const JAAS_APP_ID      = process.env.JAAS_APP_ID;
const JAAS_API_KEY     = process.env.JAAS_API_KEY;
const JAAS_PRIVATE_KEY = (process.env.JAAS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const STUDY_ROOM        = 'main-camstudy';

// 학교 정보
const SCHOOL_CODE = '7310046'; // 부광고등학교
const EDU_CODE    = 'E10';     // 인천광역시교육청

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

// ── 급식 수집 및 저장 (KST 기준) ──
function kstDate(offsetDays = 0) {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

function ymd(d, sep = '') {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return sep ? `${y}${sep}${m}${sep}${day}` : `${y}${m}${day}`;
}

function thisWeekDates() {
  const today = kstDate();
  const dow = today.getUTCDay(); // KST 기준 요일 (0=일 ... 6=토)
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const dates = [];
  for (let i = 0; i < 5; i++) dates.push(kstDate(mondayOffset + i));
  return dates;
}

async function fetchMealForDate(d) {
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${EDU_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${ymd(d)}&KEY=${NEIS_KEY}`;
  const data = await new Promise((resolve, reject) => {
    https.get(url, r => {
      let body = '';
      r.on('data', chunk => body += chunk);
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
  const json = JSON.parse(data);
  if (!json.mealServiceDietInfo) {
    console.log(`NEIS 응답 (${ymd(d, '-')}):`, JSON.stringify(json.RESULT || json));
    return [];
  }
  const rows = json.mealServiceDietInfo[1]?.row || [];
  return rows.map(r => ({
    date: ymd(d, '-'),
    meal_type: r.MMEAL_SC_NM, // 조식/중식/석식
    menu: r.DDISH_NM.split('<br/>').map(s => s.replace(/\([^)]*\)/g, '').replace(/\d+\./g, '').trim()).filter(Boolean),
  }));
}

async function fetchAndSaveMeal() {
  console.log('급식 수집 시작:', new Date().toLocaleString('ko-KR'));
  const dates = thisWeekDates();
  const allMeals = [];
  for (const d of dates) {
    try {
      allMeals.push(...await fetchMealForDate(d));
    } catch (e) {
      console.error(`${ymd(d, '-')} 급식 수집 실패:`, e.message);
    }
  }

  const dateStrs = dates.map(d => ymd(d, '-'));
  await sb.from('meals').delete().in('date', dateStrs);
  if (allMeals.length > 0) {
    const { error } = await sb.from('meals').insert(allMeals);
    if (error) console.error('급식 DB 저장 실패:', error.message);
    else console.log(`급식 ${allMeals.length}건 저장 완료`);
  }
}

// ── 스케줄러 (매일 오전 6시 KST = UTC 21시) ──
function scheduleDailyMeal() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(21, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const delay = next - now;
  console.log(`다음 급식 수집: ${next.toLocaleString('ko-KR')} (${Math.round(delay/60000)}분 후)`);
  setTimeout(() => {
    fetchAndSaveMeal();
    setInterval(fetchAndSaveMeal, 24 * 60 * 60 * 1000);
  }, delay);
}

// ── API: 급식 수동 수집 ──
app.post('/api/fetch-meal', requireAdmin, async (req, res) => {
  try {
    await fetchAndSaveMeal();
    res.json({ success: true, message: '급식 정보를 수집했습니다' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════
// 캠스터디 (화상 자습방)
// ═══════════════════════════════════════════

// ── 로그인 세션 확인 미들웨어 (Supabase access_token 검증) ──
async function requireStudySession(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다' });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인해주세요' });
  const studentId = data.user.email.split('@')[0];
  const nickname = data.user.user_metadata?.display_name || studentId;
  const { data: roleRow } = await sb.from('user_roles').select('role').eq('student_id', studentId).single();
  const role = roleRow?.role || 'student';
  req.studyUser = { studentId, nickname, role };
  next();
}

function isStaffRole(role) { return role === 'admin' || role === 'owner'; }

// JaaS(Jitsi) 입장권(JWT) 생성 — RS256, Private Key로 서명
function makeJaasToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const moderator = isStaffRole(user.role);
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: JAAS_APP_ID,
    room: '*',
    exp: now + 3 * 60 * 60,
    nbf: now - 10,
    context: {
      user: {
        id: user.studentId,
        name: user.nickname,
        avatar: '',
        email: '',
        moderator: moderator ? 'true' : 'false',
      },
      features: {
        livestreaming: 'false',
        recording: 'false',
        transcription: 'false',
        'outbound-call': 'false',
      },
    },
  };
  return jwt.sign(payload, JAAS_PRIVATE_KEY, {
    algorithm: 'RS256',
    header: { kid: JAAS_API_KEY, typ: 'JWT' },
  });
}

// ── API: 캠스터디 입장 (영상 토큰 발급) ──
app.post('/api/study/join', requireStudySession, async (req, res) => {
  if (!JAAS_APP_ID || !JAAS_API_KEY || !JAAS_PRIVATE_KEY) {
    return res.status(500).json({ error: '영상 서버 설정이 아직 안 됐어요. 관리자에게 문의해주세요.' });
  }
  const token = makeJaasToken(req.studyUser);
  res.json({
    token,
    appId: JAAS_APP_ID,
    room: STUDY_ROOM,
    moderator: isStaffRole(req.studyUser.role),
  });
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGINS, credentials: true },
  pingTimeout: 90000,
  pingInterval: 25000,
});

// ── Socket.IO: 채팅 + 참가자 목록 (영상 자체는 JaaS가 담당) ──
const studyParticipants = new Map();

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('인증 실패'));
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return next(new Error('인증 실패'));
  const studentId = data.user.email.split('@')[0];
  const nickname = data.user.user_metadata?.display_name || studentId;
  const { data: roleRow } = await sb.from('user_roles').select('role').eq('student_id', studentId).single();
  socket.studyUser = { studentId, nickname, role: roleRow?.role || 'student' };
  next();
});

function broadcastStudyCount() {
  io.to(STUDY_ROOM).emit('participant-count', studyParticipants.size);
  io.to(STUDY_ROOM).emit('participant-list', [...studyParticipants.entries()].map(([id, p]) => ({ id, ...p })));
}

io.on('connection', (socket) => {
  socket.emit('participant-count', studyParticipants.size);

  socket.on('join-study', () => {
    let wasAlreadyIn = false;
    for (const [otherId, p] of studyParticipants.entries()) {
      if (otherId !== socket.id && p.studentId === socket.studyUser.studentId) {
        wasAlreadyIn = true;
        const oldSocket = io.sockets.sockets.get(otherId);
        if (oldSocket && oldSocket.connected) {
          oldSocket.emit('force-leave-study', { reason: '다른 기기에서 입장했어요.' });
          oldSocket.leave(STUDY_ROOM);
        }
        studyParticipants.delete(otherId);
      }
    }
    const alreadyHere = studyParticipants.has(socket.id);
    socket.join(STUDY_ROOM);
    studyParticipants.set(socket.id, { studentId: socket.studyUser.studentId, nickname: socket.studyUser.nickname });
    broadcastStudyCount();
    if (!wasAlreadyIn && !alreadyHere) {
      io.to(STUDY_ROOM).emit('chat', { system: true, text: `${socket.studyUser.nickname} 님이 입장했습니다.`, ts: Date.now() });
    }
  });

  socket.on('chat', ({ text }) => {
    const p = studyParticipants.get(socket.id);
    if (!p || !text) return;
    io.to(STUDY_ROOM).emit('chat', {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentId: p.studentId, nickname: p.nickname,
      text: String(text).slice(0, 500), ts: Date.now(),
    });
  });

  socket.on('delete-chat', ({ id }) => {
    if (!isStaffRole(socket.studyUser.role) || !id) return;
    io.to(STUDY_ROOM).emit('chat-deleted', { id });
  });

  function leaveStudyRoom() {
    const p = studyParticipants.get(socket.id);
    if (p) {
      studyParticipants.delete(socket.id);
      io.to(STUDY_ROOM).emit('chat', { system: true, text: `${p.nickname} 님이 퇴장했습니다.`, ts: Date.now() });
      broadcastStudyCount();
    }
  }
  socket.on('leave-study', leaveStudyRoom);
  socket.on('disconnect', leaveStudyRoom);
});

server.listen(PORT, () => {
  console.log(`부광 서버 실행 중 :${PORT}`);
  scheduleDaily();
  scheduleDailyMeal();
  fetchAndSaveNews().catch(console.error);
  fetchAndSaveMeal().catch(console.error);
});
