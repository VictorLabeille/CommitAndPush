import { ghostFor } from '../ghost';
import { makeExercise, makeSession, makeSet } from './fixtures';

const EID = 'exo-dc';

describe('ghostFor (cahier §6.2)', () => {
  it('renvoie null pour un exercice jamais réalisé', () => {
    const sessions = [
      makeSession({ exercises: [makeExercise('Autre', [makeSet(50, 10)], 'active', 'autre')] }),
    ];
    expect(ghostFor(EID, sessions)).toBeNull();
  });

  it('prend la dernière séance completed (endTime décroissant)', () => {
    const older = makeSession({
      endTime: 1000,
      exercises: [makeExercise('Développé', [makeSet(70, 10)], 'active', EID)],
    });
    const newer = makeSession({
      endTime: 2000,
      exercises: [makeExercise('Développé', [makeSet(80, 10), makeSet(80, 8)], 'active', EID)],
    });
    expect(ghostFor(EID, [older, newer])).toBe('Dern. : 80kg×10, 80kg×8');
  });

  it('n’affiche que les séries validées', () => {
    const session = makeSession({
      endTime: 2000,
      exercises: [
        makeExercise('Développé', [makeSet(80, 10), makeSet(80, 8), makeSet(80, 6, false)], 'active', EID),
      ],
    });
    expect(ghostFor(EID, [session])).toBe('Dern. : 80kg×10, 80kg×8');
  });

  it('ignore les séances plus récentes sans série validée pour cet exercice', () => {
    const withData = makeSession({
      endTime: 2000,
      exercises: [makeExercise('Développé', [makeSet(80, 10)], 'active', EID)],
    });
    const recentNoCompleted = makeSession({
      endTime: 3000,
      exercises: [makeExercise('Développé', [makeSet(90, 10, false)], 'active', EID)],
    });
    expect(ghostFor(EID, [withData, recentNoCompleted])).toBe('Dern. : 80kg×10');
  });

  it('ignore les séances non terminées (status actif)', () => {
    const active = makeSession({
      status: 'active',
      endTime: 9000,
      exercises: [makeExercise('Développé', [makeSet(85, 10)], 'active', EID)],
    });
    expect(ghostFor(EID, [active])).toBeNull();
  });

  it('affiche « PdC » pour le poids de corps', () => {
    const session = makeSession({
      endTime: 2000,
      exercises: [makeExercise('Tractions', [makeSet(0, 12), makeSet(0, 10)], 'active', EID)],
    });
    expect(ghostFor(EID, [session])).toBe('Dern. : PdC×12, PdC×10');
  });
});
