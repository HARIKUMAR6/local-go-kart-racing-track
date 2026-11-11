/* Central site configuration & content data. Pages and components read from here (Phase 3 reuses it).
   NOTE: Apexline is a fictional business. Address, phone, email and social handles below are a single,
   consistent project identity – they are not claims about a real operating venue. */
export const brand = {
  name: 'Apexline',
  descriptor: 'Kart Circuit',
  fullName: 'Apexline Kart Circuit',
  tagline: 'Find your line. Own the apex.',
  blurb: 'Indoor and outdoor karting with pro-grade karts, live lap timing and a proper racing briefing.',
};

export const nav = {
  home: {
    label: 'Home',
    children: [
      { key: 'home-1', label: 'Home 1', href: '/' },
      { key: 'home-2', label: 'Home 2', href: '/home-2' },
    ],
  },
  links: [
    { key: 'about', label: 'About', href: '/about' },
    { key: 'races', label: 'Races & Pricing', href: '/races-pricing' },
    { key: 'safety', label: 'Safety', href: '/safety' },
    { key: 'contact', label: 'Contact', href: '/contact' },
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  ],
  login: { key: 'login', label: 'Login', href: '/login' },
  cta: { label: 'Book a Race', href: '/races-pricing#book' },
};

export const experiences = [
  { label: 'Indoor Karting', href: '/races-pricing#indoor' },
  { label: 'Outdoor Karting', href: '/races-pricing#outdoor' },
  { label: 'Racing Sessions', href: '/races-pricing#sessions' },
  { label: 'Group Racing', href: '/races-pricing#group' },
];

export const contact = {
  address: '48 Paddock Way, Austin, TX 78744, USA',
  addressLines: ['48 Paddock Way', 'Austin, TX 78744, USA'],
  phone: '+1 (512) 555-0148',
  phoneHref: 'tel:+15125550148',
  email: 'bookings@apexlinekarting.com',
  hours: [
    { days: 'Mon – Fri', time: '12:00 – 22:00' },
    { days: 'Sat – Sun', time: '09:00 – 23:00' },
  ],
  /* Map: the street address is a project-level fictional one with no OpenStreetMap record, so the map is
     centred on the ZIP code it belongs to (78744, Austin TX – centroid from OSM Nominatim). */
  map: { lat: 30.18879, lon: -97.73025, zoom: 14, provider: 'OpenStreetMap' },
};

/* Business profile URLs are not verified yet. `href: null` renders a non-navigational icon;
   set the owner's confirmed profile URL here and the footer turns it into a link automatically. */
export const social = [
  { name: 'Instagram', icon: 'instagram', href: null },
  { name: 'Facebook', icon: 'facebook', href: null },
  { name: 'YouTube', icon: 'youtube', href: null },
  { name: 'X', icon: 'x', href: null },
];

/* One consistent fictional price list, reused by Home 1, Home 2 and (Phase 3) Races & Pricing. */
export const pricing = {
  currency: '$',
  formats: [
    { key: 'individual', name: 'Individual Race', price: 28, unit: 'per driver', detail: '10 laps · timed' },
    { key: 'sprint', name: 'Sprint Session', price: 45, unit: 'per driver', detail: '2 heats · 8 min each' },
    { key: 'competitive', name: 'Competitive Series', price: 69, unit: 'per driver', detail: 'Qualifying + 20-lap final' },
    { key: 'group', name: 'Group Racing', price: 38, unit: 'per driver · 8+', detail: 'Private grid · host included' },
  ],
};

/* Fictional, internally consistent circuit data (illustrative – not engineered or surveyed figures). */
export const circuits = {
  indoor: { name: 'Indoor Circuit', length: 720, corners: 14, width: 9, surface: 'Sealed concrete', karts: 'Electric 15 kW', zones: ['Long sweeper', 'Hairpin complex', 'Chicane run'] },
  outdoor: { name: 'Outdoor Circuit', length: 1180, corners: 17, width: 11, surface: 'Asphalt', karts: 'Petrol 9 hp', zones: ['Flat-out straight', 'Double apex', 'Esses'] },
};
