(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DgParsers = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function cleanBlank(v) {
    if (v == null) return '';
    var s = String(v).replace(/\u00a0/g, ' ').trim();
    s = s.replace(/^[\*_]+$/, '');
    if (/^\*{1,}$/.test(s) || s === '***' || s === '********') return '';
    s = s.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '').trim();
    s = s.replace(/_+/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/[\u200b\u200c\u200d\ufeff]/g, '');
    return s;
  }

  function normalizeDate(raw) {
    if (!raw) return '';
    var s = String(raw).replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    var m = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    if (m) {
      return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
    }
    m = s.match(/(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
    if (m) return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
    return cleanBlank(s);
  }

  function pad2(n) {
    n = String(parseInt(n, 10));
    return n.length < 2 ? '0' + n : n;
  }

  function stripStarsQty(v) {
    var s = cleanBlank(v);
    s = s.replace(/^\*+/, '').trim();
    return s;
  }

  function detectDocType(text) {
    var t = text || '';
    if (/出境危险货物运输包装使用鉴定结果单/.test(t) || /使用鉴定结果单/.test(t)) {
      return '危包证';
    }
    if (/出入境货物包装性能检验结果单/.test(t) || /包装性能检验结果单/.test(t)) {
      return '包装性能单';
    }
    if (/包装容器性能检验结果单号/.test(t) && /危险货物名称/.test(t)) {
      return '危包证';
    }
    if (/拟装货物名称/.test(t) && /包装容器数量/.test(t)) {
      return '包装性能单';
    }
    // 粘贴/抽字不全时：性能单特有「本单有效期」+ 使用人/数量
    if (/本单有效期/.test(t) && (/包装使用人/.test(t) || /包装容器数量/.test(t))) {
      return '包装性能单';
    }
    // 危包证特有「本结果单有效期」
    if (/本结果单有效期/.test(t) && (/危险货物名称/.test(t) || /使用人/.test(t))) {
      return '危包证';
    }
    return 'unknown';
  }

  function extractCertNo(text) {
    // pdftotext: 「编号326N…」；PDF.js 排版常把号放在标签前一行：「326N… 编号」
    var patterns = [
      /编号\s*[:：]?\s*([0-9A-Za-z]{10,})/,
      /([0-9A-Za-z]{10,})\s*编号/,
      /(?:结果单|检验结果单)?\s*编号\s*[:：]?\s*([0-9A-Za-z]{10,})/,
      /\b(\d{3}[A-Za-z]\d{6,}[A-Za-z0-9]*)\b/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = text.match(patterns[i]);
      if (m) {
        var v = cleanBlank(m[1]);
        // 排除联合国编号等短数字；CIQ 单号通常 >= 15
        if (v && v.length >= 12 && !/^1263$/.test(v)) return v;
      }
    }
    return '';
  }

  function afterLabel(text, label, untilRe) {
    var idx = text.indexOf(label);
    if (idx < 0) return '';
    var rest = text.slice(idx + label.length);
    if (untilRe) {
      var m = rest.match(untilRe);
      if (m) rest = rest.slice(0, m.index);
    }
    return rest;
  }

  function firstLineValue(chunk) {
    var lines = String(chunk).split(/\r?\n/).map(function (l) {
      return l.trim();
    }).filter(Boolean);
    if (!lines.length) return '';
    return cleanBlank(lines[0].replace(/^[:：\s]+/, ''));
  }

  function matchField(text, patterns) {
    for (var i = 0; i < patterns.length; i++) {
      var m = text.match(patterns[i]);
      if (m && m[1] != null) {
        var v = cleanBlank(m[1]);
        if (v) return v;
      }
    }
    return '';
  }

  /** 包装性能单字段 schema */
  var PERF_FIELDS = [
    '编号', '申请人', '包装容器名称及规格', '包装容器标记及批号', '包装容器数量',
    '生产日期起', '生产日期止', '拟装货物名称', '状态', '比重', '检验依据',
    '拟装货物类别', '联合国编号', '运输方式', '检验结果摘要', '包装使用人',
    '签发日期', '本单有效期截止', '源文件名', '导入时间'
  ];

  /** 危包证字段 schema */
  var CERT_FIELDS = [
    '编号', '申请人', '使用人', '包装容器名称及规格', '包装容器标记及批号',
    '货物包装类别', '包装容器性能检验结果单号', '运输方式',
    '危险货物名称中文', '危险货物名称英文', '危险货物类别', '联合国编号',
    '危险货物状态', '危险货物密度', '报检包件数量', '单件容积', '单件毛重',
    '单件净重', '危险货物灌装日期', '检验依据', '鉴定结果摘要',
    '签发日期', '本结果单有效期截止', '源文件名', '导入时间'
  ];

  function parsePerformance(text, meta) {
    meta = meta || {};
    var t = text || '';
    var flat = t.replace(/\r\n/g, '\n');
    var row = emptyRow(PERF_FIELDS);

    row['编号'] = extractCertNo(flat);

    row['申请人'] = matchField(flat, [
      /申请人\s+([^\n]+?)(?:\n|$)/,
      /申请人\s*[:：]?\s*([^\n]+)/
    ]);

    // 名称及规格 + 标记及批号 常并排两列
    var nameMark = parsePerfNameAndMark(flat);
    row['包装容器名称及规格'] = nameMark.name;
    row['包装容器标记及批号'] = nameMark.mark;

    row['包装容器数量'] = stripStarsQty(matchField(flat, [
      /包装容器数量\s+\*{0,2}\s*([^\n生产]+?)(?=\s{2,}生产日期|\s*生产日期|$)/,
      /包装容器数量\s*[:：]?\s*\*{0,2}\s*([^\n]+)/
    ]));

    var dateRange = flat.match(/生产日期\s*自\s*([\d\s_\u200b年日月]+?)\s*至\s*([\d\s_\u200b年日月]+)/);
    if (dateRange) {
      row['生产日期起'] = normalizeDate(dateRange[1]);
      row['生产日期止'] = normalizeDate(dateRange[2]);
    }

    // 拟装货物名称可能跨行（黏度说明）
    row['拟装货物名称'] = parseCargoName(flat);
    row['状态'] = matchField(flat, [
      /状态\s+([^\s\n比重]+)/,
      /状态\s*[:：]?\s*([液固态气粉]+)/
    ]);
    // 比重多为 *** 空白；只接受数字（含小数），避免吃到右侧「检验依据/拟装货物类别」
    (function () {
      var m = flat.match(/比重\s*[:：]?\s*((?:\*{1,3})|(?:\d+(?:\.\d+)?))?/);
      var v = m && m[1] ? String(m[1]).trim() : '';
      if (!v || /^\*+$/.test(v)) row['比重'] = '';
      else if (/^\d+(?:\.\d+)?$/.test(v)) row['比重'] = v;
      else row['比重'] = '';
    })();

    row['检验依据'] = parseInspectBasis(flat);
    row['拟装货物类别'] = /[×xX]\s*危险货物/.test(flat) || /拟装货物类别[\s\S]{0,40}危险货物/.test(flat)
      ? (/[×xX]\s*一般货物/.test(flat) && !/[×xX]\s*危险货物/.test(flat) ? '一般货物' : '危险货物')
      : (/[×xX]\s*一般货物/.test(flat) ? '一般货物' : '');

    row['联合国编号'] = cleanBlank(matchField(flat, [
      /联合国编号\s+\*{0,3}\s*([A-Za-z0-9]*)/,
      /联合国编号\s*[:：]?\s*([^\n运输]+)/
    ]));
    if (/^\*+$/.test(row['联合国编号'])) row['联合国编号'] = '';

    row['运输方式'] = matchField(flat, [
      /运输方式\s+([^\n检]+?)(?=\n|$)/,
      /运输方式\s*[:：]?\s*([^\n]+)/
    ]);

    row['检验结果摘要'] = matchField(flat, [
      /符合\s*([IiⅠⅡⅢIV一二三四\d]+)\s*类\s*包装\s*要求/,
      /(该包装容器符合[^\n。]+)/,
      /性能测试结果表明[，,]\s*([^\n。]+)/
    ]);
    if (row['检验结果摘要'] && !/^符合/.test(row['检验结果摘要']) && /符合/.test(row['检验结果摘要'])) {
      // keep as is
    } else if (/符合\s*[IiⅠⅡⅢIV一二三四\d]+\s*类/.test(flat)) {
      var rm = flat.match(/符合\s*([IiⅠⅡⅢIV一二三四\d]+)\s*类\s*包装\s*要求/);
      if (rm) row['检验结果摘要'] = '符合' + rm[1] + '类包装要求';
    }

    row['包装使用人'] = matchField(flat, [
      /包装使用人\s+([^\n本]+?)(?=\n|本单有效期|$)/,
      /包装使用人\s*[:：]?\s*([^\n]+)/
    ]);

    // 签发日期：签字附近的日期（非有效期）
    var issueM = flat.match(/签字[：:][\s\S]{0,80}?日期[：:]\s*([\d\s年日月]+)/);
    if (issueM) row['签发日期'] = normalizeDate(issueM[1]);
    else {
      var allDates = flat.match(/日期[：:]\s*([\d\s年日月]+)/g);
      // fallback: first 日期 after 签字 block
      var dm = flat.match(/日期[：:]\s*(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)/);
      if (dm) row['签发日期'] = normalizeDate(dm[1]);
    }

    var validM = flat.match(/本单有效期\s*截止于\s*([\d\s年日月]+)/);
    if (validM) row['本单有效期截止'] = normalizeDate(validM[1]);

    row['源文件名'] = meta.sourceName || '';
    row['导入时间'] = meta.importedAt || nowStr();
    return row;
  }

  /** UN 包装标记：钢桶 1A2/Y1.6/100/26、纸箱 4G/Y25/S/25 等（第 3 段可为 S 或数字；兼容尾部 _） */
  function extractUnPackMarks(text) {
    var marks = [];
    // 不用尾部 \b：PDF 常把标记写成 4G/Y20/S/26_ / 1A2/Y1.6/100/26_，_ 会破坏词边界
    var re = /(?:^|[^A-Z0-9\/])(\d[A-Z0-9]{0,3}\/[XYZN][A-Z0-9.]*\/[A-Z0-9.]+\/\d+)_?(?=[^A-Z0-9\/]|$)/gi;
    var m;
    while ((m = re.exec(text || ''))) {
      var code = String(m[1]).toUpperCase().replace(/_+$/, '');
      if (marks.indexOf(code) < 0) marks.push(code);
    }
    return marks;
  }

  /** CN/批号 + PI：兼容 PDF 抽字空格，如 CN/ C241205 __ PI:008 → CN/C241205_PI:008 */
  function extractCnPiMarks(text) {
    var marks = [];
    var t = String(text || '');
    var reSpaced = /\bCN\s*\/\s*([A-Za-z0-9]+)\s*_+\s*PI\s*[:：]?\s*(\d+)\b/gi;
    var m;
    while ((m = reSpaced.exec(t))) {
      var code = 'CN/' + m[1] + '_PI:' + m[2];
      if (marks.indexOf(code) < 0) marks.push(code);
    }
    if (!marks.length) {
      var reTight = /\bCN\s*\/\s*([A-Za-z0-9]+)(?:\s*_+\s*|\s+)PI\s*[:：]?\s*(\d+)\b/gi;
      while ((m = reTight.exec(t))) {
        code = 'CN/' + m[1] + '_PI:' + m[2];
        if (marks.indexOf(code) < 0) marks.push(code);
      }
    }
    if (!marks.length) {
      var reLoose = /\bCN\s*\/\s*([A-Za-z0-9]+)\b/gi;
      while ((m = reLoose.exec(t))) {
        code = 'CN/' + m[1];
        if (marks.indexOf(code) < 0) marks.push(code);
      }
    }
    return marks;
  }

  function formatPackMarks(unMarks, cnMarks) {
    return unMarks.concat(cnMarks).filter(Boolean).join(' / ');
  }

  function stripPackMarksFromText(s) {
    s = String(s || '');
    s = s.replace(/\d[A-Z0-9]{0,3}\/[XYZN][A-Z0-9.]*\/[A-Z0-9.]+\/\d+_?/gi, ' ');
    s = s.replace(/\bCN\s*\/\s*[A-Za-z0-9]+\s*_+\s*PI\s*[:：]?\s*\d+\b/gi, ' ');
    s = s.replace(/\bCN\s*\/\s*[A-Za-z0-9]+(?:\s*_+\s*|\s+)PI\s*[:：]?\s*\d+\b/gi, ' ');
    s = s.replace(/\bCN\s*\/\s*[A-Za-z0-9]+\b/gi, ' ');
    return cleanBlank(s);
  }

  function parsePerfNameAndMark(flat) {
    var name = '';
    var mark = '';
    // Pattern: 包装容器 ... 包装容器  then 名称及规格 / 标记及批号
    // 钢桶：1A2/Y1.6/100/26 + CN/...PI
    // 纸箱：4G/Y25/S/25 + CN/...PI（第 3 段常为 S，旧正则只认数字会漏读）
    var scope = flat;
    var block = flat.match(/包装容器\s+([\s\S]*?)包装容器数量/);
    if (block) scope = block[0];

    var unMarks = extractUnPackMarks(scope);
    if (!unMarks.length) unMarks = extractUnPackMarks(flat);
    var cnMarks = extractCnPiMarks(scope);
    if (!cnMarks.length) cnMarks = extractCnPiMarks(flat);
    mark = formatPackMarks(unMarks, cnMarks);

    if (block) {
      var lines = block[1].split(/\n/).map(function (l) { return l.replace(/\s+$/, ''); });
      var leftParts = [];
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (/名称及规格|标记及批号|包装容器\s*$/.test(line) && !/\S{4,}/.test(line.replace(/包装容器|名称及规格|标记及批号/g, ''))) {
          continue;
        }
        // 右栏 UN / CN 标记（兼容单空格：…包装容器 4G/Y25/S/25）
        var unMark = line.match(/(?:\s{2,}|\s)(\d[A-Z0-9]{0,3}\/[XYZN][A-Z0-9.]*\/[A-Z0-9.]+\/\d+)\s*_?\s*$/i);
        var cnMark = line.match(/(?:\s{2,}|\s)(CN\s*\/\s*[A-Za-z0-9]+(?:\s*_+\s*PI\s*[:：]?\s*\d+)?)\s*$/i);
        if (unMark || cnMark) {
          var m = unMark || cnMark;
          var left = line.slice(0, m.index).replace(/包装容器|名称及规格|标记及批号/g, '').trim();
          left = stripPackMarksFromText(left);
          if (left) leftParts.push(left);
        } else {
          var cleaned = line.replace(/包装容器|名称及规格|标记及批号/g, '').trim();
          cleaned = stripPackMarksFromText(cleaned);
          if (!cleaned) continue;
          var parts = cleaned.split(/\s{3,}/).map(cleanBlank).filter(Boolean);
          if (parts.length >= 2) {
            leftParts.push(parts[0]);
            // 右栏残留文本若不是标记则并入名称备注
            var rightRest = stripPackMarksFromText(parts.slice(1).join(' '));
            if (rightRest && !/^[0-9A-Z]{1,3}\//i.test(rightRest) && !/^CN\//i.test(rightRest)) {
              leftParts.push(rightRest);
            }
          } else if (parts.length === 1) {
            if (!/^[0-9A-Z]{1,3}\//i.test(parts[0]) && !/^CN\//i.test(parts[0])) {
              leftParts.push(parts[0]);
            }
          }
        }
      }
      name = leftParts.join(' ').replace(/^\*+/, '').trim();
    }

    if (!name) {
      name = matchField(flat, [
        /名称及规格\s+([^\n包装]+)/
      ]);
      name = stripPackMarksFromText(name);
    } else {
      name = stripPackMarksFromText(name);
    }

    // 名称仍空时：从块内抓纸箱/钢桶描述行
    if (!name && block) {
      var nmGuess = block[1].match(/((?:双瓦楞|三瓦楞|钢制|铁桶|塑料|纤维板)[^\n]{0,120})/);
      if (nmGuess) name = stripPackMarksFromText(nmGuess[1]);
    }

    return { name: cleanBlank(name), mark: mark };
  }

  function parseCargoName(flat) {
    // Normal: 拟装货物名称  xxx  状态
    var m = flat.match(/拟装货物名称\s+([^\n]*?)\s+状态\s+/);
    if (m && cleanBlank(m[1])) {
      var raw = cleanBlank(m[1]);
      // continuation line with closing paren (viscosity note)
      var cont = flat.match(/拟装货物名称[\s\S]{0,80}?状态[^\n]*\n\s*([^\n]*[）)])/);
      if (cont) raw = cleanBlank(raw + cont[1]);
      return raw;
    }
    // Awkward layout: cargo text appears on line ABOVE the label
    var awkward = flat.match(/\n\s*([^\n]{2,40})\n\s*拟装货物名称\s+状态\s+/);
    if (awkward) {
      var name = cleanBlank(awkward[1]);
      var cont2 = flat.match(/拟装货物名称[\s\S]{0,100}?\n\s*([^\n]*[）)])/);
      if (cont2) name = cleanBlank(name + cont2[1]);
      return name;
    }
    return matchField(flat, [/拟装货物名称\s+([^\n状态]+)/]);
  }

  function parseInspectBasis(flat) {
    // Between 检验依据 area and 拟装货物类别 / 检验结果
    var m = flat.match(/(《[^》]+》[^\n]*|SN\/T[^\n]+)/);
    // Prefer the block near 检/验/依/据
    var basisBlock = flat.match(/包装容器数量[\s\S]*?检\s*\n?\s*验[\s\S]*?依[\s\S]*?据([\s\S]*?)检验结果|按上述/);
    var candidates = [];
    var re = /(《[^》]+》(?:及[^。\n]+)?|SN\/T[_\s]?[0-9.]+-?[0-9]*《[^》]+》|SN\/T[_\s]?[0-9.]+-?[0-9]*[^\n]*)/g;
    var mm;
    while ((mm = re.exec(flat)) && candidates.length < 5) {
      var c = cleanBlank(mm[1]);
      if (c && c.length > 4 && !/使用鉴定/.test(c) || /性能|规程|规则/.test(c)) {
        candidates.push(c);
      }
    }
    // For performance docs, take first substantial basis before 检验结果
    var beforeResult = flat.split(/检\s*\n\s*验\s*\n\s*结\s*\n\s*果|按上述检验依据/)[0] || flat;
    candidates = [];
    re.lastIndex = 0;
    while ((mm = re.exec(beforeResult))) {
      var c2 = cleanBlank(mm[1]);
      if (c2.length > 6) candidates.push(c2);
    }
    if (candidates.length) {
      var seen = {};
      var out = [];
      candidates.forEach(function (c) {
        c = c.replace(/\s*拟装货物类别[\s\S]*$/, '').replace(/\s*[×xX]\s*危险货物.*$/, '').trim();
        if (c && !seen[c]) { seen[c] = 1; out.push(c); }
      });
      return out[0] || '';
    }
    return '';
  }

  function parseCertificate(text, meta) {
    meta = meta || {};
    var flat = (text || '').replace(/\r\n/g, '\n');
    var row = emptyRow(CERT_FIELDS);

    row['编号'] = extractCertNo(flat);

    row['申请人'] = matchField(flat, [
      /申请人\s+([^\n]+)/
    ]);
    row['使用人'] = matchField(flat, [
      /使用人\s+([^\n]+)/
    ]);

    var nm = parseCertNameAndMark(flat);
    row['包装容器名称及规格'] = nm.name;
    row['包装容器标记及批号'] = nm.mark;

    row['货物包装类别'] = matchField(flat, [
      /货物包装类别\s+([IiⅠⅡⅢIV一二三四\d]+)\s*类/,
      /货物包装类别\s+([^\n包装1]+)/
    ]);
    if (row['货物包装类别'] && !/类$/.test(row['货物包装类别'])) {
      row['货物包装类别'] = row['货物包装类别'] + '类';
    }
    // Normalize
    var catM = flat.match(/货物包装类别\s*([IiⅠⅡⅢIV一二三四\d]+)\s*类/);
    if (catM) row['货物包装类别'] = catM[1] + '类';

    row['包装容器性能检验结果单号'] = matchField(flat, [
      /包装容器性能\s*\n?\s*检验结果单号\s*([0-9A-Za-z]+)/,
      /检验结果单号\s*([0-9A-Za-z]{10,})/,
      /包装容器性能[\s\S]{0,40}?([0-9]{3}[A-Za-z][0-9A-Za-z]{10,})/
    ]);
    // Layout often has number between 性能 and 检验结果单号
    if (!row['包装容器性能检验结果单号']) {
      var pm = flat.match(/包装容器性能\s*\n\s*([0-9A-Za-z]{10,})\s*\n\s*检验结果单号/);
      if (pm) row['包装容器性能检验结果单号'] = cleanBlank(pm[1]);
      else {
        pm = flat.match(/货物包装类别[\s\S]{0,120}?([0-9]{3}N[0-9A-Za-z]+Z[0-9]{2})/);
        if (pm && pm[1] !== row['编号']) row['包装容器性能检验结果单号'] = pm[1];
      }
    }

    row['运输方式'] = matchField(flat, [
      /运输方式\s+([^\n]+)/
    ]);

    var names = parseDangerNames(flat);
    row['危险货物名称中文'] = names.zh;
    row['危险货物名称英文'] = names.en;

    // 类别只取 IMDG 类号（如 3 / 8 / 3.1），不要吞进品名后缀 402、405-4P
    row['危险货物类别'] = matchField(flat, [
      /危险货物类别\s*([0-9]{1,2}(?:\.[0-9])?)/
    ]);
    row['联合国编号'] = matchField(flat, [
      /联合国编号\s+([0-9A-Za-z]+)/
    ]);

    row['危险货物状态'] = matchField(flat, [
      /危险货物状态\s+([^\s\n危险]+)/
    ]);
    row['危险货物密度'] = matchField(flat, [
      /危险货物密度\s+([0-9.]+)/
    ]);

    row['报检包件数量'] = stripStarsQty(matchField(flat, [
      /报检包件数量\s+\*{0,2}\s*([^\s\n单]+)/
    ]));
    row['单件容积'] = stripStarsQty(matchField(flat, [
      /单件容积\s+\*{0,3}\s*([^\s\n单]+)/
    ]));
    row['单件毛重'] = stripStarsQty(matchField(flat, [
      /单件毛重\s+\*{0,2}\s*([^\n]+)/
    ]));
    row['单件净重'] = stripStarsQty(matchField(flat, [
      /单件净重\s+\*{0,2}\s*([^\n]+)/
    ]));

    var fillM = flat.match(/危险货物灌装日期\s+([\d\s年日月]+)/);
    if (fillM) row['危险货物灌装日期'] = normalizeDate(fillM[1]);

    row['检验依据'] = matchField(flat, [
      /检验依据\s+(《[^》]+》及[^\n]+)/,
      /检验依据\s+([^\n]+)/
    ]);

    row['鉴定结果摘要'] = '';
    if (/符合《国际海运危险货物规则》/.test(flat) || /适用性及使用方法符合/.test(flat)) {
      var am = flat.match(/符合(《[^》]+》[^\n]*|SN\/T[^\n]+要求)/);
      row['鉴定结果摘要'] = '适用性及使用方法符合《国际海运危险货物规则》及 SN/T0370.3 使用鉴定要求';
      var sn = flat.match(/SN\/T\s*0370\.3-?\d*/);
      if (sn) row['鉴定结果摘要'] = '符合《国际海运危险货物规则》、' + sn[0] + ' 使用鉴定要求';
    }

    var issueM = flat.match(/日期[：:]\s*([\d\s年日月]+)/);
    // Prefer the one near 签字
    var issue2 = flat.match(/签字[：:][\s\S]{0,100}?日期[：:]\s*([\d\s年日月]+)/);
    if (issue2) row['签发日期'] = normalizeDate(issue2[1]);
    else if (issueM) row['签发日期'] = normalizeDate(issueM[1]);

    var validM = flat.match(/本结果单有效期\s*截止于\s*([\d\s年日月]+)/);
    if (validM) row['本结果单有效期截止'] = normalizeDate(validM[1]);

    row['源文件名'] = meta.sourceName || '';
    row['导入时间'] = meta.importedAt || nowStr();
    return row;
  }

  function parseCertNameAndMark(flat) {
    var name = '';
    var mark = '';

    // 纸箱 / 钢桶两种版式：标题顺序可能对调；标记在「货物包装类别」同行或下一行
    var block = flat.match(/包装容器(?:名称及规格|标记及批号)\s+包装容器(?:标记及批号|名称及规格)\s*\n([\s\S]*?)货物包装类别/);
    if (block) {
      var lines = block[1].split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      var nameLines = [];
      lines.forEach(function (line) {
        if (isPackMarkLine(line)) return;
        line = line.replace(/\s+\d[A-Z0-9]{1,3}\/[A-Z0-9.\/]+$/i, '').trim();
        if (line) nameLines.push(line);
      });
      name = normalizePackName(nameLines.join(' '));
    }

    if (!name) {
      var nm2 = flat.match(/((?:钢制|双瓦楞|铁桶|塑料)[\s\S]{0,140}?皮重\s*[:：]?\s*[0-9.]+kg(?:[\s\S]{0,40}?装货\s*物)?)/);
      if (nm2) name = normalizePackName(nm2[1]);
    }

    if (name && name.length > 160) {
      var cut = name.search(/货物包装类别|申请人|使用人|运输方式|危险货物|包装容器性能/);
      if (cut > 8) name = name.slice(0, cut);
      name = name.replace(/包装容器名称及规格|包装容器标记及批号/g, '').trim();
    }

    var marks = [];
    // 1A1/Y1.6/100/26（1A1 三字符）与 4G/Y25/S/25
    var umRe = /\b(\d[A-Z0-9]{1,3}\/[A-Z0-9.]+\/[A-Z0-9.]+\/\d+)\b/g;
    var um;
    while ((um = umRe.exec(flat))) {
      if (marks.indexOf(um[1]) < 0) marks.push(um[1]);
    }
    var cm = flat.match(/\bCN\/\s*([A-Za-z0-9]+)\s*_+\s*PI\s*[:：]?\s*(\d+)/i);
    if (cm) {
      marks.push('CN/' + cm[1] + '_PI:' + cm[2]);
    } else {
      cm = flat.match(/\b(CN\/[A-Za-z0-9]+(?:_*PI[:：]?\d+)?)/i);
      if (cm) marks.push(cm[1].replace(/__+/g, '_'));
    }
    mark = marks.join(' / ');
    return { name: cleanBlank(name), mark: mark };
  }

  function normalizePackName(s) {
    s = String(s || '');
    s = s.replace(/_+/g, ' ');
    s = s.replace(/装货\s*物/g, '装货物');
    s = s.replace(/\s*:\s*/g, ':');
    s = s.replace(/\s*,\s*/g, ', ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/Φ\s*/g, 'Φ');
    s = s.replace(/(\d)\s*L\b/g, '$1L');
    s = s.replace(/mm\s*,/g, 'mm,');
    s = s.replace(/mm皮重/g, 'mm 皮重').replace(/kg内有/g, 'kg 内有');
    return s;
  }

  function isPackMarkLine(line) {
    return /^\d[A-Z0-9]{1,3}\/[A-Z0-9.\/]+$/i.test(line)
      || /^CN\//i.test(line)
      || /^CN\/\s*[A-Za-z0-9]+\s*_+\s*PI/i.test(line);
  }

  function parseDangerNames(flat) {
    var zh = '';
    var en = '';
    var zhBlock = flat.match(/（中文）\s*([\s\S]*?)（英文）/);
    if (zhBlock) {
      zh = zhBlock[1]
        .replace(/危险货物类别\s*[0-9]{1,2}(?:\.[0-9])?/g, ' ')
        .replace(/危险货物名称/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      zh = cleanBlank(zh);
      // Join split " / Thinner_xxx" fragments
      zh = zh.replace(/\s+\/\s+/g, ' / ').replace(/\s+/g, ' ').trim();
    } else {
      var zhM = flat.match(/（中文）\s*([^\n]+)/);
      if (zhM) zh = cleanBlank(zhM[1].replace(/危险货物类别\s*\S+/g, ''));
    }
    var enM = flat.match(/（英文）\s*\*{0,3}\s*([^\n联合国]*)/);
    if (enM) {
      en = cleanBlank(enM[1]);
      if (/^\*+$/.test(en) || !en) en = '';
    }
    return { zh: zh, en: en };
  }

  function emptyRow(fields) {
    var o = {};
    fields.forEach(function (f) { o[f] = ''; });
    return o;
  }

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function parseAuto(text, meta) {
    var type = detectDocType(text);
    if (type === '危包证') return { type: type, row: parseCertificate(text, meta) };
    if (type === '包装性能单') return { type: type, row: parsePerformance(text, meta) };
    return { type: 'unknown', row: null };
  }

  return {
    detectDocType: detectDocType,
    parsePerformance: parsePerformance,
    parseCertificate: parseCertificate,
    parseAuto: parseAuto,
    PERF_FIELDS: PERF_FIELDS,
    CERT_FIELDS: CERT_FIELDS,
    cleanBlank: cleanBlank,
    normalizeDate: normalizeDate,
    stripStarsQty: stripStarsQty
  };
});

