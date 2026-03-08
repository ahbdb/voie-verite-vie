import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageSelector from '@/components/LanguageSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings, type Theme, type TextSize } from '@/hooks/useSettings';
import { Sun, Moon, Monitor, Type, Bell, Globe, Lock, Download, Trash2, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Settings = memo(() => {
  const { t } = useTranslation();
  const { settings, setTheme, setTextSize, isDarkMode } = useSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('settings.light'), icon: <Sun className="w-5 h-5" /> },
    { value: 'dark', label: t('settings.dark'), icon: <Moon className="w-5 h-5" /> },
    { value: 'system', label: t('settings.system'), icon: <Monitor className="w-5 h-5" /> },
  ];

  const textSizeOptions: { value: TextSize; label: string; scale: string }[] = [
    { value: 'small', label: t('settings.small'), scale: '-10%' },
    { value: 'normal', label: t('settings.normal'), scale: t('settings.default') },
    { value: 'large', label: t('settings.large'), scale: '+15%' },
    { value: 'extra-large', label: t('settings.extraLarge'), scale: '+30%' },
  ];

  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then((names) => { names.forEach(name => { caches.delete(name); }); });
    }
    localStorage.clear();
    alert(t('settings.clearCache'));
  };

  const installApp = () => {
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        toast({ title: t('common.error'), description: t('auth.networkError'), variant: "destructive" });
        return;
      }
      const userId = session.user.id;
      await supabase.from('profiles').delete().eq('id', userId).select();
      await supabase.from('user_roles').delete().eq('user_id', userId).select();
      try {
        await supabase.rpc('hard_delete_auth_user', { target_user_id: userId });
      } catch (rpcErr) { console.error('RPC error:', rpcErr); }
      try { await supabase.auth.signOut(); } catch (e) {}
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) { try { const names = await caches.keys(); await Promise.all(names.map(name => caches.delete(name))); } catch (e) {} }
      toast({ title: "✅ " + t('settings.deleteAccount'), description: t('settings.deleteDesc') });
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: t('common.error'), description: "support@voieVeriteVie.com", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-white'}`}>
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 font-playfair">{t('settings.title')}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{t('settings.subtitle')}</p>
          </div>

          <div className="space-y-6">
            {/* Theme */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sun className="w-5 h-5" />{t('settings.theme')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.themeDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {themeOptions.map(option => (
                    <button key={option.value} onClick={() => setTheme(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.theme === option.value
                          ? isDarkMode ? 'border-violet-500 bg-violet-950/50' : 'border-violet-600 bg-violet-50'
                          : isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-slate-600' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}>
                      <span className={settings.theme === option.value ? 'text-violet-600' : ''}>{option.icon}</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : ''}`}>{option.label}</span>
                      {settings.theme === option.value && <span className={isDarkMode ? 'text-xs text-violet-400' : 'text-xs text-violet-600'}>{t('settings.active')}</span>}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Text Size */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Type className="w-5 h-5" />{t('settings.textSize')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.textSizeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {textSizeOptions.map(option => (
                    <button key={option.value} onClick={() => setTextSize(option.value)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all flex justify-between items-center ${
                        settings.textSize === option.value
                          ? isDarkMode ? 'border-violet-500 bg-violet-950/50' : 'border-violet-600 bg-violet-50'
                          : isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-slate-600' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}>
                      <span className="font-medium">{option.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{option.scale}</span>
                        {settings.textSize === option.value && <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
                <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-xs font-semibold mb-2 opacity-75 ${isDarkMode ? 'text-slate-300' : ''}`}>{t('settings.preview')}</p>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>{t('settings.previewSmall')}</p>
                  <p className={`text-base mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>{t('settings.previewNormal')}</p>
                  <p className={`text-lg mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>{t('settings.previewLarge')}</p>
                  <p className={`text-xl ${isDarkMode ? 'text-slate-200' : ''}`}>{t('settings.previewXL')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Application */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" />{t('settings.application')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.appDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={installApp} variant="outline" className="w-full justify-start gap-2"><Download className="w-4 h-4" />{t('settings.installApp')}</Button>
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />{t('settings.accessibility')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.accessibilityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" defaultChecked /><span className="text-sm">{t('settings.reduceAnimations')}</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">{t('settings.highContrast')}</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">{t('settings.enhancedFocus')}</span></label>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />{t('settings.notifications')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.notificationsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" defaultChecked /><span className="text-sm">{t('settings.readingReminders')}</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" defaultChecked /><span className="text-sm">{t('settings.lentNotifications')}</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">{t('settings.activityNotifications')}</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">{t('settings.newsUpdates')}</span></label>
              </CardContent>
            </Card>

            {/* Content & Language */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />{t('settings.contentLanguage')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.contentLanguageDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">{t('settings.language')}</label>
                  <LanguageSelector variant="full" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" defaultChecked /><span className="text-sm">{t('settings.showVerses')}</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-4 h-4" defaultChecked /><span className="text-sm">{t('settings.simplifiedReading')}</span></label>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />{t('settings.dataPrivacy')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{t('settings.dataPrivacyDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={clearCache} variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" />{t('settings.clearCache')}</Button>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('settings.clearCacheDesc')}</p>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className={`${isDarkMode ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />{t('settings.dangerZone')}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{t('settings.dangerZoneDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>⚠️ <strong>{t('settings.deleteWarning')}</strong></p>
                </div>
                <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" className="w-full justify-start gap-2"><Trash2 className="w-4 h-4" />{t('settings.deleteAccount')}</Button>
              </CardContent>
            </Card>

            {/* About */}
            <Card className={isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" />{t('common.about')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm font-medium">Voie, Vérité, Vie</p><p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>v1.0.0</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />{t('settings.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 mt-4"><p>{t('settings.deleteConfirmDesc')}</p></AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deletingAccount} className="bg-red-600 hover:bg-red-700 text-white">
              {deletingAccount ? t('settings.deleting') : t('settings.deleteAccount')}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default Settings;
