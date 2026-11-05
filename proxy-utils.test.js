import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveProxyTargetUrl,
  normalizeBitfinexPath,
  UPSTREAM_EXCHANGES,
} from './proxy-utils.js';

test('resolveProxyTargetUrl maps known exchanges with path and query', () => {
  const url = resolveProxyTargetUrl(
    'kucoin',
    '/api/v1/market/orderbook/level2_100',
    'symbol=BTC-USDT'
  );
  assert.equal(
    url,
    'https://api.kucoin.com/api/v1/market/orderbook/level2_100?symbol=BTC-USDT'
  );
});

test('resolveProxyTargetUrl normalizes leading slashes and question marks', () => {
  const url = resolveProxyTargetUrl('mexc', 'api/v3/depth', '?symbol=BTCUSDT&limit=100');
  assert.equal(url, 'https://api.mexc.com/api/v3/depth?symbol=BTCUSDT&limit=100');
});

test('normalizeBitfinexPath inserts colon for 4+ char base symbols', () => {
  assert.equal(
    normalizeBitfinexPath('/v2/book/tDOGEUST/P0'),
    '/v2/book/tDOGE:UST/P0'
  );
  assert.equal(
    normalizeBitfinexPath('/v2/book/tBTCUST/P0'),
    '/v2/book/tBTCUST/P0'
  );
  assert.equal(
    resolveProxyTargetUrl('bitfinex', 'v2/book/tAVAXUST/P0', 'len=100'),
    'https://api-pub.bitfinex.com/v2/book/tAVAX:UST/P0?len=100'
  );
});

test('resolveProxyTargetUrl returns null for unknown exchanges', () => {
  assert.equal(resolveProxyTargetUrl('unknown_ex', '/v1/book'), null);
  assert.equal(resolveProxyTargetUrl('', '/v1/book'), null);
});

test('UPSTREAM_EXCHANGES contains all 15 supported exchanges', () => {
  assert.equal(Object.keys(UPSTREAM_EXCHANGES).length, 15);
  assert.ok(UPSTREAM_EXCHANGES.binance);
  assert.ok(UPSTREAM_EXCHANGES.poloniex);
});
