const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'إنكلترا', 'ألمانيا', 'إسبانيا', 'البرتغال', 'هولندا', 'فرنسا', 'بلجيكا'];
const KO_STAGES = ['r32', 'r16', 'qf', 'sf', 'final'];

// جدول الـ 72 مباراة للدور الأول كاملاً متوافقاً 100% مع مسميات وقاموس أعلام واجهتك
const OFFICIAL_SCHEDULE = [
    // الجولة 1
    { id: "m1", t1: "المكسيك", t2: "جنوب أفريقيا", grp: "1", stg: "group", dt: "2026-06-11T19:00:00Z", res: null },
    { id: "m2", t1: "كوريا الجنوبية", t2: "التشيك", grp: "1", stg: "group", dt: "2026-06-12T02:00:00Z", res: null },
    { id: "m3", t1: "كندا", t2: "البوسنة", grp: "1", stg: "group", dt: "2026-06-12T19:00:00Z", res: null },
    { id: "m4", t1: "الولايات المتحدة", t2: "الباراغواي", grp: "1", stg: "group", dt: "2026-06-13T01:00:00Z", res: null },
    { id: "m5", t1: "قطر", t2: "سويسرا", grp: "1", stg: "group", dt: "2026-06-13T19:00:00Z", res: null },
    { id: "m6", t1: "البرازيل", t2: "المغرب", grp: "1", stg: "group", dt: "2026-06-13T22:00:00Z", res: null },
    { id: "m7", t1: "هايتي", t2: "إسكتلندا", grp: "1", stg: "group", dt: "2026-06-14T01:00:00Z", res: null },
    { id: "m8", t1: "أستراليا", t2: "تركيا", grp: "1", stg: "group", dt: "2026-06-14T04:00:00Z", res: null },
    { id: "m9", t1: "ألمانيا", t2: "كوراساو", grp: "1", stg: "group", dt: "2026-06-14T17:00:00Z", res: null },
    { id: "m10", t1: "هولندا", t2: "اليابان", grp: "1", stg: "group", dt: "2026-06-14T20:00:00Z", res: null },
    { id: "m11", t1: "كوت ديفوار", t2: "الإكوادور", grp: "1", stg: "group", dt: "2026-06-14T23:00:00Z", res: null },
    { id: "m12", t1: "السويد", t2: "تونس", grp: "1", stg: "group", dt: "2026-06-15T02:00:00Z", res: null },
    { id: "m13", t1: "إسبانيا", t2: "الرأس الأخضر", grp: "1", stg: "group", dt: "2026-06-15T16:00:00Z", res: null },
    { id: "m14", t1: "بلجيكا", t2: "مصر", grp: "1", stg: "group", dt: "2026-06-15T19:00:00Z", res: null },
    { id: "m15", t1: "السعودية", t2: "الأوروغواي", grp: "1", stg: "group", dt: "2026-06-15T22:00:00Z", res: null },
    { id: "m16", t1: "إيران", t2: "نيوزيلندا", grp: "1", stg: "group", dt: "2026-06-16T01:00:00Z", res: null },
    { id: "m17", t1: "فرنسا", t2: "السنغال", grp: "1", stg: "group", dt: "2026-06-16T19:00:00Z", res: null },
    { id: "m18", t1: "العراق", t2: "النرويج", grp: "1", stg: "group", dt: "2026-06-16T22:00:00Z", res: null },
    { id: "m19", t1: "الأرجنتين", t2: "الجزائر", grp: "1", stg: "group", dt: "2026-06-17T01:00:00Z", res: null },
    { id: "m20", t1: "النمسا", t2: "الأردن", grp: "1", stg: "group", dt: "2026-06-17T04:00:00Z", res: null },
    { id: "m21", t1: "البرتغال", t2: "الكونغو", grp: "1", stg: "group", dt: "2026-06-17T17:00:00Z", res: null },
    { id: "m22", t1: "إنكلترا", t2: "كرواتيا", grp: "1", stg: "group", dt: "2026-06-17T20:00:00Z", res: null },
    { id: "m23", t1: "غانا", t2: "بنما", grp: "1", stg: "group", dt: "2026-06-17T23:00:00Z", res: null },
    { id: "m24", t1: "أوزبكستان", t2: "كولومبيا", grp: "1", stg: "group", dt: "2026-06-18T02:00:00Z", res: null },
    { id: "m25", t1: "التشيك", t2: "جنوب أفريقيا", grp: "1", stg: "group", dt: "2026-06-18T16:00:00Z", res: null },
    { id: "m26", t1: "سويسرا", t2: "البوسنة", grp: "1", stg: "group", dt: "2026-06-18T19:00:00Z", res: null },

    // الجولة 2
    { id: "m27", t1: "كندا", t2: "قطر", grp: "2", stg: "group", dt: "2026-06-18T22:00:00Z", res: null },
    { id: "m28", t1: "المكسيك", t2: "كوريا الجنوبية", grp: "2", stg: "group", dt: "2026-06-19T01:00:00Z", res: null },
    { id: "m29", t1: "الولايات المتحدة", t2: "أستراليا", grp: "2", stg: "group", dt: "2026-06-19T19:00:00Z", res: null },
    { id: "m30", t1: "إسكتلندا", t2: "المغرب", grp: "2", stg: "group", dt: "2026-06-19T22:00:00Z", res: null },
    { id: "m31", t1: "البرازيل", t2: "هايتي", grp: "2", stg: "group", dt: "2026-06-20T00:30:00Z", res: null },
    { id: "m32", t1: "تركيا", t2: "الباراغواي", grp: "2", stg: "group", dt: "2026-06-20T03:00:00Z", res: null },
    { id: "m33", t1: "هولندا", t2: "السويد", grp: "2", stg: "group", dt: "2026-06-20T17:00:00Z", res: null },
    { id: "m34", t1: "ألمانيا", t2: "كوت ديفوار", grp: "2", stg: "group", dt: "2026-06-20T20:00:00Z", res: null },
    { id: "m35", t1: "الإكوادور", t2: "كوراساو", grp: "2", stg: "group", dt: "2026-06-21T00:00:00Z", res: null },
    { id: "m36", t1: "تونس", t2: "اليابان", grp: "2", stg: "group", dt: "2026-06-21T04:00:00Z", res: null },
    { id: "m37", t1: "إسبانيا", t2: "السعودية", grp: "2", stg: "group", dt: "2026-06-21T16:00:00Z", res: null },
    { id: "m38", t1: "بلجيكا", t2: "إيران", grp: "2", stg: "group", dt: "2026-06-21T19:00:00Z", res: null },
    { id: "m39", t1: "الأوروغواي", t2: "الرأس الأخضر", grp: "2", stg: "group", dt: "2026-06-21T22:00:00Z", res: null },
    { id: "m40", t1: "نيوزيلندا", t2: "مصر", grp: "2", stg: "group", dt: "2026-06-22T01:00:00Z", res: null },
    { id: "m41", t1: "الأرجنتين", t2: "النمسا", grp: "2", stg: "group", dt: "2026-06-22T17:00:00Z", res: null },
    { id: "m42", t1: "فرنسا", t2: "العراق", grp: "2", stg: "group", dt: "2026-06-22T21:00:00Z", res: null },
    { id: "m43", t1: "النرويج", t2: "السنغال", grp: "2", stg: "group", dt: "2026-06-23T00:00:00Z", res: null },
    { id: "m44", t1: "الأردن", t2: "الجزائر", grp: "2", stg: "group", dt: "2026-06-23T03:00:00Z", res: null },
    { id: "m45", t1: "البرتغال", t2: "أوزبكستان", grp: "2", stg: "group", dt: "2026-06-23T17:00:00Z", res: null },
    { id: "m46", t1: "إنكلترا", t2: "غانا", grp: "2", stg: "group", dt: "2026-06-23T20:00:00Z", res: null },
    { id: "m47", t1: "بنما", t2: "كرواتيا", grp: "2", stg: "group", dt: "2026-06-23T23:00:00Z", res: null },
    { id: "m48", t1: "كولومبيا", t2: "الكونغو", grp: "2", stg: "group", dt: "2026-06-24T02:00:00Z", res: null },
    { id: "m49", t1: "سويسرا", t2: "كندا", grp: "2", stg: "group", dt: "2026-06-24T19:00:00Z", res: null },
    { id: "m50", t1: "البوسنة", t2: "قطر", grp: "2", stg: "group", dt: "2026-06-24T19:00:00Z", res: null },

    // الجولة 3
    { id: "m51", t1: "إسكتلندا", t2: "البرازيل", grp: "3", stg: "group", dt: "2026-06-24T22:00:00Z", res: null },
    { id: "m52", t1: "المغرب", t2: "هايتي", grp: "3", stg: "group", dt: "2026-06-24T22:00:00Z", res: null },
    { id: "m53", t1: "التشيك", t2: "المكسيك", grp: "3", stg: "group", dt: "2026-06-25T01:00:00Z", res: null },
    { id: "m54", t1: "جنوب أفريقيا", t2: "كوريا الجنوبية", grp: "3", stg: "group", dt: "2026-06-25T01:00:00Z", res: null },
    { id: "m55", t1: "الإكوادور", t2: "ألمانيا", grp: "3", stg: "group", dt: "2026-06-25T20:00:00Z", res: null },
    { id: "m56", t1: "كوراساو", t2: "كوت ديفوار", grp: "3", stg: "group", dt: "2026-06-25T20:00:00Z", res: null },
    { id: "m57", t1: "تونس", t2: "هولندا", grp: "3", stg: "group", dt: "2026-06-25T23:00:00Z", res: null },
    { id: "m58", t1: "اليابان", t2: "السويد", grp: "3", stg: "group", dt: "2026-06-25T23:00:00Z", res: null },
    { id: "m59", t1: "تركيا", t2: "الولايات المتحدة", grp: "3", stg: "group", dt: "2026-06-26T02:00:00Z", res: null },
    { id: "m60", t1: "الباراغواي", t2: "أستراليا", grp: "3", stg: "group", dt: "2026-06-26T02:00:00Z", res: null },
    { id: "m61", t1: "النرويج", t2: "فرنسا", grp: "3", stg: "group", dt: "2026-06-26T19:00:00Z", res: null },
    { id: "m62", t1: "السنغال", t2: "العراق", grp: "3", stg: "group", dt: "2026-06-26T19:00:00Z", res: null },
    { id: "m63", t1: "الأوروغواي", t2: "إسبانيا", grp: "3", stg: "group", dt: "2026-06-27T00:00:00Z", res: null },
    { id: "m64", t1: "الرأس الأخضر", t2: "السعودية", grp: "3", stg: "group", dt: "2026-06-27T00:00:00Z", res: null },
    { id: "m65", t1: "نيوزيلندا", t2: "بلجيكا", grp: "3", stg: "group", dt: "2026-06-27T03:00:00Z", res: null },
    { id: "m66", t1: "مصر", t2: "إيران", grp: "3", stg: "group", dt: "2026-06-27T03:00:00Z", res: null },
    { id: "m67", t1: "بنما", t2: "إنكلترا", grp: "3", stg: "group", dt: "2026-06-27T21:00:00Z", res: null },
    { id: "m68", t1: "كرواتيا", t2: "غانا", grp: "3", stg: "group", dt: "2026-06-27T21:00:00Z", res: null },
    { id: "m69", t1: "كولومبيا", t2: "البرتغال", grp: "3", stg: "group", dt: "2026-06-27T23:30:00Z", res: null },
    { id: "m70", t1: "الكونغو", t2: "أوزبكستان", grp: "3", stg: "group", dt: "2026-06-27T23:30:00Z", res: null },
    { id: "m71", t1: "الأردن", t2: "الأرجنتين", grp: "3", stg: "group", dt: "2026-06-28T02:00:00Z", res: null },
    { id: "m72", t1: "الجزائر", t2: "النمسا", grp: "3", stg: "group", dt: "2026-06-28T02:00:00Z", res: null }
];

