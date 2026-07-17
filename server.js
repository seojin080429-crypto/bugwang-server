const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');

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

// ── 웹 푸시 알림 (VAPID) ──
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:noreply@bugwang3-1.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY가 설정되지 않아 푸시 알림이 비활성화됩니다.');
}

// student_id 목록(null이면 전체 구독자)에게 푸시를 보낸다. 만료/삭제된 구독(410/404)은
// 그때그때 정리해서 다음부터는 헛수고하지 않게 한다.
async function sendPushNotification(payload, studentIds) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  let q = sb.from('push_subscriptions').select('id,endpoint,p256dh,auth_key,student_id');
  if (studentIds) q = q.in('student_id', studentIds);
  const { data: subs } = await q;
  if (!subs || !subs.length) return;
  const body = JSON.stringify(payload);
  await Promise.allSettled(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        body
      );
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await sb.from('push_subscriptions').delete().eq('id', s.id);
      } else {
        console.error('푸시 발송 실패:', s.student_id, e.statusCode, e.message);
      }
    }
  }));
}

// ── HTTP 요청 헬퍼 ──
// 응답을 문자열로 바로 이어붙이면 멀티바이트 UTF-8 문자(한글 등)가 청크 경계에서
// 잘려 깨질 수 있으므로, Buffer로 모았다가 끝에서 한 번에 디코딩한다.
function httpGet(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
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
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
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
// 재학 중인 3학년이 치르는 수능은 2026년 11월 시행 "2027학년도" 입시이므로 검색어에 연도를 명시한다.
const NEWS_QUERIES = [
  { keyword: '2027학년도 수능 입시', category: '수능' },
  { keyword: '2027학년도 대학 수시모집', category: '수시' },
  { keyword: '2027학년도 대학 정시모집', category: '정시' },
  { keyword: '2027 수능 모의고사', category: '모의고사' },
  { keyword: '2027학년도 대입 학생부종합', category: '학종' },
];

// 검색어에 연도를 넣어도 다른 학년도(예: 2026학년도) 기사가 섞여 들어올 수 있으므로,
// 제목/설명에 다른 학년도 표기가 있고 2027학년도 언급이 없는 기사는 걸러낸다.
function isRelevantTo2027(text) {
  const years = text.match(/20\d{2}학년도/g);
  if (!years) return true; // 학년도 표기가 없으면 그대로 통과
  return years.some(y => y.startsWith('2027'));
}

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
      })).filter(item => isRelevantTo2027(item.title + ' ' + item.source));
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
  const { data } = await sb.from('user_roles').select('role, is_teacher').eq('student_id', student_id).single();
  const role = data?.role;
  const isTeacher = !!data?.is_teacher;
  if (role !== 'admin' && role !== 'owner' && !isTeacher) {
    return res.status(403).json({ error: '권한이 없습니다' });
  }
  // owner/teacher 둘 다 아니어도(예: admin+is_teacher 조합) 계정 삭제·역할 변경 등
  // owner 전용 액션은 이 값으로 별도 체크한다.
  req.callerRole = role;
  req.callerIsOwnerTier = role === 'owner' || isTeacher;
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
      id: u.id,
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

// 아이디(학번) 형식 — create-user와 change-student-id가 공유
const STUDENT_ID_RE = /^[a-zA-Z0-9_-]{2,30}$/;

