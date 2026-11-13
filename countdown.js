// Count local calendar days in India, independent of the guest's time zone or DST.
export function weddingCountdown(date, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => Number(parts.find(part => part.type === type).value);
  const today = Date.UTC(value('year'), value('month') - 1, value('day'));
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - today) / 86400000);
  return { days, value: days > 0 ? String(days) : '✧', label: days > 0 ? `${days === 1 ? 'day' : 'days'} to our wedding` : days === 0 ? 'Today, our forever begins' : 'Forever began on 25 January 2027' };
}
