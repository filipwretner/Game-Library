import type { PriceQuote } from '@game-tracker/shared';
import type { CheapsharkClient } from './cheapsharkClient.js';
import type { PriceProvider } from '../ports.js';
import { pickBestDeal, type DealCandidate } from '../../domain/pricing.js';

/**
 * Maps CheapShark responses onto the PriceProvider port (spec §2.2). Services
 * depend on the port, so swapping in ITAD later is a one-file change.
 */

const CURRENCY = 'USD';
const REDIRECT_URL = 'https://www.cheapshark.com/redirect';

interface RawDeal {
  salePrice?: string;
  normalPrice?: string;
  savings?: string;
  storeID?: string;
  dealID?: string;
}

interface RawStore {
  storeID: string;
  storeName: string;
}

export class CheapsharkPriceProvider implements PriceProvider {
  private storeNames: Map<string, string> | null = null;

  constructor(private readonly client: CheapsharkClient) {}

  async getBestPrice(title: string): Promise<PriceQuote | null> {
    const rawDeals = (await this.client.deals(title)) as RawDeal[];
    const best = pickBestDeal(rawDeals.map(toCandidate).filter(isValidDeal));
    if (!best) return null;

    return {
      price: best.salePrice,
      normalPrice: best.normalPrice,
      discountPct: Math.round(best.savings),
      currency: CURRENCY,
      store: await this.storeName(best.storeId),
      dealUrl: `${REDIRECT_URL}?dealID=${best.dealId}`,
    };
  }

  private async storeName(storeId: string): Promise<string> {
    this.storeNames ??= await this.loadStores();
    return this.storeNames.get(storeId) ?? 'Unknown store';
  }

  private async loadStores(): Promise<Map<string, string>> {
    const stores = (await this.client.stores()) as RawStore[];
    return new Map(stores.map((s) => [s.storeID, s.storeName]));
  }
}

function toCandidate(deal: RawDeal): DealCandidate {
  return {
    salePrice: Number.parseFloat(deal.salePrice ?? 'NaN'),
    normalPrice: Number.parseFloat(deal.normalPrice ?? 'NaN'),
    savings: Number.parseFloat(deal.savings ?? '0'),
    storeId: deal.storeID ?? '',
    dealId: deal.dealID ?? '',
  };
}

function isValidDeal(deal: DealCandidate): boolean {
  return !Number.isNaN(deal.salePrice) && deal.dealId !== '';
}
