export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'עכשיו';
  if (m < 60) return m === 1 ? 'לפני דקה' : `לפני ${m} דקות`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'אתמול' : d === 2 ? 'לפני יומיים' : `לפני ${d} ימים`;
}

export const isDone = (status) => status === 'given' || status === 'taken' || status === 'gone';

export function statusLabel(item, nameOf) {
  switch (item.status) {
    case 'available': return 'זמין';
    case 'reserved': return item.chosenId ? `שמור ל${nameOf(item.chosenId)}` : 'שמור';
    case 'given': return 'נמסר';
    case 'taken':
    case 'gone': return 'נלקח';
    default: return '';
  }
}

// 0501234567 -> https://wa.me/972501234567?text=...
export function waToPerson(phone, text) {
  const intl = '972' + phone.replace(/\D/g, '').replace(/^0/, '');
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function waShare(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function itemLink(id) {
  return `${window.location.origin}${window.location.pathname}#/item/${id}`;
}

// מקטין תמונה לפני שמירה, כדי לא לפוצץ את האחסון
export function resizeImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
