const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya']; // الحسابات الإدارية الصارمة

// الجدول الرسمي للدور الأول مدعوماً بجميع صيغ الحقول ليتوافق مع واجهتك المستعادة
const OFFICIAL_SCHEDULE = [
    { id: "m1", matchId: "m1", teamA: "المكسيك", team1: "المكسيك", teamB: "كندا", team2: "كندا", day: 1, matchDay: 1, date: "2026-06-11", time: "18:00", startTime: "2026-06-11T18:00:00Z", status: "pending", round: "first" },
    { id: "m2", matchId: "m2", teamA: "أمريكا", team1: "أمريكا", teamB: "غانا", team2: "غانا", day: 1, matchDay: 1, date: "2026-06-11", time: "21:00", startTime: "2026-06-11T21:00:00Z", status: "pending", round: "first" },
    { id: "m3", matchId: "m3", teamA: "الأرجنتين", team1: "الأرجنتين", teamB: "المغرب", team2: "المغرب", day: 2, matchDay: 2, date: "2026-06-12", time: "15:00", startTime: "2026-06-12T15:00:00Z", status: "pending", round: "first" },
    { id: "m4", matchId: "m4", teamA: "فرنسا", team1: "فرنسا", teamB: "أستراليا", team2: "أستراليا", day: 2, matchDay: 2, date: "2026-06-12", time: "18:00", startTime: "2026-06-12T18:00:00Z", status: "pending", round: "first" },
    { id: "m5", matchId: "m5", teamA: "البرازيل", team1: "البرازيل", teamB: "اليابان", team2: "اليابان", day: 3, matchDay: 3, date: "2026-06-13", time: "18:00", startTime: "2026-06-13T18:00:00Z", status: "pending", round: "first" },
    { id: "m6", matchId: "m6", teamA: "ألمانيا", team1: "ألمانيا", teamB: "تونس", team2: "تونس", day: 3, matchDay: 3, date: "2026-06-13", time: "21:00", startTime: "2026-06-13T21:00:00Z", status: "pending", round: "first" },
    { id: "m7", matchId: "m7", teamA: "إسبانيا", team1: "إسبانيا", teamB: "الكاميرون", team2: "الكاميرون", day: 4, matchDay: 4, date: "2026-06-14", time: "15:00", startTime: "2026-06-14T15:00:00Z", status: "pending", round: "first" },
    { id: "m8", matchId: "m8", teamA: "إنجلترا", team1: "إنجلترا", teamB: "السعودية", team2: "السعودية", day: 4, matchDay: 4, date: "2026-06-14", time: "18:00", startTime: "2026-06-14T18:00:00Z", status: "pending", round: "first" }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const reqUrl = req.url.toLowerCase();

    try {
        // --- 1. قسم الحسابات وتصحيح الصلاحيات تلقائياً ---
        if (reqUrl.includes('auth')) {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const action = urlObj.searchParams.get('action');
            const { username, password } = req.body || {};

            if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
            const isAnAdmin = ADMINS.includes(username.toLowerCase());

            if (action === 'register') {
                const existing = await kv.get(`user:${username}`);
                if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
                
                const user = { username, password, isAdmin: isAnAdmin };
                await kv.set(`user:${username}`, user);
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }

            if (action === 'login') {
                const user = await kv.get(`user:${username}`);
                if (!user || user.password !== password) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
                
                // تصحيح فوري: حتى لو كان الحساب قديماً، امنحه الإدارة الآن إذا كان في القائمة
                user.isAdmin = isAnAdmin;
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }
        }

        // --- 2. قسم المباريات ذو التوافقية العالية ---
        if (reqUrl.includes('matches')) {
            let matches = await kv.get('matches');
            
            // حماية صلبة: إذا كانت البيانات قديمة أو فارغة أو ناقصة، استبدلها فوراً بالجدول الشامل الكامل
            if (!matches || !Array.isArray(matches) || matches.length < 5) {
                matches = OFFICIAL_SCHEDULE;
                await kv.set('matches', OFFICIAL_SCHEDULE);
            }

            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const view = urlObj.searchParams.get('view');

            // إذا طلبت الواجهة مباريات اليوم فقط (بناءً على أول مباراة لم تنتهِ)
            if (view === 'today') {
                let activeDay = 1;
                const currentUnfinished = matches.find(m => m.status !== 'finished');
                if (currentUnfinished) activeDay = currentUnfinished.day;
                return res.status(200).json(matches.filter(m => m.day === activeDay));
            }

            // الافتراضي: إرجاع الجدول كاملاً مرتباً بالتاريخ ليتناسب مع شاشات تطبيقك الأصلي
            matches.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            return res.status(200).json(matches);
        }

        // في حال استدعاء أي مسار آخر، نرجع الجدول كحماية للواجهة من الانهيار
        let fallback = await kv.get('matches') || OFFICIAL_SCHEDULE;
        return res.status(200).json(fallback);

    } catch (error) {
        return res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
};
