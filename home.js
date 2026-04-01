// Simple market ticker using free Yahoo Finance proxy
async function loadMarkets() {
  const symbols = [
    { id: 'sp500',  symbol: '%5EGSPC',  label: 'S&P 500' },
    { id: 'dow',    symbol: '%5EDJI',   label: 'Dow' },
    { id: 'nasdaq', symbol: '%5EIXIC',  label: 'NASDAQ' },
    { id: 'btc',    symbol: 'BTC-USD',  label: 'Bitcoin' },
    { id: 'gold',   symbol: 'GC%3DF',   label: 'Gold' },
    { id: 'oil',    symbol: 'CL%3DF',   label: 'Oil' },
  ];
 
  for (const s of symbols) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?interval=1d&range=1d`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const price = result?.meta?.regularMarketPrice;
      const prev  = result?.meta?.previousClose || result?.meta?.chartPreviousClose;
      const el = document.getElementById(s.id);
      if (el && price) {
        const change = price - prev;
        const pct = ((change / prev) * 100).toFixed(2);
        const isUp = change >= 0;
        const fmt = s.id === 'btc'
          ? '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
          : s.id === 'gold' || s.id === 'oil'
            ? '$' + price.toFixed(2)
            : price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        el.textContent = fmt;
        el.className = 'ticker-val ' + (isUp ? 'up' : 'down');
        el.title = (isUp ? '+' : '') + change.toFixed(2) + ' (' + (isUp ? '+' : '') + pct + '%)';
      }
    } catch(e) {
      const el = document.getElementById(s.id);
      if (el) el.textContent = 'N/A';
    }
  }
}
 
loadMarkets();
 
