export const FIRST_NAMES_M = [
  'Mark', 'Bryan', 'Paolo', 'Joshua', 'Christian', 'Jerome', 'Kevin', 'Alden',
  'Angelo', 'John Paul', 'Carlo', 'Rafael', 'Danilo', 'Kenneth', 'Miggy', 'Lester'
];

export const FIRST_NAMES_F = [
  'Maria', 'Angel', 'Christine', 'Bea', 'Jennifer', 'Camille', 'Danica', 'Roxanne',
  'Princess', 'Kathryn', 'Alyssa', 'Patricia', 'Nicole', 'Hannah', 'Maricar', 'Sheena'
];

export const LAST_NAMES = [
  'Santos', 'Reyes', 'Dela Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Flores',
  'Gonzales', 'Lopez', 'Ocampo', 'Castillo', 'Villanueva', 'Rivera', 'Aquino',
  'Torres', 'Navarro', 'Salazar', 'Valdez', 'Soriano', 'Mercado'
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
  { text: "Kape muna tayo sa pantry! ☕", icon: "☕" },
  { text: "Graveyard shift energy powered by 3-in-1! ⚡", icon: "⚡" },
  { text: "Yes! 5-star CSAT survey received! ⭐", icon: "⭐" },
  { text: "Supervisor call de-escalated successfully! 🛡️", icon: "🛡️" },
  { text: "Sahod day feels! Payout na! 💰", icon: "💰" },
  { text: "Order na ba tayo ng Jollibee Chickenjoy? 🍗", icon: "🍗" },
  { text: "AHT goal met! 240 seconds record! 🎯", icon: "🎯" },
  { text: "Please don't hang up before the survey! 🙏", icon: "📋" },
  { text: "Network stable, queue under control! 🌐", icon: "🌐" },
  { text: "Siopao & cold water break! 🥟", icon: "🥟" },
  { text: "TL commended our pod for 100% attendance! 🏆", icon: "🏆" }
];
