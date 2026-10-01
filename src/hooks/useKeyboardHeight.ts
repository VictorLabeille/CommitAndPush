import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

/**
 * Hauteur de clavier qui recouvre RÉELLEMENT le bas de la fenêtre (0 s'il est masqué).
 *
 * Robuste y compris sous le mode edge-to-edge d'Android (SDK 56), où la fenêtre
 * n'est plus redimensionnée automatiquement : le clavier recouvre alors l'UI tant
 * qu'on ne décale pas le contenu nous-mêmes. iOS émet les évènements `Will*`
 * (animés, synchrones avec la transition) ; Android les `Did*`.
 *
 * On déduit la hauteur du HAUT du clavier (`endCoordinates.screenY`) plutôt que de
 * `endCoordinates.height` : sous edge-to-edge, `height` englobe la barre de
 * navigation et dépasse le bas de la fenêtre, ce qui faisait remonter les bottom
 * sheets trop haut (espace vide entre le clavier et le sheet). `screenH - screenY`
 * donne le recouvrement exact, identique sur iOS (où le clavier touche le bas).
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => {
      const { screenY, height: rawHeight } = e.endCoordinates;
      const overlap = screenY != null ? Dimensions.get('window').height - screenY : rawHeight;
      setHeight(Math.max(0, overlap));
    });
    const hide = Keyboard.addListener(hideEvt, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

/**
 * Ordonnée (dans la fenêtre) du HAUT du clavier, `null` s'il est masqué.
 *
 * Pour un conteneur qui ne touche pas le bas de la fenêtre — un écran d'onglet s'arrête
 * au-dessus de la barre d'onglets — `useKeyboardHeight` surestime le décalage : la partie
 * du clavier qui recouvre la barre d'onglets ne recouvre pas le conteneur. Le bon
 * décalage est `bas du conteneur − haut du clavier` (cf. `BottomSheet`).
 */
export function useKeyboardTop(): number | null {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => {
      const { screenY, height } = e.endCoordinates;
      setTop(screenY ?? Dimensions.get('window').height - height);
    });
    const hide = Keyboard.addListener(hideEvt, () => setTop(null));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return top;
}
