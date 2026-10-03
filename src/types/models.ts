export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type Language = 'es' | 'en';

export type Gender = 'female' | 'male' | 'nonbinary' | 'prefer_not_to_say';

export type BlockCategoryKey =
  | 'estudios'
  | 'descanso'
  | 'hobbies'
  | 'emociones'
  | 'trabajo'
  | 'autocuidado'
  | 'salud'
  | 'amor'
  | 'tiempo'
  | 'gente'
  | 'ejercicio'
  | 'comidas'
  | 'eventos';

export type SpecialBlockKey = 'musica' | 'clima' | 'ejercicio' | 'sueno';

export type WeatherOption = 'soleado' | 'nublado' | 'lluvia' | 'frio' | 'calor';

export interface CustomTag {
  id: string;
  label: string;
  type: 'boolean' | 'text';
}

/** Perfil armado durante el onboarding. */
export interface UserProfile {
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  gender: Gender;
  language: Language;
  selectedBlocks: BlockCategoryKey[];
  selectedSpecialBlocks: SpecialBlockKey[];
  customTags: CustomTag[];
  notificationHour: number; // 0-23
  notificationMinute: number; // 0-59
  onboardingComplete: boolean;
}

/** Registro de un día puntual. */
export interface DayEntry {
  date: string; // ISO yyyy-mm-dd, clave del registro
  mood: MoodLevel;
  note: string;
  loggedAtHour: number; // hora del día en que se registró (0-23)
  selectedOptions: string[]; // ids de opciones de bloques tageadas ese día
  customTagValues: Record<string, boolean | string>; // id de CustomTag -> valor
  song?: string; // "canción del día" (texto libre en este boceto)
  weather?: WeatherOption;
  exerciseMinutes?: number;
  sleepHours?: number;
  photoUri?: string;
  favorite?: boolean;
}

export type EntriesByDate = Record<string, DayEntry>;
