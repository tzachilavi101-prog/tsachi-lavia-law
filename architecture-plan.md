# Drip-Feed Rollout Plan — tsachi-lavia-law
*Architecture & deployment strategy for graduated topical authority building*

---

## Phase 0 — החלטת אחסון: למה uPress לא מתאים לארכיטקטורה שלנו

### 0.1 הסבר טכני — למה uPress הוא הכלי הלא נכון

uPress היא פלטפורמת **אחסון WordPress מנוהל**. כל תשתית הסביבה שלה בנויה סביב WordPress: מסד נתונים MySQL, רנטיים PHP, עדכונים אוטומטיים של ה-core, ולוח בקרה קנייני המותאם להרצת `.php`. זה יוצר ארבעה אי-התאמות קונקרטיות עם הארכיטקטורה שתכננו:

| הדרישה שלנו | המציאות ב-uPress | הבעיה |
|---|---|---|
| לשרת רק את `public/` כ-web root | ה-root קבוע (`public_html` של WordPress); אין מושג של "output directory" | `drafts/` יהיה נגיש דרך HTTP אלא אם תחסום ידנית עם `.htaccess` — שביר ופשוט לטעות |
| GitHub Actions → deploy trigger | אין Git deployment נייטיב; העלאות הן דרך FTP או לוח הבקרה הקנייני | כל pipeline ה-CI/CD (`deploy.yml`) לא יכול לטרגט uPress בלי עקיפות FTP מסורבלות |
| סקריפטי Node.js רצים בזמן deploy | uPress מריץ PHP, לא Node.js; גישת shell מוגבלת בתכניות managed | הסקריפטים לא יכולים לרוץ server-side; פיתרון ב-GitHub Actions אפשרי אבל uPress עדיין לא יכול לקבל את הפלט בצורה נקייה |
| ללא overhead של WordPress | WordPress core, MySQL, PHP תמיד רצים ואוכלים משאבים | אתר HTML סטטי משלם מחיר ביצועים ועלות עבור תשתית שלא ישתמש בה לעולם |

**תחתית השורה:** uPress יכול טכנית לאחסן קובץ HTML סטטי אם תעלה אותו דרך FTP — אבל הוא **אינו יכול לתמוך** בפיצול `public/drafts`, ב-Git-based deploys, או ב-IndexNow pinging שהם עמוד השדרה של האסטרטגיה שלנו. אחסון כאן פירושו העלאת קבצים ידנית ב-FTP כל שבוע ועריכה ידנית של ה-sitemap — מה שמבטל לחלוטין את אוטומציית ה-drip-feed שבנינו.

---

### 0.2 פעולות ידניות להתנתקות מ-uPress

בצע בסדר הזה כדי לא לאבד מידע ולא לגרום downtime:

**שלב א — גיבוי כל מה שכבר על השרת שלהם**
- התחבר ללוח הבקרה של uPress
- אם הועלו קבצים כלשהם (אפילו `index.html` לבדיקה) — הורד אותם דרך File Manager שלהם או FTP לפני הביטול
- אם נוצרה התקנת WordPress אוטומטית — ייצא את התוכן (WordPress admin → Tools → Export), גם אם ריק

**שלב ב — בדוק את ה-DNS של הדומיין שלך**
- התחבר לחברת הדומיין שלך (רשם הדומיין — GoDaddy, Namecheap, 101domain, או רשם ישראלי כגון 012 / Domains.co.il)
- עבור להגדרות DNS וחפש:
  - רשומות `A` שמצביעות על IP של uPress
  - רשומות `CNAME` שמצביעות על `*.upress.co.il` או דומה
- **אל תמחק אותן עדיין** — המתן עד שהאחסון החדש חי ומוגדר, ואז תחליף. מחיקה קודמת גורמת downtime. שינויי DNS לוקחים עד 48 שעות להתפשט.

