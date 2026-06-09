const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'ألمانيا', 'فرنسا', 'إسبانيا', 'إنجلترا', 'البرتغال', 'إيطاليا'];

// الجدول الرسمي الجاهز للدور الأول (تاريخ البدء ينطلق من 11 يونيو 2026)
const OFFICIAL_SCHEDULE = [
    { id: "m1", teamA: "المكسيك", teamB: "كندا", day: 1, startTime: "2026-06-11T18:00:00Z", status: "pending" },
    { id: "m2", teamA: "أمريكا", teamB: "غانا", day: 1, startTime: "2026-06-11T21:00:00Z", status: "pending" },
    { id: "m3", teamA: "الأرجنتين", teamB: "المغرب", day: 2, startTime: "2026-06-12T15:00:00Z", status: "pending" },
    { id: "m4", teamA: "فرنسا", teamB: "أستراليا", day: 2, startTime: "2026-06-12T18:00:00Z", status: "pending" },
    { id: "m5", teamA: "البرازيل", teamB: "اليابان", day: 3, startTime: "2026-06-13T18:00:00Z", status: "pending" },
    { id: "m6", teamA: "ألمانيا", teamB: "تونس", day: 3, startTime: "2026-06-13T21:00:00Z", status: "pending" },
    { id: "m7", teamA: "إسبانيا", teamB: "الكاميرون", day: 4, startTime: "2026-06-14T15:00:00Z", status: "pending" },
    { id: "m8", teamA: "إنجلترا", teamB: "السعودية", day: 4, startTime: "2026-06-14T18:00:00Z", status: "pending" }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const originalUrl = req.headers['x-matched-path'] || req.url || '';
    const path = originalUrl.split('?')[0].toLowerCase();
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = urlObj.searchParams.get('action');
    const view = urlObj.searchParams.get('view');

    let username = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            username = jwt.verify(token, JWT_SECRET).username;
        } catch (e) {}
    }

    try {
        // --- 1. قسم الحسابات ---
        if (path.includes('auth')) {
            const { username: user, password } = req.body || {};
            if (action === 'register') {
                const existing = await kv.get(`user:${user}`);
                if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
                const newUser = { username: user, password, isAdmin: ADMINS.includes(user.toLowerCase()) };
                await kv.set(`user:${user}`, newUser);
                return res.status(200).json({ token: jwt.sign({ username: user }, JWT_SECRET), user: newUser });
            }
            if (action === 'login') {
                const existing = await kv.get(`user:${user}`);
                if (!existing || existing.password !== password) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
                return res.status(200).json({ token: jwt.sign({ username: user }, JWT_SECRET), user: existing });
            }
        }

        // --- 2. قسم المباريات الذكي (حقن تلقائي للجدول) ---
        if (path.includes('matches') || req.url.toLowerCase().includes('matches')) {
            let matches = await kv.get('matches');
            
            // إذا كانت قاعدة البيانات فارغة تماماً، قم بحشو الجدول الرسمي تلقائياً فوراً
            if (!matches || !Array.isArray(matches) || matches.length === 0) {
                matches = OFFICIAL_SCHEDULE;
                await kv.set('matches', OFFICIAL_SCHEDULE); 
            }

            // ترتيب المباريات حسب الوقت والتاريخ
            matches.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

            // أ: الرئيسية (مباريات اليوم النشط الحالي فقط)
            if (view === 'today') {
                let activeDay = 1;
                const currentUnfinished = matches.find(m => m.status !== 'finished');
                if (currentUnfinished) activeDay = currentUnfinished.day;

                const todayMatches = matches.filter(m => m.day === activeDay);
                return res.status(200).json(todayMatches);
            }

            // ب: جدول المباريات الكامل
            return res.status(200).json(matches);
        }

        // --- 3. قسم التوقعات (قفل قبل ساعة) ---
        if (path.includes('predictions') && req.method === 'POST') {
            if (!username) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

            const { matchId, predictedWinner } = req.body;
            const matches = await kv.get('matches') || OFFICIAL_SCHEDULE;
            const match = matches.find(m => m.id === matchId);

            if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });

            // فحص قفل الساعة
            const matchTime = new Date(match.startTime).getTime();
            const currentTime = Date.now();
            const oneHourInMs = 60 * 60 * 1000;

            if (currentTime > (matchTime - oneHourInMs)) {
                return res.status(400).json({ error: 'عذراً، تم إغلاق التوقع لهذه المباراة (متبقي أقل من ساعة)' });
            }

            await kv.set(`pred:${username}:${matchId}`, { matchId, predictedWinner, updatedAt: currentTime });
            return res.status(200).json({ success: true, message: 'تم حفظ توقعك بنجاح' });
        }

        // إرجاع المباريات كحماية متكاملة للواجهة
        let fallback = await kv.get('matches') || OFFICIAL_SCHEDULE;
        return res.status(200).json(fallback);

    } catch (error) {
        return res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
};
