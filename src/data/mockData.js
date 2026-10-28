// נתוני דמו: קהילה פיקטיבית. כשעוברים ל-Firebase, הקובץ הזה נעלם
// והנתונים מגיעים מ-Firestore. שום מסך לא צריך להשתנות.
// טקסטים בשתי שפות: { he, en }. המסכים בוחרים לפי השפה עם L() מ-i18n.jsx.

export const COMMUNITY = { id: 'givat-hazeitim', name: { he: 'גבעת הזיתים', en: 'Olive Hill' } };

export const USERS = [
  { id: 'dana', name: { he: 'דנה לוי', en: 'Dana Levi' }, short: { he: 'דנה', en: 'Dana' }, street: { he: 'רחוב הזית', en: 'Olive St.' }, phone: '0501111111' },
  { id: 'michal', name: { he: 'מיכל כהן', en: 'Michal Cohen' }, short: { he: 'מיכל', en: 'Michal' }, street: { he: 'רחוב הגפן', en: 'Vine St.' }, phone: '0502222222' },
  { id: 'noa', name: { he: 'נועה ברק', en: 'Noa Barak' }, short: { he: 'נועה', en: 'Noa' }, street: { he: 'רחוב התאנה', en: 'Fig St.' }, phone: '0503333333' },
  { id: 'yael', name: { he: 'יעל אור', en: 'Yael Or' }, short: { he: 'יעל', en: 'Yael' }, street: { he: 'רחוב הרימון', en: 'Pomegranate St.' }, phone: '0504444444' },
  { id: 'shula', name: { he: 'שולה מזרחי', en: 'Shula Mizrahi' }, short: { he: 'שולה', en: 'Shula' }, street: { he: 'רחוב השקד', en: 'Almond St.' }, phone: '0505555555' },
];

export const CATEGORIES = [
  { id: 'furniture', label: { he: 'רהיטים', en: 'Furniture' }, tint: '#DCE6D5' },
  { id: 'kids', label: { he: 'ילדים', en: 'Kids' }, tint: '#E6E0D2' },
  { id: 'books', label: { he: 'ספרים', en: 'Books' }, tint: '#D8E2E6' },
  { id: 'kitchen', label: { he: 'מטבח', en: 'Kitchen' }, tint: '#E1E6DD' },
  { id: 'garden', label: { he: 'גינה', en: 'Garden' }, tint: '#D5E6DA' },
  { id: 'other', label: { he: 'אחר', en: 'Other' }, tint: '#E2E2DE' },
];

const min = 60 * 1000;
const hour = 60 * min;

// תמונות דמו מ-Unsplash (רישיון חופשי). קישור ישיר ל-CDN שלהם, כמו שהם ממליצים,
// בגודל 800 פיקסלים. אם אין רשת, Photo חוזר לרקע של הקטגוריה.
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

