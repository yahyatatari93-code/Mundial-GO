const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya'];
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'ألمانيا', 'فرنسا', 'إسبانيا', 'إنجلترا', 'البرتغال', 'إيطاليا'];

module.exports = async (req, res) => {
    // إعدادات السماح بالاتصال من أي مكان (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // الحصول على المسار النظيف وتحويله لأحرف صغيرة
    const path = req.url.split('?')[0].toLowerCase();
    
    // محاولة قراءة نوع العملية (تسجيل أو دخول) من أي مكان ممكن
    let action = req.query.action || (req.body && req.body.action);
    
    // ذكاء اصطناعي مبسط لملائمة واجهتك القديمة تلقائياً:
    if (path.includes('register') || path.includes('signup')) {
        action = 'register';
    } else if (path.includes('login') || path.includes('signin')) {
        action = 'login';
    }

    try {
        // --- قسم الحسابات (تسجيل ودخول) ---
        if (action === 'register' || action === 'login') {
            const { username, password } = req.body || {};
            
            if (!username || !password) {
                return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
            }

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

        // --- قسم المباريات ---
        if (path.includes('matches')) {
            const matches = await kv.get('matches') || [];
            return res.status(200).json(matches);
        }

        // كود فحص ذكي: إذا لم يطابق أي شيء، يخبرك الخادم ماذا استلم من واجهتك لكي نصلحه فوراً
        return res.status(200).json({ 
            status: "Mundial GO API هو الآن أونلاين ويعمل", 
            receivedPath: path, 
            receivedAction: action 
        });

    } catch (error) {
        return res.status(500).json({ error: 'خطأ في الاتصال بقاعدة البيانات' });
    }
};