**שלב ג — ביטול המנוי ב-uPress**
- בלוח הבקרה, חפש **My Subscriptions** או **Billing**
- אם אין אפשרות ביטול ברורה — פנה לתמיכה שלהם בכתב (צ'אט או אימייל) ובקש ביטול. שמור אישור בכתב
- שאל מפורשות: "האם הביטול עוצר חיוב מיידית או בסוף תקופת החיוב?"
- אם חידשו אוטומטית לאחרונה — בדוק אם יש חלון החזר כספי (בד"כ 14–30 יום)

**שלב ד — עדכון ה-DNS לאחר שהאחסון החדש חי**
- לאחר שה-deploy ב-Vercel עובד ונבדק — חזור ל-DNS והחלף את הרשומות לאלו של Vercel (הן יינתנו בלוח הבקרה של Vercel אוטומטית)
- מחק רשומות ישנות של uPress

---

### 0.3 אלטרנטיבות אחסון מומלצות

כל שלוש האפשרויות תומכות בדפוס ה-`public/` output directory, ב-Git-based deploys, ובמנגנון GitHub Actions שתכננו.

---

**אפשרות א: Vercel** *(כבר בתוכנית — הכי מתאים)*

- **למה מתאים:** תמיכה native ב-`outputDirectory` — מגדיר `"outputDirectory": "public"` ב-`vercel.json` ו-Vercel משרת רק את התיקייה הזו. `drafts/` לא נפרס בכלל ולא נגיש דרך HTTP.
- **חיבור Git:** מחבר את ה-GitHub repo ישירות דרך ה-dashboard — ללא CLI. כל push ל-`main` מפעיל deploy אוטומטי תוך 10 שניות.
- **עברית/RTL:** אפס בעיות — Vercel הוא CDN שמגיש קבצים byte-for-byte. תוכן UTF-8 עברי מוצג בצורה מושלמת.
- **IndexNow:** אין הגבלות על outbound HTTP מ-GitHub Actions, כך שצעד ה-auto-ping עובד בצורה נקייה.
- **עלות:** חינם לשימוש הזה. תכניות בתשלום נדרשות רק אם עוברים 100 GB bandwidth לחודש או רוצים preview URLs מוגנים בסיסמה.
- **הגדרת דומיין:** מוסיף את `lavia-adv.co.il` בלוח הבקרה של Vercel ← מקבל שני רשומות DNS (A + CNAME) להוספה אצל רשם הדומיין. SSL מוקצה אוטומטית.

---

**אפשרות ב: Cloudflare Pages** *(אלטרנטיבה חזקה — CDN מהיר ביותר)*

- **למה מתאים:** Cloudflare Pages בנוי ייעודית לאתרים סטטיים. תמיכה native ב-output directory config. CDN מהיר ביותר בעולם — עמודים נטענים מ-node קרוב למשתמש הישראלי.
- **חיבור Git:** מחבר GitHub repo בלוח הבקרה של Cloudflare. מגדיר build output directory ל-`public`. כל push נפרס תוך ~5 שניות.
- **יתרון בונוס:** העברת ניהול ה-DNS ל-Cloudflare (חינם) נותנת הגנת DDoS ו-caching rules — רלוונטי לאתר YMYL תחרותי.
- **IndexNow:** ל-Cloudflare יש IndexNow integration מובנה — יכול לשלוח URLs ל-Bing/Google אוטומטית ללא צעד ב-GitHub Actions.
- **עלות:** Free tier — bandwidth ללא הגבלה לאתרים סטטיים.
- **הגדרת דומיין:** מעביר ניהול DNS ל-Cloudflare (תהליך מודרך, לוקח ~24 שעות) ← מחבר Cloudflare Pages project.

---

**אפשרות ג: GitHub Pages** *(מוכר, אך דורש עקיפה)*

- **למה מתאים (חלקית):** כבר יש GitHub repo קיים ב-`tzachilavi101-prog/tsachi-lavia-law`. GitHub Pages חינמי וההיכרות קיימת.
- **העקיפה הנדרשת:** GitHub Pages משרת את ה-root של branch שלם, לא תת-תיקייה. כדי לשרת רק את `public/`, נדרש branch נפרד `gh-pages` שבו יש רק את תוכן `public/`. GitHub Actions מטפל בזה: build על `main`, דחיפת תוכן `public/` ל-`gh-pages`, Pages משרת מ-`gh-pages`.
- **מגבלה:** אין native password-protected previews. אין per-PR preview deployments. workflow של GitHub Actions מעט יותר מורכב.
- **עלות:** חינם.
- **הכי מתאים ל:** מי שרוצה אפס חשבונות חדשים ומוכן לנהל workflow CI/CD מעט מורכב יותר.

---

**סיכום המלצות:**

| פלטפורמה | קלות הגדרה | תמיכה ב-`public/` | עלות | הכי מתאים ל |
|---|---|---|---|---|
| **Vercel** | ★★★★★ | Native (`vercel.json`) | חינם | הפרויקט הזה — כבר בתוכנית |
| **Cloudflare Pages** | ★★★★☆ | Native | חינם | CDN מקסימלי + איחוד DNS |
| **GitHub Pages** | ★★★☆☆ | דרך branch עקיף | חינם | אפס חשבונות חדשים |

**המלצה: Vercel כמתוכנן.** דורש הכי פחות הגדרות, תומך בארכיטקטורת `public/drafts` נייטיבית, ומשתלב עם GitHub Actions עם משתנה סביבה אחד (`VERCEL_TOKEN`).

---

## הקשר כללי

הפרויקט הוא אתר משפטי עברי סטטי (עו"ד צחי לביא, רשלנות רפואית, אשקלון) הנמצא כרגע בתיקייה מקומית עם **22 קבצי HTML** שטוחים ב-root של הפרויקט. כל הקבצים היו עולים לאוויר בו-זמנית אם היו נדחפים כמות שהם — מה שמסכל את מטרת האסטרטגיה המבוקרת לבניית E-E-A-T. מסמך זה מתאר ארגון מחדש של ה-workspace, pipeline פריסה, גישת sitemap דינמי, ושחרור תוכן שלבי — הכל לפני שנגעים בקובץ אחד.

---

## 1. מלאי מלא של נכסי התוכן הקיימים

### קבצי תשתית מרכזיים

| קובץ | סטטוס | הערות |
|---|---|---|
| `index.html` | שלב 1 — לאוויר מיידית | LegalService + LocalBusiness schema ✓ |
| `accessibility.html` | שלב 1 — לאוויר מיידית | אין schema — צריך להוסיף WebPage JSON-LD |
| `style.css` | שלב 1 | Global design tokens |
| `sitemap.xml` | לבנות מחדש דינמית | כרגע מפרט את כל הדפים — חייב להפוך לגנרטד |
| `robots.txt` | שלב 1 — לעדכן URL | מצביע על GitHub Pages URL; לעדכן ל-lavia-adv.co.il |
| `CNAME` | שלב 1 | `lavia-adv.co.il` ✓ |

### נכסי תוכן — סיווג לפי סוג

**PILLARS** (מאמרי cornerstone רחבים, כוונת חיפוש הכי רחבה)

| קובץ | סוג Schema | איכות Schema | אשכול |
|---|---|---|---|
| `article-surgical-malpractice.html` | LegalArticle | ✓ | Surgical |
| `article-birth-malpractice.html` | LegalArticle + VideoObject + BreadcrumbList | ✓ חזק | Birth |

**HUBS** (מרכז אשכול, עומק בינוני + קישורים פנימיים חזקים)

| קובץ | סוג Schema | איכות Schema | הערות |
|---|---|---|---|
| `article-cerebral-palsy-malpractice.html` | LegalArticle + FAQPage (5 Q&As) + MedicalCondition | ✓ הכי טוב | Birth cluster Hub |
| `article-pregnancy-malpractice.html` | LegalArticle + FAQPage + MedicalCondition | ✓ חזק | Birth cluster Hub |
| `article-stroke-diagnosis.html` | LegalArticle + MedicalCondition | טוב | Standalone Hub |
| `article-cancer-diagnosis.html` | **Article** (לא LegalArticle), ללא FAQPage | ⚠ דרוש תיקון | Standalone Hub |
| `article-informed-consent-surgery.html` | LegalArticle | לבדיקה | Consent cluster Hub |

**SPOKES** (long-tail ספציפי, מזין סמכות ל-Pillar/Hub)

| קובץ | אשכול | Schema | הערות |
|---|---|---|---|
| `article-missed-surgical-diagnosis.html` | Surgical | LegalArticle + FAQPage + Collection (isPartOf) | ✓ חזק |
| `article-missed-radiology-findings.html` | Surgical | LegalArticle + BreadcrumbList + isPartOf | ✓ חזק |
| `article-delayed-emergency-surgery.html` | Surgical | LegalArticle + BreadcrumbList | ✓ טוב |
| `article-diagnosis-reassessment-failure.html` | Surgical | LegalArticle + BreadcrumbList | ✓ טוב |
| `article-family-doctor-referral-negligence.html` | Surgical | **Article** (לא LegalArticle) | ⚠ דרוש תיקון |
| `article-informed-consent-autonomy-damages.html` | Consent | לבדיקה | Spoke |
| `article-informed-consent-case-law.html` | Consent | לבדיקה | Spoke |
| `article-informed-consent-special-cases.html` | Consent | לבדיקה | Spoke |
| `article-malpractice-limitations.html` | Standalone | לבדיקה | Procedural Spoke |

**עדיפות נמוכה / שחרור עתידי**

| קובץ | הערות |
|---|---|
| `article-genetic-malpractice.html` | נישה — להחזיק לשלב מאוחר יותר |
| `article-estate-malpractice.html` | נישה — להחזיק לשלב מאוחר יותר |
| `article-car-accident-malpractice.html` | נישה סמוכה — לתכנן בנפרד |
| `article-medical-malpractice-signs.html` | אינפורמטיבי — לשחרר עם אשכול Consent |

### תוכן טיוטה ב-`my_content_hub/articles/`

| קובץ | סטטוס |
|---|---|
| `final_cp_article.html` | טיוטה מוכנה — כבר פורסמה בתור `article-cerebral-palsy-malpractice.html` |
| `cerebral_palsy_full_draft.md` | בסיס מחקר |
| `pregnancy_malpractice_full_draft.md` | בסיס מחקר |
| `stroke_malpractice_full_draft.md` | בסיס מחקר |

---

## 2. ארכיטקטורת ה-Workspace החדשה

### מבנה תיקיות מוצע

```
tsachi-lavia-law/
│
├── public/                          ← נפרס — Vercel משרת רק מכאן
│   ├── index.html                   ← שלב 1
│   ├── accessibility.html           ← שלב 1
│   ├── style.css
│   ├── robots.txt
│   ├── CNAME
│   ├── sitemap.xml                  ← גנרטד — לעולם לא לערוך ידנית
│   ├── images/
│   ├── videos/
│   └── [מאמרים מתווספים לפי שלב]
│
├── drafts/                          ← לא נפרס — תור המתנה לשחרור
│   ├── article-cerebral-palsy-malpractice.html
│   ├── article-cancer-diagnosis.html
│   ├── article-pregnancy-malpractice.html
│   ├── article-stroke-diagnosis.html
│   └── ... (כל המאמרים שטרם עלו לאוויר)
│
├── my_content_hub/                  ← מחקר וטיוטות — לעולם לא נפרס
│   ├── articles/
│   ├── legal_database/
│   └── research_summary.md
│
├── scripts/
│   ├── lint-articles.js             ← קיים — מאמת איכות HTML
│   ├── promote.js                   ← חדש — מתזמר העברת draft → public
│   └── generate-sitemap.js          ← חדש — בונה sitemap מ-public/ בלבד
│
├── .github/
│   └── workflows/
│       └── deploy.yml               ← חדש — GitHub Actions CI/CD
│
├── package.json                     ← לעדכן את קטע scripts
├── CLAUDE.md                        ← לעדכן את מבנה הקבצים
└── robots.txt                       ← לעדכן sitemap URL
```

**עיקרון מרכזי:** תיקיית `public/` היא האתר. Vercel מוגדר לשרת רק ממנה. תיקיית `drafts/` לא מקבלת route HTTP כלשהו — היא פשוט לא קיימת על ה-CDN.

---

## 3. Pipeline הפריסה

### פלטפורמת אחסון: Vercel

הגדרת Vercel:
- `vercel.json` עם `"outputDirectory": "public"`
- חיבור GitHub repo ישיר דרך ה-dashboard
- SSL אוטומטי לדומיין `lavia-adv.co.il`

### תהליך GitHub Actions (`deploy.yml`)

```
Trigger: push ל-main branch
         (או ידנית דרך workflow_dispatch)

שלב 1: Checkout repository
שלב 2: הרצת generate-sitemap.js
        → סורק public/*.html
        → כותב public/sitemap.xml
שלב 3: הרצת lint-articles.js (מוגבל ל-public/ בלבד)
        → אם מאמר נכשל: עצירת הפריסה
שלב 4: פריסת public/ ל-Vercel דרך CLI
        → משתמש ב-VERCEL_TOKEN secret שמאוחסן ב-GitHub
שלב 5: Ping ל-IndexNow API
        → שליחת ה-URL החדש ל-Google/Bing
        → דורש INDEXNOW_KEY כ-GitHub secret
```

### למה התהליך הזה נכון עבור E-E-A-T
- Linter רץ **לפני** הפריסה — מונע מאמרים פגומים להגיע לגוגל
- Sitemap נבנה מחדש תמיד — גוגל אף פעם לא רואה דפים מ-`drafts/`
- תיקיית `drafts/` לא מופיעה בשום HTTP response — גוגל לא יכול לסרוק תוכן חצי-גמור

---

## 4. Sitemap דינמי — איך `generate-sitemap.js` יעבוד

הסקריפט יופעל אוטומטית על ידי GitHub Actions לפני כל פריסה. הלוגיקה:

1. **סריקת `public/`** — מוצא את כל קבצי `*.html`
2. **לכל קובץ:**
   - מחלץ תוכן `<title>` — מוודא שזה דף אמיתי (לא ריק/תבנית)
   - מחלץ `<meta name="article:modified_time">` או `<meta property="article:modified_time">` — משתמש כ-`<lastmod>`
   - fallback: תאריך שינוי הקובץ אם אין meta tag
   - מקצה `<priority>`:
     - `index.html` → `1.0`
     - מאמרי Pillar → `0.9`
     - מאמרי Hub → `0.8`
     - מאמרי Spoke → `0.7`
     - `accessibility.html` → `0.3`
   - מקצה `<changefreq>`:
     - `index.html` → `monthly`
     - כל המאמרים → `yearly` (תוכן משפטי יציב)
3. **כתיבת `public/sitemap.xml`** עם prefix הדומיין הקנוני (`https://lavia-adv.co.il/`)
4. **לעולם לא כולל** קבצים מ-`drafts/`, `my_content_hub/`, או `scripts/`

תוצאה: ה-sitemap הוא תמיד השתקפות מדויקת של מה שחי בפועל — לא רשימה ידנית שיכולה להתיישן.

---

## 5. סקריפט `promote.js` — איך יעבוד

זהו כלי האוטומציה המרכזי. יופעל כך:

```bash
node scripts/promote.js article-stroke-diagnosis.html
```

**ביצוע שלב אחר שלב:**

1. **אימות קיום המקור** — מוודא שקיים `drafts/article-stroke-diagnosis.html`; עוצר אם לא
2. **הרצת בדיקת lint** על הקובץ הספציפי — עוצר אם נכשל (disclaimer, H1, meta description מ-`lint-articles.js`)
3. **אימות/הזרקת schema:**
   - בודק שהקובץ משתמש ב-`LegalArticle` schema (לא `Article` רגיל) — מדגיל אם שגוי
   - מזריק/מעדכן `datePublished` עם תאריך היום (ISO 8601)
   - מזריק/מעדכן `dateModified` עם תאריך היום
4. **העברת הקובץ** מ-`drafts/` → `public/`
5. **בניית sitemap מחדש** — קריאה ל-`generate-sitemap.js`
6. **ביקורת קישורים פנימיים (אדוויזורי בלבד):**
   - סורק את כל `public/*.html` לאיתור `href` שמצביעים על `drafts/` או קישורים שבורים
   - מדפיס דוח אזהרות (לא עורך אוטומטית — זהו שלב סקירה אנושית)
   - סורק מאמרים שמזכירים את הנושא לפי מילות מפתח ומציע היכן להוסיף כרטיס "Related Articles"
7. **הדפסת סיכום הקידום** — איזה קובץ עבר, רשומת sitemap חדשה, כל אזהרות קישורים

---

## 6. תוכנית השחרור השלבי

### שלב 1 — מיידי (יום 0): תשתית

**מטרה:** ביסוס הדומיין, מעבר סריקה בסיסית, ללא אותות תוכן עדיין.

קבצים לעבור ל-`public/`:
- `index.html` (LegalService + LocalBusiness schema — אות אמון חזק ביותר)
- `accessibility.html` (עמידה בדרישות חוקיות + hygiene סריקה)
- `style.css`, `images/`, `videos/`, `robots.txt`, `CNAME`

**תיקונים נדרשים לפני שלב 1:**
- לעדכן `robots.txt` — לשנות sitemap URL מ-`github.io` ל-`https://lavia-adv.co.il/sitemap.xml`
- להוסיף `WebPage` JSON-LD בסיסי ל-`accessibility.html` (כרגע ללא schema בכלל)

**אימות:** האתר נטען ב-`lavia-adv.co.il`, Google Search Console מדווח ש-`robots.txt` תקין, sitemap מכיל רק `index.html` ו-`accessibility.html`.

---

### שלב 2 — ימים 1-3: אשכול ניתוחים (Pillar + 2 Spokes)

**מטרה:** ביסוס אות עומק נושאי באשכול בעדיפות הגבוהה ביותר.

קבצים לקידום:
1. `article-surgical-malpractice.html` ← **PILLAR** (כוונה רחבה, סמכות גבוהה ביותר)
2. `article-missed-surgical-diagnosis.html` ← **SPOKE** (יש לו `isPartOf Collection` schema — מקשר חזרה ל-Pillar)
3. `article-missed-radiology-findings.html` ← **SPOKE** (גם יש לו `isPartOf Collection` — מחזק את האשכול)

**למה האשכול הזה ראשון:**
- ל-3 המאמרים האלו כבר יש `isPartOf Collection` schema שמחבר אותם — הם מהווים אשכול E-E-A-T מהקופסה
- ה-Pillar הכירורגי הוא נקודת הכניסה הרחבה ביותר; שחרור ה-Spokes שלו באותו חלון מסגיר לגוגל שלאתר יש עומק אמיתי בנושא
- לשני ה-Spokes יש FAQPage ו-BreadcrumbList schema — זכאות מיידית ל-rich snippets

**הזרקת schema נדרשת בזמן הקידום:**
- לאשר ש-URL של `isPartOf Collection` ב-Spokes מצביע על URL ה-Pillar החי (לא GitHub Pages)
- לקבוע `datePublished` על כל 3 הקבצים לתאריך הקידום
- לאמת ש-URL של `author sameAs` מתפקד

**קישורים פנימיים להוסיף/לאמת:**
- Pillar → מקשר לשני ה-Spokes בכרטיסי "Related Articles"
- כל Spoke → מקשר חזרה ל-Pillar + לכל Spoke אחר
- `index.html` חלק "מאמרים" → להוסיף כרטיס עבור Pillar כירורגי

---

### שלב 3 — Drip שבועי: תוכן נותר (שבועות 1–8)

**עיקרון מנחה:** אשכול אחד או זוג קשור אחד בשבוע. לעולם לא לשחרר Spoke מבודד ללא Hub שלו כבר חי.

| שבוע | מאמרים | סוג | נימוק |
|---|---|---|---|
| שבוע 1 | `article-birth-malpractice.html` | Pillar | פתיחת אשכול Birth; schema וידאו חזק |
| שבוע 1 | `article-cerebral-palsy-malpractice.html` | Hub | Schema מהטובים ביותר (FAQPage + MedicalCondition); קישור טבעי ל-Birth Pillar |
| שבוע 2 | `article-delayed-emergency-surgery.html` | Spoke | משלים אשכול Surgical (Pillar + 2 Spokes כבר חיים) |
| שבוע 2 | `article-diagnosis-reassessment-failure.html` | Spoke | מתאים עם delayed surgery — אותה תמה קבלת החלטות |
| שבוע 3 | `article-stroke-diagnosis.html` | Hub | מקביל מבנית למאמר הסרטן (עיכוב → נזק → אחריות) |
| שבוע 4 | `article-cancer-diagnosis.html` | Hub | **דורש תיקון לפני קידום:** שינוי `Article` → `LegalArticle` |
| שבוע 5 | `article-pregnancy-malpractice.html` | Hub | זוג טבעי עם Birth Pillar + CP Hub שכבר אינדקסו |
| שבוע 6 | `article-informed-consent-surgery.html` | Hub | פתיחת אשכול Consent |
| שבוע 6 | `article-informed-consent-autonomy-damages.html` | Spoke | מחזק מיידית את ה-Hub |
| שבוע 7 | `article-informed-consent-case-law.html` | Spoke | מעמיק סמכות אשכול Consent |
| שבוע 7 | `article-informed-consent-special-cases.html` | Spoke | משלים אשכול Consent (4 דפים) |
| שבוע 8 | `article-malpractice-limitations.html` | Procedural | Evergreen; מקשר לכל האשכולות כנקודת כניסה "איך להגיש" |
| שבוע 8 | `article-family-doctor-referral-negligence.html` | Spoke | **דורש תיקון לפני קידום:** `Article` → `LegalArticle` |
| עתידי | `article-medical-malpractice-signs.html` | אינפורמטיבי | לשחרר לאחר שאשכולות אחרים אינדקסו |
| עתידי | `article-genetic-malpractice.html` | נישה | להחזיק — נפח חיפוש נמוך, דורש בדיקת דיוק YMYL |
| עתידי | `article-estate-malpractice.html` | נישה | להחזיק — קהל מצומצם |
| עתידי | `article-car-accident-malpractice.html` | נישה סמוכה | להחזיק — אשכול נושא נפרד, לתכנן בנפרד |

**תהליך עדכון קישורים פנימיים (לכל שחרור שבועי):**
בכל פעם שרץ `promote.js`, הסקריפט:
1. יחפש בכל `public/*.html` הפניות למילות המפתח של המאמר המקודם (לפי מפת מילות מפתח מוגדרת ב-`promote.js`)
2. ידפיס רשימה של מאמרים שצריכים לקבל כרטיס "Related Article" שמצביע על הדף החדש
3. המפתח סוקר ידנית ומוסיף את הכרטיסים (שלב ידני — הסקריפט רק מייעץ)

---

## 7. תיקונים נדרשים לפני הפריסה

אלו בעיות ידועות שהתגלו במהלך הביקורת ויש לתקן לפני קידום הקבצים המושפעים:

| קובץ | בעיה | תיקון נדרש |
|---|---|---|
| `robots.txt` | sitemap URL מצביע על `github.io` | לעדכן ל-`https://lavia-adv.co.il/sitemap.xml` |
| `accessibility.html` | ללא JSON-LD schema בכלל | להוסיף `WebPage` schema עם `Organization` |
| `article-cancer-diagnosis.html` | משתמש ב-`Article` לא ב-`LegalArticle` | לעדכן את `@type` ב-schema |
| `article-family-doctor-referral-negligence.html` | משתמש ב-`Article` לא ב-`LegalArticle` | לעדכן את `@type` ב-schema |
| כל URL של `isPartOf Collection` ב-Spokes | עשוי להצביע על domain ישן של GitHub Pages | לעדכן ל-`lavia-adv.co.il` |
| `sitemap.xml` | מתוחזק ידנית כרגע, מפרט את כל הדפים | להחליף בגרסה גנרטדית לאחר שלב 1 |

---

## 8. החלטות מאושרות

| החלטה | בחירה | השפעה |
|---|---|---|
| **אחסון** | **Vercel** | לכתוב `vercel.json` עם `"outputDirectory": "public"` |
| **טווח `promote.js`** | **אדוויזורי בלבד** | הסקריפט מדפיס הצעות קישורים; המפתח מבצע עריכות HTML ידנית |
| **נגישות לטיוטות** | **פרטי לחלוטין (404)** | תיקיית `drafts/` לא נכללת בפריסת Vercel בכלל |
| **IndexNow** | **auto-ping בפריסה** | GitHub Actions עושה ping ל-IndexNow לאחר כל פריסה; דורש `INDEXNOW_KEY` כ-GitHub secret |

---

## 9. רשימת בדיקות לאימות (אחרי כל שלב)

לאחר כל שלב, לאמת:
- [ ] `npm run lint:articles` עובר על כל הקבצים ב-`public/`
- [ ] `sitemap.xml` מכיל בדיוק את המאמרים שקודמו (הספירה תואמת)
- [ ] `robots.txt` מצביע על URL ה-sitemap הנכון
- [ ] Google Search Console → URL Inspection מאשר שהדף החדש ניתן לאינדוקס
- [ ] כל הקישורים הפנימיים בין מאמרי `public/` מתפקדים (ללא 404)
- [ ] JSON-LD מאומת ב-schema.org/validator לכל מאמר שקודם
- [ ] `datePublished` ב-schema תואם את תאריך הקידום בפועל

---

*מסמך תכנון בלבד. אין קבצים שנוצרו, שונו, או הועברו.*