// ── API: 계정 생성 ──
app.post('/api/create-user', requireAdmin, async (req, res) => {
  if (!req.callerIsOwnerTier) return res.status(403).json({ error: '운영자/교사만 계정을 생성할 수 있습니다' });
  const { target_student_id, password = '1234' } = req.body;
  if (!target_student_id) return res.status(400).json({ error: '아이디가 없습니다' });
  if (!STUDENT_ID_RE.test(target_student_id)) return res.status(400).json({ error: '아이디는 영문/숫자/-/_ 2~30자여야 합니다' });
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
  if (!req.callerIsOwnerTier) return res.status(403).json({ error: '운영자/교사만 계정을 삭제할 수 있습니다' });
  const { target_student_id } = req.body;
  if (!target_student_id) return res.status(400).json({ error: '학번이 없습니다' });
  const email = `${target_student_id}@bugwang3-1.app`;
  const { data: users, error: listErr } = await sb.auth.admin.listUsers({ perPage: 200 });
  if (listErr) return res.status(500).json({ error: listErr.message });
  const user = users.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: '해당 학번의 계정을 찾을 수 없습니다' });
  const { error } = await sb.auth.admin.deleteUser(user.id);
  if (error) return res.status(500).json({ error: error.message });
  // 계정 삭제 후에도 학번(student_id)으로 연결된 권한/등록기기 기록이 남아있으면
  // 같은 학번으로 계정을 재생성했을 때 예전 권한이 그대로 부활하므로 함께 삭제한다.
  await Promise.all([
    sb.from('user_roles').delete().eq('student_id', target_student_id),
    sb.from('user_devices').delete().eq('student_id', target_student_id),
    sb.from('user_profiles').delete().eq('student_id', target_student_id),
  ]);
  res.json({ success: true, message: `${target_student_id}번 계정이 삭제되었습니다` });
});

// ── 로그인한 본인 확인 미들웨어 (관리자 권한 불필요, access_token만 검증) ──
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다' });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인해주세요' });
  req.authUser = data.user;
  next();
}
// 이메일은 저장 시 소문자로 정규화되므로(change-student-id에서 겪은 문제와 동일), 대소문자가
// 보존되는 user_metadata.student_id를 우선 쓰고 없을 때만 이메일에서 유추한다.
function studentIdOf(authUser) {
  return authUser.user_metadata?.student_id || authUser.email.split('@')[0];
}
// requireAuth 뒤에 붙여서 쓰는 스태프(관리자/운영자/선생님) 전용 게이트 — 공지/선생님메시지
// 발송처럼 전체 학생에게 푸시가 나가는 액션을 아무나 못 부르게 막는다.
async function requireStaffAuth(req, res, next) {
  const sid = studentIdOf(req.authUser);
  const { data } = await sb.from('user_roles').select('role, is_teacher').eq('student_id', sid).maybeSingle();
  const role = data?.role;
  if (role !== 'admin' && role !== 'owner' && !data?.is_teacher) {
    return res.status(403).json({ error: '권한이 없습니다' });
  }
  req.authStudentId = sid;
  next();
}

