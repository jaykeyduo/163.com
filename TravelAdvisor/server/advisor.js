const CITY_HINTS = {
  东京: ["浅草寺", "明治神宫", "涩谷十字路口", "秋叶原", "台场"],
  京都: ["清水寺", "伏见稻荷", "岚山竹林", "金阁寺", "祇园"],
  大阪: ["道顿堀", "大阪城", "环球影城", "心斋桥", "海游馆"],
  巴黎: ["埃菲尔铁塔", "卢浮宫", "塞纳河游船", "蒙马特", "凡尔赛"],
  伦敦: ["大本钟", "大英博物馆", "伦敦眼", "塔桥", "柯芬园"],
  纽约: ["中央公园", "自由女神", "大都会博物馆", "时代广场", "布鲁克林大桥"],
  曼谷: ["大皇宫", "卧佛寺", "恰图恰周末市场", "郑王庙", "暹罗天地"],
  新加坡: ["滨海湾花园", "圣淘沙", "牛车水", "滨海湾金沙", "夜间动物园"],
  首尔: ["景福宫", "明洞", "北村韩屋村", "弘大", "南山塔"],
  上海: ["外滩", "豫园", "迪士尼", "武康路", "东方明珠"],
  北京: ["故宫", "长城", "颐和园", "南锣鼓巷", "天坛"],
  成都: ["宽窄巷子", "大熊猫基地", "锦里", "春熙路", "都江堰"],
};

function pickSpots(destination, days) {
  const key = Object.keys(CITY_HINTS).find((city) =>
    destination.includes(city),
  );
  const base = key
    ? CITY_HINTS[key]
    : [
        `${destination}老城区漫步`,
        `${destination}地标打卡`,
        `${destination}本地市集`,
        `${destination}博物馆/文化区`,
        `${destination}夜景观景点`,
        `${destination}周边半日游`,
      ];

  const needed = Math.max(days * 2, 2);
  const spots = [];
  for (let i = 0; i < needed; i += 1) {
    spots.push(base[i % base.length]);
  }
  return spots;
}

export function generateAdvice({
  destination,
  days = 3,
  budget = "适中",
  preferences = "美食与文化",
}) {
  const safeDays = Math.min(Math.max(Number(days) || 3, 1), 14);
  const spots = pickSpots(destination, safeDays);
  const itinerary = Array.from({ length: safeDays }, (_, index) => {
    const morning = spots[index * 2] || spots[0];
    const afternoon = spots[index * 2 + 1] || spots[1] || spots[0];
    return {
      day: index + 1,
      theme: `Day ${index + 1} · ${preferences || "自由行"}`,
      morning: `上午：前往「${morning}」，慢慢逛、拍照、感受当地节奏。`,
      afternoon: `下午：安排「${afternoon}」，顺路找一家评分高的本地餐厅。`,
      evening: `晚上：回酒店附近散步，试试夜市小吃或预约人气餐厅。`,
    };
  });

  const tips = [
    `预算档位按「${budget || "适中"}」规划，热门景点建议提前在线购票。`,
    `兴趣偏向「${preferences || "美食与文化"}」，优先安排步行可达的街区串联。`,
    "手机与电脑可使用同一同步码，实时查看这份行程结果。",
    "出发前确认签证、交通卡和离线地图，减少现场排队时间。",
  ];

  return {
    title: `${destination} ${safeDays} 日旅行建议`,
    destination,
    days: safeDays,
    budget,
    preferences,
    summary: `为「${destination}」生成了 ${safeDays} 天行程草案，兼顾${preferences || "自由行"}与${budget || "适中"}预算，可在手机和电脑同步查看与迭代。`,
    itinerary,
    tips,
    source: "advisor",
  };
}
