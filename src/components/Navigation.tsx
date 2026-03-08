import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  Cross,
  BookOpen,
  Calendar,
  Mail,
  Camera,
  HelpCircle,
  User,
  LogOut,
  Bot,
  Heart,
  Shield,
  Download,
  ChevronDown,
  Settings,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  Cross,
  BookOpen,
  User,
  Calendar,
  Heart,
  Camera,
  HelpCircle,
  Mail,
  Download,
  Bot,
  Settings,
};

import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useSettings, type TextSize } from '@/hooks/useSettings';
import siteLinks from '@/data/site-links';
import { useToast } from '@/components/ui/use-toast';
import { NotificationBell } from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import AnimatedLogo from './AnimatedLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Navigation = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { settings, setTheme, setTextSize, isDarkMode } = useSettings();
  
  const textSizes: TextSize[] = ['small', 'normal', 'large', 'extra-large'];
  const currentSizeIndex = textSizes.indexOf(settings.textSize);
  const canZoomIn = currentSizeIndex < textSizes.length - 1;
  const canZoomOut = currentSizeIndex > 0;
  const handleZoomIn = () => { if (canZoomIn) setTextSize(textSizes[currentSizeIndex + 1]); };
  const handleZoomOut = () => { if (canZoomOut) setTextSize(textSizes[currentSizeIndex - 1]); };
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('📱 [Navigation] State update:', { 
      user: user?.email, 
      isAdmin,
      userExists: !!user 
    });
  }, [user, isAdmin]);

  // PWA install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      navigate('/install');
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t('auth.logoutSuccess'),
      description: t('auth.logoutMessage'),
    });
    navigate('/');
  };

  const flatLinks = siteLinks.flatMap((c) => c.items);
  const navItems = flatLinks.filter((i) => i.showInNav !== false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <AnimatedLogo size="sm" />
            <span className="text-xl font-cinzel font-semibold text-foreground hidden sm:inline">
              {t('brand.fullName')}
            </span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {siteLinks.map((category) => {
              const visibleItems = category.items.filter((i) => i.showInNav !== false);
              return (
                <div key={category.id} className="group relative">
                  <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150 rounded-md hover:bg-muted/50">
                    {t(category.titleKey)}
                  </button>
                  {/* Dropdown */}
                  <div className="absolute left-0 mt-0 w-48 bg-background border border-border/50 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out origin-top-left z-50">
                    <div className="py-2">
                      {visibleItems.map((item) => {
                        const Icon = item.icon ? ICONS[item.icon as string] : undefined;
                        return (
                          <Link
                            key={item.nameKey}
                            to={item.href}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors duration-150"
                          >
                            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                            <span>{t(item.nameKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <NotificationBell />
            <LanguageSelector variant="icon" />

            <Button
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              variant="ghost"
              size="sm"
              className="gap-2"
              title={isDarkMode ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </Button>

            <div className="flex items-center gap-0.5">
              <Button
                onClick={handleZoomOut}
                variant="ghost"
                size="sm"
                disabled={!canZoomOut}
                title={t('common.reduceText')}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleZoomIn}
                variant="ghost"
                size="sm"
                disabled={!canZoomIn}
                title={t('common.enlargeText')}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleInstall}
              variant="ghost"
              size="sm"
              className="gap-2 text-secondary"
            >
              <Download className="w-4 h-4" />
              {t('common.install')}
            </Button>

            {authLoading ? <div className="w-12" /> : (user ? (
              <>
                {isAdmin && (
                  <Button
                    onClick={() => navigate('/admin')}
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary"
                  >
                    <Shield className="w-4 h-4" />
                    {t('common.admin')}
                  </Button>
                )}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/auth')}
                  variant="ghost"
                  size="sm"
                >
                  <User className="w-4 h-4 mr-2" />
                  {t('common.login')}
                </Button>
                <Button
                  onClick={() => navigate('/auth')}
                  variant="default"
                  size="sm"
                  className="divine-glow"
                >
                  {t('common.joinUs')}
                </Button>
              </>
            ))}
          </div>

          {/* Mobile/Tablet top bar icons + hamburger */}
          <div className="flex items-center gap-0.5 lg:hidden">
            <LanguageSelector variant="icon" />
            <Button
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={isDarkMode ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </Button>
            <Button onClick={handleZoomOut} variant="ghost" size="icon" className="h-8 w-8" disabled={!canZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button onClick={handleZoomIn} variant="ghost" size="icon" className="h-8 w-8" disabled={!canZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <NotificationBell />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-[30%] min-w-[250px] sm:w-[30%]">
              <div className="flex flex-col h-full py-6">
                <div className="space-y-4 flex-1 overflow-y-auto">
                {siteLinks.map((cat) => {
                  const visibleItems = cat.items.filter((i) => i.showInNav !== false);
                  const isExpanded = expandedCategory === cat.id;
                  
                  return (
                    <div key={cat.id} className="border-b border-border/30 pb-4 last:border-0">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                        className="w-full flex items-center px-0 py-2 text-sm font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-opacity text-left"
                      >
                        <span>{t(cat.titleKey)}</span>
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-200 ml-auto flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="space-y-1 mt-2">
                          {visibleItems.map((item) => {
                            const Icon = item.icon ? ICONS[item.icon as string] : undefined;
                            return (
                              <Link
                                key={item.nameKey}
                                to={item.href}
                                className="flex items-center space-x-3 py-2 px-0 rounded-none hover:opacity-80 transition-opacity"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
                                <span className="text-sm font-medium">{t(item.nameKey)}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                <div className="border-t border-border/50 pt-4 space-y-2">
                  {/* Install button mobile */}
                  <Button
                    onClick={() => {
                      handleInstall();
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-secondary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('common.installApp')}
                  </Button>

                  {user ? (
                    <>
                      {isAdmin && (
                        <Button
                          onClick={() => {
                            navigate('/admin');
                            setIsMenuOpen(false);
                          }}
                          variant="ghost"
                          className="w-full justify-start text-primary"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {t('common.admin')}
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('common.logout')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          navigate('/auth');
                          setIsMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <User className="w-4 h-4 mr-2" />
                        {t('common.login')}
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/auth');
                          setIsMenuOpen(false);
                        }}
                        variant="default"
                        className="w-full divine-glow"
                      >
                        {t('common.joinUs')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
           </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
