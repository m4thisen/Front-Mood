import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/i18n';

/** Sincroniza el idioma guardado en el perfil con el i18n activo al cargar la app. */
export const LanguageSync: React.FC = () => {
  const { profile } = useApp();
  const { language, setLanguage } = useTranslation();

  useEffect(() => {
    if (profile?.language && profile.language !== language) {
      setLanguage(profile.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.language]);

  return null;
};
