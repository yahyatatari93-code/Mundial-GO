const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'إنكلترا', 'ألمانيا', 'إسبانيا', 'البرتغال', 'هولندا', 'فرنسا', 'بلجيكا'];
const KO_STAGES = ['r32', 'r16', 'qf', 'sf', 'final'];

const BONUS_LOCK_TIME = new Date('2026-06-13T19:00:00Z').getTime();

// دالة الحصانة البرمجية: تفك تجميد البيانات القادمة من قاعدة البيانات مهما كان شكلها
async function safeGet(key) {
    let data = await kv.get(key);
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
    }
    return data;
}

// دالة تفكيك المدخلات لضمان عدم حدوث خطأ 500
async function parseBody(req) {
    if (req.body) {
        if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
        if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString('utf-8')); } catch(e){} }
        if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch(e){} }
    }
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
    });
}

function calculatePtsServer(m, pred) {
    if (!m.res || !pred) return 0;
    const s1 = +pred.s1, s2 = +pred.s2, r1 = +m.res.s1, r2 = +m.res.s2;
    const t1b = BIG_TEAMS.includes(m.t1), t2b = BIG_TEAMS.includes(m.t2);
    let pts = 0;
    if (t1b && t2b) {
        const pr = s1 > s2 ? 'w1' : s1 < s2 ? 'w2' : 'd', ar = r1 > r2 ? 'w1' : r1 < r2 ? 'w2' : 'd';
        if (s1 === r1 && s2 === r2) pts = (ar === 'd') ? 3 : 5;
        else if (pr === ar) pts = (ar === 'd') ? 2 : 3;
    } else if (t1b || t2b) {
        const bf = t1b; const bW = bf ? (r1 > r2) : (r2 > r1); const dr = (r1 === r2); const sW = bf ? (r2 > r1) : (r1 > r2);
        const pbW = bf ? (s1 > s2) : (s2 > s1); const pd = (s1 === s2); const psW = bf ? (s2 > s1) : (s1 > s2);
        if (s1 === r1 && s2 === r2) { if (bW) pts = 2; if (dr) pts = 3; if (sW) pts = 6; } 
        else { if (pbW && bW) pts = 1; if (pd && dr) pts = 2; if (psW && sW) pts = 4; }
    } else {
        const pr = s1 > s2 ? 'w1' : s1 < s2 ? 'w2' : 'd', ar = r1 > r2 ? 'w1' : r1 < r2 ? 'w2' : 'd';
        if (s1 === r1 && s2 === r2) { const sr = r1 + r2; pts = (sr >= 5 || (r1 === 0 && r2 === 0)) ? 4 : 3; } 
        else if (pr === ar) pts = 1;
    }
    if (KO_STAGES.includes(m.stg) && m.res) {
        if (pred.penW && m.res.penW && pred.penW === m.res.penW) pts += 1;
        if (pred.ps1 != null && pred.ps2 != null && m.res.ps1 != null && m.res.ps2 != null && +pred.ps1 === +m.res.ps1 && +pred.ps2 === +m.res.ps2) pts += 5;
    }
    return pts;
}

