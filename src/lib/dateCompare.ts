export function isRenewable(
  numberOfDays: number,
  expiryDate: number | undefined,
  currentDate: number,
): boolean {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  if (expiryDate !== undefined && Number.isFinite(expiryDate)) {
    const exp = new Date(expiryDate);
    const curr = new Date(currentDate);

    if (isNaN(exp.getTime()) || isNaN(curr.getTime())) {
      return false;
    }

    const diffDays = (exp.getTime() - curr.getTime()) / MS_PER_DAY;
    return diffDays <= numberOfDays;
  } else {
    return false;
  }
}

export function compareStudentExpiry(
  a: { expiry_date?: number; username: string },
  b: { expiry_date?: number; username: string },
): number {
  const expiry = (value: number | undefined) =>
    value !== undefined && Number.isFinite(value) ? value : Infinity;
  const first = expiry(a.expiry_date);
  const second = expiry(b.expiry_date);
  return first === second
    ? a.username.localeCompare(b.username)
    : first < second
      ? -1
      : 1;
}
