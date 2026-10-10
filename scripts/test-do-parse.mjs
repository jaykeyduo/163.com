import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const P = require('./dg_parsers_extract.js');

let fail = 0;
for (const [file, delivery, expectDate] of [
  ['/tmp/pdfextract/83231976_55d0.txt', '83231976', '06.07.2026'],
  ['/tmp/pdfextract/83255460_b5f0.txt', '83255460', '18.08.2026'],
]) {
  const text = fs.readFileSync(file, 'utf8');
  if (P.detectDocType(text) !== '运单DO') { console.error('detect fail', file); fail++; continue; }
  const { header, items } = P.parseDelivery(text, { sourceName: file });
  console.log(delivery, 'items', items.length, 'date', header['Delivery日期']);
  if (header['Delivery号码'] !== delivery) { console.error('delivery no'); fail++; }
  if (header['Delivery日期'] !== expectDate) { console.error('date want', expectDate, 'got', header['Delivery日期']); fail++; }
  if (items.length !== 17) { console.error('want 17 items'); fail++; }
  const incomplete = items.filter(it => !it['产品描述'] || !it['Batch no.'] || !it['manufactured'] || !it['Use by end of'] || !it['Country of origin']);
  if (incomplete.length) { console.error('incomplete', incomplete.map(x=>x.Pos)); fail++; }
  const polluted = items.filter(it => /Product name|_{5,}/.test(it['产品额外描述']||''));
  if (polluted.length) { console.error('polluted extra', polluted.map(x=>x.Pos)); fail++; }
  const p10 = items.find(x => x.Pos === '10');
  if (!p10 || p10['产品描述'] !== 'ALEXIT-Primer 463-VG') { console.error('p10 name', p10); fail++; }
  if (!/farblos/.test(p10['产品额外描述']||'') || !/MR 10:1/.test(p10['产品额外描述']||'')) { console.error('p10 extra', p10['产品额外描述']); fail++; }
  const p20 = items.find(x => x.Pos === '20');
  if ((p20['产品额外描述']||'') !== '') { console.error('p20 should have empty extra'); fail++; }
  const p70 = items.find(x => x.Pos === '70');
  if (!p70 || p70['产品描述'] !== 'ALEXIT- Thinner 903-LP' || !p70['Batch no.']) { console.error('p70 cross-page', p70); fail++; }
}
console.log(fail ? 'FAIL '+fail : 'ALL PASS');
process.exit(fail ? 1 : 0);
