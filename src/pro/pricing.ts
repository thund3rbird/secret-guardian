/**
 * Pro pricing + checkout links (pure, dependency-free).
 *
 * Payment provider: Lemon Squeezy (merchant of record — handles global tax).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAUNCH (Operator checkpoint #2): after creating the Lemon Squeezy store and
 * three products with **license keys enabled**, either
 *   (a) set `LEMONSQUEEZY_STORE_BASE` below to your store URL and fill each
 *       tier's `variantId`, or
 *   (b) paste a full `checkoutUrl` onto each tier, or
 *   (c) leave the source alone and set `secretGuardian.pro.checkoutBaseUrl` in
 *       settings (the extension passes it to `resolveCheckoutUrl`).
 * Until then the tiers are "not configured" and the Upgrade flow falls back to
 * the public listing — we never pretend a broken checkout works.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ProTierId = 'monthly' | 'yearly' | 'lifetime';

export interface ProTier {
  id: ProTierId;
  label: string;
  priceLabel: string;
  cadence: string;
  description: string;
  /** Lemon Squeezy variant id for this tier. Fill in at launch (see header). */
  variantId: string;
  /** Optional full checkout URL. Takes precedence over base + variantId. */
  checkoutUrl?: string;
}

/** Your Lemon Squeezy store base, e.g. "https://secretguardian.lemonsqueezy.com". */
export const LEMONSQUEEZY_STORE_BASE = ''; // TODO(launch): set at Operator checkpoint #2

/** Public fallback shown when checkout isn't configured yet. Always valid. */
export const PRODUCT_LANDING_URL =
  'https://marketplace.visualstudio.com/items?itemName=thund3rbird.secret-guardian';

/** Pricing proposal from PLAN.md (editable before launch). */
export const PRO_TIERS: ProTier[] = [
  {
    id: 'monthly',
    label: 'Pro — Monthly',
    priceLabel: '$5 / month',
    cadence: 'monthly',
    description: 'All Pro features, billed monthly. Cancel anytime.',
    variantId: '', // TODO(launch)
  },
  {
    id: 'yearly',
    label: 'Pro — Yearly',
    priceLabel: '$39 / year',
    cadence: 'yearly',
    description: 'All Pro features, billed yearly (best value — ~35% off monthly).',
    variantId: '', // TODO(launch)
  },
  {
    id: 'lifetime',
    label: 'Pro — Lifetime',
    priceLabel: '$59 once',
    cadence: 'one-time',
    description: 'All Pro features forever with a single one-time payment (launch offer).',
    variantId: '', // TODO(launch)
  },
];

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Resolve the checkout URL for a tier, or `null` if checkout isn't configured.
 * `overrideBase` (from settings) wins over the compiled-in store base.
 */
export function resolveCheckoutUrl(
  tier: ProTier,
  overrideBase?: string,
): string | null {
  if (tier.checkoutUrl && tier.checkoutUrl.trim()) {
    return tier.checkoutUrl.trim();
  }
  const base = (overrideBase && overrideBase.trim()) || LEMONSQUEEZY_STORE_BASE;
  if (base && tier.variantId) {
    return `${trimTrailingSlash(base)}/buy/${tier.variantId}`;
  }
  return null;
}

/** True when at least one tier has a working checkout URL. */
export function isCheckoutConfigured(overrideBase?: string): boolean {
  return PRO_TIERS.some((t) => resolveCheckoutUrl(t, overrideBase) !== null);
}