// ── API: 아이디(학번) 변경 — 마이페이지에서 학생이 직접 요청 ──
// 로그인 이메일이 `{학번}@bugwang3-1.app` 형태이고 student_id가 여러 테이블에서
// (실제 FK 제약 없이) 텍스트로 그대로 쓰이고 있어서, 바꿀 때 이메일과 관련 테이블을
// 한 번에 일관되게 갱신해야 함. study_tasks는 student_id 컬럼이 없이 user_id(uuid)로만
// 연결돼 있어서 auth 쪽 uuid가 그대로 유지되는 이번 방식에서는 손댈 필요가 없다.
app.post('/api/change-student-id', requireAuth, async (req, res) => {
  const { new_student_id } = req.body;
  // 이메일은 Supabase Auth가 저장할 때 소문자로 정규화하므로, 대문자가 섞인 아이디(선생님
  // 계정 등, 학번과 달리 영문 허용)라면 email.split('@')[0]는 실제 student_id 컬럼에
  // 저장된 원래 대소문자와 달라진다 — 그 상태로 .eq('student_id', oldStudentId)를 돌리면
  // 0건 매칭되어 아무 것도 안 바뀌었는데도 에러 없이 "성공"으로 응답할 뻔했다. 프론트의
  // restoreSession()과 동일하게 원래 대소문자가 보존되는 user_metadata.student_id를
  // 우선 쓰고, 없을 때만 이메일에서 유추한다.
  const oldStudentId = req.authUser.user_metadata?.student_id || req.authUser.email.split('@')[0];
  if (!new_student_id) return res.status(400).json({ error: '새 아이디가 없습니다' });
  if (!STUDENT_ID_RE.test(new_student_id)) return res.status(400).json({ error: '아이디는 영문/숫자/-/_ 2~30자여야 합니다' });
  if (new_student_id === oldStudentId) return res.status(400).json({ error: '현재 아이디와 같습니다' });

  const newEmail = `${new_student_id}@bugwang3-1.app`;

  // 이메일(=로그인 아이디) 중복 확인 + student_id가 기본키인 테이블에 이미 같은 아이디로
  // 남은 행이 있는지(예: 예전 계정 삭제 시 정리가 안 된 경우, 갱신 시 기본키 충돌 방지) —
  // 서로 독립적인 조회라 병렬로 처리
  const pkTables = ['user_roles', 'user_profiles', 'simo_members'];
  const [{ data: users, error: listErr }, ...pkChecks] = await Promise.all([
    sb.auth.admin.listUsers({ perPage: 200 }),
    ...pkTables.map(t => sb.from(t).select('student_id').eq('student_id', new_student_id).maybeSingle()),
  ]);
  if (listErr) return res.status(500).json({ error: listErr.message });
  if (users.users.some(u => u.email === newEmail)) {
    return res.status(409).json({ error: '이미 사용 중인 아이디예요' });
  }
  if (pkChecks.some(c => c.data)) {
    return res.status(409).json({ error: '이미 사용 중인 아이디예요' });
  }

  // 1) 로그인 이메일(= 아이디) 변경
  const { error: authErr } = await sb.auth.admin.updateUserById(req.authUser.id, {
    email: newEmail,
    email_confirm: true,
    user_metadata: { ...req.authUser.user_metadata, student_id: new_student_id },
  });
  if (authErr) return res.status(500).json({ error: authErr.message });

  // 2) student_id를 텍스트로 들고 있는 테이블들 갱신 (study_tasks는 user_id만 쓰므로 대상 아님)
  const updateTables = ['user_roles', 'user_profiles', 'simo_members', 'user_devices', 'study_sessions', 'posts', 'comments', 'notice_poll_votes', 'push_subscriptions', 'teacher_messages'];
  const results = await Promise.allSettled(
    updateTables.map(t => sb.from(t).update({ student_id: new_student_id }).eq('student_id', oldStudentId))
  );
  const failedTables = updateTables.filter((t, i) => results[i].status === 'rejected' || results[i].value?.error);
  if (failedTables.length) {
    console.error('아이디 변경 중 일부 테이블 갱신 실패:', failedTables, results.map(r => r.reason || r.value?.error));
    // user_roles가 실패하면 이 계정의 관리자/선생님 권한이 새 아이디로 안 옮겨져서
    // requireAdmin이 새 아이디로는 권한을 못 찾는 상태가 됨 — 별도로 강조해서 안내
    const roleWarning = failedTables.includes('user_roles') ? ' 특히 권한(관리자/선생님) 정보가 아직 예전 아이디에 남아있을 수 있어요.' : '';
    return res.status(207).json({
      success: true,
      partial: true,
      failed_tables: failedTables,
      message: `로그인 아이디는 바뀌었지만 일부 기록(${failedTables.join(', ')})은 갱신하지 못했어요.${roleWarning} 관리자에게 문의해주세요.`,
      new_student_id,
    });
  }

  res.json({ success: true, message: `아이디가 ${new_student_id}(으)로 변경되었습니다`, new_student_id });
});

// ═══════════════════════════════════════════
// 푸시 알림
// ═══════════════════════════════════════════

// ── API: 이 기기를 푸시 구독으로 등록 ──
app.post('/api/push-subscribe', requireAuth, async (req, res) => {
  const { endpoint, keys, device_label } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: '구독 정보가 올바르지 않습니다' });
  const { error } = await sb.from('push_subscriptions').upsert({
    user_id: req.authUser.id,
    student_id: studentIdOf(req.authUser),
    endpoint, p256dh: keys.p256dh, auth_key: keys.auth,
    device_label: device_label || null,
  }, { onConflict: 'endpoint' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── API: 이 기기의 푸시 구독 해지 ──
app.post('/api/push-unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint가 없습니다' });
  await sb.from('push_subscriptions').delete().eq('user_id', req.authUser.id).eq('endpoint', endpoint);
  res.json({ success: true });
});

