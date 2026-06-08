const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-super-secret-key-123';
const BIG = ['البرازيل','الأرجنتين','إنكلترا','ألمانيا','إسبانيا','البرتغال','هولندا','فرنسا','بلجيكا'];
const KO = ['r32','r16','qf','sf','final'];

function calcPts(m, pred) {
  if (!m.res || !pred) return 0;
  const s1 = +pred.s1, s2 = +pred.s2, r1 = +m.res.s1, r2 = +m.res.s2;
  const t1b = BIG.includes(m.t1), t2b = BIG.includes(m.t2); 
  let pts = 0;
  
  if (t1b && t2b) {
    const pr = s1>s2?'w1':s1<s2?'w2':'d', ar = r1>r2?'w1':r1<r2?'w2':'d';
    if (s1 === r1 && s2 === r2) pts = ar === 'd' ? 3 : 5;
    else if (pr === ar) pts = pr === 'd' ? 2 : 3;
  } else if (t1b || t2b) {
    const bf = t1b, bW = bf?r1>r2:r2>r1, dr = r1===r2, sW = !bW&&!dr;
    const pbW = bf?s1>s2:s2>s1, pd = s1===s2, psW = !pbW&&!pd;
    if(s1 === r1 && s2 === r2) pts = psW ? 5 : pd ? 3 : 3;
    else if(psW && sW) pts = 4;
    else if(pd && dr) pts = 2;
    else if(pbW && bW) pts = 1;
  } else {
    const sr = r1+r2, pr = s1>s2?'w1':s1<s2?'w2':'d', ar = r1>r2?'w1':r1<r2?'w2':'d';
    if(s1 === r1 && s2 === r2) pts = (sr >= 5 || (r1 === 0 && r2 === 0)) ? 3 : 2;
    else if(pr === ar) pts = 1;
  }
  
  if (KO.includes(m.stg) && m.res && pred.penW && m.res.penW && pred.penW === m.res.penW) {
    pts += 1;
    if (pred.ps1!=null && pred.ps2!=null && m.res.ps1!=null && m.res.ps2!=null && +pred.ps1 === +m.res.ps1 && +pred.ps2 === +m.res.ps2) pts += 3;
  }
  return pts;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { route, action, id } = req.query;
  const method = req.method;
  const body = req.body || {};

  const getUser = () => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
  };

  try {
    if (route === 'auth') {
      if (action === 'register' && method === 'POST') {
        const { username, password } = body;
        if (!username || !password) throw new Error('بيانات مفقودة');
        const uid = username.toLowerCase();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(uid)) throw new Error('اسم المستخدم غير صالح');
        
        const exists = await kv.hget('users', uid);
        if (exists) throw new Error('اسم المستخدم موجود مسبقاً');
        
        // إعطاء صلاحيات الإدارة تلقائياً للحسابات المحددة
        const isAdmin = uid === 'red_army' || uid === 'yahya';
        const user = { uid, username, password, isAdmin, pts: 0, predCount: 0 };
        
        await kv.hset('users', { [uid]: user });
        const token = jwt.sign({ uid, username, isAdmin }, JWT_SECRET);
        return res.status(200).json({ token, user: { uid, username, isAdmin } });
      }
      
      if (action === 'login' && method === 'POST') {
        const uid = body.username.toLowerCase();
        const user = await kv.hget('users', uid);
        if (!user || user.password !== body.password) throw new Error('بيانات الدخول خاطئة');
        
        const token = jwt.sign({ uid, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET);
        return res.status(200).json({ token, user: { uid, username: user.username, isAdmin: user.isAdmin } });
      }

      const me = getUser();
      if (!me) throw new Error('غير مصرح - انتهت الجلسة');
      
      if (action === 'me') {
        const u = await kv.hget('users', me.uid);
        if (!u) throw new Error('الحساب غير موجود');
        return res.status(200).json({ uid: u.uid, username: u.username, isAdmin: u.isAdmin });
      }
      
      if (action === 'change-password' && method === 'POST') {
        const u = await kv.hget('users', me.uid);
        u.password = body.newPassword;
        await kv.hset('users', { [me.uid]: u });
        return res.status(200).json({ ok: true });
      }
    }

    const me = getUser();
    if (!me) throw new Error('جلسة غير صالحة، يرجى تسجيل الدخول مجدداً');

    if (route === 'matches') {
      if (method === 'GET') {
        const m = await kv.hgetall('matches');
        return res.status(200).json(m ? Object.values(m) : []);
      }
      if (method === 'POST' && me.isAdmin) {
        const mId = 'm' + Date.now();
        const newMatch = { ...body, id: mId, res: null };
        await kv.hset('matches', { [mId]: newMatch });
        return res.status(200).json(newMatch);
      }
      if (method === 'PUT' && me.isAdmin) {
        const m = await kv.hget('matches', id);
        if (!m) throw new Error('المباراة غير موجودة');
        m.res = body.res;
        await kv.hset('matches', { [id]: m });
        
        const allUsers = await kv.hgetall('users') || {};
        const allMatches = await kv.hgetall('matches') || {};
        
        for (const uid of Object.keys(allUsers)) {
          const preds = await kv.hgetall(`preds:${uid}`) || {};
          let pts = 0; let count = Object.keys(preds).length;
          for (const mid of Object.keys(preds)) {
            if (allMatches[mid]?.res) pts += calcPts(allMatches[mid], preds[mid]);
          }
          allUsers[uid].pts = pts;
          allUsers[uid].predCount = count;
        }
        await kv.hset('users', allUsers);
        return res.status(200).json(m);
      }
      if (method === 'DELETE' && me.isAdmin) {
        await kv.hdel('matches', id);
        return res.status(200).json({ ok: true });
      }
    }

    if (route === 'predictions') {
      if (method === 'GET') {
        const p = await kv.hgetall(`preds:${me.uid}`) || {};
        return res.status(200).json(p);
      }
      if (method === 'POST') {
        await kv.hset(`preds:${me.uid}`, { [body.matchId]: body });
        
        const u = await kv.hget('users', me.uid);
        const preds = await kv.hgetall(`preds:${me.uid}`) || {};
        u.predCount = Object.keys(preds).length;
        await kv.hset('users', { [me.uid]: u });
        
        return res.status(200).json({ ok: true });
      }
    }

    if (route === 'leaderboard') {
      const allUsers = await kv.hgetall('users') || {};
      const board = Object.values(allUsers).map(u => ({
        uid: u.uid, username: u.username, isAdmin: u.isAdmin, pts: u.pts || 0, predCount: u.predCount || 0
      })).sort((a, b) => b.pts - a.pts);
      return res.status(200).json(board);
    }

    if (route === 'leagues') {
      if (method === 'GET') {
        const all = await kv.hgetall('leagues') || {};
        const myLgs = Object.values(all).filter(l => l.members.includes(me.uid));
        return res.status(200).json(myLgs);
      }
      if (action === 'create') {
        const lId = 'lg' + Date.now();
        const code = Math.random().toString(36).slice(2,8).toUpperCase();
        const lg = { id: lId, name: body.name, code, owner: me.uid, members: [me.uid] };
        await kv.hset('leagues', { [lId]: lg });
        return res.status(200).json(lg);
      }
      if (action === 'join') {
        const all = await kv.hgetall('leagues') || {};
        const lg = Object.values(all).find(l => l.code === body.code?.toUpperCase());
        if (!lg) throw new Error('كود غير صحيح');
        if (lg.members.includes(me.uid)) throw new Error('أنت منضم بالفعل');
        lg.members.push(me.uid);
        await kv.hset('leagues', { [lg.id]: lg });
        return res.status(200).json(lg);
      }
      if (action === 'leave') {
        const lg = await kv.hget('leagues', body.leagueId);
        if (lg) {
          lg.members = lg.members.filter(m => m !== me.uid);
          await kv.hset('leagues', { [lg.id]: lg });
        }
        return res.status(200).json({ ok: true });
      }
    }

    if (route === 'users') {
      if (!me.isAdmin) throw new Error('غير مصرح');
      if (method === 'GET') {
        const all = await kv.hgetall('users') || {};
        return res.status(200).json(Object.values(all).map(u => ({ uid: u.uid, username: u.username, isAdmin: u.isAdmin })));
      }
      if (method === 'PUT') {
        const u = await kv.hget('users', body.uid);
        if (u) {
          u.isAdmin = !!body.isAdmin;
          await kv.hset('users', { [body.uid]: u });
        }
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(404).json({ error: 'المسار غير موجود' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
