import { BadGatewayError } from '../../domain/errors.js';

/**
 * Thin IGDB transport (spec §9). Owns the Twitch OAuth2 client-credentials token
 * (cached in memory, refreshed before expiry) and exposes a single `query`
 * primitive that POSTs an Apicalypse body to an IGDB endpoint. Knows nothing
 * about games/search semantics — that lives in IgdbMetadataProvider.
 */

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_BASE_URL = 'https://api.igdb.com/v4';

/* eslint-disable @typescript-eslint/no-magic-numbers -- time-unit conversions */
const MS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 24 * 60 * 60;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Refresh once the token is within a day of expiry. */
const REFRESH_MARGIN_MS = SECONDS_PER_DAY * MS_PER_SECOND;

export interface IgdbCredentials {
  clientId: string;
  clientSecret: string;
}

export interface IgdbClient {
  query(endpoint: string, apicalypseBody: string): Promise<unknown>;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export function createIgdbClient(creds: IgdbCredentials): IgdbClient {
  let cached: CachedToken | null = null;

  async function fetchToken(): Promise<CachedToken> {
    const url = `${TWITCH_TOKEN_URL}?client_id=${encodeURIComponent(creds.clientId)}&client_secret=${encodeURIComponent(creds.clientSecret)}&grant_type=client_credentials`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      throw new BadGatewayError(`Twitch token request failed (${res.status})`);
    }
    const body = (await res.json()) as TwitchTokenResponse;
    return {
      accessToken: body.access_token,
      expiresAt: Date.now() + body.expires_in * MS_PER_SECOND,
    };
  }

  async function getToken(): Promise<string> {
    if (!cached || cached.expiresAt - Date.now() < REFRESH_MARGIN_MS) {
      cached = await fetchToken();
    }
    return cached.accessToken;
  }

  return {
    async query(endpoint, apicalypseBody) {
      const token = await getToken();
      const res = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Client-ID': creds.clientId,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: apicalypseBody,
      });
      if (!res.ok) {
        throw new BadGatewayError(`IGDB ${endpoint} request failed (${res.status})`);
      }
      return res.json();
    },
  };
}
