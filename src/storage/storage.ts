import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './keys';
import { DayEntry, EntriesByDate, UserProfile } from '@/types/models';

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.profile);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export async function loadEntries(): Promise<EntriesByDate> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.entries);
  return raw ? (JSON.parse(raw) as EntriesByDate) : {};
}

export async function saveEntries(entries: EntriesByDate): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

export async function upsertEntry(entry: DayEntry): Promise<EntriesByDate> {
  const current = await loadEntries();
  const next = { ...current, [entry.date]: entry };
  await saveEntries(next);
  return next;
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.profile, STORAGE_KEYS.entries]);
}
