export function formatMoney(amountPaise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountPaise / 100);
}

export function formatPercentage(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(basisPoints % 100 === 0 ? 0 : 1)}%`;
}

export function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
