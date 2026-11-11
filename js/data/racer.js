/* Racer record for the dashboard. Prices come from site.js (single source); every total, average and rank
   shown on the dashboard is DERIVED from these records so the figures can never contradict each other.
   Lap times are in milliseconds. The leaderboard rows for the indoor circuit match the Home 2 leaderboard. */
import { pricing, circuits } from './site.js';

export const racer = {
  name: 'Eli Moreau',
  short: 'E. Moreau',
  email: 'eli.moreau@mailbox.com',
  phone: '+1 (512) 555-0187',
  kart: 15,
  since: '2026-08-09',
  preferredCircuit: 'Indoor',
  reminders: true,
  card: 'Visa •••• 4821',
};

/* "Today" for the dashboard's countdowns and upcoming/history split */
export const TODAY = '2026-11-11';

export const formatByKey = Object.fromEntries(pricing.formats.map((f) => [f.key, f]));
export const price = (key, drivers = 1) => formatByKey[key].price * drivers;

/* Completed sessions (oldest first). `laps` = timed laps recorded in the session. */
export const sessions = [
  { id: 'AX-2608-1', date: '2026-08-09', time: '10:00', circuit: 'outdoor', format: 'individual', laps: 10, best: 70904, pos: null, of: null },
  { id: 'AX-2608-2', date: '2026-08-30', time: '13:30', circuit: 'indoor', format: 'sprint', laps: 20, best: 43734, pos: 6, of: 8 },
  { id: 'AX-2609-1', date: '2026-09-13', time: '11:00', circuit: 'outdoor', format: 'sprint', laps: 13, best: 69812, pos: 5, of: 8 },
  { id: 'AX-2609-2', date: '2026-09-27', time: '15:00', circuit: 'indoor', format: 'sprint', laps: 21, best: 42381, pos: 5, of: 8 },
  { id: 'AX-2610-1', date: '2026-10-11', time: '12:30', circuit: 'outdoor', format: 'competitive', laps: 26, best: 69140, pos: 4, of: 10 },
  { id: 'AX-2610-2', date: '2026-10-25', time: '16:00', circuit: 'indoor', format: 'competitive', laps: 26, best: 41934, pos: 3, of: 10 },
  { id: 'AX-2611-1', date: '2026-11-01', time: '11:30', circuit: 'outdoor', format: 'sprint', laps: 13, best: 68412, pos: 4, of: 8 },
];

/* Lap-by-lap data for the final of the 25 Oct indoor Competitive Series (best lap = lap 18) */
export const finalLaps = {
  sessionId: 'AX-2610-2',
  laps: [43182, 42617, 42455, 42388, 42301, 42274, 42190, 42351, 42118, 42087, 42240, 42063, 42402, 42011, 42156, 41998, 42073, 41934, 42209, 42044],
};

/* Sector splits of each personal-best lap (ms); each set sums exactly to the best lap */
export const bestSectors = {
  indoor: [13688, 15221, 13025],
  outdoor: [22874, 24915, 20623],
};

/* Bookings still to come */
export const bookings = [
  { ref: 'AX-2611-3', date: '2026-11-14', time: '14:30', circuit: 'indoor', format: 'competitive', drivers: 1, status: 'Confirmed', paidOn: '2026-11-02' },
  { ref: 'AX-2611-4', date: '2026-11-22', time: '11:00', circuit: 'outdoor', format: 'sprint', drivers: 1, status: 'Confirmed', paidOn: '2026-11-08' },
  { ref: 'AX-2612-1', date: '2026-12-05', time: '18:00', circuit: 'indoor', format: 'group', drivers: 8, status: 'Pending', paidOn: null },
];

/* Season leaderboards (best lap per racer). Indoor mirrors the Home 2 board. */
export const boards = {
  indoor: [
    { name: 'M. Alvarez', kart: 7, format: 'Sprint', ms: 41208 },
    { name: 'J. Okafor', kart: 12, format: 'Sprint', ms: 41377 },
    { name: 'S. Lindqvist', kart: 3, format: 'Competitive', ms: 41502 },
    { name: 'R. Tanaka', kart: 9, format: 'Sprint', ms: 41689 },
    { name: 'E. Moreau', kart: 15, format: 'Competitive', ms: 41934, you: true },
    { name: 'D. Brandt', kart: 5, format: 'Individual', ms: 42215 },
  ],
  outdoor: [
    { name: 'M. Alvarez', kart: 7, format: 'Sprint', ms: 66842 },
    { name: 'S. Lindqvist', kart: 3, format: 'Competitive', ms: 67215 },
    { name: 'J. Okafor', kart: 12, format: 'Sprint', ms: 67690 },
    { name: 'R. Tanaka', kart: 9, format: 'Competitive', ms: 68120 },
    { name: 'E. Moreau', kart: 15, format: 'Sprint', ms: 68412, you: true },
    { name: 'D. Brandt', kart: 5, format: 'Individual', ms: 69005 },
  ],
};

export { circuits };
