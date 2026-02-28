import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AdminRole = 'admin_principal' | 'admin' | 'moderator' | null;

// Cache local pour éviter de re-vérifier trop souvent
const roleCache = new Map<string, { role: AdminRole; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 secondes pour plus de réactivité

// Fonction globale pour réinitialiser le cache (utile pour debug)
export const resetAdminCache = () => {
  console.log('🔄 [useAdmin] Clearing role cache');
  roleCache.clear();
};

// Expose debug functions to window
if (typeof window !== 'undefined') {
  (window as any).__DEBUG_resetAdminCache = resetAdminCache;
}

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    mountedRef.current = true;

    const promiseWithTimeout = <T,>(p: Promise<T>, ms = 5000) => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), ms);
      p.then((res) => {
        clearTimeout(timer);
        resolve(res);
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  };

  const checkUserRoles = async (userId: string, email?: string) => {
    try {
      console.log('🔍 [useAdmin] Checking roles for user:', userId);

      // Check cache first
      const cached = roleCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('💾 [useAdmin] Using cached role:', cached.role);
        if (mountedRef.current) {
          setIsAdmin(cached.role !== null);
          setAdminRole(cached.role);
          setLoading(false);
          setChecked(true);
        }
        return;
      }

      // Query user roles with retries + timeout
      console.log('📝 [useAdmin] Querying user_roles table with retries...');
      let attempts = 0;
      let lastError: any = null;
      let roles: any = null;

      while (attempts < 3) {
        attempts += 1;
        try {
          console.log(`⏱ [useAdmin] Attempt ${attempts} - querying user_roles`);
          const res = await promiseWithTimeout(
            supabase.from('user_roles').select('role').eq('user_id', userId),
            4000
          );
          // supabase returns { data, error }
          const { data, error } = res as any;
          if (error) throw error;
          roles = data;
          lastError = null;
          break;
        } catch (e) {
          console.warn(`⚠️ [useAdmin] Attempt ${attempts} failed:`, e?.message || e);
          lastError = e;
          // small backoff
          await new Promise((r) => setTimeout(r, attempts * 300));
        }
      }

      if (!mountedRef.current) return;

      if (lastError) {
        console.error('❌ [useAdmin] All attempts failed:', lastError);
        // keep cached state if present, otherwise fail gracefully
        setLoading(false);
        setChecked(true);
        return;
      }

      // Ensure ahdybau@gmail.com is always admin_principal
      if (email === 'ahdybau@gmail.com') {
        console.log('👑 [useAdmin] Principal admin detected (ahdybau@gmail.com), ensuring admin_principal role...');
        
        // Check if they have admin_principal role
        const hasAdminPrincipal = roles && roles.some((r: any) => r.role === 'admin_principal');
        
        if (!hasAdminPrincipal) {
          // Delete all existing roles and set admin_principal
          console.log('👑 [useAdmin] Setting ahdybau@gmail.com as admin_principal...');
          
          await supabase.from('user_roles').delete().eq('user_id', userId);
          
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'admin_principal' });
          
          if (!insertError) {
            console.log('✅ [useAdmin] ahdybau@gmail.com confirmed as admin_principal');
            roles = [{ role: 'admin_principal' }];
          } else {
            console.error('❌ [useAdmin] Failed to set admin_principal:', insertError);
          }
        }
      }

      handleRoles(roles, userId);
    } catch (err) {
      console.error('❌ [useAdmin] Exception:', err);
      // Don't reset on error
      setLoading(false);
      setChecked(true);
    }
  };

    const handleRoles = (roles: any[], userId: string) => {
      console.log('📋 [useAdmin] Found', roles?.length || 0, 'role(s)');
      
      let foundRole: AdminRole = null;

      if (roles && roles.length > 0) {
        if (roles.some((r: any) => r.role === 'admin_principal')) {
          foundRole = 'admin_principal';
          console.log('👑 [useAdmin] Has admin_principal');
        } else if (roles.some((r: any) => r.role === 'admin')) {
          foundRole = 'admin';
          console.log('🛡️ [useAdmin] Has admin');
        } else if (roles.some((r: any) => r.role === 'moderator')) {
          foundRole = 'moderator';
          console.log('📢 [useAdmin] Has moderator');
        }
      }

      // Cache the result
      roleCache.set(userId, { role: foundRole, timestamp: Date.now() });

      if (foundRole) {
        console.log('🎉 [useAdmin] isAdmin = TRUE, role = ' + foundRole);
        if (mountedRef.current) {
          setIsAdmin(true);
          setAdminRole(foundRole);
        }
      } else {
        console.log('❌ [useAdmin] No admin role found');
        if (mountedRef.current) {
          setIsAdmin(false);
          setAdminRole(null);
        }
      }
      
      if (mountedRef.current) {
        setLoading(false);
        setChecked(true);
      }
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mountedRef.current) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await checkUserRoles(currentUser.id, currentUser.email);
      } else {
        setLoading(false);
        setChecked(true);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        const currentUser = session?.user ?? null;
        console.log('🔄 [useAuth] Auth state changed:', event, currentUser?.id);
        setUser(currentUser);
        
        if (currentUser) {
          setLoading(true);
          await checkUserRoles(currentUser.id, currentUser.email);
        } else {
          setIsAdmin(false);
          setAdminRole(null);
          setLoading(false);
          setChecked(true);
        }
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { user, isAdmin, adminRole, loading, checked };
};
