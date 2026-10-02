import { BlockCategoryKey, SpecialBlockKey } from '@/types/models';

export interface BlockOption {
  id: string; // clave estable, ej "trabajo.vacaciones"
  labelKey: string; // clave de traducción
}

export interface BlockCategory {
  key: BlockCategoryKey;
  icon: string; // emoji simple, sin dependencias extra de íconos
  titleKey: string;
  options: BlockOption[];
}

const makeOptions = (category: BlockCategoryKey, keys: string[]): BlockOption[] =>
  keys.map((k) => ({ id: `${category}.${k}`, labelKey: `blockOption.${category}.${k}` }));

export const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    key: 'estudios',
    icon: '📚',
    titleKey: 'block.estudios',
    options: makeOptions('estudios', ['examen', 'entrega', 'clase', 'estudie', 'aprobe']),
  },
  {
    key: 'descanso',
    icon: '🌙',
    titleKey: 'block.descanso',
    options: makeOptions('descanso', ['dormiBien', 'dormiMal', 'siesta', 'diaLibre']),
  },
  {
    key: 'hobbies',
    icon: '🎨',
    titleKey: 'block.hobbies',
    options: makeOptions('hobbies', ['lei', 'jugue', 'pinte', 'cocine', 'musica']),
  },
  {
    key: 'emociones',
    icon: '💫',
    titleKey: 'block.emociones',
    options: makeOptions('emociones', ['alegria', 'tristeza', 'ansiedad', 'calma', 'enojo']),
  },
  {
    key: 'trabajo',
    icon: '💼',
    titleKey: 'block.trabajo',
    options: makeOptions('trabajo', ['vacaciones', 'horasExtras', 'saliATiempo', 'reunionDificil', 'logro']),
  },
  {
    key: 'autocuidado',
    icon: '🫧',
    titleKey: 'block.autocuidado',
    options: makeOptions('autocuidado', ['meditacion', 'journaling', 'terapia', 'tiempoASolas']),
  },
  {
    key: 'salud',
    icon: '🩺',
    titleKey: 'block.salud',
    options: makeOptions('salud', ['medico', 'tomePastillas', 'meSentiMal', 'chequeo']),
  },
  {
    key: 'amor',
    icon: '❤️',
    titleKey: 'block.amor',
    options: makeOptions('amor', ['cita', 'conversacionLinda', 'discusion', 'extranoAAlguien']),
  },
  {
    key: 'tiempo',
    icon: '⏳',
    titleKey: 'block.tiempo',
    options: makeOptions('tiempo', ['tiempoLibre', 'ocupado', 'llegueTarde', 'llegueTemprano']),
  },
  {
    key: 'gente',
    icon: '👥',
    titleKey: 'block.gente',
    options: makeOptions('gente', ['saliConAmigos', 'enFamilia', 'estuveSolo', 'conociAAlguien']),
  },
  {
    key: 'ejercicio',
    icon: '🏃',
    titleKey: 'block.ejercicio',
    options: makeOptions('ejercicio', ['camine', 'gimnasio', 'corri', 'yoga', 'noHiceNada']),
  },
  {
    key: 'comidas',
    icon: '🍽️',
    titleKey: 'block.comidas',
    options: makeOptions('comidas', ['cocine', 'comiAfuera', 'comidaSaludable', 'comiDeMas', 'salteeComida']),
  },
  {
    key: 'eventos',
    icon: '🎉',
    titleKey: 'block.eventos',
    options: makeOptions('eventos', ['cumpleanos', 'viaje', 'celebracion', 'imprevisto']),
  },
];

export const ALL_OPTIONS: BlockOption[] = BLOCK_CATEGORIES.flatMap((c) => c.options);

export const getOptionLabelKey = (id: string): string =>
  ALL_OPTIONS.find((o) => o.id === id)?.labelKey ?? id;

export const getOptionCategoryIcon = (id: string): string => {
  const categoryKey = id.split('.')[0];
  return BLOCK_CATEGORIES.find((c) => c.key === categoryKey)?.icon ?? '✨';
};

export interface SpecialBlock {
  key: SpecialBlockKey;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

export const SPECIAL_BLOCKS: SpecialBlock[] = [
  { key: 'musica', icon: '🎧', titleKey: 'special.musica', descriptionKey: 'special.musica.desc' },
  { key: 'clima', icon: '☁️', titleKey: 'special.clima', descriptionKey: 'special.clima.desc' },
  { key: 'ejercicio', icon: '⚡️', titleKey: 'special.ejercicio', descriptionKey: 'special.ejercicio.desc' },
  { key: 'sueno', icon: '💤', titleKey: 'special.sueno', descriptionKey: 'special.sueno.desc' },
];
