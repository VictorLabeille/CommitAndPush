import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Hauteur courante du clavier (0 s'il est masqué).
 *
 * Robuste y compris sous le mode edge-to-edge d'Android (SDK 56), où la fenêtre
 * n'est plus redimensionnée automatiquement : le clavier recouvre alors l'UI tant
 * qu'on ne décale pas le contenu nous-mêmes. iOS émet les évènements `Will*`
 * (animés, synchrones avec la transition) ; Android les `Did*`.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvt, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
