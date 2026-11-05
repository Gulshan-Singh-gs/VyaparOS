/**
 * Money representation & arithmetic engine for VyaparOS
 * 
 * Invariant: Never use floating-point for monetary math.
 * All amounts are stored internally as integer paise (1 INR = 100 paise).
 */

/**
 * Convert rupee decimal to integer paise safely
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to decimal rupees
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return paise / 100;
}

/**
 * Format integer paise into Indian Rupee string with Indian number grouping
 * e.g., 18240000 paise -> ₹1,82,400.00
 */
export function formatRupees(paise: number, includeDecimals = true): string {
  const rupees = paiseToRupees(paise);
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);
  
  const [intPart, decPart = '00'] = absRupees.toFixed(2).split('.');
  
  // Format with Indian numbering system (last 3 digits, then groups of 2)
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  const sign = isNegative ? '-' : '';
  return includeDecimals 
    ? `${sign}₹${formattedInt}.${decPart}`
    : `${sign}₹${formattedInt}`;
}

/**
 * Safe addition of paise
 */
export function addMoney(...amountsInPaise: number[]): number {
  return amountsInPaise.reduce((acc, curr) => {
    if (!Number.isSafeInteger(curr)) {
      throw new Error(`Invalid money amount: ${curr} is not a safe integer`);
    }
    return acc + curr;
  }, 0);
}

/**
 * Safe subtraction of paise
 */
export function subtractMoney(baseInPaise: number, subtractInPaise: number): number {
  if (!Number.isSafeInteger(baseInPaise) || !Number.isSafeInteger(subtractInPaise)) {
    throw new Error('Amounts must be safe integers');
  }
  return baseInPaise - subtractInPaise;
}

/**
 * Calculate percentage in integer paise with Banker's or standard rounding
 */
export function calculatePercentagePaise(baseInPaise: number, percent: number): number {
  return Math.round((baseInPaise * percent) / 100);
}