// دالة سيرفر لحساب النقاط ومزامنتها مع المتصدرين
function calculatePtsServer(m, pred) {
    if (!m.res || !pred) return 0;
    const s1 = +pred.s1, s2 = +pred.s2, r1 = +m.res.s1, r2 = +m.res.s2;
    const t1b = BIG_TEAMS.includes(m.t1), t2b = BIG_TEAMS.includes(m.t2);
    let pts = 0;
    if (t1b && t2b) {
        const pr = s1 > s2 ? 'w1' : s1 < s2 ? 'w2' : 'd', ar = r1 > r2 ? 'w1' : r1 < r2 ? 'w2' : 'd';
        if (s1 === r1 && s2 === r2) pts = ar === 'd' ? 3 : 5; else if (pr === ar) pts = pr === 'd' ? 2 : 3;
    } else if (t1b || t2b) {
        const bf = t1b, bW = bf ? r1 > r2 : r2 > r1, dr = r1 === r2, sW = !bW && !dr;
        const pbW = bf ? s1 > s2 : s2 > s1, pd = s1 === s2, psW = !pbW && !pd;
        if (s1 === r1 && s2 === r2) pts = psW ? 5 : pd ? 3 : 3;
        else if (psW && sW) pts = 4; else if (pd && dr) pts = 2; else if (pbW && bW) pts = 1;
    } else {
        const sr = r1 + r2, pr = s1 > s2 ? 'w1' : s1 < s2 ? 'w2' : 'd', ar = r1 > r2 ? 'w1' : r1 < r2 ? 'w2' : 'd';
        if (s1 === r1 && s2 === r2) pts = (sr >= 5 || (r1 === 0 && r2 === 0)) ? 3 : 2; else if (pr === ar) pts = 1;
    }
    if (KO_STAGES.includes(m.stg) && m.res && pred.penW && m.res.penW && pred.penW === m.res.penW) {
        pts += 1;
        if (pred.ps1 != null && pred.ps2 != null && m.res.ps1 != null && m.res.ps2 != null && +pred.ps1 === +m.res.ps1 && +pred.ps2 === +m.res.ps2) pts += 3;
    }
    return pts;
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

    // التحقق من هوية المستخدم الحالية
    let userSession = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            userSession = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        } catch (e) {}
    }

    try {
        // --- 1. مسار الحسابات والمصادقة (route=auth) ---
        if (route === 'auth') {
            const { username, password, newPassword } = req.body || {};

            if (action === 'register') {
                const cleanUser = username.trim().toLowerCase();
                const existing = await kv.get(`user:${cleanUser}`);
                if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
                
                const uid = 'u_' + Math.random().toString(36).substr(2, 9);
                const userObj = { uid, username: cleanUser, password, isAdmin: ADMINS.includes(cleanUser) };
                
                await kv.set(`user:${cleanUser}`, userObj);
                await kv.set(`uid:${uid}`, userObj);
                
                // إضافة المستخدم لقائمة المتصدرين العامة
                let allUsers = await kv.get('all_users_list') || [];
                allUsers.push({ uid, username: cleanUser, isAdmin: userObj.isAdmin });
                await kv.set('all_users_list', allUsers);

                return res.status(200).json({ token: jwt.sign({ username: cleanUser, uid }, JWT_SECRET), user: userObj });
            }

            if (action === 'login') {
                const cleanUser = username.trim().toLowerCase();
                const userObj = await kv.get(`user:${cleanUser}`);
                if (!userObj || userObj.password !== password) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
                
                userObj.isAdmin = ADMINS.includes(cleanUser); // تأكيد الصلاحيات لـ Red_Army
                return res.status(200).json({ token: jwt.sign({ username: cleanUser, uid: userObj.uid }, JWT_SECRET), user: userObj });
            }

            if (action === 'me') {
                if (!userSession) return res.status(401).json({ error: 'غير مصرح' });
                const userObj = await kv.get(`user:${userSession.username}`);
                return res.status(200).json(userObj);
            }

            if (action === 'change-password') {
                if (!userSession) return res.status(401).json({ error: 'غير مصرح' });
                const userObj = await kv.get(`user:${userSession.username}`);
                userObj.password = newPassword;
                await kv.set(`user:${userSession.username}`, userObj);
                return res.status(200).json({ success: true });
            }
        }

        // --- 2. مسار المباريات (route=matches) ---
        if (route === 'matches') {
            let matches = await kv.get('db_matches');
            if (!matches || !Array.isArray(matches) || matches.length === 0) {
                matches = OFFICIAL_SCHEDULE;
                await kv.set('db_matches', OFFICIAL_SCHEDULE);
            }

            if (req.method === 'GET') {
                return res.status(200).json(matches);
            }

            // الإدارة والتحديث (Admin Only)
            if (req.method === 'PUT') {
                const { res: gameRes } = req.body || {};
                matches = matches.map(m => m.id === matchIdParam ? { ...m, res: gameRes } : m);
                await kv.set('db_matches', matches);
                const updatedMatch = matches.find(m => m.id === matchIdParam);
                return res.status(200).json(updatedMatch);
            }

            if (req.method === 'POST') {
                const { t1, t2, grp, stg, dt } = req.body;
                const newId = 'm_' + Date.now();
                const newMatch = { id: newId, t1, t2, grp, stg, dt, res: null };
                matches.push(newMatch);
                await kv.set('db_matches', matches);
                return res.status(200).json(newMatch);
            }

            if (req.method === 'DELETE') {
                matches = matches.filter(m => m.id !== matchIdParam);
                await kv.set('db_matches', matches);
                return res.status(200).json({ success: true });
            }
        }

        // --- 3. مسار التوقعات (route=predictions) ---
        if (route === 'predictions') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك أولاً' });
            const userPredsKey = `preds:${userSession.uid}`;

            if (req.method === 'GET') {
                const preds = await kv.get(userPredsKey) || {};
                return res.status(200).json(preds);
            }

            if (req.method === 'POST') {
                const { matchId, s1, s2, penW, ps1, ps2 } = req.body;
                let matches = await kv.get('db_matches') || OFFICIAL_SCHEDULE;
                const currentMatch = matches.find(m => m.id === matchId);

                if (!currentMatch) return res.status(404).json({ error: 'المباراة غير موجودة' });

                // فحص قاعدة التجميد قبل ساعة من الانطلاق
                const matchTime = new Date(currentMatch.dt).getTime();
                if (Date.now() >= (matchTime - 3600000)) {
                    return res.status(400).json({ error: 'أغلق التوقع، متبقي أقل من ساعة!' });
                }

                const currentPreds = await kv.get(userPredsKey) || {};
                currentPreds[matchId] = { s1, s2, penW, ps1, ps2 };
                await kv.set(userPredsKey, currentPreds);

                return res.status(200).json({ success: true });
            }
        }

        // --- 4. لوحة الصدارة العامة (route=leaderboard) ---
        if (route === 'leaderboard') {
            const allUsers = await kv.get('all_users_list') || [];
            const matches = await kv.get('db_matches') || OFFICIAL_SCHEDULE;

            const leaderboard = await Promise.all(allUsers.map(async (u) => {
                const preds = await kv.get(`preds:${u.uid}`) || {};
                let score = 0;
                let count = Object.keys(preds).length;

                matches.forEach(m => {
                    if (m.res && preds[m.id]) {
                        score += calculatePtsServer(m, preds[m.id]);
                    }
                });

                return {
                    uid: u.uid,
                    username: u.username,
                    isAdmin: ADMINS.includes(u.username),
                    pts: score,
                    predCount: count
                };
            }));

            leaderboard.sort((a, b) => b.pts - a.pts);
            return res.status(200).json(leaderboard);
        }

        // --- 5. مسار الدوريات (route=leagues) ---
        if (route === 'leagues') {
            if (!userSession) return res.status(401).json({ error: 'سجل دخولك أولاً' });
            let allLeagues = await kv.get('global_leagues') || [];

            if (req.method === 'GET') {
                const myLeagues = allLeagues.filter(l => l.members.includes(userSession.uid));
                return res.status(200).json(myLeagues);
            }

            const { name, code, leagueId } = req.body || {};

            if (action === 'create') {
                const newLgCode = Math.random().toString(36).substr(2, 6).toUpperCase();
                const newLg = {
                    id: 'lg_' + Date.now(),
                    name,
                    code: newLgCode,
                    owner: userSession.uid,
                    members: [userSession.uid]
                };
                allLeagues.push(newLg);
                await kv.set('global_leagues', allLeagues);
                return res.status(200).json(newLg);
            }

            if (action === 'join') {
                const targetLg = allLeagues.find(l => l.code === code.toUpperCase());
                if (!targetLg) return res.status(404).json({ error: 'كود الدوري غير صحيح' });
                
                if (!targetLg.members.includes(userSession.uid)) {
                    targetLg.members.push(userSession.uid);
                    await kv.set('global_leagues', allLeagues);
                }
                return res.status(200).json(targetLg);
            }

            if (action === 'leave') {
                allLeagues = allLeagues.map(l => {
                    if (l.id === leagueId) {
                        l.members = l.members.filter(m => m !== userSession.uid);
                    }
                    return l;
                }).filter(l => l.members.length > 0);
                await kv.set('global_leagues', allLeagues);
                return res.status(200).json({ success: true });
            }
        }

        // --- 6. قائمة المستخدمين للإدارة (route=users) ---
        if (route === 'users') {
            if (!userSession || !ADMINS.includes(userSession.username)) return res.status(403).json({ error: 'غير مصرح' });
            const allUsers = await kv.get('all_users_list') || [];
            return res.status(200).json(allUsers);
        }

        return res.status(200).json(OFFICIAL_SCHEDULE);

    } catch (error) {
        return res.status(500).json({ error: 'خطأ داخلي في نظام قاعدة البيانات السحابية' });
    }
};