async function refreshLeaderboardCache() {
    let allUsers = await safeGet('all_users_list') || [];
    if (!Array.isArray(allUsers)) allUsers = [];
    const matches = await safeGet('db_matches') || [];
    const official = await safeGet('official_outcomes') || {};
    if (allUsers.length === 0) return [];
    
    const predKeys = allUsers.map(u => `preds:${u.uid}`);
    const bonusKeys = allUsers.map(u => `bonus:${u.uid}`);
    let allPreds = []; let allBonuses = [];
    
    for (let i = 0; i < allUsers.length; i += 100) {
        allPreds.push(...(await kv.mget(...predKeys.slice(i, i + 100))));
        allBonuses.push(...(await kv.mget(...bonusKeys.slice(i, i + 100))));
    }
    
    const leaderboard = allUsers.map((u, index) => {
        let preds = allPreds[index] || {};
        if (typeof preds === 'string') { try { preds = JSON.parse(preds); } catch(e) { preds = {}; } }
        let bonus = allBonuses[index] || {};
        if (typeof bonus === 'string') { try { bonus = JSON.parse(bonus); } catch(e) { bonus = {}; } }
        let score = 0;
        matches.forEach(m => { if (m.res && preds[m.id]) score += calculatePtsServer(m, preds[m.id]); });
        if (bonus.first && official.first && bonus.first === official.first) score += 10;
        if (bonus.second && official.second && bonus.second === official.second) score += 10;
        if (bonus.third && official.third && bonus.third === official.third) score += 8;
        if (bonus.fourth && official.fourth && bonus.fourth === official.fourth) score += 5;
        if (bonus.topScorer && official.topScorer && bonus.topScorer === official.topScorer) score += 5;
        return { uid: u.uid, username: u.username, isAdmin: ADMINS.includes(u.username), pts: score, predCount: Object.keys(preds).length };
    });
    leaderboard.sort((a, b) => b.pts - a.pts);
    await kv.set('cache:leaderboard', leaderboard);
    return leaderboard;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const route = urlObj.searchParams.get('route') || '';
    const action = urlObj.searchParams.get('action') || '';
    const matchIdParam = urlObj.searchParams.get('id') || '';

    const body = await parseBody(req);
    let userSession = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1]; const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.username) {
                userSession = await safeGet(`user:${decoded.username.toLowerCase().trim()}`);
                if(userSession) userSession.isAdmin = ADMINS.includes(userSession.username);
            }
        } catch (e) {}
    }

    try {
        if (route === 'auth') {
            const username = body.username; const password = body.password;
            if (action === 'login') {
                if (!username || !password) return res.status(400).json({ error: 'أدخل البيانات' });
                const cleanUser = String(username).trim().toLowerCase();
                const userObj = await safeGet(`user:${cleanUser}`);
                if (!userObj) return res.status(400).json({ error: 'المستخدم غير موجود' });
                if (String(userObj.password) !== String(password)) return res.status(400).json({ error: 'كلمة المرور خاطئة' });
                userObj.isAdmin = ADMINS.includes(cleanUser);
                return res.status(200).json({ token: jwt.sign({ username: cleanUser }, JWT_SECRET), user: userObj });
            }
            if (action === 'register') {
                if (!username || !password) return res.status(400).json({ error: 'أدخل البيانات' });
                const cleanUser = String(username).trim().toLowerCase();
                if (await safeGet(`user:${cleanUser}`)) return res.status(400).json({ error: 'الاسم موجود بالفعل' });
                const uid = 'u_' + Math.random().toString(36).substr(2, 9);
                const userObj = { uid, username: cleanUser, password: String(password), isAdmin: ADMINS.includes(cleanUser) };
                await kv.set(`user:${cleanUser}`, userObj); await kv.set(`uid:${uid}`, userObj);
                let allUsers = await safeGet('all_users_list') || []; if (!Array.isArray(allUsers)) allUsers = [];
                allUsers.push({ uid, username: cleanUser, isAdmin: userObj.isAdmin });
                await kv.set('all_users_list', allUsers); await refreshLeaderboardCache();
                return res.status(200).json({ token: jwt.sign({ username: cleanUser }, JWT_SECRET), user: userObj });
            }
            if (action === 'me') return res.status(200).json(userSession);
        }

        if (route === 'matches') {
            let matches = await safeGet('db_matches') || [];
            if (req.method === 'GET') { res.setHeader('Cache-Control', 'public, max-age=60'); return res.status(200).json(matches); }
            if (req.method === 'POST') {
                if (!userSession || !userSession.isAdmin) return res.status(403).json({ error: 'غير مصرح' });
                const { t1, t2, grp, stg, dt } = body;
                const newId = 'm_' + Date.now(); const newMatch = { id: newId, t1, t2, grp, stg, dt, res: null };
                matches.push(newMatch); await kv.set('db_matches', matches); await refreshLeaderboardCache();
                return res.status(200).json(newMatch);
            }
            if (req.method === 'PUT') {
                if (!userSession || !userSession.isAdmin) return res.status(403).json({ error: 'غير مصرح' });
                const { res: gameRes } = body;
                matches = matches.map(m => m.id === matchIdParam ? { ...m, res: gameRes } : m);
                await kv.set('db_matches', matches); await refreshLeaderboardCache();
                return res.status(200).json(matches.find(m => m.id === matchIdParam));
            }
            if (req.method === 'DELETE') {
                if (!userSession || !userSession.isAdmin) return res.status(403).json({ error: 'غير مصرح' });
                matches = matches.filter(m => m.id !== matchIdParam);
                await kv.set('db_matches', matches); await refreshLeaderboardCache();
                return res.status(200).json({ success: true });
            }
        }

        if (route === 'predictions') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك' });
            if (req.method === 'GET') return res.status(200).json(await safeGet(`preds:${userSession.uid}`) || {});
            if (req.method === 'POST') {
                const { matchId, s1, s2, penW, ps1, ps2 } = body;
                let matches = await safeGet('db_matches') || []; const cm = matches.find(m => m.id === matchId);
                if (Date.now() >= (new Date(cm.dt).getTime() - 3600000)) return res.status(400).json({ error: 'أغلق التوقع' });
                const cp = await safeGet(`preds:${userSession.uid}`) || {}; cp[matchId] = { s1, s2, penW, ps1, ps2 };
                await kv.set(`preds:${userSession.uid}`, cp); return res.status(200).json({ success: true });
            }
        }

        if (route === 'bonus') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك' });
            if (req.method === 'GET') return res.status(200).json(await safeGet(`bonus:${userSession.uid}`) || {});
            if (req.method === 'POST') {
                if (Date.now() >= BONUS_LOCK_TIME) return res.status(400).json({ error: 'مغلق' });
                await kv.set(`bonus:${userSession.uid}`, body); return res.status(200).json({ success: true });
            }
        }

        if (route === 'bonus_outcomes') {
            if (req.method === 'GET') return res.status(200).json(await safeGet('official_outcomes') || {});
            if (req.method === 'POST') {
                if (!userSession || !userSession.isAdmin) return res.status(403).json({ error: 'غير مصرح' });
                await kv.set('official_outcomes', body); await refreshLeaderboardCache();
                return res.status(200).json({ success: true });
            }
        }

        if (route === 'leaderboard') {
            res.setHeader('Cache-Control', 'no-cache, no-store');
            let cachedLb = await safeGet('cache:leaderboard');
            if (!cachedLb || !Array.isArray(cachedLb)) { cachedLb = await refreshLeaderboardCache(); }
            return res.status(200).json(cachedLb);
        }

        return res.status(200).json(await safeGet('db_matches') || []);
    } catch (error) { return res.status(500).json({ error: 'خطأ داخلي' }); }
};
