"use client";

import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/auth/supabase-browser";
import type { UserProfile } from "@/types/auth";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    // Mock 开发模式：直接以本地开发用户登录
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
      const mockUser = {
        id: "mock-user-001",
        email: "dev@example.com",
      } as User;
      set({ user: mockUser, isLoading: false });
      set({
        profile: {
          id: mockUser.id,
          email: mockUser.email ?? "dev@example.com",
          username: "开发用户",
          avatar_url: null,
          storage_used: 0,
          storage_limit: 1073741824,
          role: "admin",
          created_at: new Date().toISOString(),
        },
      });
      return;
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      set({ user: session.user, isLoading: false });
      await get().refreshProfile();
    } else {
      set({ user: null, profile: null, isLoading: false });
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (session?.user) {
        set({ user: session.user });
        await get().refreshProfile();
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signUp: async (email, password, username) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };

    // 如果注册成功且返回了 session（邮箱验证关闭时）
    if (data.user) {
      // 等待触发器创建 profile
      await new Promise((r) => setTimeout(r, 500));
      await get().refreshProfile();
    }

    return { error: null };
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  resetPassword: async (email) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password?step=reset`,
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      set({ profile: data as UserProfile });
    }
  },
}));
