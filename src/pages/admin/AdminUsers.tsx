import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import AdminLoadingSpinner from '@/components/admin/AdminLoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Users, Shield, Trash2, AlertCircle, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin_principal' | 'admin' | 'moderator' | 'user';
  created_at?: string;
}

type UserPermission = 
  | 'manage_readings'
  | 'manage_prayers'
  | 'manage_gallery'
  | 'manage_users'
  | 'manage_contacts'
  | 'view_contacts'
  | 'create_notifications'
  | 'moderate_content'
  | 'manage_activities'
  | 'manage_faq'
  | 'manage_about'
  | 'view_analytics';

interface UserPermissionData {
  user_id: string;
  permission: UserPermission;
  granted_at: string;
}

const AVAILABLE_PERMISSIONS: { id: UserPermission; label: string; category: string }[] = [
  // Content Management
  { id: 'manage_readings', label: 'Gérer les lectures bibliques', category: 'Contenu' },
  { id: 'manage_prayers', label: 'Gérer les prières', category: 'Contenu' },
  { id: 'manage_gallery', label: 'Gérer la galerie', category: 'Contenu' },
  { id: 'manage_activities', label: 'Gérer les activités', category: 'Contenu' },
  { id: 'manage_faq', label: 'Gérer la FAQ', category: 'Contenu' },
  { id: 'manage_about', label: 'Gérer la page À propos', category: 'Contenu' },
  { id: 'moderate_content', label: 'Modérer les contenus', category: 'Contenu' },
  // User Management
  { id: 'manage_users', label: 'Gérer les utilisateurs', category: 'Utilisateurs' },
  // Communications
  { id: 'manage_contacts', label: 'Gérer les contacts (voir/supprimer)', category: 'Communications' },
  { id: 'view_contacts', label: 'Voir les contacts (lecture seule)', category: 'Communications' },
  { id: 'create_notifications', label: 'Créer des notifications', category: 'Communications' },
  // Analytics
  { id: 'view_analytics', label: 'Voir les analytics', category: 'Analytics' },
];

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isAdmin, adminRole, loading: authLoading } = useAdmin();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<UserPermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<UserPermission>>(new Set());

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        navigate('/');
      } else {
        loadData();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesRes, rolesRes, permissionsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('user_permissions').select('*')
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (rolesRes.data) setRoles(rolesRes.data);
      if (permissionsRes.data) setPermissions(permissionsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissions = (userId: string): UserPermission[] => {
    return permissions
      .filter(p => p.user_id === userId)
      .map(p => p.permission);
  };

  const getUserRole = (userId: string): UserRole['role'] => {
    const role = roles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const getRoleLabel = (role: UserRole['role']) => {
    switch (role) {
      case 'admin_principal': return '👑 Admin Principal';
      case 'admin': return '🔐 Admin';
      case 'moderator': return '📋 Modérateur';
      default: return 'Utilisateur';
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole['role']) => {
    try {
      const currentRole = getUserRole(userId);
      
      if (currentRole !== 'user') {
        const deleteRes = await supabase.from('user_roles').delete().eq('user_id', userId);
        if (deleteRes.error) {
          console.error('❌ Delete role error:', deleteRes.error);
          toast.error('Erreur: ' + deleteRes.error.message);
          return;
        }
      }

      if (newRole !== 'user') {
        const insertRes = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
        if (insertRes.error) {
          console.error('❌ Insert role error:', insertRes.error);
          toast.error('Erreur: ' + insertRes.error.message);
          return;
        }
      }

      console.log('✅ Rôle mis à jour');
      toast.success('Rôle mis à jour');
      loadData();
    } catch (error) {
      console.error('❌ Exception:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openPermissionDialog = (userId: string) => {
    const userPermissions = getUserPermissions(userId);
    setSelectedUserId(userId);
    setSelectedPermissions(new Set(userPermissions));
    setPermissionDialogOpen(true);
  };

  const savePermissions = async () => {
    if (!selectedUserId) return;
    try {
      // Delete existing permissions
      const deleteRes = await supabase.from('user_permissions').delete().eq('user_id', selectedUserId);
      if (deleteRes.error) {
        console.error('❌ Delete permissions error:', deleteRes.error);
      }
      
      // Insert new permissions
      if (selectedPermissions.size > 0) {
        const newPermissions = Array.from(selectedPermissions).map(permission => ({
          user_id: selectedUserId,
          permission,
          granted_by: user?.id
        }));
        const insertRes = await supabase.from('user_permissions').insert(newPermissions);
        if (insertRes.error) {
          console.error('❌ Insert permissions error:', insertRes.error);
          toast.error('Erreur: ' + insertRes.error.message);
          return;
        }
      }

      console.log('✅ Permissions mises à jour');
      toast.success('Permissions mises à jour');
      setPermissionDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('❌ Exception:', error);
      toast.error('Erreur lors de la mise à jour des permissions');
    }
  };

  const togglePermission = (permission: UserPermission) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const deleteUser = async () => {
    if (!selectedUserId) return;
    try {
      console.log('🗑️ Deleting user:', selectedUserId);
      
      // Supprimer d'abord les rôles
      const deleteRolesRes = await supabase.from('user_roles').delete().eq('user_id', selectedUserId);
      if (deleteRolesRes.error) console.warn('⚠️ Delete roles error:', deleteRolesRes.error);
      else console.log('✅ Roles deleted');
      
      // Supprimer les permissions
      const deletePermsRes = await supabase.from('user_permissions').delete().eq('user_id', selectedUserId);
      if (deletePermsRes.error) console.warn('⚠️ Delete permissions error:', deletePermsRes.error);
      else console.log('✅ Permissions deleted');
      
      // Puis supprimer le profil
      const deleteProfileRes = await supabase.from('profiles').delete().eq('id', selectedUserId);
      if (deleteProfileRes.error) {
        console.error('❌ Delete profile error:', deleteProfileRes.error);
        toast.error('Erreur: ' + deleteProfileRes.error.message);
        return;
      }
      
      console.log('✅ User deleted successfully');
      toast.success('Utilisateur supprimé');
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('❌ Exception:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading || authLoading) return <AdminLoadingSpinner />;
  // Tous les admins peuvent accéder à cette page
  if (!user || !isAdmin) return null;
  
  const isMainAdmin = adminRole === 'admin_principal';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Users className="h-8 w-8" /> Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="h-4 w-4" /> 
            {isMainAdmin ? 'Vous êtes Admin Principal' : `Vous êtes ${adminRole === 'moderator' ? 'Modérateur' : 'Admin'}`}
          </p>
          {isMainAdmin && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded ml-2">
              Permissions complètes
            </span>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {profiles.length} utilisateur(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const role = getUserRole(profile.id);
                  const isCurrentUser = user?.id === profile.id;
                  
                  return (
                    <TableRow key={profile.id} className={isCurrentUser ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">
                        {profile.full_name || 'Non renseigné'}
                        {isCurrentUser && <span className="ml-2 text-xs text-primary">(Vous)</span>}
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            role === 'admin_principal' ? 'default' :
                            role === 'admin' ? 'secondary' :
                            role === 'moderator' ? 'outline' :
                            'secondary'
                          }
                          className={role === 'admin_principal' ? 'bg-gradient-peace' : ''}
                        >
                          {getRoleLabel(role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {isMainAdmin && !isCurrentUser && (
                          <>
                            <Select value={role} onValueChange={(newRole: any) => updateUserRole(profile.id, newRole)}>
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="moderator">Modérateur</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {role !== 'user' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openPermissionDialog(profile.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedUserId(profile.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isMainAdmin && (
                          <span className="text-xs text-muted-foreground">Lecture seule</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={deleteUser} className="bg-destructive">
            Supprimer
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md md:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gérer les permissions</DialogTitle>
            <DialogDescription>
              Sélectionnez les permissions à accorder à cet utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {['Contenu', 'Utilisateurs', 'Communications', 'Analytics'].map(category => (
              <div key={category}>
                <h3 className="font-semibold mb-3 text-sm">{category}</h3>
                <div className="space-y-2 pl-4">
                  {AVAILABLE_PERMISSIONS.filter(p => p.category === category).map(permission => (
                    <div key={permission.id} className="flex items-center gap-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <label 
                        htmlFor={permission.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={savePermissions}>
              Enregistrer les permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
