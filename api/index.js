const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];

const OFFICIAL_SCHEDULE = [
    // الجولة 1
    { id: "m1", matchId: "m1", teamA: "المكسيك", teamB: "جنوب أفريقيا", day: 1, time: "22:00", startTime: "2026-06-11T22:00:00Z", round: "first", status: "pending" },
    { id: "m2", matchId: "m2", teamA: "كوريا الجنوبية", teamB: "التشيك", day: 2, time: "05:00", startTime: "2026-06-12T05:00:00Z", round: "first", status: "pending" },
    { id: "m3", matchId: "m3", teamA: "كندا", teamB: "البوسنة والهرسك", day: 2, time: "22:00", startTime: "2026-06-12T22:00:00Z", round: "first", status: "pending" },
    { id: "m4", matchId: "m4", teamA: "الولايات المتحدة", teamB: "باراغواي", day: 3, time: "04:00", startTime: "2026-06-13T04:00:00Z", round: "first", status: "pending" },
    { id: "m5", matchId: "m5", teamA: "قطر", teamB: "سويسرا", day: 3, time: "22:00", startTime: "2026-06-13T22:00:00Z", round: "first", status: "pending" },
    { id: "m6", matchId: "m6", teamA: "البرازيل", teamB: "المغرب", day: 4, time: "01:00", startTime: "2026-06-14T01:00:00Z", round: "first", status: "pending" },
    { id: "m7", matchId: "m7", teamA: "هايتي", teamB: "اسكتلندا", day: 4, time: "04:00", startTime: "2026-06-14T04:00:00Z", round: "first", status: "pending" },
    { id: "m8", matchId: "m8", teamA: "أستراليا", teamB: "تركيا", day: 4, time: "07:00", startTime: "2026-06-14T07:00:00Z", round: "first", status: "pending" },
    { id: "m9", matchId: "m9", teamA: "ألمانيا", teamB: "كوراساو", day: 4, time: "20:00", startTime: "2026-06-14T20:00:00Z", round: "first", status: "pending" },
    { id: "m10", matchId: "m10", teamA: "هولندا", teamB: "اليابان", day: 4, time: "23:00", startTime: "2026-06-14T23:00:00Z", round: "first", status: "pending" },
    { id: "m11", matchId: "m11", teamA: "ساحل العاج", teamB: "الإكوادور", day: 5, time: "02:00", startTime: "2026-06-15T02:00:00Z", round: "first", status: "pending" },
    { id: "m12", matchId: "m12", teamA: "السويد", teamB: "تونس", day: 5, time: "05:00", startTime: "2026-06-15T05:00:00Z", round: "first", status: "pending" },
    { id: "m13", matchId: "m13", teamA: "إسبانيا", teamB: "الرأس الأخضر", day: 5, time: "19:00", startTime: "2026-06-15T19:00:00Z", round: "first", status: "pending" },
    { id: "m14", matchId: "m14", teamA: "بلجيكا", teamB: "مصر", day: 5, time: "22:00", startTime: "2026-06-15T22:00:00Z", round: "first", status: "pending" },
    { id: "m15", matchId: "m15", teamA: "السعودية", teamB: "أوروغواي", day: 6, time: "01:00", startTime: "2026-06-16T01:00:00Z", round: "first", status: "pending" },
    { id: "m16", matchId: "m16", teamA: "إيران", teamB: "نيوزيلندا", day: 6, time: "04:00", startTime: "2026-06-16T04:00:00Z", round: "first", status: "pending" },
    { id: "m17", matchId: "m17", teamA: "فرنسا", teamB: "السنغال", day: 6, time: "22:00", startTime: "2026-06-16T22:00:00Z", round: "first", status: "pending" },
    { id: "m18", matchId: "m18", teamA: "العراق", teamB: "النرويج", day: 7, time: "01:00", startTime: "2026-06-17T01:00:00Z", round: "first", status: "pending" },
    { id: "m19", matchId: "m19", teamA: "الأرجنتين", teamB: "الجزائر", day: 7, time: "04:00", startTime: "2026-06-17T04:00:00Z", round: "first", status: "pending" },
    { id: "m20", matchId: "m20", teamA: "النمسا", teamB: "الأردن", day: 7, time: "07:00", startTime: "2026-06-17T07:00:00Z", round: "first", status: "pending" },
    { id: "m21", matchId: "m21", teamA: "البرتغال", teamB: "جمهورية الكونغو الديمقراطية", day: 7, time: "20:00", startTime: "2026-06-17T20:00:00Z", round: "first", status: "pending" },
    { id: "m22", matchId: "m22", teamA: "إنجلترا", teamB: "كرواتيا", day: 7, time: "23:00", startTime: "2026-06-17T23:00:00Z", round: "first", status: "pending" },
    { id: "m23", matchId: "m23", teamA: "غانا", teamB: "بنما", day: 8, time: "02:00", startTime: "2026-06-18T02:00:00Z", round: "first", status: "pending" },
    { id: "m24", matchId: "m24", teamA: "أوزبكستان", teamB: "كولومبيا", day: 8, time: "05:00", startTime: "2026-06-18T05:00:00Z", round: "first", status: "pending" },
    { id: "m25", matchId: "m25", teamA: "التشيك", teamB: "جنوب أفريقيا", day: 8, time: "19:00", startTime: "2026-06-18T19:00:00Z", round: "first", status: "pending" },
    { id: "m26", matchId: "m26", teamA: "سويسرا", teamB: "البوسنة والهرسك", day: 8, time: "22:00", startTime: "2026-06-18T22:00:00Z", round: "first", status: "pending" },
    
    // الجولة 2
    { id: "m27", matchId: "m27", teamA: "كندا", teamB: "قطر", day: 9, time: "01:00", startTime: "2026-06-19T01:00:00Z", round: "first", status: "pending" },
    { id: "m28", matchId: "m28", teamA: "المكسيك", teamB: "كوريا الجنوبية", day: 9, time: "04:00", startTime: "2026-06-19T04:00:00Z", round: "first", status: "pending" },
    { id: "m29", matchId: "m29", teamA: "الولايات المتحدة", teamB: "أستراليا", day: 9, time: "22:00", startTime: "2026-06-19T22:00:00Z", round: "first", status: "pending" },
    { id: "m30", matchId: "m30", teamA: "اسكتلندا", teamB: "المغرب", day: 10, time: "01:00", startTime: "2026-06-20T01:00:00Z", round: "first", status: "pending" },
    { id: "m31", matchId: "m31", teamA: "البرازيل", teamB: "هايتي", day: 10, time: "03:30", startTime: "2026-06-20T03:30:00Z", round: "first", status: "pending" },
    { id: "m32", matchId: "m32", teamA: "تركيا", teamB: "باراغواي", day: 10, time: "06:00", startTime: "2026-06-20T06:00:00Z", round: "first", status: "pending" },
    { id: "m33", matchId: "m33", teamA: "هولندا", teamB: "السويد", day: 10, time: "20:00", startTime: "2026-06-20T20:00:00Z", round: "first", status: "pending" },
    { id: "m34", matchId: "m34", teamA: "ألمانيا", teamB: "ساحل العاج", day: 10, time: "23:00", startTime: "2026-06-20T23:00:00Z", round: "first", status: "pending" },
    { id: "m35", matchId: "m35", teamA: "الإكوادور", teamB: "كوراساو", day: 11, time: "03:00", startTime: "2026-06-21T03:00:00Z", round: "first", status: "pending" },
    { id: "m36", matchId: "m36", teamA: "تونس", teamB: "اليابان", day: 11, time: "07:00", startTime: "2026-06-21T07:00:00Z", round: "first", status: "pending" },
    { id: "m37", matchId: "m37", teamA: "إسبانيا", teamB: "السعودية", day: 11, time: "19:00", startTime: "2026-06-21T19:00:00Z", round: "first", status: "pending" },
    { id: "m38", matchId: "m38", teamA: "بلجيكا", teamB: "إيران", day: 11, time: "22:00", startTime: "2026-06-21T22:00:00Z", round: "first", status: "pending" },
    { id: "m39", matchId: "m39", teamA: "أوروغواي", teamB: "الرأس الأخضر", day: 12, time: "01:00", startTime: "2026-06-22T01:00:00Z", round: "first", status: "pending" },
    { id: "m40", matchId: "m40", teamA: "نيوزيلندا", teamB: "مصر", day: 12, time: "04:00", startTime: "2026-06-22T04:00:00Z", round: "first", status: "pending" },
    { id: "m41", matchId: "m41", teamA: "الأرجنتين", teamB: "النمسا", day: 12, time: "20:00", startTime: "2026-06-22T20:00:00Z", round: "first", status: "pending" },
    { id: "m42", matchId: "m42", teamA: "فرنسا", teamB: "العراق", day: 13, time: "00:00", startTime: "2026-06-23T00:00:00Z", round: "first", status: "pending" },
    { id: "m43", matchId: "m43", teamA: "النرويج", teamB: "السنغال", day: 13, time: "03:00", startTime: "2026-06-23T03:00:00Z", round: "first", status: "pending" },
    { id: "m44", matchId: "m44", teamA: "الأردن", teamB: "الجزائر", day: 13, time: "06:00", startTime: "2026-06-23T06:00:00Z", round: "first", status: "pending" },
    { id: "m45", matchId: "m45", teamA: "البرتغال", teamB: "أوزبكستان", day: 13, time: "20:00", startTime: "2026-06-23T20:00:00Z", round: "first", status: "pending" },
    { id: "m46", matchId: "m46", teamA: "إنجلترا", teamB: "غانا", day: 13, time: "21:00", startTime: "2026-06-23T21:00:00Z", round: "first", status: "pending" },
    { id: "m47", matchId: "m47", teamA: "بنما", teamB: "كرواتيا", day: 14, time: "02:00", startTime: "2026-06-24T02:00:00Z", round: "first", status: "pending" },
    { id: "m48", matchId: "m48", teamA: "كولومبيا", teamB: "جمهورية الكونغو الديمقراطية", day: 14, time: "05:00", startTime: "2026-06-24T05:00:00Z", round: "first", status: "pending" },
    { id: "m49", matchId: "m49", teamA: "سويسرا", teamB: "كندا", day: 14, time: "22:00", startTime: "2026-06-24T22:00:00Z", round: "first", status: "pending" },
    { id: "m50", matchId: "m50", teamA: "البوسنة والهرسك", teamB: "قطر", day: 14, time: "22:00", startTime: "2026-06-24T22:00:00Z", round: "first", status: "pending" },

    // الجولة 3
    { id: "m51", matchId: "m51", teamA: "اسكتلندا", teamB: "البرازيل", day: 15, time: "01:00", startTime: "2026-06-25T01:00:00Z", round: "first", status: "pending" },
    { id: "m52", matchId: "m52", teamA: "المغرب", teamB: "هايتي", day: 15, time: "01:00", startTime: "2026-06-25T01:00:00Z", round: "first", status: "pending" },
    { id: "m53", matchId: "m53", teamA: "التشيك", teamB: "المكسيك", day: 15, time: "04:00", startTime: "2026-06-25T04:00:00Z", round: "first", status: "pending" },
    { id: "m54", matchId: "m54", teamA: "جنوب أفريقيا", teamB: "كوريا الجنوبية", day: 15, time: "04:00", startTime: "2026-06-25T04:00:00Z", round: "first", status: "pending" },
    { id: "m55", matchId: "m55", teamA: "الإكوادور", teamB: "ألمانيا", day: 15, time: "23:00", startTime: "2026-06-25T23:00:00Z", round: "first", status: "pending" },
    { id: "m56", matchId: "m56", teamA: "كوراساو", teamB: "ساحل العاج", day: 15, time: "23:00", startTime: "2026-06-25T23:00:00Z", round: "first", status: "pending" },
    { id: "m57", matchId: "m57", teamA: "تونس", teamB: "هولندا", day: 16, time: "02:00", startTime: "2026-06-26T02:00:00Z", round: "first", status: "pending" },
    { id: "m58", matchId: "m58", teamA: "اليابان", teamB: "السويد", day: 16, time: "02:00", startTime: "2026-06-26T02:00:00Z", round: "first", status: "pending" },
    { id: "m59", matchId: "m59", teamA: "تركيا", teamB: "الولايات المتحدة", day: 16, time: "05:00", startTime: "2026-06-26T05:00:00Z", round: "first", status: "pending" },
    { id: "m60", matchId: "m60", teamA: "باراغواي", teamB: "أستراليا", day: 16, time: "05:00", startTime: "2026-06-26T05:00:00Z", round: "first", status: "pending" },
    { id: "m61", matchId: "m61", teamA: "النرويج", teamB: "فرنسا", day: 16, time: "22:00", startTime: "2026-06-26T22:00:00Z", round: "first", status: "pending" },
    { id: "m62", matchId: "m62", teamA: "السنغال", teamB: "العراق", day: 16, time: "22:00", startTime: "2026-06-26T22:00:00Z", round: "first", status: "pending" },
    { id: "m63", matchId: "m63", teamA: "أوروغواي", teamB: "إسبانيا", day: 17, time: "03:00", startTime: "2026-06-27T03:00:00Z", round: "first", status: "pending" },
    { id: "m64", matchId: "m64", teamA: "الرأس الأخضر", teamB: "السعودية", day: 17, time: "03:00", startTime: "2026-06-27T03:00:00Z", round: "first", status: "pending" },
    { id: "m65", matchId: "m65", teamA: "نيوزيلندا", teamB: "بلجيكا", day: 17, time: "06:00", startTime: "2026-06-27T06:00:00Z", round: "first", status: "pending" },
    { id: "m66", matchId: "m66", teamA: "مصر", teamB: "إيران", day: 17, time: "06:00", startTime: "2026-06-27T06:00:00Z", round: "first", status: "pending" },
    { id: "m67", matchId: "m67", teamA: "بنما", teamB: "إنجلترا", day: 18, time: "00:00", startTime: "2026-06-28T00:00:00Z", round: "first", status: "pending" },
    { id: "m68", matchId: "m68", teamA: "كرواتيا", teamB: "غانا", day: 18, time: "00:00", startTime: "2026-06-28T00:00:00Z", round: "first", status: "pending" },
    { id: "m69", matchId: "m69", teamA: "كولومبيا", teamB: "البرتغال", day: 18, time: "02:30", startTime: "2026-06-28T02:30:00Z", round: "first", status: "pending" },
    { id: "m70", matchId: "m70", teamA: "جمهورية الكونغو الديمقراطية", teamB: "أوزبكستان", day: 18, time: "02:30", startTime: "2026-06-28T02:30:00Z", round: "first", status: "pending" },
    { id: "m71", matchId: "m71", teamA: "الأردن", teamB: "الأرجنتين", day: 18, time: "05:00", startTime: "2026-06-28T05:00:00Z", round: "first", status: "pending" },
    { id: "m72", matchId: "m72", teamA: "الجزائر", teamB: "النمسا", day: 18, time: "05:00", startTime: "2026-06-28T05:00:00Z", round: "first", status: "pending" }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const reqUrl = req.url.toLowerCase();

    try {
        // --- 1. قسم المصادقة والحسابات ---
        if (reqUrl.includes('auth')) {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const action = urlObj.searchParams.get('action');
            const { username, password } = req.body || {};

            if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
            const isAnAdmin = ADMINS.includes(username.toLowerCase());

            if (action === 'register') {
                const existing = await kv.get(`user:${username}`);
                if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود' });
                const user = { username, password, isAdmin: isAnAdmin };
                await kv.set(`user:${username}`, user);
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }
            if (action === 'login') {
                const user = await kv.get(`user:${username}`);
                if (!user || user.password !== password) return res.status(400).json({ error: 'بيانات خاطئة' });
                user.isAdmin = isAnAdmin;
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }
        }

        // --- 2. توليد مصفوفة المباريات الشاملة بكافة هياكل البيانات المحتملة واجهاتك ---
        const processedMatches = OFFICIAL_SCHEDULE.map(m => {
            // صياغة الحقول بكافة الأشكال (مصفوفات، كائنات مدمجة، نصوص مسطحة) منعا لاختفاء الأسماء
            return {
                ...m,
                id: m.id, matchId: m.id, match_id: m.id,
                date: m.date || m.startTime.split('T')[0],
                matchDate: m.date || m.startTime.split('T')[0],
                match_date: m.date || m.startTime.split('T')[0],
                time: m.time, matchTime: m.time, match_time: m.time,
                
                // أسماء الفرق بجميع الأشكال النصية المحتملة
                teamA: m.teamA, team1: m.teamA, team_1: m.teamA, homeTeam: m.teamA, home_team: m.teamA, home: m.teamA, teamA_name: m.teamA, nameA: m.teamA, homeName: m.teamA, home_name: m.teamA,
                teamB: m.teamB, team2: m.teamB, team_2: m.teamB, awayTeam: m.teamB, away_team: m.teamB, away: m.teamB, teamB_name: m.teamB, nameB: m.teamB, awayName: m.teamB, away_name: m.teamB,
                
                // صياغة الكائنات المتداخلة (Nested Objects) إن كانت واجهتك تستخدمها
                home: { name: m.teamA, title: m.teamA, teamA: m.teamA },
                away: { name: m.teamB, title: m.teamB, teamB: m.teamB },
                home_team: { name: m.teamA }, away_team: { name: m.teamB },
                teamA_obj: { name: m.teamA }, teamB_obj: { name: m.teamB },
                
                // صياغة المصفوفات (Arrays) في حال كانت تقرأ عبر الفهرس [0] و [1]
                teams: [m.teamA, m.teamB],
                countries: [m.teamA, m.teamB]
            };
        });

        // --- 3. قسم جلب المباريات بالتنقل التلقائي الذكي ---
        if (reqUrl.includes('matches') || reqUrl === '/api' || reqUrl === '/api/') {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const view = urlObj.searchParams.get('view');

            // حساب اليوم النشط بناء على توقيت الساعة الحالي
            const currentTime = Date.now();
            const matchDuration = 2.5 * 60 * 60 * 1000; // وقت المباراة المقدر ساعتان ونصف
            let activeDay = 1;

            // البحث التلقائي عن أول مباراة لم تنته في الجدول لمعرفة رقم يومها
            const currentUnfinished = OFFICIAL_SCHEDULE.find(m => {
                const matchEndTime = new Date(m.startTime).getTime() + matchDuration;
                return currentTime < matchEndTime;
            });

            if (currentUnfinished) {
                activeDay = currentUnfinished.day;
            } else {
                activeDay = 18; // في حال انتهاء المجموعات، ثبت اليوم الأخير
            }

            // أ: إذا كان الطلب من الصفحة الرئيسية (مباريات اليوم النشط تلقائياً)
            if (view === 'today' || reqUrl.includes('today')) {
                const todayMatches = processedMatches.filter(m => m.day === activeDay);
                return res.status(200).json(todayMatches);
            }

            // ب: إذا كان الطلب للجدول بالكامل (كل مباريات الدور الأول)
            processedMatches.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            return res.status(200).json(processedMatches);
        }

        // --- 4. قسم التوقعات (قفل قبل ساعة) ---
        if (reqUrl.includes('predictions') && req.method === 'POST') {
            let authUser = null;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    authUser = jwt.verify(authHeader.split(' ')[1], JWT_SECRET).username;
                } catch (e) {}
            }
            if (!authUser) return res.status(401).json({ error: 'سجل دخولك أولاً' });

            const { matchId } = req.body;
            const match = OFFICIAL_SCHEDULE.find(m => m.id === matchId || m.matchId === matchId);
            if (!match) return res.status(404).json({ error: 'المباراة غير موجودة' });

            const matchTime = new Date(match.startTime).getTime();
            const oneHourInMs = 60 * 60 * 1000;

            if (Date.now() > (matchTime - oneHourInMs)) {
                return res.status(400).json({ error: 'عذراً، تم إغلاق التوقعات لهذه المباراة' });
            }

            await kv.set(`pred:${authUser}:${matchId}`, { ...req.body, updatedAt: Date.now() });
            return res.status(200).json({ success: true });
        }

        return res.status(200).json(processedMatches);

    } catch (error) {
        return res.status(500).json({ error: 'خطأ داخلي' });
    }
};
