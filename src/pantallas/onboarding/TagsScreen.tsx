import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PasoOnboarding } from '@/componentes/PasoOnboarding';
import { Boton } from '@/componentes/Boton';
import { EditorTags } from '@/componentes/EditorTags';
import { useTranslation } from '@/i18n';
import { useTagsActivos } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';

type Props = NativeStackScreenProps<RootStackParamList, 'Tags'>;

/** Paso 3 del onboarding, opcional: tags propios del usuario (CU-04, pasos 5 y 6). */
export const TagsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const tags = useTagsActivos();

  return (
    <PasoOnboarding
      paso={2}
      titulo={t('steps.tagsTitle')}
      subtitulo={t('steps.tagsSubtitle')}
      onAtras={() => navigation.goBack()}
      pie={
        <Boton
          titulo={tags.length > 0 ? t('common.continue') : t('common.skip')}
          variante={tags.length > 0 ? 'primario' : 'secundario'}
          onPress={() => navigation.navigate('Recordatorio')}
        />
      }
    >
      <EditorTags />
    </PasoOnboarding>
  );
};