// 아래 알림 API들은 제목/내용을 클라이언트가 보낸 문자열을 그대로 믿지 않고, 항상 서버가
// id로 원본 행을 다시 조회해서 만든다 — 그래야 이 엔드포인트를 직접 두드려서 학급 전체에
// 임의의 문구로 푸시를 뿌리는 악용을 막을 수 있다.

// ── API: 새 공지사항 알림 (스태프 전용) ──
app.post('/api/notify/notice', requireAuth, requireStaffAuth, async (req, res) => {
  const { notice_id } = req.body;
  if (!notice_id) return res.status(400).json({ error: 'notice_id가 없습니다' });
  const { data: notice } = await sb.from('notices').select('title,audience').eq('id', notice_id).maybeSingle();
  if (!notice) return res.status(404).json({ error: '공지를 찾을 수 없습니다' });
  // 실모반 전용 공지는 실모반원에게만 — 승인된 학생 + 스태프
  let studentIds = null;
  if (notice.audience === 'simo') {
    const [{ data: members }, { data: staff }] = await Promise.all([
      sb.from('simo_members').select('student_id').eq('status', 'approved'),
      sb.from('user_roles').select('student_id').or('role.eq.admin,role.eq.owner,is_teacher.eq.true'),
    ]);
    studentIds = [...new Set([...(members || []).map(m => m.student_id), ...(staff || []).map(s => s.student_id)])];
  }
  sendPushNotification({ title: '새 공지사항', body: notice.title, url: './index.html' }, studentIds).catch(() => {});
  res.json({ success: true });
});

// ── API: 내 글/댓글에 달린 새 댓글 알림 (누구나 자기가 실제로 쓴 댓글에 대해서만 호출 가능) ──
app.post('/api/notify/comment', requireAuth, async (req, res) => {
  const { comment_id } = req.body;
  if (!comment_id) return res.status(400).json({ error: 'comment_id가 없습니다' });
  const { data: comment } = await sb.from('comments').select('post_id,user_id,author_name,content').eq('id', comment_id).maybeSingle();
  if (!comment || comment.user_id !== req.authUser.id) return res.status(403).json({ error: '본인이 작성한 댓글만 알릴 수 있습니다' });
  const { data: post } = await sb.from('posts').select('student_id,user_id').eq('id', comment.post_id).maybeSingle();
  if (!post || post.user_id === comment.user_id) return res.json({ success: true }); // 본인 글엔 본인 댓글 알림 없음
  sendPushNotification({
    title: '새 댓글',
    body: `${comment.author_name}: ${comment.content.slice(0, 60)}`,
    url: './index.html',
  }, [post.student_id]).catch(() => {});
  res.json({ success: true });
});

// ── API: 공지 투표 참여 알림 (투표를 만든 사람에게) ──
app.post('/api/notify/poll-vote', requireAuth, async (req, res) => {
  const { poll_id } = req.body;
  if (!poll_id) return res.status(400).json({ error: 'poll_id가 없습니다' });
  const { data: poll } = await sb.from('notice_polls').select('question,created_by').eq('id', poll_id).maybeSingle();
  if (!poll || !poll.created_by || poll.created_by === req.authUser.id) return res.json({ success: true }); // 본인 투표엔 본인 참여 알림 없음
  const { data: creatorAuth } = await sb.auth.admin.getUserById(poll.created_by);
  if (!creatorAuth?.user) return res.json({ success: true });
  const voterName = studentIdOf(req.authUser);
  sendPushNotification({
    title: '투표 참여',
    body: `"${poll.question}" 투표에 새로운 참여가 있어요`,
    url: './index.html',
  }, [studentIdOf(creatorAuth.user)]).catch(() => {});
  res.json({ success: true });
});

