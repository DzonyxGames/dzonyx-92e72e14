export type ComicStatus = "draft" | "published";

export type ComicRecord = {
  id: string;
  slug: string;
  title: string;
  collectionName: string;
  issueNumber: number;
  description: string;
  priceEurCents: number;
  priceUsdCents: number;
  includedInPass: boolean;
  status: ComicStatus;
  coverAssetId: string | null;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
};

export type StoreSettings = {
  passName: string;
  passEurCents: number;
  passUsdCents: number;
  paymentsEnabled: false;
};

export const defaultStoreSettings: StoreSettings = {
  passName: "Dzonyx Universe Pass",
  passEurCents: 200,
  passUsdCents: 250,
  paymentsEnabled: false,
};

export function formatMoney(cents: number, currency: "EUR" | "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
