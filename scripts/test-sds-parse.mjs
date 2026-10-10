import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const P = require('./dg_parsers_extract.js');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(__dirname, '../samples/sds/fixtures');

const cases = [
  {
    stem: '340SY3020W000_CN_ZH_1000',
    code: '340SY3020W000',
    un: '',
    nonDg: '是',
    cls: '',
    pg: '',
    dens: '1.5',
    flash: '不适用',
    state: '液体',
    zhHas: '水性漆',
    enHas: 'Waterborne',
    wantCas: false,
    ghsHas: '非危险',
  },
  {
    stem: '463VG00005000_CN_ZH_1000',
    code: '463VG00005000',
    un: '1263',
    nonDg: '',
    cls: '3',
    pg: 'II',
    dens: '1.1',
    flash: '21°C',
    state: '液体',
    psn: 'PAINT',
    zhHas: '油漆',
    enHas: 'Paint',
    wantCas: true,
    ems: 'F-E, S-E',
  },
  {
    stem: '4050200000000_CN_ZH_1000',
    code: '4050200000000',
    un: '1263',
    nonDg: '',
    cls: '3',
    pg: 'III',
    dens: '0.98',
    flash: '25°C',
    state: '液体',
    psn: 'PAINT RELATED MATERIAL',
    zhHas: '固化剂',
    enHas: 'Hardener',
    wantCas: true,
    ems: 'F-E, S-E',
  },
  {
    stem: '9018600000000_CN_ZH_1000',
    code: '9018600000000',
    un: '1263',
    nonDg: '',
    cls: '3',
    pg: 'II',
    dens: '0.92',
    flash: '3°C',
    state: '液体',
    psn: 'PAINT RELATED MATERIAL',
    zhHas: '稀释剂',
    enHas: 'Thinner',
    wantCas: true,
    ems: 'F-E, S-E',
  },
  {
    stem: '9051300000000_CN_ZH_1000_R5030',
    code: '9051300000000',
    un: '1263',
    nonDg: '',
    cls: '3',
    pg: 'II',
    dens: '0.93',
    flash: '5°C',
    state: '液体',
    psn: 'PAINT RELATED MATERIAL',
    zhHas: '稀释剂',
    enHas: 'Thinner',
    wantCas: true,
    ems: 'F-E, S-E',
  },
];

let fail = 0;
for (const c of cases) {
  const file = path.join(FIX, c.stem + '.txt');
  const text = fs.readFileSync(file, 'utf8');
  if (P.detectDocType(text) !== 'SDS') {
    console.error('detect fail', c.stem, P.detectDocType(text));
    fail++;
    continue;
  }
  const r = P.parseSds(text, { sourceName: c.stem + '.pdf' });
  const checks = [
    ['产品代码', r['产品代码'], c.code],
    ['联合国编号', r['联合国编号'], c.un],
    ['运输非危标记', r['运输非危标记'], c.nonDg],
    ['危险货物类别', r['危险货物类别'], c.cls],
    ['包装类别', r['包装类别'], c.pg],
    ['危险货物密度', r['危险货物密度'], c.dens],
    ['闪点', r['闪点'], c.flash],
    ['危险货物状态', r['危险货物状态'], c.state],
  ];
  if (c.psn) checks.push(['联合国运输名称', r['联合国运输名称'], c.psn]);
  if (c.ems) checks.push(['EmS表号', r['EmS表号'], c.ems]);
  console.log('\n==', c.stem);
  for (const [k, got, want] of checks) {
    if (got !== want) {
      console.error(' FAIL', k, JSON.stringify(got), 'want', JSON.stringify(want));
      fail++;
    } else console.log(' OK', k, got);
  }
  if (c.zhHas && !String(r['中文名称'] || '').includes(c.zhHas)) {
    console.error(' FAIL 中文名称', r['中文名称']);
    fail++;
  } else console.log(' OK 中文名称', r['中文名称']);
  if (c.enHas && !String(r['英文名称'] || '').includes(c.enHas)) {
    console.error(' FAIL 英文名称', r['英文名称']);
    fail++;
  } else console.log(' OK 英文名称', r['英文名称']);
  if (c.wantCas) {
    if (!/\d{2,7}-\d{2,5}-\d{1,2}/.test(r['主要危险成分'] || '')) {
      console.error(' FAIL 主要危险成分 missing CAS', r['主要危险成分']);
      fail++;
    } else console.log(' OK 主要危险成分', (r['主要危险成分'] || '').slice(0, 60));
  }
  if (c.ghsHas && !String(r['GHS危险性类别'] || '').includes(c.ghsHas)) {
    console.error(' FAIL GHS', r['GHS危险性类别']);
    fail++;
  }
  // GHS must not leak into transport class for DG
  if (c.un && r['危险货物类别'] && /[A-Za-z]/.test(r['危险货物类别'])) {
    console.error(' FAIL transport class looks like GHS', r['危险货物类别']);
    fail++;
  }
}
console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
process.exit(fail ? 1 : 0);
