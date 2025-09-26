// client/src/utils/dates.js
export function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString();
}

export function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatTime(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
}

export function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
}

export function isThisWeek(date) {
  const today = new Date();
  const checkDate = new Date(date);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return checkDate >= startOfWeek && checkDate <= endOfWeek;
}

export function getDaysUntil(date) {
  const today = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
