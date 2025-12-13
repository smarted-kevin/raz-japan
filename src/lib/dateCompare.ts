export function isRenewable(
  numberOfDays: number,
  expiryDate: number | undefined,
  currentDate: number
): boolean {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  if(expiryDate) {
    const exp = new Date(expiryDate);
    const curr = new Date(currentDate);
  
    if (isNaN(exp.getTime()) || isNaN(curr.getTime())) {
      throw new Error("Invalid date input");
    }
  
    const diffDays = (exp.getTime() - curr.getTime()) / MS_PER_DAY;
    console.log(diffDays);
    return diffDays <= numberOfDays && diffDays >= 0;
  } else {
    return false;
  }
}