// ── API: 선생님 메시지 알림 (스태프 전용) ──
app.post('/api/notify/teacher-message', requireAuth, requireStaffAuth, async (req, res) => {
  const { message_id } = req.body;
  if (!message_id) return res.status(400).json({ error: 'message_id가 없습니다' });
  const { data: msg } = await sb.from('teacher_messages').select('student_id,author_name,content,sender_role').eq('id', message_id).maybeSingle();
  if (!msg || msg.sender_role !== 'teacher') return res.status(404).json({ error: '메시지를 찾을 수 없습니다' });
  sendPushNotification({
    title: `${msg.author_name} 선생님 메시지`,
    body: msg.content.slice(0, 80),
    url: './index.html',
  }, [msg.student_id]).catch(() => {});
  res.json({ success: true });
});

// ── API: DM 새 메시지 알림 (보낸 사람 본인만 호출 가능, 나머지 참가자에게 발송) ──
app.post('/api/notify/dm-message', requireAuth, async (req, res) => {
  const { message_id } = req.body;
  if (!message_id) return res.status(400).json({ error: 'message_id가 없습니다' });
  const { data: msg } = await sb.from('dm_messages').select('room_id,sender_user_id,sender_name,content,image_url').eq('id', message_id).maybeSingle();
  // 호출자가 실제 이 메시지의 발신자인지 확인 — 아니면 남의 메시지를 빌미로 임의 알림을 보낼 수 있음
  if (!msg || msg.sender_user_id !== req.authUser.id) return res.status(403).json({ error: '본인이 보낸 메시지만 알릴 수 있습니다' });
  const [{ data: room }, { data: participants }] = await Promise.all([
    sb.from('dm_rooms').select('is_group,name').eq('id', msg.room_id).maybeSingle(),
    sb.from('dm_participants').select('student_id,user_id').eq('room_id', msg.room_id),
  ]);
  const recipientIds = (participants || [])
    .filter(p => p.user_id !== req.authUser.id)
    .map(p => p.student_id);
  if (!recipientIds.length) return res.json({ success: true });
  const title = room?.is_group ? `${msg.sender_name} (${room.name || '단톡방'})` : msg.sender_name;
  const body = msg.image_url ? '📷 사진을 보냈어요' : (msg.content || '').slice(0, 80);
  sendPushNotification({ title, body, url: './index.html' }, recipientIds).catch(() => {});
  res.json({ success: true });
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
  const { data: roleRow } = await sb.from('user_roles').select('role, cam_allowed').eq('student_id', studentId).single();
  const role = roleRow?.role || 'student';
  req.studyUser = { studentId, nickname, role, camAllowed: !!roleRow?.cam_allowed };
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
  if (!isStaffRole(req.studyUser.role) && !req.studyUser.camAllowed) {
    return res.status(403).json({ error: '캠스터디 이용이 허용되지 않은 계정이에요. 선생님/관리자에게 신청해주세요.' });
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
  // 같은 학생의 다른 기기(폰/PC)끼리만 타이머 상태를 주고받는 개인 룸
  socket.join(`user:${socket.studyUser.studentId}`);

  // 학습 플래너 타이머: 상태가 바뀔 때만(시작/일시정지/재개/정지) 클라이언트가 emit하고,
  // 서버는 같은 학생의 다른 기기로만 그대로 릴레이한다. 매초 카운트를 보내는 게 아니라
  // start_timestamp/accumulated_seconds/status만 오가므로 받는 쪽에서 Date.now() 기준으로
  // 알아서 재계산한다.
  socket.on('timer-sync', (state) => {
    if (!state || typeof state !== 'object') return;
    const { sessionId, subject, taskName, startTimestamp, accumulatedSeconds, status } = state;
    if (status !== 'running' && status !== 'paused' && status !== 'stopped') return;
    socket.to(`user:${socket.studyUser.studentId}`).emit('timer-sync', {
      sessionId: sessionId ?? null,
      subject: typeof subject === 'string' ? subject.slice(0, 100) : null,
      taskName: typeof taskName === 'string' ? taskName.slice(0, 100) : null,
      startTimestamp: Number.isFinite(startTimestamp) ? startTimestamp : null,
      accumulatedSeconds: Number.isFinite(accumulatedSeconds) ? accumulatedSeconds : 0,
      status,
    });
  });

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
