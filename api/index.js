const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wc2026-secret-key';
const ADMINS = ['red_army', 'yahya']; // ضمان حسابات الإدارة

// جدول مباريات الدور الأول كاملاً كما أرسلته بدقة عالية ومسميات مرنة جداً
const OFFICIAL_SCHEDULE = [
    // الجولة 1
    { id: "m1", matchId: "m1", teamA: "المكسيك", team1: "المكسيك", homeTeam: "المكسيك", teamB: "جنوب أفريقيا", team2: "جنوب أفريقيا", awayTeam: "جنوب أفريقيا", day: 1, matchDay: 1, date: "2026-06-11", matchDate: "2026-06-11", time: "22:00", startTime: "2026-06-11T22:00:00Z", round: "first" },
    { id: "m2", matchId: "m2", teamA: "كوريا الجنوبية", team1: "كوريا الجنوبية", homeTeam: "كوريا الجنوبية", teamB: "التشيك", team2: "التشيك", awayTeam: "التشيك", day: 2, matchDay: 2, date: "2026-06-12", matchDate: "2026-06-12", time: "05:00", startTime: "2026-06-12T05:00:00Z", round: "first" },
    { id: "m3", matchId: "m3", teamA: "كندا", team1: "كندا", homeTeam: "كندا", teamB: "البوسنة والهرسك", team2: "البوسنة والهرسك", awayTeam: "البوسنة والهرسك", day: 2, matchDay: 2, date: "2026-06-12", matchDate: "2026-06-12", time: "22:00", startTime: "2026-06-12T22:00:00Z", round: "first" },
    { id: "m4", matchId: "m4", teamA: "الولايات المتحدة", team1: "الولايات المتحدة", homeTeam: "الولايات المتحدة", teamB: "باراغواي", team2: "باراغواي", awayTeam: "باراغواي", day: 3, matchDay: 3, date: "2026-06-13", matchDate: "2026-06-13", time: "04:00", startTime: "2026-06-13T04:00:00Z", round: "first" },
    { id: "m5", matchId: "m5", teamA: "قطر", team1: "قطر", homeTeam: "قطر", teamB: "سويسرا", team2: "سويسرا", awayTeam: "سويسرا", day: 3, matchDay: 3, date: "2026-06-13", matchDate: "2026-06-13", time: "22:00", startTime: "2026-06-13T22:00:00Z", round: "first" },
    { id: "m6", matchId: "m6", teamA: "البرازيل", team1: "البرازيل", homeTeam: "البرازيل", teamB: "المغرب", team2: "المغرب", awayTeam: "المغرب", day: 4, matchDay: 4, date: "2026-06-14", matchDate: "2026-06-14", time: "01:00", startTime: "2026-06-14T01:00:00Z", round: "first" },
    { id: "m7", matchId: "m7", teamA: "هايتي", team1: "هايتي", homeTeam: "هايتي", teamB: "اسكتلندا", team2: "اسكتلندا", awayTeam: "اسكتلندا", day: 4, matchDay: 4, date: "2026-06-14", matchDate: "2026-06-14", time: "04:00", startTime: "2026-06-14T04:00:00Z", round: "first" },
    { id: "m8", matchId: "m8", teamA: "أستراليا", team1: "أستراليا", homeTeam: "أستراليا", teamB: "تركيا", team2: "تركيا", awayTeam: "تركيا", day: 4, matchDay: 4, date: "2026-06-14", matchDate: "2026-06-14", time: "07:00", startTime: "2026-06-14T07:00:00Z", round: "first" },
    { id: "m9", matchId: "m9", teamA: "ألمانيا", team1: "ألمانيا", homeTeam: "ألمانيا", teamB: "كوراساو", team2: "كوراساو", awayTeam: "كوراساو", day: 4, matchDay: 4, date: "2026-06-14", matchDate: "2026-06-14", time: "20:00", startTime: "2026-06-14T20:00:00Z", round: "first" },
    { id: "m10", matchId: "m10", teamA: "هولندا", team1: "هولندا", homeTeam: "هولندا", teamB: "اليابان", team2: "اليابان", awayTeam: "اليابان", day: 4, matchDay: 4, date: "2026-06-14", matchDate: "2026-06-14", time: "23:00", startTime: "2026-06-14T23:00:00Z", round: "first" },
    { id: "m11", matchId: "m11", teamA: "ساحل العاج", team1: "ساحل العاج", homeTeam: "ساحل العاج", teamB: "الإكوادور", team2: "الإكوادور", awayTeam: "الإكوادور", day: 5, matchDay: 5, date: "2026-06-15", matchDate: "2026-06-15", time: "02:00", startTime: "2026-06-15T02:00:00Z", round: "first" },
    { id: "m12", matchId: "m12", teamA: "السويد", team1: "السويد", homeTeam: "السويد", teamB: "تونس", team2: "تونس", awayTeam: "تونس", day: 5, matchDay: 5, date: "2026-06-15", matchDate: "2026-06-15", time: "05:00", startTime: "2026-06-15T05:00:00Z", round: "first" },
    { id: "m13", matchId: "m13", teamA: "إسبانيا", team1: "إسبانيا", homeTeam: "إسبانيا", teamB: "الرأس الأخضر", team2: "الرأس الأخضر", awayTeam: "الرأس الأخضر", day: 5, matchDay: 5, date: "2026-06-15", matchDate: "2026-06-15", time: "19:00", startTime: "2026-06-15T19:00:00Z", round: "first" },
    { id: "m14", matchId: "m14", teamA: "بلجيكا", team1: "بلجيكا", homeTeam: "بلجيكا", teamB: "مصر", team2: "مصر", awayTeam: "مصر", day: 5, matchDay: 5, date: "2026-06-15", matchDate: "2026-06-15", time: "22:00", startTime: "2026-06-15T22:00:00Z", round: "first" },
    { id: "m15", matchId: "m15", teamA: "السودية", team1: "السعودية", homeTeam: "السعودية", teamB: "أوروغواي", team2: "أوروغواي", awayTeam: "أوروغواي", day: 6, matchDay: 6, date: "2026-06-16", matchDate: "2026-06-16", time: "01:00", startTime: "2026-06-16T01:00:00Z", round: "first" },
    { id: "m16", matchId: "m16", teamA: "إيران", team1: "إيران", homeTeam: "إيران", teamB: "نيوزيلندا", team2: "نيوزيلندا", awayTeam: "نيوزيلندا", day: 6, matchDay: 6, date: "2026-06-16", matchDate: "2026-06-16", time: "04:00", startTime: "2026-06-16T04:00:00Z", round: "first" },
    { id: "m17", matchId: "m17", teamA: "فرنسا", team1: "فرنسا", homeTeam: "فرنسا", teamB: "السنغال", team2: "السنغال", awayTeam: "السنغال", day: 6, matchDay: 6, date: "2026-06-16", matchDate: "2026-06-16", time: "22:00", startTime: "2026-06-16T22:00:00Z", round: "first" },
    { id: "m18", matchId: "m18", teamA: "العراق", team1: "العراق", homeTeam: "العراق", teamB: "النرويج", team2: "النرويج", awayTeam: "النرويج", day: 7, matchDay: 7, date: "2026-06-17", matchDate: "2026-06-17", time: "01:00", startTime: "2026-06-17T01:00:00Z", round: "first" },
    { id: "m19", matchId: "m19", teamA: "الأرجنتين", team1: "الأرجنتين", homeTeam: "الأرجنتين", teamB: "الجزائر", team2: "الجزائر", awayTeam: "الجزائر", day: 7, matchDay: 7, date: "2026-06-17", matchDate: "2026-06-17", time: "04:00", startTime: "2026-06-17T04:00:00Z", round: "first" },
    { id: "m20", matchId: "m20", teamA: "النمسا", team1: "النمسا", homeTeam: "النمسا", teamB: "الأردن", team2: "الأردن", awayTeam: "الأردن", day: 7, matchDay: 7, date: "2026-06-17", matchDate: "2026-06-17", time: "07:00", startTime: "2026-06-17T07:00:00Z", round: "first" },
    { id: "m21", matchId: "m21", teamA: "البرتغال", team1: "البرتغال", homeTeam: "البرتغال", teamB: "جمهورية الكونغو الديمقراطية", team2: "جمهورية الكونغو الديمقراطية", awayTeam: "جمهورية الكونغو الديمقراطية", day: 7, matchDay: 7, date: "2026-06-17", matchDate: "2026-06-17", time: "20:00", startTime: "2026-06-17T20:00:00Z", round: "first" },
    { id: "m22", matchId: "m22", teamA: "إنجلترا", team1: "إنجلترا", homeTeam: "إنجلترا", teamB: "كرواتيا", team2: "كرواتيا", awayTeam: "كرواتيا", day: 7, matchDay: 7, date: "2026-06-17", matchDate: "2026-06-17", time: "23:00", startTime: "2026-06-17T23:00:00Z", round: "first" },
    { id: "m23", matchId: "m23", teamA: "غانا", team1: "غانا", homeTeam: "غانا", teamB: "بنما", team2: "بنما", awayTeam: "بنما", day: 8, matchDay: 8, date: "2026-06-18", matchDate: "2026-06-18", time: "02:00", startTime: "2026-06-18T02:00:00Z", round: "first" },
    { id: "m24", matchId: "m24", teamA: "أوزبكستان", team1: "أوزبكستان", homeTeam: "أوزبكستان", teamB: "كولومبيا", team2: "كولومبيا", awayTeam: "كولومبيا", day: 8, matchDay: 8, date: "2026-06-18", matchDate: "2026-06-18", time: "05:00", startTime: "2026-06-18T05:00:00Z", round: "first" },
    { id: "m25", matchId: "m25", teamA: "التشيك", team1: "التشيك", homeTeam: "التشيك", teamB: "جنوب أفريقيا", team2: "جنوب أفريقيا", awayTeam: "جنوب أفريقيا", day: 8, matchDay: 8, date: "2026-06-18", matchDate: "2026-06-18", time: "19:00", startTime: "2026-06-18T19:00:00Z", round: "first" },
    { id: "m26", matchId: "m26", teamA: "سويسرا", team1: "سويسرا", homeTeam: "سويسرا", teamB: "البوسنة والهرسك", team2: "البوسنة والهرسك", awayTeam: "البوسنة والهرسك", day: 8, matchDay: 8, date: "2026-06-18", matchDate: "2026-06-18", time: "22:00", startTime: "2026-06-18T22:00:00Z", round: "first" },
    
    // الجولة 2
    { id: "m27", matchId: "m27", teamA: "كندا", team1: "كندا", homeTeam: "كندا", teamB: "قطر", team2: "قطر", awayTeam: "قطر", day: 9, matchDay: 9, date: "2026-06-19", matchDate: "2026-06-19", time: "01:00", startTime: "2026-06-19T01:00:00Z", round: "first" },
    { id: "m28", matchId: "m28", teamA: "المكسيك", team1: "المكسيك", homeTeam: "المكسيك", teamB: "كوريا الجنوبية", team2: "كوريا الجنوبية", awayTeam: "كوريا الجنوبية", day: 9, matchDay: 9, date: "2026-06-19", matchDate: "2026-06-19", time: "04:00", startTime: "2026-06-19T04:00:00Z", round: "first" },
    { id: "m29", matchId: "m29", teamA: "الولايات المتحدة", team1: "الولايات المتحدة", homeTeam: "الولايات المتحدة", teamB: "أستراليا", team2: "أستراليا", awayTeam: "أستراليا", day: 9, matchDay: 9, date: "2026-06-19", matchDate: "2026-06-19", time: "22:00", startTime: "2026-06-19T22:00:00Z", round: "first" },
    { id: "m30", matchId: "m30", teamA: "اسكتلندا", team1: "اسكتلندا", homeTeam: "اسكتلندا", teamB: "المغرب", team2: "المغرب", awayTeam: "المغرب", day: 10, matchDay: 10, date: "2026-06-20", matchDate: "2026-06-20", time: "01:00", startTime: "2026-06-20T01:00:00Z", round: "first" },
    { id: "m31", matchId: "m31", teamA: "البرازيل", team1: "البرازيل", homeTeam: "البرازيل", teamB: "هايتي", team2: "هايتي", awayTeam: "هايتي", day: 10, matchDay: 10, date: "2026-06-20", matchDate: "2026-06-20", time: "03:30", startTime: "2026-06-20T03:30:00Z", round: "first" },
    { id: "m32", matchId: "m32", teamA: "تركيا", team1: "تركيا", homeTeam: "تركيا", teamB: "باراغواي", team2: "باراغواي", awayTeam: "باراغواي", day: 10, matchDay: 10, date: "2026-06-20", matchDate: "2026-06-20", time: "06:00", startTime: "2026-06-20T06:00:00Z", round: "first" },
    { id: "m33", matchId: "m33", teamA: "هولندا", team1: "هولندا", homeTeam: "هولندا", teamB: "السويد", team2: "السويد", awayTeam: "السويد", day: 10, matchDay: 10, date: "2026-06-20", matchDate: "2026-06-20", time: "20:00", startTime: "2026-06-20T20:00:00Z", round: "first" },
    { id: "m34", matchId: "m34", teamA: "ألمانيا", team1: "ألمانيا", homeTeam: "ألمانيا", teamB: "ساحل العاج", team2: "ساحل العاج", awayTeam: "ساحل العاج", day: 10, matchDay: 10, date: "2026-06-20", matchDate: "2026-06-20", time: "23:00", startTime: "2026-06-20T23:00:00Z", round: "first" },
    { id: "m35", matchId: "m35", teamA: "الإكوادور", team1: "الإكوادور", homeTeam: "الإكوادور", teamB: "كوراساو", team2: "كوراساو", awayTeam: "كوراساو", day: 11, matchDay: 11, date: "2026-06-21", matchDate: "2026-06-21", time: "03:00", startTime: "2026-06-21T03:00:00Z", round: "first" },
    { id: "m36", matchId: "m36", teamA: "تونس", team1: "تونس", homeTeam: "تونس", teamB: "اليابان", team2: "اليابان", awayTeam: "اليابان", day: 11, matchDay: 11, date: "2026-06-21", matchDate: "2026-06-21", time: "07:00", startTime: "2026-06-21T07:00:00Z", round: "first" },
    { id: "m37", matchId: "m37", teamA: "إسبانيا", team1: "إسبانيا", homeTeam: "إسبانيا", teamB: "السودية", team2: "السعودية", awayTeam: "السعودية", day: 11, matchDay: 11, date: "2026-06-21", matchDate: "2026-06-21", time: "19:00", startTime: "2026-06-21T19:00:00Z", round: "first" },
    { id: "m38", matchId: "m38", teamA: "بلجيكا", team1: "بلجيكا", homeTeam: "بلجيكا", teamB: "إيران", team2: "إيران", awayTeam: "إيران", day: 11, matchDay: 11, date: "2026-06-21", matchDate: "2026-06-21", time: "22:00", startTime: "2026-06-21T22:00:00Z", round: "first" },
    { id: "m39", matchId: "m39", teamA: "أوروغواي", team1: "أوروغواي", homeTeam: "أوروغواي", teamB: "الرأس الأخضر", team2: "الرأس الأخضر", awayTeam: "الرأس الأخضر", day: 12, matchDay: 12, date: "2026-06-22", matchDate: "2026-06-22", time: "01:00", startTime: "2026-06-22T01:00:00Z", round: "first" },
    { id: "m40", matchId: "m40", teamA: "نيوزيلندا", team1: "نيوزيلندا", homeTeam: "نيوزيلندا", teamB: "مصر", team2: "مصر", awayTeam: "مصر", day: 12, matchDay: 12, date: "2026-06-22", matchDate: "2026-06-22", time: "04:00", startTime: "2026-06-22T04:00:00Z", round: "first" },
    { id: "m41", matchId: "m41", teamA: "الأرجنتين", team1: "الأرجنتين", homeTeam: "الأرجنتين", teamB: "النمسا", team2: "النمسا", awayTeam: "النمسا", day: 12, matchDay: 12, date: "2026-06-22", matchDate: "2026-06-22", time: "20:00", startTime: "2026-06-22T20:00:00Z", round: "first" },
    { id: "m42", matchId: "m42", teamA: "فرنسا", team1: "فرنسا", homeTeam: "فرنسا", teamB: "العراق", team2: "العراق", awayTeam: "العراق", day: 13, matchDay: 13, date: "2026-06-23", matchDate: "2026-06-23", time: "00:00", startTime: "2026-06-23T00:00:00Z", round: "first" },
    { id: "m43", matchId: "m43", teamA: "النرويج", team1: "النرويج", homeTeam: "النرويج", teamB: "السنغال", team2: "السنغال", awayTeam: "السنغال", day: 13, matchDay: 13, date: "2026-06-23", matchDate: "2026-06-23", time: "03:00", startTime: "2026-06-23T03:00:00Z", round: "first" },
    { id: "m44", matchId: "m44", teamA: "الأردن", team1: "الأردن", homeTeam: "الأردن", teamB: "الجزائر", team2: "الجزائر", awayTeam: "الجزائر", day: 13, matchDay: 13, date: "2026-06-23", matchDate: "2026-06-23", time: "06:00", startTime: "2026-06-23T06:00:00Z", round: "first" },
    { id: "m45", matchId: "m45", teamA: "البرتغال", team1: "البرتغال", homeTeam: "البرتغال", teamB: "أوزبكستان", team2: "أوزبكستان", awayTeam: "أوزبكستان", day: 13, matchDay: 13, date: "2026-06-23", matchDate: "2026-06-23", time: "20:00", startTime: "2026-06-23T20:00:00Z", round: "first" },
    { id: "m46", matchId: "m46", teamA: "إنجلترا", team1: "إنجلتles", homeTeam: "إنجلترا", teamB: "غانا", team2: "غانا", awayTeam: "غانا", day: 13, matchDay: 13, date: "2026-06-23", matchDate: "2026-06-23", time: "21:00", startTime: "2026-06-23T21:00:00Z", round: "first" },
    { id: "m47", matchId: "m47", teamA: "بنما", team1: "بنما", homeTeam: "بنما", teamB: "كرواتيا", team2: "كرواتيا", awayTeam: "كرواتيا", day: 14, matchDay: 14, date: "2026-06-24", matchDate: "2026-06-24", time: "02:00", startTime: "2026-06-24T02:00:00Z", round: "first" },
    { id: "m48", matchId: "m48", teamA: "كولومبيا", team1: "كولومبيا", homeTeam: "كولومبيا", teamB: "جمهورية الكونغو الديمقراطية", team2: "جمهورية الكونغو الديمقراطية", awayTeam: "جمهورية الكونغو الديمقراطية", day: 14, matchDay: 14, date: "2026-06-24", matchDate: "2026-06-24", time: "05:00", startTime: "2026-06-24T05:00:00Z", round: "first" },
    { id: "m49", matchId: "m49", teamA: "سويسرا", team1: "سويسرا", homeTeam: "سويسرا", teamB: "كندا", team2: "كندا", awayTeam: "كندا", day: 14, matchDay: 14, date: "2026-06-24", matchDate: "2026-06-24", time: "22:00", startTime: "2026-06-24T22:00:00Z", round: "first" },
    { id: "m50", matchId: "m50", teamA: "البوسنة والهرسك", team1: "البوسنة والهرسك", homeTeam: "البوسنة والهرسك", teamB: "قطر", team2: "قطر", awayTeam: "قطر", day: 14, matchDay: 14, date: "2026-06-24", matchDate: "2026-06-24", time: "22:00", startTime: "2026-06-24T22:00:00Z", round: "first" },

    // الجولة 3
    { id: "m51", matchId: "m51", teamA: "اسكتلندا", team1: "اسكتلندا", homeTeam: "اسكتلندا", teamB: "البرازيل", team2: "البرازيل", awayTeam: "البرازيل", day: 15, matchDay: 15, date: "2026-06-25", matchDate: "2026-06-25", time: "01:00", startTime: "2026-06-25T01:00:00Z", round: "first" },
    { id: "m52", matchId: "m52", teamA: "المغرب", team1: "المغرب", homeTeam: "المغرب", teamB: "هايتي", team2: "هايتي", awayTeam: "هايتي", day: 15, matchDay: 15, date: "2026-06-25", matchDate: "2026-06-25", time: "01:00", startTime: "2026-06-25T01:00:00Z", round: "first" },
    { id: "m53", matchId: "m53", teamA: "التشيك", team1: "التشيك", homeTeam: "التشيك", teamB: "المكسيك", team2: "المكسيك", awayTeam: "المكسيك", day: 15, matchDay: 15, date: "2026-06-25", matchDate: "2026-06-25", time: "04:00", startTime: "2026-06-25T04:00:00Z", round: "first" },
    { id: "m54", matchId: "m54", teamA: "جنوب أفريقيا", team1: "جنوب أفريقيا", homeTeam: "جنوب أفريقيا", teamB: "كوريا الجنوبية", team2: "كوريا الجنوبية", awayTeam: "كوريا الجنوبية", day: 15, matchDay: 15, date: "2026-06-25", matchDate: "2026-06-25", time: "04:00", startTime: "2026-06-25T04:00:00Z", round: "first" },
    { id: "m55", matchId: "m55", teamA: "الإكوادور", team1: "الإكوادور", homeTeam: "الإكوادور", teamB: "ألمانيا", team2: "ألمانيا", awayTeam: "ألمانيا", day: 15, matchDay: 15, date: "2026-06-25", matchDate: "2026-06-25", time: "23:00", startTime: "2026-06-25T23:00:00Z", round: "first" },
    { id: "m56", matchId: "m56", teamA: "كوراساو", team1: "كوراساو", homeTeam: "كوراساو", teamB: "ساحل العاج", team2: "ساحل العاج", awayTeam: "ساحل العاج", day: 15, matchDay: 15, date: "2026-06-25", matchDate: "2026-06-25", time: "23:00", startTime: "2026-06-25T23:00:00Z", round: "first" },
    { id: "m57", matchId: "m57", teamA: "تونس", team1: "تونس", homeTeam: "تونس", teamB: "هولندا", team2: "هولندا", awayTeam: "هولندا", day: 16, matchDay: 16, date: "2026-06-26", matchDate: "2026-06-26", time: "02:00", startTime: "2026-06-26T02:00:00Z", round: "first" },
    { id: "m58", matchId: "m58", teamA: "اليابان", team1: "اليابان", homeTeam: "اليابان", teamB: "السويد", team2: "السويد", awayTeam: "السويد", day: 16, matchDay: 16, date: "2026-06-26", matchDate: "2026-06-26", time: "02:00", startTime: "2026-06-26T02:00:00Z", round: "first" },
    { id: "m59", matchId: "m59", teamA: "تركيا", team1: "تركيا", homeTeam: "تركيا", teamB: "الولايات المتحدة", team2: "الولايات المتحدة", awayTeam: "الولايات المتحدة", day: 16, matchDay: 16, date: "2026-06-26", matchDate: "2026-06-26", time: "05:00", startTime: "2026-06-26T05:00:00Z", round: "first" },
    { id: "m60", matchId: "m60", teamA: "باراغواي", team1: "باراغواي", homeTeam: "باراغواي", teamB: "أستراليا", team2: "أستراليا", awayTeam: "أستراليا", day: 16, matchDay: 16, date: "2026-06-26", matchDate: "2026-06-26", time: "05:00", startTime: "2026-06-26T05:00:00Z", round: "first" },
    { id: "m61", matchId: "m61", teamA: "النرويج", team1: "النرويج", homeTeam: "النرويج", teamB: "فرنسا", team2: "فرنسا", awayTeam: "فرنسا", day: 16, matchDay: 16, date: "2026-06-26", matchDate: "2026-06-26", time: "22:00", startTime: "2026-06-26T22:00:00Z", round: "first" },
    { id: "m62", matchId: "m62", teamA: "السنغال", team1: "السنغال", homeTeam: "السنغال", teamB: "العراق", team2: "العراق", awayTeam: "العراق", day: 16, matchDay: 16, date: "2026-06-26", matchDate: "2026-06-26", time: "22:00", startTime: "2026-06-26T22:00:00Z", round: "first" },
    { id: "m63", matchId: "m63", teamA: "أوروغواي", team1: "أوروغواي", homeTeam: "أوروغواي", teamB: "إسبانيا", team2: "إسبانيا", awayTeam: "إسبانيا", day: 17, matchDay: 17, date: "2026-06-27", matchDate: "2026-06-27", time: "03:00", startTime: "2026-06-27T03:00:00Z", round: "first" },
    { id: "m64", matchId: "m64", teamA: "الرأس الأخضر", team1: "الرأس الأخضر", homeTeam: "الرأس الأخضر", teamB: "السودية", team2: "السعودية", awayTeam: "السعودية", day: 17, matchDay: 17, date: "2026-06-27", matchDate: "2026-06-27", time: "03:00", startTime: "2026-06-27T03:00:00Z", round: "first" },
    { id: "m65", matchId: "m65", teamA: "نيوزيلندا", team1: "نيوزيلندا", homeTeam: "نيوزيلندا", teamB: "بلجيكا", team2: "بلجيكا", awayTeam: "بلجيكا", day: 17, matchDay: 17, date: "2026-06-27", matchDate: "2026-06-27", time: "06:00", startTime: "2026-06-27T06:00:00Z", round: "first" },
    { id: "m66", matchId: "m66", teamA: "مصر", team1: "مصر", homeTeam: "مصر", teamB: "إيران", team2: "إيران", awayTeam: "إيران", day: 17, matchDay: 17, date: "2026-06-27", matchDate: "2026-06-27", time: "06:00", startTime: "2026-06-27T06:00:00Z", round: "first" },
    { id: "m67", matchId: "m67", teamA: "بنما", team1: "بنما", homeTeam: "بنما", teamB: "إنجلترا", team2: "إنجلترا", awayTeam: "إنجلترا", day: 18, matchDay: 18, date: "2026-06-28", matchDate: "2026-06-28", time: "00:00", startTime: "2026-06-28T00:00:00Z", round: "first" },
    { id: "m68", matchId: "m68", teamA: "كرواتيا", team1: "كرواتيا", homeTeam: "كرواتيا", teamB: "غانا", team2: "غانا", awayTeam: "غانا", day: 18, matchDay: 18, date: "2026-06-28", matchDate: "2026-06-28", time: "00:00", startTime: "2026-06-28T00:00:00Z", round: "first" },
    { id: "m69", matchId: "m69", teamA: "كولومبيا", team1: "كولومبيا", homeTeam: "كولومبيا", teamB: "البرتغال", team2: "البرتغال", awayTeam: "البرتغال", day: 18, matchDay: 18, date: "2026-06-28", matchDate: "2026-06-28", time: "02:30", startTime: "2026-06-28T02:30:00Z", round: "first" },
    { id: "m70", matchId: "m70", teamA: "جمهورية الكونغو الديمقراطية", team1: "جمهورية الكونغو الديمقراطية", homeTeam: "جمهورية الكونغو الديمقراطية", teamB: "أوزبكستان", team2: "أوزبكستان", awayTeam: "أوزبكستان", day: 18, matchDay: 18, date: "2026-06-28", matchDate: "2026-06-28", time: "02:30", startTime: "2026-06-28T02:30:00Z", round: "first" },
    { id: "m71", matchId: "m71", teamA: "الأردنية", team1: "الأردن", homeTeam: "الأردن", teamB: "الأرجنتين", team2: "الأرجنتين", awayTeam: "الأرجنتين", day: 18, matchDay: 18, date: "2026-06-28", matchDate: "2026-06-28", time: "05:00", startTime: "2026-06-28T05:00:00Z", round: "first" },
    { id: "m72", matchId: "m72", teamA: "الجزائر", team1: "الجزائر", homeTeam: "الجزائر", teamB: "النمسا", team2: "النمسا", awayTeam: "النمسا", day: 18, matchDay: 18, date: "2026-06-28", matchDate: "2026-06-28", time: "05:00", startTime: "2026-06-28T05:00:00Z", round: "first" }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const reqUrl = req.url.toLowerCase();

    try {
        // --- 1. قسم الحسابات وتصحيح صلاحيات المشرفين فوراً ---
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
                
                user.isAdmin = isAnAdmin; // إجبار التفعيل للإدارة
                return res.status(200).json({ token: jwt.sign({ username }, JWT_SECRET), user });
            }
        }

        // --- 2. قسم المباريات الفائق التوافق والتحديث التلقائي ---
        if (reqUrl.includes('matches') || reqUrl === '/api' || reqUrl === '/api/') {
            // تحديث إجباري وتنظيف لأي بيانات قديمة غير مطابقة
            let matches = OFFICIAL_SCHEDULE;
            await kv.set('matches', OFFICIAL_SCHEDULE); // حشو الجدول المتكامل في Upstash

            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const view = urlObj.searchParams.get('view');

            const currentTime = Date.now();
            const matchDuration = 2.5 * 60 * 60 * 1000; // ساعتان ونصف للمباراة

            // أ: حساب اليوم النشط حالياً بناءً على الوقت الحالي للمباريات
            if (view === 'today' || reqUrl.includes('today')) {
                let activeDay = 1;
                
                // البحث عن أول مباراة لم تنتهِ من حيث الوقت الملعوب
                const currentUnfinished = matches.find(m => {
                    const matchEndTime = new Date(m.startTime).getTime() + matchDuration;
                    return currentTime < matchEndTime;
                });

                if (currentUnfinished) activeDay = currentUnfinished.day;
                
                const todayMatches = matches.filter(m => m.day === activeDay);
                return res.status(200).json(todayMatches);
            }

            // ب: الجدول الكامل للدور الأول مرتب بالتاريخ
            matches.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            return res.status(200).json(matches);
        }

        // --- 3. قسم التوقعات الفائق الذكاء (قفل قبل ساعة) ---
        if (reqUrl.includes('predictions') && req.method === 'POST') {
            let authUsername = null;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    authUsername = jwt.verify(token, JWT_SECRET).username;
                } catch (e) {}
            }

            if (!authUsername) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً لتتمكن من وضع التوقع' });

            const { matchId, predictedWinner } = req.body;
            const match = OFFICIAL_SCHEDULE.find(m => m.id === matchId || m.matchId === matchId);

            if (!match) return res.status(404).json({ error: 'المباراة غير موجودة في الجدول' });

            // فحص شرط القفل قبل ساعة بدقة
            const matchTime = new Date(match.startTime).getTime();
            const currentTime = Date.now();
            const oneHourInMs = 60 * 60 * 1000;

            if (currentTime > (matchTime - oneHourInMs)) {
                return res.status(400).json({ error: 'عذراً، تم إغلاق التوقعات لهذه المباراة (متبقي أقل من ساعة على البداية)' });
            }

            await kv.set(`pred:${authUsername}:${matchId}`, { matchId, predictedWinner, updatedAt: currentTime });
            return res.status(200).json({ success: true, message: 'تم حفظ توقعك بنجاح وعصرياً!' });
        }

        // كود حماية عام
        return res.status(200).json(OFFICIAL_SCHEDULE);

    } catch (error) {
        return res.status(500).json({ error: 'خطأ داخلي في نظام قاعدة البيانات السحابية' });
    }
};
