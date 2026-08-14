export function insumoUnitCost(packagePrice: number | null | undefined, packageQty: number): number | null {
  if (packagePrice == null || !packageQty) return null;
  return packagePrice / packageQty;
}

export type EventTotals = {
  revenue: number;
  costs: number;
  staffCosts: number;
  totalCosts: number;
  result: number;
  margin: number;
};

export function computeEventTotals(params: {
  saleItems: { quantity: number; unitPrice: number }[];
  costs: { amount: number }[];
  staffShifts: { dailyRate: number }[];
}): EventTotals {
  const revenue = params.saleItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const costs = params.costs.reduce((sum, c) => sum + c.amount, 0);
  const staffCosts = params.staffShifts.reduce((sum, s) => sum + s.dailyRate, 0);
  const totalCosts = costs + staffCosts;
  const result = revenue - totalCosts;
  const margin = revenue > 0 ? result / revenue : 0;
  return { revenue, costs, staffCosts, totalCosts, result, margin };
}
