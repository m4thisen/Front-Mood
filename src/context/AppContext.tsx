import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Storage from '@/persistencia/almacenamientoLocal';
import { CustomTag, DayEntry, EntriesByDate, UserProfile } from '@/types/models';
import { todayISO } from '@/utils/fecha';
import { computeSoulColor, computeStreak } from '@/servicios/CalculadoraProgreso';

const DRAFT_PROFILE: UserProfile = {
  name: '',
  birthDate: '',
  gender: 'prefer_not_to_say',
  language: 'es',
  selectedBlocks: [],
  selectedSpecialBlocks: [],
  customTags: [],
  notificationHour: 21,
  notificationMinute: 0,
  onboardingComplete: false,
};

interface AppContextValue {
  isLoading: boolean;
  profile: UserProfile | null;
  entries: EntriesByDate;
  streak: number;
  soulColor: string | null;
  todayEntry: DayEntry | null;

  beginOnboarding: () => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addCustomTag: (tag: CustomTag) => void;
  removeCustomTag: (id: string) => void;
  saveEntry: (entry: DayEntry) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<EntriesByDate>({});

  useEffect(() => {
    (async () => {
      const [storedProfile, storedEntries] = await Promise.all([
        Storage.loadProfile(),
        Storage.loadEntries(),
      ]);
      setProfile(storedProfile);
      setEntries(storedEntries);
      setIsLoading(false);
    })();
  }, []);

  const persistProfile = useCallback((next: UserProfile) => {
    setProfile(next);
    Storage.saveProfile(next);
  }, []);

  const beginOnboarding = useCallback(() => {
    persistProfile({ ...DRAFT_PROFILE });
  }, [persistProfile]);

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      persistProfile({ ...(profile ?? DRAFT_PROFILE), ...partial });
    },
    [profile, persistProfile]
  );

  const completeOnboarding = useCallback(() => {
    persistProfile({ ...(profile ?? DRAFT_PROFILE), onboardingComplete: true });
  }, [profile, persistProfile]);

  const addCustomTag = useCallback(
    (tag: CustomTag) => {
      if (!profile) return;
      persistProfile({ ...profile, customTags: [...profile.customTags, tag] });
    },
    [profile, persistProfile]
  );

  const removeCustomTag = useCallback(
    (id: string) => {
      if (!profile) return;
      persistProfile({ ...profile, customTags: profile.customTags.filter((t) => t.id !== id) });
    },
    [profile, persistProfile]
  );

  const saveEntry = useCallback(async (entry: DayEntry) => {
    const next = await Storage.upsertEntry(entry);
    setEntries(next);
  }, []);

  const logout = useCallback(async () => {
    await Storage.clearAllData();
    setProfile(null);
    setEntries({});
  }, []);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const soulColor = useMemo(() => computeSoulColor(entries), [entries]);
  const todayEntry = useMemo(() => entries[todayISO()] ?? null, [entries]);

  const value: AppContextValue = {
    isLoading,
    profile,
    entries,
    streak,
    soulColor,
    todayEntry,
    beginOnboarding,
    updateProfile,
    completeOnboarding,
    addCustomTag,
    removeCustomTag,
    saveEntry,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
