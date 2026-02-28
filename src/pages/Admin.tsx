import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FixSuperadminRole from '@/components/admin/FixSuperadminRole';
import { 
  Home, Info, Calendar, BookOpen, MessageSquare, 
  Image, HelpCircle, Mail, Bot, Settings, Users, Shield, Flame, Cross, User, Palette, Bell, Clock
} from 'lucide-react';

const adminSections = [
  { title: 'Accueil', description: 'Gérer la page d\'accueil', icon: Home, path: '/admin/home' },
  { title: 'À Propos', description: 'Gérer la page à propos', icon: Info, path: '/admin/about' },
  { title: 'Auteur', description: 'Gérer la fiche auteur', icon: User, path: '/admin/author' },
  { title: 'Design', description: 'Paramètres visuels du site', icon: Palette, path: '/admin/design' },
  { title: 'Carême 2026', description: 'Gérer le programme de Carême', icon: Flame, path: '/admin/careme2026' },
  { title: 'Chemin de Croix', description: 'Gérer les 14 stations', icon: Cross, path: '/admin/chemin-de-croix' },
  { title: 'Activités', description: 'Gérer les activités', icon: Calendar, path: '/admin/activities' },
  { title: 'Lecture Biblique', description: 'Gérer les lectures', icon: BookOpen, path: '/admin/readings' },
  { title: 'Forum Prière', description: 'Modérer les prières', icon: MessageSquare, path: '/admin/prayers' },
  { title: 'Galerie', description: 'Gérer les images', icon: Image, path: '/admin/gallery' },
  { title: 'FAQ', description: 'Gérer les questions', icon: HelpCircle, path: '/admin/faq' },
  { title: 'Contact', description: 'Voir les messages', icon: Mail, path: '/admin/contact' },
  { title: 'Notifications', description: 'Envoyer des notifications persistentes', icon: Bell, path: '/admin/notifications' },
  { title: 'Scheduler', description: 'Gérer les notifications automatiques', icon: Clock, path: '/admin/notification-scheduler' },
  { title: 'Assistant IA', description: 'Configurer l\'IA', icon: Bot, path: '/admin/ai' },
  { title: 'Utilisateurs', description: 'Gérer les utilisateurs', icon: Users, path: '/admin/users' },
];

interface Stats {
  users: number;
  readings: number;
  prayers: number;
  messages: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, adminRole, loading, checked } = useAdmin();
  const [stats, setStats] = useState<Stats>({ users: 0, readings: 0, prayers: 0, messages: 0 });

  // Déterminer les sections à afficher
  const getSections = () => {
    const sections = [...adminSections];
    
    // Ajouter la gestion des administrateurs si on est admin_principal
    const isMainAdmin = adminRole === 'admin_principal';
    
    if (isMainAdmin) {
      sections.push({
        title: 'Administrateurs',
        description: 'Gérer les administrateurs',
        icon: Shield,
        path: '/admin/admins'
      });
    }
    
    return sections;
  };

  useEffect(() => {
    // Only redirect if we're sure the user is not admin after loading is complete
    if (loading) return;
    
    // Only redirect to home if user just logged out or is explicitly not admin
    if (!user || (checked && !isAdmin)) {
      console.log('⛔ [Admin] Redirecting - user:', !!user, 'isAdmin:', isAdmin, 'checked:', checked);
      navigate('/');
    }
  }, [user, isAdmin, loading, checked, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const [usersRes, readingsRes, prayersRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('biblical_readings').select('*', { count: 'exact', head: true }),
        supabase.from('prayer_requests').select('*', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        users: usersRes.count || 0,
        readings: readingsRes.count || 0,
        prayers: prayersRes.count || 0,
        messages: messagesRes.count || 0
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      // Don't show error toast for stats - it's not critical
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Administration</h1>
            {adminRole === 'admin_principal' && (
              <span className="text-2xl">👑</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Bienvenue dans le panneau d'administration de VOIE, VÉRITÉ, VIE
            </p>
            {adminRole === 'admin_principal' && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                Admin Principal
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSections().map((section) => (
            <Link key={section.path} to={section.path}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-border hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Afficher le fix si pas admin_principal */}
        {adminRole !== 'admin_principal' && (
          <div className="mb-8">
            <FixSuperadminRole />
          </div>
        )}

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Statistiques rapides
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.users}</p>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.readings}</p>
              <p className="text-sm text-muted-foreground">Lectures</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.prayers}</p>
              <p className="text-sm text-muted-foreground">Prières</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.messages}</p>
              <p className="text-sm text-muted-foreground">Messages</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
