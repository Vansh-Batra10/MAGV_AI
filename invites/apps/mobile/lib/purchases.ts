import Purchases from "react-native-purchases";

/**
 * In-app purchases via RevenueCat (sandbox in development). Entitlements are granted server-side by the
 * RevenueCat webhook into the same orders/entitlements model Razorpay uses on the web.
 * TODO_VERIFY(current App Store / Play billing rules for India for this kind of digital good).
 */
export function initPurchases(apiKey: string, userId: string) { Purchases.configure({ apiKey, appUserID: userId }); }
export async function buy(packageId: string) {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageId);
  if (!pkg) throw new Error("package not found");
  return Purchases.purchasePackage(pkg);
}
