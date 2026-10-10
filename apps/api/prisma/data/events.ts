// Built relative to "now" so the demo always has upcoming items.
const days = (n: number, hour = 17) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export const events = [
  { title: 'Coding club recruitment closes', category: 'CLUB', startsAt: days(3, 23), audienceYears: [1, 2] },
  { title: 'Mid-semester exams begin', category: 'EXAM', startsAt: days(6, 9), audienceYears: [1, 2, 3, 4] },
  { title: 'Campus hackathon registrations close', category: 'HACKATHON', startsAt: days(2, 20), link: null },
  { title: 'Northwind Labs pre-placement talk', category: 'PLACEMENT', startsAt: days(4, 16), audienceYears: [3, 4] },
  { title: 'Internship form deadline (summer)', category: 'DEADLINE', startsAt: days(5, 23), audienceYears: [2, 3] },
  { title: 'Freshers meet-the-seniors evening', category: 'EVENT', startsAt: days(1, 18), audienceYears: [1] },
  { title: 'Alumni webinar: breaking into ML roles', category: 'WEBINAR', startsAt: days(9, 19) },
  { title: 'Robotics club demo day', category: 'CLUB', startsAt: days(12, 15) },
] as const;
