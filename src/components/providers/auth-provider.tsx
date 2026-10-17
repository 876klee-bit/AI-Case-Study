'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { loadRemote, setSyncUser } from '@/services/supabase-sync';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useProjectStore } from '@/store/useProjectStore';
import type { UserProfile } from '@/types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  configured: false,
  signOut: async () => {},
  refresh: async () => {},
});

function toProfile(user: User | null): UserProfile | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name: meta.full_name ?? meta.name ?? meta.user_name ?? null,
    avatarUrl: meta.avatar_url ?? null,
  };
}

async function pullRemote() {
  const snapshot = await loadRemote();
  if (!snapshot) return;
  useProjectStore.getState().mergeRemote(snapshot.projects);
  useChatStore.getState().mergeRemote(snapshot.chats, snapshot.messages, snapshot.files);
  useArtifactStore.getState().mergeRemote(snapshot.artifacts, snapshot.versions);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let lastUserId: string | null = null;
    const apply = (u: User | null) => {
      const profile = toProfile(u);
      setUser(profile);
      setSyncUser(profile?.id ?? null);
      if (profile && profile.id !== lastUserId) void pullRemote();
      lastUserId = profile?.id ?? null;
      setLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => apply(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      signOut: async () => {
        await getBrowserSupabase()?.auth.signOut();
        setSyncUser(null);
        setUser(null);
      },
      refresh: async () => {
        const { data } = (await getBrowserSupabase()?.auth.getUser()) ?? { data: { user: null } };
        setUser(toProfile(data.user));
        await pullRemote();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
