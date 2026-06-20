import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, profile: null }),
    }),
    { name: 'yw-auth', partialize: (s) => ({ profile: s.profile }) }
  )
);

// ── App Store (pieces, prompts, settings) ────────────────────
export const useAppStore = create(
  persist(
    (set, get) => ({
      // Writing
      pieces: [],
      drafts: {},
      currentDraft: null,

      // Accessibility
      dyslexicMode: false,
      highContrast: false,
      largText: false,
      language: 'en',

      // Gamification
      badges: [],
      xp: 0,
      streak: 0,

      // Actions
      addPiece: (piece) =>
        set((s) => ({ pieces: [piece, ...s.pieces] })),

      updatePiece: (id, updates) =>
        set((s) => ({
          pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      saveDraft: (key, content) =>
        set((s) => ({ drafts: { ...s.drafts, [key]: { content, savedAt: new Date().toISOString() } } })),

      getDraft: (key) => get().drafts[key],

      clearDraft: (key) =>
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[key];
          return { drafts };
        }),

      setLanguage: (language) => set({ language }),
      toggleDyslexicMode: () =>
        set((s) => {
          document.body.classList.toggle('dyslexic-mode', !s.dyslexicMode);
          return { dyslexicMode: !s.dyslexicMode };
        }),
      toggleHighContrast: () =>
        set((s) => {
          document.body.classList.toggle('high-contrast', !s.highContrast);
          return { highContrast: !s.highContrast };
        }),

      awardBadge: (badge) =>
        set((s) => {
          if (s.badges.find((b) => b.id === badge.id)) return {};
          return { badges: [...s.badges, { ...badge, earnedAt: new Date().toISOString() }] };
        }),

      addXP: (amount) => set((s) => ({ xp: s.xp + amount })),
    }),
    {
      name: 'yw-app',
      partialize: (s) => ({
        pieces: s.pieces,
        drafts: s.drafts,
        dyslexicMode: s.dyslexicMode,
        highContrast: s.highContrast,
        language: s.language,
        badges: s.badges,
        xp: s.xp,
        streak: s.streak,
      }),
    }
  )
);

// ── Community Store ──────────────────────────────────────────
export const useCommunityStore = create((set) => ({
  feed: [],
  setFeed: (feed) => set({ feed }),
  addToFeed: (post) => set((s) => ({ feed: [post, ...s.feed] })),
  toggleReaction: (postId) =>
    set((s) => ({
      feed: s.feed.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              hearts: p.liked ? p.hearts - 1 : p.hearts + 1,
            }
          : p
      ),
    })),
}));
