import type { PriceQuote } from '@game-tracker/shared';
import type { CheapsharkClient } from './cheapsharkClient.js';
import type { PriceProvider } from '../ports.js';
import { pickBestDeal, type DealCandidate } from '../../domain/pricing.js';

/**
 * Maps CheapShark responses onto the PriceProvider port (spec §2.2). Resolves the
 * title to a single best-matching game, then picks the cheapest deal *for that
 * game* — so a cheaper, similarly-named title can never hijack the price.
 */

const CURRENCY = 'USD';
const REDIRECT_URL = 'https://www.cheapshark.com/redirect';

interface RawGameSummary {
  gameID?: string;
}

interface RawGameDeal {
  storeID?: string;
  dealID?: string;
  price?: string;
  retailPrice?: string;
  savings?: string;
}

interface RawGameDetail {
  deals?: RawGameDeal[];
}

interface RawStore {
  storeID: string;
  storeName: string;
}

export class CheapsharkPriceProvider implements PriceProvider {
  private storeNames: Map<string, string> | null = null;

  constructor(private readonly client: CheapsharkClient) {}

  async getBestPrice(title: string): Promise<PriceQuote | null> {
    const summaries = (await this.client.gameSummaries(title)) as RawGameSummary[];
    const gameId = summaries[0]?.gameID;
    if (!gameId) return null;

    const detail = (await this.client.gameDeals(gameId)) as RawGameDetail;
    const best = pickBestDeal((detail.deals ?? []).map(toCandidate).filter(isValidDeal));
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
    // Only cache a populated map, so a one-off empty /stores response can recover.
    if (!this.storeNames || this.storeNames.size === 0) {
      this.storeNames = await this.loadStores();
    }
    return this.storeNames.get(storeId) ?? 'Unknown store';
  }

  private async loadStores(): Promise<Map<string, string>> {
    const stores = (await this.client.stores()) as RawStore[];
    return new Map(stores.map((s) => [s.storeID, s.storeName]));
  }
}

function toCandidate(deal: RawGameDeal): DealCandidate {
  return {
    salePrice: Number.parseFloat(deal.price ?? 'NaN'),
    normalPrice: Number.parseFloat(deal.retailPrice ?? 'NaN'),
    savings: Number.parseFloat(deal.savings ?? '0'),
    storeId: deal.storeID ?? '',
    dealId: deal.dealID ?? '',
  };
}

function isValidDeal(deal: DealCandidate): boolean {
  return !Number.isNaN(deal.salePrice) && deal.dealId !== '';
}
