const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'ألمانيا', 'فرنسا', 'إسبانيا', 'إنجلترا', 'البرتغال', 'إيطاليا'];

module.exports = async (req, res) => {
    // السماح بالاتصال
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const action = url.searchParams.get('action');

    try {
        // --- مسار تسجيل الدخول وإنشاء الحساب ---
        if (path === '/api/auth' && req.method === 'POST') {
            const { username, password } = req.body;
            
            if (action === 'register') {
                const existing = await kv.get(`user:${username}`);
                if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
                
                const user = { username, password, isAdmin: ADMINS.includes(username.toLowerCase()) };
                await kv.set(`user:${username}`, user);
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            } 
            
            if (action === 'login') {
                const user = await kv.get(`user:${username}`);
                if (!user || user.password !== password) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }
        }

        // --- مسار جلب المباريات ---
        if (path === '/api/matches' && req.method === 'GET') {
            const matches = await kv.get('matches') || [];
            return res.status(200).json(matches);
        }

        // إذا كان المسار غير معروف
        return res.status(404).json({ error: 'المسار غير موجود' });

    } catch (error) {
        return res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
};
