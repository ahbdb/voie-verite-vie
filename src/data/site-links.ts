export interface SiteLink {
  name: string;
  href: string;
  /** icon name (mapped in UI) */
  icon?: string;
  showInNav?: boolean; // default true
}

export interface SiteCategory {
  id: string;
  title: string;
  items: SiteLink[];
}

export const siteLinks: SiteCategory[] = [
  {
    id: 'principal',
    title: 'Principal',
    items: [
      { name: 'Accueil', href: '/', icon: 'Cross' },
      { name: 'À propos', href: '/about', icon: 'BookOpen' },
      { name: 'Créateur', href: '/createur', icon: 'User' },
    ],
  },
  {
    id: 'spiritual',
    title: 'Pratiques Spirituelles',
    items: [
      { name: 'Lecture Biblique', href: '/biblical-reading', icon: 'BookOpen' },
      { name: 'Forum Prière', href: '/prayer-forum', icon: 'Heart' },
      { name: 'Carême 2026', href: '/careme-2026', icon: 'Cross' },
      { name: 'Chemin de Croix', href: '/chemin-de-croix', icon: 'Cross' },
    ],
  },
  {
    id: 'community',
    title: 'Communauté',
    items: [
      { name: 'Activités', href: '/activities', icon: 'Calendar' },
      { name: 'Galerie', href: '/gallery', icon: 'Camera' },
    ],
  },
  {
    id: 'help',
    title: 'Aide et Contact',
    items: [
      { name: 'FAQ', href: '/faq', icon: 'HelpCircle' },
      { name: 'Contacts', href: '/contacts', icon: 'Mail' },
    ],
  },
  {
    id: 'tools',
    title: 'Outils',
    items: [
      { name: 'Profil', href: '/profile', icon: 'User' },
      { name: 'Assistant IA', href: '/ai-chat', icon: 'Bot' },
      { name: 'Paramètres', href: '/settings', icon: 'Settings' },
    ],
  },
];

export default siteLinks;

