/**
 * Map des polices à charger via `useFonts` au démarrage (cf. src/app/_layout.tsx).
 * Les clés DOIVENT correspondre aux `fontFamily` utilisés dans typography.ts.
 */
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

export const fontMap = {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
};
