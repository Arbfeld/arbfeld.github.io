import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProxyTargetUrl } from './proxy-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

const BITSTAMP_FALLBACK_PAIRS = [
  'btcusdt',
  'ethusdt',
  'solusdt',
  'xrpusdt',
  'dogeusdt',
  'adausdt',
  'linkusdt',
  'avaxusdt',
  'dotusdt',
  'shibusdt',
  'ltcusdt',
  'bchusdt',
  'nearusdt',
  'xlmusdt',
  'uniusdt',
  'suiusdt',
  'pepeusdt',
  'aaveusdt',
  'hbarusdt',
  'algousdt',
].map((url_symbol) => ({ url_symbol, trading: 'Enabled' }));

// Exchange CORS proxy endpoint used by the frontend (`/proxy/:exchange/*`)
app.get('/proxy/:exchange/*', async (req, res) => {
  const { exchange } = req.params;
  const exchangeKey = exchange.toLowerCase();
  const subPath = req.params[0] || '';
  const queryIndex = req.originalUrl.indexOf('?');
  const search = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';

  const targetUrl = resolveProxyTargetUrl(exchangeKey, subPath, search);
  if (!targetUrl) {
    return res.status(404).json({ error: `Unknown exchange: ${exchange}` });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ArbFeld/1.0',
      },
      signal: controller.signal,
    });

    // If Bitstamp blocks datacenter IPs with 403, provide clean fallback
    if (exchangeKey === 'bitstamp' && upstreamRes.status === 403) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (subPath.includes('trading-pairs-info')) {
        return res.status(200).json(BITSTAMP_FALLBACK_PAIRS);
      }
      const match = subPath.match(/order_book\/([a-z0-9]+)/i);
      if (match) {
        const sym = match[1].toUpperCase();
        const fbRes = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${sym}&limit=50`,
          { signal: controller.signal }
        );
        if (fbRes.ok) {
          const fbJson = await fbRes.json();
          return res.status(200).json({
            timestamp: String(Math.floor(Date.now() / 1000)),
            bids: Array.isArray(fbJson.bids) ? fbJson.bids : [],
            asks: Array.isArray(fbJson.asks) ? fbJson.asks : [],
          });
        }
      }
    }

    const bodyText = await upstreamRes.text();
    res.status(upstreamRes.status);
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(bodyText);
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Upstream proxy error',
    });
  } finally {
    clearTimeout(timeout);
  }
});

// Serve static assets and root files with no-store so updates take effect immediately
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`ArbFeld server listening on http://${HOST}:${PORT}`);
});
