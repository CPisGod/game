// 원숭이 서커스 주식 시세 수집 (GitHub Actions에서 실행). 결과 JSON을 stdout으로 출력한다.
// 포도 = 테슬라(TSLA, USD → KRW 환산), 오이 = SK하이닉스(000660, KRW)
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; circus-prices)' };
const get = async (u, asText) => {
  const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${u} -> HTTP ${r.status}`);
  return asText ? r.text() : r.json();
};
const log = (...a) => console.error(...a);

async function yahoo(sym) {
  const j = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`);
  const m = j.chart.result[0].meta, price = +m.regularMarketPrice;
  if (!(price > 0)) throw new Error('yahoo ' + sym + ' 가격 없음');
  const at = (m.regularMarketTime || Date.now() / 1000) * 1000;
  return { price, at, closed: Date.now() - at > 15 * 60 * 1000, src: 'yahoo' };   // 15분 넘게 안 바뀌면 장 마감
}
async function usdKrw() {
  try { return +(await get('https://open.er-api.com/v6/latest/USD')).rates.KRW; } catch (e) { log('er-api', e.message); }
  return +(await get('https://api.frankfurter.app/latest?from=USD&to=KRW')).rates.KRW;
}
async function tsla() {
  try { return await yahoo('TSLA'); } catch (e) { log('TSLA yahoo', e.message); }
  const row = (await get('https://stooq.com/q/l/?s=tsla.us&f=sd2t2c&h&e=csv', true)).trim().split('\n')[1].split(',');   // 심볼,날짜,시간,종가
  const price = +row[3];
  if (!(price > 0)) throw new Error('stooq TSLA 가격 없음');
  return { price, at: Date.now(), closed: false, src: 'stooq' };
}
async function hynix() {
  try {
    const j = await get('https://m.stock.naver.com/api/stock/000660/basic');
    const price = +String(j.closePrice).replace(/,/g, '');
    if (!(price > 0)) throw new Error('naver 가격 없음');
    return { price, at: Date.now(), closed: j.marketStatus !== 'OPEN', src: 'naver' };
  } catch (e) { log('hynix naver', e.message); }
  return await yahoo('000660.KS');
}

const out = { t: Date.now(), grape: null, cucumber: null };
const [g, c, fx] = await Promise.allSettled([tsla(), hynix(), usdKrw()]);
if (g.status === 'fulfilled' && fx.status === 'fulfilled' && fx.value > 0)
  out.grape = { price: g.value.price * fx.value, usd: g.value.price, fx: fx.value, at: g.value.at, closed: g.value.closed, src: g.value.src };
else log('grape 실패', g.reason?.message, fx.reason?.message);
if (c.status === 'fulfilled') out.cucumber = { price: c.value.price, at: c.value.at, closed: c.value.closed, src: c.value.src };
else log('cucumber 실패', c.reason?.message);
if (!out.grape && !out.cucumber) { log('모든 시세 수집 실패'); process.exit(1); }
console.log(JSON.stringify(out));
