import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import AdminLoadingSpinner from '@/components/admin/AdminLoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Flame, Plus, Edit2, Trash2, Save, X, Eye, Download } from 'lucide-react';
import { caremeData } from '@/data/careme-2026-data';

interface CaremeProgram {
  id?: string;
  page_key: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  updated_at?: string;
}

interface CaremDay {
  id?: string;
  date: string;
  title: string;
  readings: string;
  actions: {
    soi: string;
    prochain: string;
    dieu: string;
  };
  weekTitle: string;
}

const AdminCareme2026 = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [programContent, setProgramContent] = useState<CaremeProgram | null>(null);
  const [formData, setFormData] = useState({
    title: 'Carême 2026',
    subtitle: '40 jours de prière, pénitence et partage'
  });
  const [saving, setSaving] = useState(false);
  const [daysData, setDaysData] = useState<CaremDay[]>([]);
  const [editingDay, setEditingDay] = useState<CaremDay | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [previewingDay, setPreviewingDay] = useState<CaremDay | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  const loadContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'careme-2026')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading content:', error);
        return;
      }

      if (data) {
        setProgramContent(data as CaremeProgram);
        setFormData({
          title: data.title || 'Carême 2026',
          subtitle: data.subtitle || '40 jours de prière, pénitence et partage'
        });
        const content = (data.content as any) || {};
        if (content.days && Array.isArray(content.days) && content.days.length > 0) {
          setDaysData(content.days as CaremDay[]);
        } else {
          // Charger les données par défaut depuis le fichier si aucun jour en BD
          const allDays: CaremDay[] = caremeData.fullProgram.flatMap((week) =>
            week.days.map((day) => ({
              date: day.date,
              title: day.title || '',
              readings: day.readings || '',
              actions: day.actions,
              weekTitle: week.title,
            }))
          );
          setDaysData(allDays);
        }
      } else {
        // Charger les données par défaut depuis le fichier si rien en BD
        const allDays: CaremDay[] = caremeData.fullProgram.flatMap((week) =>
          week.days.map((day) => ({
            date: day.date,
            title: day.title || '',
            readings: day.readings || '',
            actions: day.actions,
            weekTitle: week.title,
          }))
        );
        setDaysData(allDays);
      }
    } catch (err) {
      console.error('Failed to load content', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadContent();
  }, [isAdmin, loadContent]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayChange = (field: string, value: string | object) => {
    if (!editingDay) return;
    
    if (field.startsWith('actions.')) {
      const actionField = field.split('.')[1];
      setEditingDay({
        ...editingDay,
        actions: {
          ...editingDay.actions,
          [actionField]: value as string
        }
      });
    } else {
      setEditingDay({
        ...editingDay,
        [field]: value
      });
    }
  };

  const addOrUpdateDay = async () => {
    if (!editingDay || !editingDay.date) {
      toast.error('Veuillez remplir au moins la date');
      return;
    }

    // Update local state first
    const updatedDays = daysData.map(d => 
      d.date === editingDay.date ? editingDay : d
    );
    
    // If new day, add it
    if (!daysData.some(d => d.date === editingDay.date)) {
      updatedDays.push(editingDay);
    }

    setDaysData(updatedDays);

    // Auto-save to database immediately
    console.log('💾 [Admin] Auto-saving day to database...');
    try {
      const contentData = { days: updatedDays };
      
      const { error: updateError } = await supabase
        .from('page_content')
        .update({
          content: contentData,
          title: formData.title,
          subtitle: formData.subtitle,
          updated_at: new Date().toISOString()
        })
        .eq('page_key', 'careme-2026');

      if (!updateError) {
        console.log('✅ [Admin] Day auto-saved to database!');
      } else {
        console.warn('⚠️ [Admin] Auto-save failed:', updateError);
      }
    } catch (err) {
      console.error('❌ [Admin] Auto-save error:', err);
    }

    setEditingDay(null);
    setShowDayDialog(false);
    toast.success(editingDay.id ? 'Jour mis à jour' : 'Jour ajouté');
  };

  const deleteDay = async (date: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce jour ?')) {
      const updatedDays = daysData.filter(d => d.date !== date);
      setDaysData(updatedDays);

      // Auto-save to database immediately
      console.log('💾 [Admin] Auto-saving deletion to database...');
      try {
        const contentData = { days: updatedDays };
        
        const { error: updateError } = await supabase
          .from('page_content')
          .update({
            content: contentData,
            title: formData.title,
            subtitle: formData.subtitle,
            updated_at: new Date().toISOString()
          })
          .eq('page_key', 'careme-2026');

        if (!updateError) {
          console.log('✅ [Admin] Deletion auto-saved to database!');
        } else {
          console.warn('⚠️ [Admin] Auto-save failed:', updateError);
        }
      } catch (err) {
        console.error('❌ [Admin] Auto-save error:', err);
      }

      toast.success('Jour supprimé');
    }
  };

  const openEditDialog = (day: CaremDay) => {
    setEditingDay({ ...day });
    setShowDayDialog(true);
  };

  const openNewDayDialog = () => {
    setEditingDay({
      date: '',
      title: '',
      readings: '',
      actions: { soi: '', prochain: '', dieu: '' },
      weekTitle: ''
    });
    setShowDayDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const contentData = {
        days: daysData
      };

      console.log('💾 [AdminCareme] Saving - careme-2026, days count:', daysData.length);
      console.log('📋 [AdminCareme] First day being saved:', daysData[0]);

      let saveSuccess = false;

      // Try: First attempt with UPDATE (direct save to table)
      console.log('📝 [AdminCareme] Attempting direct table UPDATE...');
      const { error: updateError } = await supabase
        .from('page_content')
        .update({
          content: contentData,
          title: formData.title,
          subtitle: formData.subtitle,
          updated_at: new Date().toISOString()
        })
        .eq('page_key', 'careme-2026');

      if (!updateError) {
        console.log('✅ [AdminCareme] Direct UPDATE succeeded');
        saveSuccess = true;
      } else {
        console.warn('⚠️ [AdminCareme] Direct UPDATE failed, trying RPC as fallback');
        
        // Fallback: Try RPC if direct update fails
        const { error: rpcError } = await supabase.rpc('update_page_content_data', {
          p_page_key: 'careme-2026',
          p_content: contentData
        });
        
        if (!rpcError) {
          console.log('✅ [AdminCareme] RPC succeeded');
          saveSuccess = true;
        } else {
          console.error('❌ [AdminCareme] Both UPDATE and RPC failed:', rpcError);
          toast.error('Erreur lors de la sauvegarde. Vérifiez que la table page_content existe.');
        }
      }

      if (!saveSuccess) {
        setSaving(false);
        return;
      }

      toast.success('Programme sauvegardé! ✓');
      
      // Wait a bit for DB to settle
      await new Promise(r => setTimeout(r, 1000));
      
      // Reload content to confirm
      console.log('🔄 [AdminCareme] Reloading content...');
      try {
        const { data: freshData, error: loadError } = await supabase
          .from('page_content')
          .select('*')
          .eq('page_key', 'careme-2026')
          .single();
        
        if (loadError) {
          console.warn('⚠️ [AdminCareme] Load error:', loadError);
        } else if (freshData) {
          console.log('✅ [AdminCareme] Fresh data loaded:', freshData.content?.days?.length, 'days');
          setProgramContent(freshData as CaremeProgram);
          if (freshData.content?.days) {
            setDaysData(freshData.content.days as CaremDay[]);
            console.log('✅ [AdminCareme] UI updated with fresh data from DB');
          }
        }
      } catch (reloadErr) {
        console.error('❌ [AdminCareme] Reload failed:', reloadErr);
      }
    } catch (err) {
      toast.error('Une erreur est survenue');
      console.error('❌ [AdminCareme] Error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6">
          <Flame className="h-8 w-8 text-violet-700" /> Gestion du Carême 2026
        </h1>

        <div className="grid gap-6">
          {/* Section 1: Informations générales */}
          <Card className="border-violet-100 dark:border-violet-800">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:bg-gradient-to-r dark:from-violet-950 dark:to-violet-900/50">
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Titre du programme</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Carême 2026"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subtitle">Sous-titre</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => handleFormChange('subtitle', e.target.value)}
                    placeholder="40 jours de prière, pénitence et partage"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="gap-2 bg-violet-700 hover:bg-violet-600"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Section 2: Gestion des jours */}
          <Card className="border-violet-100">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100/50 flex flex-row items-center justify-between space-y-0 dark:bg-gradient-to-r dark:from-violet-950 dark:to-violet-900/50">
              <CardTitle>Jours du programme ({daysData.length})</CardTitle>
              <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openNewDayDialog} className="gap-2 bg-violet-700 hover:bg-violet-600">
                    <Plus className="h-4 w-4" /> Ajouter un jour
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDay?.id ? 'Modifier le jour' : 'Ajouter un nouveau jour'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="sr-only">Formulaire pour {editingDay?.id ? 'modifier' : 'créer'} un jour du programme Carême 2026</div>

                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          value={editingDay?.date || ''}
                          onChange={(e) => handleDayChange('date', e.target.value)}
                          placeholder="Mercredi 18 février"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weekTitle">Semaine</Label>
                        <Input
                          id="weekTitle"
                          value={editingDay?.weekTitle || ''}
                          onChange={(e) => handleDayChange('weekTitle', e.target.value)}
                          placeholder="Semaine 1 de Carême"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">Titre (optionnel)</Label>
                      <Input
                        id="title"
                        value={editingDay?.title || ''}
                        onChange={(e) => handleDayChange('title', e.target.value)}
                        placeholder="Mercredi des Cendres"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="readings">Lectures bibliques</Label>
                      <Textarea
                        id="readings"
                        value={editingDay?.readings || ''}
                        onChange={(e) => handleDayChange('readings', e.target.value)}
                        placeholder="Jl 2,12-18 / Ps 50 / 2 Co 5,20-6,2 / Mt 6,1-6.16-18"
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                      <h4 className="font-semibold text-sm">Actions quotidiennes (3P)</h4>
                      
                      <div>
                        <Label htmlFor="soi">🪞 Soi (action personnelle)</Label>
                        <Textarea
                          id="soi"
                          value={editingDay?.actions?.soi || ''}
                          onChange={(e) => handleDayChange('actions.soi', e.target.value)}
                          placeholder="Faire un examen de conscience approfondi"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="prochain">❤️ Prochain (action envers les autres)</Label>
                        <Textarea
                          id="prochain"
                          value={editingDay?.actions?.prochain || ''}
                          onChange={(e) => handleDayChange('actions.prochain', e.target.value)}
                          placeholder="Demander pardon à une personne que j'ai blessée"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="dieu">🙏 Dieu (action spirituelle)</Label>
                        <Textarea
                          id="dieu"
                          value={editingDay?.actions?.dieu || ''}
                          onChange={(e) => handleDayChange('actions.dieu', e.target.value)}
                          placeholder="Participer à la messe et recevoir les cendres"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                      <Button variant="outline" onClick={() => { setShowDayDialog(false); setEditingDay(null); }}>
                        Annuler
                      </Button>
                      <Button onClick={addOrUpdateDay} className="bg-violet-700 hover:bg-violet-600">
                        {editingDay?.id ? 'Mettre à jour' : 'Ajouter'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="pt-6">
              {daysData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun jour programmé. Commencez par en ajouter un.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {daysData.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-100">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{day.date}</div>
                        {day.title && <div className="text-xs text-violet-700 font-semibold">{day.title}</div>}
                        <div className="text-xs text-gray-600 line-clamp-1 mt-1">{day.weekTitle}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Dialog open={previewingDay?.date === day.date} onOpenChange={(open) => { if (!open) setPreviewingDay(null); }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setPreviewingDay(day)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                            <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{day.date}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {day.title && <p className="text-sm font-semibold text-violet-700">{day.title}</p>}
                              {day.readings && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Lectures</h4>
                                  <p className="text-sm text-gray-600">{day.readings}</p>
                                </div>
                              )}
                              <div className="grid gap-4 mt-4">
                                <div className="bg-violet-50 p-3 rounded-lg dark:bg-violet-950 dark:text-slate-100">
                                  <p className="text-xs font-semibold text-violet-700 mb-1">🪞 Soi</p>
                                  <p className="text-sm">{day.actions.soi}</p>
                                </div>
                                <div className="bg-rose-50 p-3 rounded-lg">
                                  <p className="text-xs font-semibold text-rose-700 mb-1">❤️ Prochain</p>
                                  <p className="text-sm">{day.actions.prochain}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                  <p className="text-xs font-semibold text-amber-700 mb-1">🙏 Dieu</p>
                                  <p className="text-sm">{day.actions.dieu}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openEditDialog(day)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteDay(day.date)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Statistiques */}
          <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:border-violet-800 dark:bg-gradient-to-br dark:from-violet-950 dark:to-violet-900/50">
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-violet-100 dark:bg-slate-900 dark:border-violet-800 dark:text-slate-100">
                  <div className="text-2xl font-bold text-violet-700">{daysData.length}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Jours programmés</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-violet-100 dark:bg-slate-900 dark:border-violet-800 dark:text-slate-100">
                  <div className="text-2xl font-bold text-violet-700">{daysData.filter(d => d.title).length}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Jours avec titre spécial</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-violet-100 dark:bg-slate-900 dark:border-violet-800 dark:text-slate-100">
                  <div className="text-2xl font-bold text-violet-700">40</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Jours requis</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminCareme2026;
