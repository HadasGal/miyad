// צילומי מסך לתיק העבודות. צריך את שרת הפיתוח רץ (npm run dev), ואז: npm run shots
// השפה נקבעת בשורה אחת כאן למטה. הסקריפט כותב אותה ל-localStorage (miyad_lang) לפני כל צילום.
// עברית נשמרת ל-shots/miyad/, ואנגלית ל-shots/miyad/en/.

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const LANG = process.env.LANG_SHOTS || 'he'; // ← 'he' או 'en'

const APP = 'http://localhost:5173/';
const OUT = join(homedir(), 'Desktop/portfolio/public/shots/miyad', LANG === 'he' ? '' : LANG);
const PHOTOS = new URL('./shot-photos/', import.meta.url).pathname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(OUT, { recursive: true });

// מה שמשתנה בין השפות בתוך הסקריפט עצמו: חיפוש שמוסיפים בהתראות, וההצעות שה-AI המדומה ממלא בסדר קבוע
const TEXT = {
  he: { search: 'ספרים', where: 'ליד השער, על הספסל', ai: ['כיסא בר מעץ', 'אופני ילדים 16 אינץ׳', 'סיר לחץ נירוסטה'] },
  en: { search: 'books', where: 'By the gate, on the bench', ai: ['Wooden bar stool', 'Kids’ bike, 16 inch', 'Pressure cooker'] },
}[LANG];

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

// כל צילום מתחיל מדמו נקי, במצב בהיר, בשפה ובפרופיל הנתונים
async function fresh(viewport, user, hash = '#/') {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.evaluate((lang) => { localStorage.clear(); localStorage.setItem('miyad_lang', lang); }, LANG);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('.welcome-cta .btn-primary');
  await sleep(300);
  await page.select('.demo-switch select', user);
  await sleep(200);
  await page.evaluate((h) => { location.hash = h; }, hash);
  await sleep(400);
  return page;
}

// תמונות lazy נטענות רק כשהן במסך, אז מכריחים טעינה ומחכים
async function images(page) {
  await page.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), { timeout: 20000 });
  await sleep(300);
}

// צילום "גבוה": החלון בגובה התוכן, כך שאלמנטים קבועים ודביקים יושבים במקומם (fullPage שובר אותם)
async function tall(page) {
  await images(page);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewport({ ...page.viewport(), height: h });
  await sleep(500);
}

async function shot(page, name) {
  await images(page);
  await page.screenshot({ path: join(OUT, name), type: 'png' });
  console.log('saved', join(OUT, name));
  await page.close();
}

async function scrollToTitle(page, offset) {
  await page.evaluate((o) => {
    const t = document.querySelector('.item-title');
    window.scrollTo(0, t.getBoundingClientRect().top + scrollY - o);
  }, offset);
  await sleep(300);
}

// 1. לוח בטלפון, כל הלוח: זמין, שמור, ונמסר מאופר בסוף
{ const p = await fresh(PHONE, 'dana'); await tall(p); await shot(p, '01-board-phone.png'); }

// 2. לוח בדסקטופ
{ const p = await fresh(DESKTOP, 'dana'); await shot(p, '02-board-desktop.png'); }

// 3. הספה, מהצד של מי שמחכה: נועה במקום 2 בתור
{ const p = await fresh(PHONE, 'noa', '#/item/sofa'); await shot(p, '03-item-seeker.png'); }

// 4. אותה ספה, מהצד של המוסרת: התור לפי הסדר והכפתור הראשי
{ const p = await fresh(PHONE, 'dana', '#/item/sofa'); await scrollToTitle(p, 60); await shot(p, '04-item-giver.png'); }

// 5. ספלים "מחכה בחוץ", מהצד של מי שמגיעה לקחת
{ const p = await fresh(PHONE, 'yael', '#/item/cups'); await shot(p, '05-waiting-outside.png'); }

// 6. התראות: למיכל יש חיפוש שמור על ספה, ומוסיפים עוד אחד
{
  const p = await fresh(PHONE, 'michal', '#/alerts');
  await p.type('form.search input', TEXT.search);
  await p.click('form.search button');
  await sleep(300);
  await shot(p, '06-alerts.png');
}

// 7. העלאה מרובה: שלוש תמונות, וה-AI המדומה ממלא כל אחת.
// ההצעות המדומות באות בסדר קבוע, והתמונות נבחרו כך שיתאימו להן. אם הסדר התערבב, מנסים שוב.
{
  let ok = false;
  for (let attempt = 1; attempt <= 5 && !ok; attempt++) {
    const p = await fresh(PHONE, 'dana', '#/publish');
    const inputs = await p.$$('input[type=file]');
    await inputs[1].uploadFile(join(PHOTOS, '1-stool.jpg'), join(PHOTOS, '2-bike.jpg'), join(PHOTOS, '3-pot.jpg'));
    await p.waitForSelector('.draft', { timeout: 10000 });
    await sleep(400);
    const titles = await p.$$eval('.draft .field:first-child input', (els) => els.map((e) => e.value));
    ok = JSON.stringify(titles) === JSON.stringify(TEXT.ai);
    if (!ok) { console.log('attempt', attempt, 'order mixed, retrying', titles); await p.close(); continue; }
    await p.type('fieldset.field ~ label input', TEXT.where);
    await p.evaluate(() => document.activeElement.blur()); // בלי סמן מהבהב בצילום
    await sleep(200);
    await tall(p);
    await shot(p, '07-ai-batch.png');
  }
  if (!ok) console.log('07 failed: AI titles did not match the photos');
}

await browser.close();
