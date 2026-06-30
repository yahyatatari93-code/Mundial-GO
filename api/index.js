const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'إنكلترا', 'ألمانيا', 'إسبانيا', 'البرتغال', 'هولندا', 'فرنسا', 'بلجيكا'];
const KO_STAGES = ['r32', 'r16', 'qf', 'sf', 'final'];

const BONUS_LOCK_TIME = new Date('2026-06-13T19:00:00Z').getTime();

// الجداول الأصلية للبطولة
const OFFICIAL_SCHEDULE = [
    { id: "m1", t1: "المكسيك", t2: "جنوب أفريقيا", grp: "1", stg: "group", dt: "2026-06-11T19:00:00Z", res: { s1: 2, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m2", t1: "كوريا الجنوبية", t2: "التشيك", grp: "1", stg: "group", dt: "2026-06-12T02:00:00Z", res: { s1: 2, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m3", t1: "كندا", t2: "البوسنة", grp: "1", stg: "group", dt: "2026-06-12T19:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m4", t1: "الولايات المتحدة", t2: "الباراغواي", grp: "1", stg: "group", dt: "2026-06-13T01:00:00Z", res: { s1: 4, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m5", t1: "قطر", t2: "سويسرا", grp: "1", stg: "group", dt: "2026-06-13T19:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m6", t1: "البرازيل", t2: "المغرب", grp: "1", stg: "group", dt: "2026-06-13T22:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m7", t1: "هايتي", t2: "إسكتلندا", grp: "1", stg: "group", dt: "2026-06-14T01:00:00Z", res: { s1: 0, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m8", t1: "أستراليا", t2: "تركيا", grp: "1", stg: "group", dt: "2026-06-14T04:00:00Z", res: { s1: 2, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m9", t1: "ألمانيا", t2: "كوراساو", grp: "1", stg: "group", dt: "2026-06-14T17:00:00Z", res: { s1: 7, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m10", t1: "هولندا", t2: "اليابان", grp: "1", stg: "group", dt: "2026-06-14T20:00:00Z", res: { s1: 2, s2: 2, penW: null, ps1: null, ps2: null } },
    { id: "m11", t1: "كوت ديفوار", t2: "الإكوادور", grp: "1", stg: "group", dt: "2026-06-14T23:00:00Z", res: { s1: 1, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m12", t1: "السويد", t2: "تونس", grp: "1", stg: "group", dt: "2026-06-15T02:00:00Z", res: { s1: 5, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m13", t1: "إسبانيا", t2: "الرأس الأخضر", grp: "1", stg: "group", dt: "2026-06-15T16:00:00Z", res: { s1: 0, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m14", t1: "بلجيكا", t2: "مصر", grp: "1", stg: "group", dt: "2026-06-15T19:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m15", t1: "السعودية", t2: "الأوروغواي", grp: "1", stg: "group", dt: "2026-06-15T22:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m16", t1: "إيران", t2: "نيوزيلندا", grp: "1", stg: "group", dt: "2026-06-16T01:00:00Z", res: { s1: 2, s2: 2, penW: null, ps1: null, ps2: null } },
    { id: "m17", t1: "فرنسا", t2: "السنغال", grp: "1", stg: "group", dt: "2026-06-16T19:00:00Z", res: { s1: 3, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m18", t1: "العراق", t2: "النرويج", grp: "1", stg: "group", dt: "2026-06-16T22:00:00Z", res: { s1: 1, s2: 4, penW: null, ps1: null, ps2: null } },
    { id: "m19", t1: "الأرجنتين", t2: "الجزائر", grp: "1", stg: "group", dt: "2026-06-17T01:00:00Z", res: { s1: 3, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m20", t1: "النمسا", t2: "الأردن", grp: "1", stg: "group", dt: "2026-06-17T04:00:00Z", res: { s1: 3, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m21", t1: "البرتغال", t2: "الكونغو", grp: "1", stg: "group", dt: "2026-06-17T17:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m22", t1: "إنكلترا", t2: "كرواتيا", grp: "1", stg: "group", dt: "2026-06-17T20:00:00Z", res: { s1: 4, s2: 2, penW: null, ps1: null, ps2: null } },
    { id: "m23", t1: "غانا", t2: "بنما", grp: "1", stg: "group", dt: "2026-06-17T23:00:00Z", res: { s1: 1, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m24", t1: "أوزبكستان", t2: "كولومبيا", grp: "1", stg: "group", dt: "2026-06-18T02:00:00Z", res: { s1: 1, s2: 3, penW: null, ps1: null, ps2: null } },
    { id: "m25", t1: "التشيك", t2: "جنوب أفريقيا", grp: "1", stg: "group", dt: "2026-06-18T16:00:00Z", res: { s1: 1, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m26", t1: "سويسرا", t2: "البوسنة", grp: "1", stg: "group", dt: "2026-06-18T19:00:00Z", res: { s1: 4, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m27", t1: "كندا", t2: "قطر", grp: "2", stg: "group", dt: "2026-06-18T22:00:00Z", res: { s1: 6, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m28", t1: "المكسيك", t2: "كوريا الجنوبية", grp: "2", stg: "group", dt: "2026-06-19T01:00:00Z", res: { s1: 1, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m29", t1: "الولايات المتحدة", t2: "أستراليا", grp: "2", stg: "group", dt: "2026-06-19T19:00:00Z", res: { s1: 2, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m30", t1: "إسكتلندا", t2: "المغرب", grp: "2", stg: "group", dt: "2026-06-19T22:00:00Z", res: { s1: 0, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m31", t1: "البرازيل", t2: "هايتي", grp: "2", stg: "group", dt: "2026-06-20T00:30:00Z", res: { s1: 3, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m32", t1: "تركيا", t2: "الباراغواي", grp: "2", stg: "group", dt: "2026-06-20T03:00:00Z", res: { s1: 0, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m33", t1: "هولندا", t2: "السويد", grp: "2", stg: "group", dt: "2026-06-20T17:00:00Z", res: { s1: 5, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m34", t1: "ألمانيا", t2: "كوت ديفوار", grp: "2", stg: "group", dt: "2026-06-20T20:00:00Z", res: { s1: 2, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m35", t1: "الإكوادور", t2: "كوراساو", grp: "2", stg: "group", dt: "2026-06-21T00:00:00Z", res: { s1: 0, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m36", t1: "تونس", t2: "اليابان", grp: "2", stg: "group", dt: "2026-06-21T04:00:00Z", res: { s1: 0, s2: 4, penW: null, ps1: null, ps2: null } },
    { id: "m37", t1: "إسبانيا", t2: "السعودية", grp: "2", stg: "group", dt: "2026-06-21T16:00:00Z", res: { s1: 4, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m38", t1: "بلجيكا", t2: "إيران", grp: "2", stg: "group", dt: "2026-06-21T19:00:00Z", res: { s1: 0, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m39", t1: "الأوروغواي", t2: "الرأس الأخضر", grp: "2", stg: "group", dt: "2026-06-21T22:00:00Z", res: { s1: 2, s2: 2, penW: null, ps1: null, ps2: null } },
    { id: "m40", t1: "نيوزيلندا", t2: "مصر", grp: "2", stg: "group", dt: "2026-06-22T01:00:00Z", res: { s1: 1, s2: 3, penW: null, ps1: null, ps2: null } },
    { id: "m41", t1: "الأرجنتين", t2: "النمسا", grp: "2", stg: "group", dt: "2026-06-22T17:00:00Z", res: { s1: 2, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m42", t1: "فرنسا", t2: "العراق", grp: "2", stg: "group", dt: "2026-06-22T21:00:00Z", res: { s1: 3, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m43", t1: "النرويج", t2: "السنغال", grp: "2", stg: "group", dt: "2026-06-23T00:00:00Z", res: { s1: 3, s2: 2, penW: null, ps1: null, ps2: null } },
    { id: "m44", t1: "الأردن", t2: "الجزائر", grp: "2", stg: "group", dt: "2026-06-23T03:00:00Z", res: { s1: 1, s2: 2, penW: null, ps1: null, ps2: null } },
    { id: "m45", t1: "البرتغال", t2: "أوزبكستان", grp: "2", stg: "group", dt: "2026-06-23T17:00:00Z", res: { s1: 5, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m46", t1: "إنكلترا", t2: "غانا", grp: "2", stg: "group", dt: "2026-06-23T20:00:00Z", res: { s1: 0, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m47", t1: "بنما", t2: "كرواتيا", grp: "2", stg: "group", dt: "2026-06-23T23:00:00Z", res: { s1: 0, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m48", t1: "كولومبيا", t2: "الكونغو", grp: "2", stg: "group", dt: "2026-06-24T02:00:00Z", res: { s1: 1, s2: 0, penW: null, ps1: null, ps2: null } },
    { id: "m49", t1: "سويسرا", t2: "كندا", grp: "2", stg: "group", dt: "2026-06-24T19:00:00Z", res: { s1: 2, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m50", t1: "البوسنة", t2: "قطر", grp: "2", stg: "group", dt: "2026-06-24T19:00:00Z", res: { s1: 3, s2: 1, penW: null, ps1: null, ps2: null } },
    { id: "m51", t1: "إسكتلندا", t2: "البرازيل", grp: "3", stg: "group", dt: "2026-06-24T22:00:00Z", res: { s1: 0, s2: 3, penW: null, ps1: null, ps2: null } },
    { id: "m52", t1: "المغرب", t2: "هايتي", grp: "3", stg: "group", dt: "2026-06-24T22:00:00Z", res: null },
    { id: "m53", t1: "التشيك", t2: "المكسيك", grp: "3", stg: "group", dt: "2026-06-25T01:00:00Z", res: { s1: 0, s2: 3, penW: null, ps1: null, ps2: null } },
    { id: "m54", t1: "جنوب أفريقيا", t2: "كوريا الجنوبية", grp: "3", stg: "group", dt: "2026-06-25T01:00:00Z", res: { s1: 1, s2: 0, penW: null, ps1: null, ps2: null } }
];

// دالة حماية لقراءة البيانات المتجمدة وتجنب الانهيار
async function safeGet(key) {
    let data = await kv.get(key);
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
    }
    return data;
}

// هذه الدالة الآن هي نسخة طبق الأصل عن منطق `calcPts` في جهاز المستخدم
function calculatePtsServer(m, pred) {
    if (!m.res || !pred) return 0;
    const s1 = +pred.s1, s2 = +pred.s2, r1 = +m.res.s1, r2 = +m.res.s2;
    // لاحظ هنا استخدمنا BIG_TEAMS الخاصة بالسيرفر
    const t1b = BIG_TEAMS.includes(m.t1), t2b = BIG_TEAMS.includes(m.t2); 
    let pts = 0;
    
    if (!t1b && !t2b) {
        const pr = s1 > s2 ? 'w1' : s1 < s2 ? 'w2' : 'd', ar = r1 > r2 ? 'w1' : r1 < r2 ? 'w2' : 'd';
        if (s1 === r1 && s2 === r2) pts = ((r1+r2) >= 5 || (r1===0 && r2===0)) ? 4 : 3;
        else if (pr === ar) pts = 1;
    }
    else {
        const bf = t1b, pbW = bf ? (s1 > s2) : (s2 > s1), psW = bf ? (s2 > s1) : (s1 > s2), pd = (s1 === s2);
        const bW = bf ? (r1 > r2) : (r2 > r1), sW = bf ? (r2 > r1) : (r1 > r2), dr = (r1 === r2);
        if (s1 === r1 && s2 === r2) { if (bW) pts = 2; else if (dr) pts = 3; else pts = 6; }
        else { if (pbW && bW) pts = 1; else if (pd && dr) pts = 2; else if (psW && sW) pts = 4; }
    }
    
    // لاحظ هنا استخدمنا KO_STAGES الخاصة بالسيرفر
    if (KO_STAGES.includes(m.stg) && m.res) {
        if (pred.s1 === pred.s2 && m.res.s1 === m.res.s2) {
            if (pred.penW && m.res.penW && pred.penW === m.res.penW) pts += 1;
            if (pred.ps1 != null && pred.ps2 != null && m.res.ps1 != null && m.res.ps2 != null && +pred.ps1 === +m.res.ps1 && +pred.ps2 === +m.res.ps2) pts += 5;
        }
    }
    return pts;
}

async function refreshLeaderboardCache() {
    let allUsers = await safeGet('all_users_list') || [];
    if (!Array.isArray(allUsers)) allUsers = [];
    const matches = await safeGet('db_matches') || OFFICIAL_SCHEDULE;
    const official = await safeGet('official_outcomes') || {};
    if (allUsers.length === 0) return [];
    
    // استخراج قائمة معرفات المباريات الحالية لفلترة التوقعات الزائدة
    const currentMatchIds = matches.map(m => m.id);
    
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
        
        // التعديل الجذري هنا: فلترة التوقعات بناءً على معرفات المباريات الحالية فقط
        const validPredCount = Object.keys(preds).filter(pid => currentMatchIds.includes(pid)).length;
        
        return { 
            uid: u.uid, 
            username: u.username, 
            isAdmin: ADMINS.includes(u.username), 
            pts: score, 
            predCount: validPredCount 
        };
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

    let body = req.body;
    if (body && typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }
    if (!body) body = {};

    let userSession = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1]; const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.username) {
                userSession = await safeGet(`user:${String(decoded.username).toLowerCase().trim()}`);
            }
        } catch (e) {}
    }

    try {
        if (route === 'auth') {
            const { username, password } = body;
            const cleanUser = username ? String(username).trim().toLowerCase() : '';
            
            if (action === 'register') {
                if (!cleanUser || !password) return res.status(400).json({ error: 'الرجاء إدخال البيانات' });
                if (await safeGet(`user:${cleanUser}`)) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
                const uid = 'u_' + Math.random().toString(36).substr(2, 9);
                const userObj = { uid, username: cleanUser, password: String(password), isAdmin: ADMINS.includes(cleanUser) };
                await kv.set(`user:${cleanUser}`, userObj); await kv.set(`uid:${uid}`, userObj);
                let allUsers = await safeGet('all_users_list') || []; if (!Array.isArray(allUsers)) allUsers = [];
                allUsers.push({ uid, username: cleanUser, isAdmin: userObj.isAdmin });
                await kv.set('all_users_list', allUsers); await refreshLeaderboardCache();
                return res.status(200).json({ token: jwt.sign({ username: cleanUser }, JWT_SECRET), user: userObj });
            }
            if (action === 'login') {
                if (!cleanUser || !password) return res.status(400).json({ error: 'الرجاء إدخال البيانات' });
                const userObj = await safeGet(`user:${cleanUser}`);
                if (!userObj || String(userObj.password) !== String(password)) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
                userObj.isAdmin = ADMINS.includes(cleanUser);
                return res.status(200).json({ token: jwt.sign({ username: cleanUser }, JWT_SECRET), user: userObj });
            }
            if (action === 'me') return res.status(200).json(userSession);
        }

        if (route === 'matches') {
            let matches = await safeGet('db_matches') || OFFICIAL_SCHEDULE;
            if (req.method === 'GET') { res.setHeader('Cache-Control', 'public, max-age=60'); return res.status(200).json(matches); }
            if (req.method === 'POST') {
                if (!userSession || !ADMINS.includes(userSession.username)) return res.status(403).json({ error: 'غير مصرح' });
                const { t1, t2, grp, stg, dt } = body;
                const newId = 'm_' + Date.now(); const newMatch = { id: newId, t1, t2, grp, stg, dt, res: null };
                matches.push(newMatch); await kv.set('db_matches', matches); await refreshLeaderboardCache();
                return res.status(200).json(newMatch);
            }
            if (req.method === 'PUT') {
                if (!userSession || !ADMINS.includes(userSession.username)) return res.status(403).json({ error: 'غير مصرح' });
                const { res: gameRes } = body;
                matches = matches.map(m => m.id === matchIdParam ? { ...m, res: gameRes } : m);
                await kv.set('db_matches', matches); await refreshLeaderboardCache();
                return res.status(200).json(matches.find(m => m.id === matchIdParam));
            }
            if (req.method === 'DELETE') {
                if (!userSession || !ADMINS.includes(userSession.username)) return res.status(403).json({ error: 'غير مصرح' });
                matches = matches.filter(m => m.id !== matchIdParam);
                await kv.set('db_matches', matches); await refreshLeaderboardCache();
                return res.status(200).json({ success: true });
            }
        }

        if (route === 'predictions') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك أولاً' });
            if (req.method === 'GET') return res.status(200).json(await safeGet(`preds:${userSession.uid}`) || {});
            if (req.method === 'POST') {
                const { matchId, s1, s2, penW, ps1, ps2 } = body;
                let matches = await safeGet('db_matches') || OFFICIAL_SCHEDULE; const cm = matches.find(m => m.id === matchId);
                if (Date.now() >= (new Date(cm.dt).getTime() - 3600000)) return res.status(400).json({ error: 'أغلق التوقع' });
                const cp = await safeGet(`preds:${userSession.uid}`) || {}; cp[matchId] = { s1, s2, penW, ps1, ps2 };
                await kv.set(`preds:${userSession.uid}`, cp); return res.status(200).json({ success: true });
            }
        }

        if (route === 'bonus') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك أولاً' });
            if (req.method === 'GET') return res.status(200).json(await safeGet(`bonus:${userSession.uid}`) || {});
            if (req.method === 'POST') {
                if (Date.now() >= BONUS_LOCK_TIME) return res.status(400).json({ error: 'عذراً، تم إغلاق التوقعات الكبرى!' });
                await kv.set(`bonus:${userSession.uid}`, body); return res.status(200).json({ success: true });
            }
        }

        if (route === 'bonus_outcomes') {
            if (req.method === 'GET') return res.status(200).json(await safeGet('official_outcomes') || {});
            if (req.method === 'POST') {
                if (!userSession || !ADMINS.includes(userSession.username)) return res.status(403).json({ error: 'غير مصرح' });
                await kv.set('official_outcomes', body); await refreshLeaderboardCache();
                return res.status(200).json({ success: true });
            }
        }

        if (route === 'leaderboard') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            let cachedLb = await safeGet('cache:leaderboard');
            if (!cachedLb || !Array.isArray(cachedLb)) { cachedLb = await refreshLeaderboardCache(); }
            return res.status(200).json(cachedLb);
        }

        if (route === 'leagues') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك أولاً' });
            let allLeagues = await safeGet('global_leagues') || [];
            if (req.method === 'GET') return res.status(200).json(allLeagues.filter(l => l.members.includes(userSession.uid)));
            const { name, code } = body;
            if (action === 'create') {
                const newLg = { id: 'lg_' + Date.now(), name, code: Math.random().toString(36).substr(2, 6).toUpperCase(), owner: userSession.uid, members: [userSession.uid] };
                allLeagues.push(newLg); await kv.set('global_leagues', allLeagues); return res.status(200).json(newLg);
            }
            if (action === 'join') {
                const targetLg = allLeagues.find(l => l.code === code.toUpperCase());
                if (!targetLg) return res.status(404).json({ error: 'كود الدوري غير صحيح' });
                if (!targetLg.members.includes(userSession.uid)) targetLg.members.push(userSession.uid);
                await kv.set('global_leagues', allLeagues); return res.status(200).json(targetLg);
            }
        }

        if (route === 'users') {
            if (!userSession || !ADMINS.includes(userSession.username)) return res.status(403).json({ error: 'غير مصرح' });
            const allUsers = await safeGet('all_users_list') || [];
            const bonusKeys = allUsers.map(u => `bonus:${u.uid}`); let allBonuses = [];
            for (let i = 0; i < bonusKeys.length; i += 100) { allBonuses.push(...(await kv.mget(...bonusKeys.slice(i, i + 100)))); }
            const usersWithBonus = allUsers.map((u, i) => {
                let b = allBonuses[i] || {}; if (typeof b === 'string') { try { b = JSON.parse(b); } catch(e) { b = {}; } }
                return { ...u, bonus: b };
            });
            return res.status(200).json(usersWithBonus);
        }

        return res.status(200).json(OFFICIAL_SCHEDULE);
    } catch (error) { return res.status(500).json({ error: 'خطأ داخلي' }); }
};
