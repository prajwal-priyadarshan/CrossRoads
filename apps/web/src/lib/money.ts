/** Amounts are stored in paise. Shown as Indian rupees with grouping, e.g. ₹1,00,000. */
export const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
