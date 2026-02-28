import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { SettingsProvider } from "@/hooks/useSettings";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollToTop from "@/components/ScrollToTop";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { initNotificationsAutomatically, initNotificationClickHandler } from "@/lib/notification-service";
import { initChangeNotificationSystem, sendDailyWelcomeNotification } from "@/lib/change-notification-system";
import { initializeNotificationScheduler } from "@/services/notification-scheduler";
import Index from "./pages/Index";
import About from "./pages/About";
import Activities from "./pages/Activities";
import BiblicalReading from "./pages/BiblicalReading";
import BibleBookDetail from "./pages/BibleBookDetail";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import FAQ from "./pages/FAQ";
import Install from "./pages/Install";
import Auth from "./pages/Auth";
import AIChat from "./pages/AIChat";
import PrayerForum from "./pages/PrayerForum";
import Careme2026 from "./pages/Careme2026";
import CheminDeCroix from "./pages/CheminDeCroix";
import ShareDebug from "./pages/ShareDebug";
import Admin from "./pages/Admin";
import AdminReadings from "./pages/admin/AdminReadings";
import AdminPrayers from "./pages/admin/AdminPrayers";
import AdminContact from "./pages/admin/AdminContact";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHome from "./pages/admin/AdminHome";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminAuthor from "./pages/admin/AdminAuthor";
import AdminDesign from "./pages/admin/AdminDesign";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminAI from "./pages/admin/AdminAI";
import AdminCareme2026 from "./pages/admin/AdminCareme2026";
import AdminCheminDeCroix from "./pages/admin/AdminCheminDeCroix";
import AdminDebugCareme from "./pages/admin/AdminDebugCareme";
import AdminTestSave from "./pages/admin/AdminTestSave";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminNotificationScheduler from "./pages/admin/AdminNotificationScheduler";
import AdminRepair from "./pages/AdminRepair";
import Profile from "./pages/Profile";
import Creator from "./pages/Creator";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDiagnostics from "@/components/AdminDiagnostics";
import NotificationInitializer from "@/components/NotificationInitializer";

const queryClient = new QueryClient();

// Composant pour initialiser les notifications automatiquement
const AppNotificationInitializer = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { notifyUpdate } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        // Initialiser le système de changements
        const cleanup = await initChangeNotificationSystem(user.id);
        
        // Envoyer une notification de bienvenue INTELLIGENTE une fois par jour
        await sendDailyWelcomeNotification(user.id);

        // Retourner la fonction cleanup
        return cleanup;
      } catch (err) {
        console.log('Erreur lors de l\'initialisation des notifications:', err);
      }
    };

    let cleanupFn: (() => void | Promise<void>) | undefined;
    
    initializeNotifications().then((fn) => {
      cleanupFn = fn;
    });

    // Nettoyer les listeners lors du unmount
    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [user?.id]); // Ajouter user.id comme dépendance, pas tout le user object

  // Initialiser le scheduler de notifications automatiques
  useEffect(() => {
    try {
      initializeNotificationScheduler(false); // mode debug désactivé en prod
      console.log('✅ Notification Scheduler initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du scheduler:', error);
    }
  }, []); // Une seule fois au montage

  return (
    <>
      <NotificationInitializer />
      {children}
    </>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SettingsProvider>
            {isLoading && <LoadingScreen />}
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <BrowserRouter>
                <AppNotificationInitializer>
                  <ScrollToTop />
                  <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/biblical-reading" element={<BiblicalReading />} />
              <Route path="/bible-book/:bookId" element={<BibleBookDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/contacts" element={<Contact />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/install" element={<Install />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/prayer-forum" element={<PrayerForum />} />
              <Route path="/careme-2026" element={<Careme2026 />} />
              <Route path="/chemin-de-croix" element={<CheminDeCroix />} />
              <Route path="/share-debug" element={<ShareDebug />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/createur" element={<Creator />} />
              <Route path="/admin-repair" element={<AdminRepair />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/home" element={<AdminHome />} />
              <Route path="/admin/about" element={<AdminAbout />} />
              <Route path="/admin/author" element={<AdminAuthor />} />
              <Route path="/admin/design" element={<AdminDesign />} />
              <Route path="/admin/careme2026" element={<AdminCareme2026 />} />
              <Route path="/admin/debug-careme" element={<AdminDebugCareme />} />
              <Route path="/admin/test-save" element={<AdminTestSave />} />
              <Route path="/admin/chemin-de-croix" element={<AdminCheminDeCroix />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
              <Route path="/admin/readings" element={<AdminReadings />} />
              <Route path="/admin/prayers" element={<AdminPrayers />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
              <Route path="/admin/faq" element={<AdminFAQ />} />
              <Route path="/admin/contact" element={<AdminContact />} />
              <Route path="/admin/ai" element={<AdminAI />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/notification-scheduler" element={<AdminNotificationScheduler />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/admins" element={<AdminManagement />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
                </AppNotificationInitializer>
                <AdminDiagnostics />
              </BrowserRouter>
            </ErrorBoundary>
          </SettingsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
