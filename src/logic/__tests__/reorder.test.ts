import { moveInGroup, moveItem } from '../reorder';

describe('moveItem', () => {
  it('déplace un élément vers le bas (dir +1)', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('déplace un élément vers le haut (dir -1)', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
  });

  it('préserve l’ordre relatif des autres éléments', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 1, 1)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('no-op (même référence) si on monte le premier élément', () => {
    const arr = ['a', 'b', 'c'];
    expect(moveItem(arr, 0, -1)).toBe(arr);
  });

  it('no-op (même référence) si on descend le dernier élément', () => {
    const arr = ['a', 'b', 'c'];
    expect(moveItem(arr, 2, 1)).toBe(arr);
  });

  it('no-op sur une liste à un seul élément', () => {
    const arr = ['a'];
    expect(moveItem(arr, 0, 1)).toBe(arr);
    expect(moveItem(arr, 0, -1)).toBe(arr);
  });

  it('no-op si l’index est hors bornes', () => {
    const arr = ['a', 'b'];
    expect(moveItem(arr, 5, -1)).toBe(arr);
    expect(moveItem(arr, -1, 1)).toBe(arr);
  });

  it('ne mute pas le tableau d’entrée', () => {
    const arr = ['a', 'b', 'c'];
    const copy = [...arr];
    moveItem(arr, 0, 1);
    expect(arr).toEqual(copy);
  });
});

describe('moveInGroup', () => {
  const r = (id: string, archived = false) => ({ id, archived });
  const active = (x: { archived: boolean }) => !x.archived;

  it('échange avec le voisin du groupe en sautant les éléments hors groupe', () => {
    const arr = [r('a'), r('x', true), r('b'), r('c')];
    expect(moveInGroup(arr, 'b', -1, active).map((x) => x.id)).toEqual(['b', 'x', 'a', 'c']);
    expect(moveInGroup(arr, 'a', 1, active).map((x) => x.id)).toEqual(['b', 'x', 'a', 'c']);
  });

  it('no-op (même référence) en bout de groupe ou id inconnu', () => {
    const arr = [r('x', true), r('a'), r('b'), r('y', true)];
    expect(moveInGroup(arr, 'a', -1, active)).toBe(arr);
    expect(moveInGroup(arr, 'b', 1, active)).toBe(arr);
    expect(moveInGroup(arr, 'zzz', 1, active)).toBe(arr);
  });
});
