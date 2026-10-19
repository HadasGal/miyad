// נתוני דמו: קהילה פיקטיבית. כשעוברים ל-Firebase, הקובץ הזה נעלם
// והנתונים מגיעים מ-Firestore. שום מסך לא צריך להשתנות.

export const COMMUNITY = { id: 'givat-hazeitim', name: 'גבעת הזיתים' };

export const USERS = [
  { id: 'dana', name: 'דנה לוי', short: 'דנה', street: 'רחוב הזית', phone: '0501111111' },
  { id: 'michal', name: 'מיכל כהן', short: 'מיכל', street: 'רחוב הגפן', phone: '0502222222' },
  { id: 'noa', name: 'נועה ברק', short: 'נועה', street: 'רחוב התאנה', phone: '0503333333' },
  { id: 'yael', name: 'יעל אור', short: 'יעל', street: 'רחוב הרימון', phone: '0504444444' },
  { id: 'shula', name: 'שולה מזרחי', short: 'שולה', street: 'רחוב השקד', phone: '0505555555' },
];

export const CATEGORIES = [
  { id: 'furniture', label: 'רהיטים', tint: '#DCE6D5' },
  { id: 'kids', label: 'ילדים', tint: '#E6E0D2' },
  { id: 'books', label: 'ספרים', tint: '#D8E2E6' },
  { id: 'kitchen', label: 'מטבח', tint: '#E1E6DD' },
  { id: 'garden', label: 'גינה', tint: '#D5E6DA' },
  { id: 'other', label: 'אחר', tint: '#E2E2DE' },
];

const min = 60 * 1000;
const hour = 60 * min;

export function buildInitialItems(now = Date.now()) {
  return [
    {
      id: 'sofa', title: 'ספה תלת מושבית אפורה', category: 'furniture', condition: 'טוב מאוד',
      description: 'עברנו דירה והיא לא נכנסת לסלון החדש. צריך שניים להרים.',
      ownerId: 'dana', createdAt: now - 1 * hour, pickup: 'coordinate', location: '',
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: null,
      queue: [
        { userId: 'michal', at: now - 40 * min },
        { userId: 'noa', at: now - 25 * min },
      ],
    },
    {
      id: 'cups', title: 'שישה ספלי קרמיקה לבנים', category: 'kitchen', condition: 'כמו חדש',
      description: 'לא צריך לתאם, פשוט לקחת.',
      ownerId: 'shula', createdAt: now - 3 * hour, pickup: 'outside', location: 'על החומה ליד השער',
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: null, queue: [],
    },
    {
      id: 'stroller', title: 'עגלת תינוק מתקפלת', category: 'kids', condition: 'טוב',
      description: 'משומשת, עובדת מצוין. הגגון קצת דהוי.',
      ownerId: 'yael', createdAt: now - 26 * hour, pickup: 'coordinate', location: '',
      status: 'reserved', chosenId: 'michal', skipped: [], takenBy: null, reportedBy: null, photo: null,
      queue: [{ userId: 'michal', at: now - 25 * hour }, { userId: 'dana', at: now - 20 * hour }],
    },
    {
      id: 'books', title: 'ערימת ספרי ילדים', category: 'books', condition: 'טוב',
      description: 'בערך 30 ספרים, גילאי 4 עד 8.',
      ownerId: 'noa', createdAt: now - 3 * hour, pickup: 'coordinate', location: '',
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: null, queue: [],
    },
    {
      id: 'herbs', title: 'שלושה עציצי תבלינים', category: 'garden', condition: 'חי ובועט',
      description: 'נענע, בזיליקום ורוזמרין.',
      ownerId: 'michal', createdAt: now - 5 * hour, pickup: 'outside', location: 'ליד הדלת, מתחת לתיבת הדואר',
      status: 'available', chosenId: null, skipped: [], takenBy: null, reportedBy: null, photo: null, queue: [],
    },
    {
      id: 'desk', title: 'שולחן כתיבה מעץ', category: 'furniture', condition: 'טוב',
      description: '',
      ownerId: 'shula', createdAt: now - 50 * hour, pickup: 'coordinate', location: '',
      status: 'given', chosenId: 'yael', skipped: [], takenBy: null, reportedBy: null, photo: null,
      queue: [{ userId: 'yael', at: now - 49 * hour }],
    },
  ];
}

export const INITIAL_ALERTS = [
  { id: 'a1', userId: 'michal', query: 'ספה' },
  { id: 'a2', userId: 'noa', query: 'אופניים' },
];

// מה שה-AI המדומה "מזהה" בתמונה. בגרסה האמיתית זו קריאה ל-Cloud Function
// ששולחת את התמונה למודל ומחזירה בדיוק את המבנה הזה.
export const AI_SUGGESTIONS = [
  { title: 'כיסא בר מעץ', category: 'furniture', condition: 'טוב' },
  { title: 'אופני ילדים 16 אינץ׳', category: 'kids', condition: 'טוב מאוד' },
  { title: 'סיר לחץ נירוסטה', category: 'kitchen', condition: 'כמו חדש' },
  { title: 'ספה דו מושבית בצבע חרדל', category: 'furniture', condition: 'טוב' },
];
