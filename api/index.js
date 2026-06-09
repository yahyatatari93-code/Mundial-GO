const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'ألمانيا', 'فرنسا', 'إسبانيا', 'إنجلترا', 'البرتغال', 'إيطاليا'];

module.exports = async (req, res) => {
    // إعدادات السماح بالاتصال (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // قراءة المسار بدقة لمعالجة التوجيه في Vercel
    const originalUrl = req.headers['x-matched-path'] || req.url || '';
    const path = originalUrl.split('?')[0].toLowerCase();
    
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = urlObj.searchParams.get('action');

    let currentAction = action;
    if (path.includes('register') || path.includes('signup')) currentAction = 'register';
    if (path.includes('login') || path.includes('signin')) currentAction = 'login';

    try {
        // --- 1. قسم الحسابات ---
        if (currentAction === 'register' || currentAction === 'login') {
            const { username, password } = req.body || {};
            
            if (currentAction === 'register') {
                const existing = await kv.get(`user:${username}`);
                if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
                
                const user = { username, password, isAdmin: ADMINS.includes(username.toLowerCase()) };
                await kv.set(`user:${username}`, user);
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            } 
            
            if (currentAction === 'login') {
                const user = await kv.get(`user:${username}`);
                if (!user || user.password !== password) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
                return res.status(200).status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }
        }

        // --- 2. قسم المباريات (محمي ومضمون المخرجات) ---
        if (path.includes('matches') || req.url.toLowerCase().includes('matches')) {
            let matches = await kv.get('matches');
            // الحماية: إذا لم تكن البيانات مصفوفة، حولها فوراً لمصفوفة فارغة لمنع كسر الواجهة
            if (!matches || !Array.isArray(matches)) {
                matches = [];
            }
            return res.status(200).json(matches);
        }

        // --- 3. الأمان الأقصى (Catch-All) ---
        // إذا طلبت الواجهة المستعادة أي مسار آخر غير معروف، سنعطيها مصفوفة المباريات 
        // لكي لا يظهر خطأ (.reduce is not a function) وتعمل الشاشة بسلاسة
        let fallbackMatches = await kv.get('matches');
        if (!fallbackMatches || !Array.isArray(fallbackMatches)) {
            fallbackMatches = [];
        }
        return res.status(200).json(fallbackMatches);

    } catch (error) {
        return res.status(500).json({ error: 'خطأ في الاتصال بقاعدة البيانات' });
    }
};
