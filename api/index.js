const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret';

// تصنيف الفرق الكبيرة للحسابات الخاصة
const BIG_TEAMS = ['البرازيل', 'الأرجنتين', 'ألمانيا', 'فرنسا', 'إسبانيا', 'إنجلترا', 'البرتغال', 'إيطاليا'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.split('?')[0];

  // منطق حساب النقاط بناءً على تصنيف الفريق
  const calculatePoints = (prediction, actual) => {
    let points = 0;
    if (prediction.winner === actual.winner) {
      points += 3;
      // نقاط إضافية إذا كان أحد الطرفين فريقاً كبيراً
      if (BIG_TEAMS.includes(actual.winner)) points += 2;
    }
    return points;
  };

  // مثال: جلب المباريات مع دمج المنطق
  if (path === '/api/matches' && req.method === 'GET') {
    const matches = await kv.get('matches') || [];
    return res.status(200).json(matches);
  }

  // يمكن إضافة باقي المسارات هنا (تسجيل، توقعات، إلخ)
  res.status(200).json({ status: "API with logic is active" });
};
