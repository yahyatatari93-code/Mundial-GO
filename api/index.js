const express = require('express');
const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya']; // حسابات الإدارة
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'ألمانيا', 'فرنسا', 'إسبانيا', 'إنجلترا', 'البرتغال', 'إيطاليا'];

// --- مسار تسجيل الدخول وإنشاء الحساب ---
app.post('/api/auth', async (req, res) => {
    const { action } = req.query;
    const { username, password } = req.body;

    try {
        if (action === 'register') {
            const existing = await kv.get(`user:${username}`);
            if (existing) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
            
            const user = { username, password, isAdmin: ADMINS.includes(username.toLowerCase()) };
            await kv.set(`user:${username}`, user);
            return res.json({ token: jwt.sign({ username }, JWT_SECRET), user });
        }
        
        if (action === 'login') {
            const user = await kv.get(`user:${username}`);
            if (!user || user.password !== password) return res.status(400).json({ error: 'بيانات الدخول خاطئة' });
            return res.json({ token: jwt.sign({ username }, JWT_SECRET), user });
        }
    } catch (error) {
        return res.status(500).json({ error: 'خطأ في الاتصال بقاعدة البيانات' });
    }
});

// --- مسار جلب المباريات ---
app.get('/api/matches', async (req, res) => {
    try {
        const matches = await kv.get('matches') || [];
        return res.json(matches);
    } catch (error) {
        return res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
});

// --- دالة حساب النقاط (مجهزة للاستخدام في التوقعات) ---
const calculatePoints = (prediction, actual) => {
    let points = 0;
    if (prediction.winner === actual.winner) {
        points += 3;
        if (BIG_TEAMS.includes(actual.winner)) points += 2; // نقاط إضافية للفرق الكبيرة
    }
    return points;
};

module.exports = app;
