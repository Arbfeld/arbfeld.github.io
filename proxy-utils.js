export const UPSTREAM_EXCHANGES = {
  binance: 'https://api.binance.com',
  bybit: 'https://api.bybit.com',
  okx: 'https://www.okx.com',
  kraken: 'https://api.kraken.com',
  kucoin: 'https://api.kucoin.com',
  gate: 'https://api.gateio.ws',
  mexc: 'https://api.mexc.com',
  htx: 'https://api.htx.com',
  bitget: 'https://api.bitget.com',
  bitfinex: 'https://api-pub.bitfinex.com',
  bitstamp: 'https://www.bitstamp.net',
  cryptocom: 'https://api.crypto.com',
  coinbase: 'https://api.exchange.coinbase.com',
  gemini: 'https://api.gemini.com',
  poloniex: 'https://api.poloniex.com',
};

/**
 * Normalizes a Bitfinex book path so 4+ char base symbols include the required colon
 * (e.g. `/v2/book/tDOGEUST/P0` -> `/v2/book/tDOGE:UST/P0`).
 * @param {string} pathStr
 * @returns {string}
 */
export function normalizeBitfinexPath(pathStr) {
  return pathStr.replace(
    /^(\/v2\/book\/t)([A-Z0-9]{4,})(UST|USD)(\/.*)$/i,
    '$1$2:$3$4'
  );
}

/**
 * Resolves a `/proxy/:exchange/*` request path and query string to the target upstream URL.
 * @param {string} exchangeId
 * @param {string} subPath
 * @param {string} [search]
 * @returns {string | null}
 */
export function resolveProxyTargetUrl(exchangeId, subPath, search = '') {
  if (!exchangeId || typeof exchangeId !== 'string') return null;
  const key = exchangeId.toLowerCase();
  const baseUrl = UPSTREAM_EXCHANGES[key];
  if (!baseUrl) return null;

  let normalizedPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  if (key === 'bitfinex') {
    normalizedPath = normalizeBitfinexPath(normalizedPath);
  }

  const normalizedSearch = search
    ? search.startsWith('?')
      ? search
      : `?${search}`
    : '';

  return `${baseUrl}${normalizedPath}${normalizedSearch}`;
}
