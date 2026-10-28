export const isDone = (status) => status === 'given' || status === 'taken' || status === 'gone';

// בלוח לא כתוב למי זה שמור: רק המוסרת ומי שנבחרה צריכות לדעת. מחזיר מפתח במילון.
export function statusKey(item) {
  if (item.status === 'gone') return 'status.taken';
  return `status.${item.status}`;
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