export function buildInitialItems(now = Date.now()) {
  return [
    {
      id: 'sofa',
      title: { he: 'ספה תלת מושבית אפורה', en: 'Gray three-seat sofa' }, category: 'furniture',
      condition: { he: 'טוב מאוד', en: 'Very good' },
      description: { he: 'עברנו דירה והיא לא נכנסת לסלון החדש. צריך שניים להרים.', en: 'We moved and it doesn’t fit the new living room. Takes two to carry.' },
      ownerId: 'dana', createdAt: now - 1 * hour, pickup: 'coordinate', location: '',
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: unsplash('1491926626787-62db157af940'),
      queue: [
        { userId: 'michal', at: now - 40 * min },
        { userId: 'noa', at: now - 25 * min },
      ],
    },
    {
      id: 'cups',
      title: { he: 'שישה ספלי קרמיקה לבנים', en: 'Six white ceramic mugs' }, category: 'kitchen',
      condition: { he: 'כמו חדש', en: 'Like new' },
      description: { he: 'לא צריך לתאם, פשוט לקחת.', en: 'No need to arrange, just take them.' },
      ownerId: 'shula', createdAt: now - 3 * hour, pickup: 'outside',
      location: { he: 'על החומה ליד השער', en: 'On the wall by the gate' },
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: unsplash('1523367118146-091f762cd8ea'), queue: [],
    },
    {
      id: 'stroller',
      title: { he: 'עגלת תינוק מתקפלת', en: 'Folding baby stroller' }, category: 'kids',
      condition: { he: 'טוב', en: 'Good' },
      description: { he: 'משומשת, עובדת מצוין. הגגון קצת דהוי.', en: 'Used, works great. The canopy is a little faded.' },
      ownerId: 'yael', createdAt: now - 26 * hour, pickup: 'coordinate', location: '',
      status: 'reserved', chosenId: 'michal', skipped: [], takenBy: null, reportedBy: null, photo: unsplash('1559135141-2bea6465fccf'),
      queue: [{ userId: 'michal', at: now - 25 * hour }, { userId: 'dana', at: now - 20 * hour }],
    },
    {
      id: 'books',
      title: { he: 'ערימת ספרי ילדים', en: 'A stack of children’s books' }, category: 'books',
      condition: { he: 'טוב', en: 'Good' },
      description: { he: 'בערך 30 ספרים, גילאי 4 עד 8.', en: 'About 30 books, ages 4 to 8.' },
      ownerId: 'noa', createdAt: now - 3 * hour, pickup: 'coordinate', location: '',
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: unsplash('1497633762265-9d179a990aa6'), queue: [],
    },
    {
      id: 'herbs',
      title: { he: 'שלושה עציצי תבלינים', en: 'Three herb pots' }, category: 'garden',
      condition: { he: 'חי ובועט', en: 'Alive and kicking' },
      description: { he: 'נענע, בזיליקום ורוזמרין.', en: 'Mint, basil and rosemary.' },
      ownerId: 'michal', createdAt: now - 5 * hour, pickup: 'outside',
      location: { he: 'ליד הדלת, מתחת לתיבת הדואר', en: 'By the door, under the mailbox' },
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: unsplash('1556929361-f0763cc59812'), queue: [],
    },
    {
      id: 'desk',
      title: { he: 'שולחן כתיבה מעץ', en: 'Wooden desk' }, category: 'furniture',
      condition: { he: 'טוב', en: 'Good' },
      description: '',
      ownerId: 'shula', createdAt: now - 50 * hour, pickup: 'coordinate', location: '',
      status: 'given', closedAt: now - 47 * hour, chosenId: 'yael', skipped: [], takenBy: null, reportedBy: null, photo: unsplash('1519219788971-8d9797e0928e'),
      queue: [{ userId: 'yael', at: now - 49 * hour }],
    },
  ];
}

// חיפושים שמורים לדוגמה. בשתי שפות, כדי שגם באנגלית מיכל תראה את הספה מתחת ל-"sofa"
export const INITIAL_ALERTS = [
  { id: 'a1', userId: 'michal', query: { he: 'ספה', en: 'sofa' } },
  { id: 'a2', userId: 'noa', query: { he: 'אופניים', en: 'bike' } },
];

// מה שה-AI המדומה "מזהה" בתמונה. בגרסה האמיתית זו קריאה ל-Cloud Function
// ששולחת את התמונה למודל ומחזירה בדיוק את המבנה הזה.
export const AI_SUGGESTIONS = [
  { title: { he: 'כיסא בר מעץ', en: 'Wooden bar stool' }, category: 'furniture', condition: { he: 'טוב', en: 'Good' } },
  { title: { he: 'אופני ילדים 16 אינץ׳', en: 'Kids’ bike, 16 inch' }, category: 'kids', condition: { he: 'טוב מאוד', en: 'Very good' } },
  { title: { he: 'סיר לחץ נירוסטה', en: 'Pressure cooker' }, category: 'kitchen', condition: { he: 'כמו חדש', en: 'Like new' } },
  { title: { he: 'ספה דו מושבית בצבע חרדל', en: 'Mustard two-seat sofa' }, category: 'furniture', condition: { he: 'טוב', en: 'Good' } },
];
