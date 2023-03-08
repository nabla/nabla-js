export const distinctBy = <T>(
  array: T[],
  selector: (value: T) => unknown,
): T[] => {
  const set = new Set();
  return array.filter((e) => {
    if (set.has(selector(e))) return false;
    set.add(selector(e));
    return true;
  });
};

export const removeUndefined = <S>(value: S | undefined): value is S =>
  value !== undefined;

export const removeNull = <S>(value: S | null): value is S => value !== null;
