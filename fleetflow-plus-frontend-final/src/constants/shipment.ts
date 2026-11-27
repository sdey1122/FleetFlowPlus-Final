export const goodsOptions = [
  { value: "documents", label: "Documents & Letters" },
  { value: "personal", label: "Personal Parcels & Gifts" },
  { value: "retail", label: "E-Commerce & Retail Goods" },
  { value: "bulk", label: "Heavy & Bulk Cargo" },
  { value: "urgent", label: "Urgent & Rapid Items" },
];
export const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    paise / 100,
  );
export const dateTime = (date: string) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
export const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());
