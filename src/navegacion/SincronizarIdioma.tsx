import { useEffect } from 'react';
import { useSesionStore } from '@/stores/SesionStore';
import { useTranslation } from '@/i18n';

/** Aplica a la interfaz el idioma guardado en las preferencias del usuario. */
export const SincronizarIdioma: React.FC = () => {
  const idioma = useSesionStore((s) => s.usuario?.idioma);
  const { language, setLanguage } = useTranslation();

  useEffect(() => {
    if (idioma && idioma !== language) setLanguage(idioma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idioma]);

  return null;
};
