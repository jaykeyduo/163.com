import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const P = require('./dg_parsers_extract.js');

const carton = `编号 310N2026AAAAA04
申请人 测试公司
包装容器 双瓦楞纸箱 外尺寸:450 mm × 300 mm × 250 mm 包装容器 4G/Y20/S/26_
名称及规格 皮重:0.85 kg 标记及批号 CN/C260101__PI:021
包装容器数量 ** 800
运输方式 海运
包装使用人 美凯威奇(浙江)新材料科技有限公司
本单有效期 截止于 2026年10月31日
`;
const row = P.parsePerformance(carton, { sourceName: 't' });
const mark = row['包装容器标记及批号'] || '';
if (!/4G\/Y20\/S\/26/.test(mark) || !/CN\/C260101_PI:021/.test(mark)) {
  console.error('mark parse failed:', mark);
  process.exit(1);
}
if (/4G\/|CN\//.test(row['包装容器名称及规格'] || '')) {
  console.error('name polluted:', row['包装容器名称及规格']);
  process.exit(1);
}
console.log('OK', mark);
