export const FIRST_NAMES_M = [
  'Marcus', 'Daniel', 'Amir', 'Kofi', 'Mateo', 'Liam', 'Hiroshi', 'Rohan',
  'Samuel', 'Andrei', 'Tomasz', 'Omar', 'Diego', 'Felix', 'Tariq', 'Ivan',
  'Jamal', 'Nikolai', 'Kwame', 'Jun', 'Rafael', 'Elias', 'Viktor', 'Dev'
];

export const FIRST_NAMES_F = [
  'Amara', 'Sofia', 'Priya', 'Mei', 'Isabel', 'Nadia', 'Chloe', 'Fatima',
  'Ingrid', 'Lucia', 'Zainab', 'Hannah', 'Anika', 'Camila', 'Yuki', 'Elena',
  'Grace', 'Leila', 'Mira', 'Thandi', 'Olivia', 'Sara', 'Aisha', 'Noor'
];

export const LAST_NAMES = [
  'Adeyemi', 'Nguyen', 'Kowalski', 'Fernandez', 'Patel', 'Okafor', 'Tanaka',
  'Silva', 'Ivanov', 'Haddad', 'Mensah', 'Costa', 'Lindqvist', 'Rahman',
  'Park', 'Moreau', 'Dubois', 'Castro', 'Zhang', 'Novak', 'Hassan', 'Mendes',
  'Kim', 'Popescu', 'Ndlovu', 'Rossi', 'Ortiz', 'Singh', 'Das', 'Abdi'
];

export function getRandomName(gender?: 'M' | 'F'): { name: string; gender: 'M' | 'F' } {
  const g = gender || (Math.random() > 0.5 ? 'M' : 'F');
  const pool = g === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F;
  const first = pool[Math.floor(Math.random() * pool.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return { name: `${first} ${last}`, gender: g };
}

export const CALL_CENTER_PHRASES = [
  { text: "Thank you for calling support! How may I assist you?", icon: "📞" },
  { text: "I understand how frustrating that must be, sir.", icon: "💬" },
  { text: "May I put you on a 2-minute hold to verify?", icon: "⏳" },
  { text: "Let me check that account for you right away.", icon: "💻" },
  { text: "Coffee break in the pantry! ☕", icon: "☕" },
  { text: "Graveyard shift energy powered by 3-in-1! ⚡", icon: "⚡" },
  { text: "Yes! 5-star CSAT survey received! ⭐", icon: "⭐" },
  { text: "Supervisor call de-escalated successfully! 🛡️", icon: "🛡️" },
  { text: "Payday feels good! 💰", icon: "💰" },
  { text: "Shall we order lunch for the floor? 🍗", icon: "🍗" },
  { text: "AHT goal met! 240 seconds record! 🎯", icon: "🎯" },
  { text: "Please don't hang up before the survey! 🙏", icon: "📋" },
  { text: "Network stable, queue under control! 🌐", icon: "🌐" },
  { text: "Snack and cold water break! 🥟", icon: "🥟" },
  { text: "TL commended our pod for 100% attendance! 🏆", icon: "🏆" }
];
