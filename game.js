(function (root) {
  "use strict";

  var WEEKS_TOTAL = 12;
  var SAVE_KEY = "volleyball-girl-v1";

  var STAT_KEYS = [
    { key: "spike", label: "扣球" },
    { key: "receive", label: "接发" },
    { key: "jump", label: "弹跳" },
    { key: "fitness", label: "体能" },
    { key: "team", label: "团队" },
    { key: "study", label: "学业" },
    { key: "fame", label: "人气" },
    { key: "mood", label: "心情" }
  ];

  var MONTHS = ["四月", "五月", "六月"];

  var ACTIONS = [
    {
      id: "fitness",
      name: "体能循环",
      hint: "折返跑、核心、跳跃。体能和弹跳上去，人也更累。",
      energy: 20,
      deltas: { fitness: 9, jump: 6, mood: -4, energy: -20 }
    },
    {
      id: "spike",
      name: "扣球特训",
      hint: "助跑、起跳、鞭打。主攻的饭碗。",
      energy: 22,
      deltas: { spike: 10, jump: 4, fitness: 2, mood: -2, energy: -22 }
    },
    {
      id: "receive",
      name: "接发特训",
      hint: "垫球、预判、低重心。比赛里活下来的本事。",
      energy: 20,
      deltas: { receive: 9, fitness: 3, team: 1, energy: -20 }
    },
    {
      id: "scrimmage",
      name: "队内对抗",
      hint: "五对五。涨球商，也涨和队友的默契。",
      energy: 22,
      deltas: { spike: 4, receive: 4, team: 8, jump: 2, fitness: 2, mood: 1, energy: -22 }
    },
    {
      id: "study",
      name: "晚自习",
      hint: "班主任的眼睛比副攻的拦网还密。",
      energy: 10,
      deltas: { study: 9, mood: -2, fame: -1, energy: -10 }
    },
    {
      id: "rest",
      name: "好好休息",
      hint: "睡觉、泡澡、不看训练视频。恢复体力。",
      energy: 0,
      deltas: { mood: 8, energy: 28, fitness: 1 }
    },
    {
      id: "job",
      name: "便利店打工",
      hint: "夜班零钱。学业和体力都会被削一刀。",
      energy: 16,
      deltas: { money: 180, energy: -16, study: -3, mood: -1, fame: 2 }
    },
    {
      id: "out",
      name: "周末出门",
      hint: "奶茶、商业街、偶尔被人认出是排球部的。",
      energy: 8,
      money: 60,
      deltas: { mood: 7, fame: 6, energy: -8, money: -60 }
    }
  ];

  var RANDOM_EVENTS = [
    {
      id: "rain-extra",
      weight: 3,
      when: function (state, action) {
        return action.id !== "rest" && action.id !== "out";
      },
      text: function (state) {
        return "训练结束时体育馆外面已经下雨。苏晴把灯又打开：「再打二十个球。市赛不管天色。」\n" + state.name + "没吭声，只是把护膝拉紧。";
      },
      deltas: { spike: 3, fitness: 2, energy: -8, mood: -2 }
    },
    {
      id: "ankle",
      weight: 1,
      when: function (state, action) {
        return (action.id === "spike" || action.id === "fitness" || action.id === "scrimmage") &&
          state.energy < 28 && !state.flags.soreAnkle;
      },
      text: function (state) {
        return "落地时脚踝拧了一下。" + state.name + "咬着牙说没事。队医看了看：「先冰敷。别逞能。」";
      },
      deltas: { energy: -12, mood: -6, jump: -2 },
      flag: "soreAnkle"
    },
    {
      id: "setter-rice",
      weight: 3,
      when: function (state, action) {
        return action.id === "scrimmage" || action.id === "receive";
      },
      text: function (state) {
        return "二传周念在更衣室门口等她，提着两盒便当：「你今天二号位起跳早了半拍。吃完我跟你对一遍节奏。」";
      },
      deltas: { team: 4, spike: 2, mood: 4 },
      flag: "setterBond"
    },
    {
      id: "captain-talk",
      weight: 3,
      when: function (state) {
        return !state.flags.captainBond;
      },
      text: function (state) {
        return "队长苏晴把她留到最后：「教练看重你，不是让你一个人把球砸死。一传乱了，你再猛也是空的。」";
      },
      deltas: { team: 5, mood: 2 },
      flag: "captainBond"
    },
    {
      id: "classmate-show",
      weight: 2,
      when: function (state, action) {
        return action.id === "study" || action.id === "out";
      },
      text: function (state) {
        return "同班的人拉她去礼堂看学生会演出。灯光很亮。" + state.name + "第一次觉得排球馆以外的世界也有声音。";
      },
      deltas: { fame: 5, mood: 5, study: -2 }
    },
    {
      id: "reporter",
      weight: 2,
      when: function (state) {
        return state.fame >= 35 || state.spike >= 45;
      },
      text: function (state) {
        return "校刊记者堵在校门口，问她是想当王牌还是想当封面。" + state.name + "想了想：「我想赢。」第二天这句话被写成了标题。";
      },
      deltas: { fame: 8, mood: 2 }
    },
    {
      id: "parent-call",
      weight: 2,
      when: function (state) {
        return state.study < 40;
      },
      text: function (state) {
        return "晚上家里来电话。母亲不大喊，只是问月考怎么办。挂掉以后，" + state.name + "把数学练习册重新打开。";
      },
      deltas: { study: 4, mood: -4 }
    },
    {
      id: "hot-hand",
      weight: 2,
      when: function (state, action) {
        return action.id === "spike";
      },
      text: function () {
        return "有那么一下，助跑、踏跳、击球点叠在同一条线上。球砸在地板上，声音干脆得像拍手。她自己也愣了一秒。";
      },
      deltas: { spike: 5, mood: 6, fame: 2 }
    },
    {
      id: "rival-watch",
      weight: 2,
      when: function (state) {
        return state.week >= 5;
      },
      text: function (state) {
        return "二中的白凛靠在门边看完训练，走之前丢下一句：「六月见。别让我打得很无聊。」";
      },
      deltas: { mood: 1, team: 2 },
      flag: "rivalSeen"
    },
    {
      id: "snack",
      weight: 2,
      when: function (state, action) {
        return action.id === "job" || action.id === "rest";
      },
      text: function () {
        return "便利店临期面包半价。她买了两袋，第二天训练前分给接应和自由人。更衣室里第一次有人笑出声。";
      },
      deltas: { team: 3, mood: 3, money: -20 }
    },
    {
      id: "insomnia",
      weight: 2,
      when: function (state) {
        return state.energy < 35 && state.mood < 45;
      },
      text: function () {
        return "夜里两点还醒着。天花板像一张过大的球网。第二天眼圈青，扣球下网。";
      },
      deltas: { mood: -5, energy: -6, spike: -2 }
    },
    {
      id: "quiet-good",
      weight: 4,
      when: function () {
        return true;
      },
      text: function (state) {
        return "这周没有大事。体育馆木地板还是那股味道，" + state.name + "的呼吸渐渐能跟上哨声。";
      },
      deltas: { mood: 2 }
    }
  ];

  var CHOICE_EVENTS = [
    {
      id: "extra-practice",
      week: 3,
      title: "加练还是回家",
      text: function (state) {
        return "苏晴约她加练拦网。同一天晚自习要默写古文。\n" + state.name + "看着你，等一句准许。";
      },
      choices: [
        {
          label: "留下加练",
          deltas: { jump: 5, team: 4, study: -4, energy: -10 },
          log: "她留下了。苏晴拍拍她的肩：「这才像一回事。」"
        },
        {
          label: "去晚自习",
          deltas: { study: 6, mood: -2, team: -1 },
          log: "她背着书包走了。苏晴没说什么，只是把球筐拖回器材室。"
        }
      ]
    },
    {
      id: "interview",
      week: 7,
      title: "校刊专访",
      text: function (state) {
        return "校刊要给排球部做人物稿，镜头对着" + state.name + "。记者问：你最想被写成什么样的人？";
      },
      choices: [
        {
          label: "写成会赢的主攻",
          deltas: { fame: 4, mood: 3, spike: 2 },
          log: "稿子标题是《想赢的人》。二中有人把剪报贴在更衣室。"
        },
        {
          label: "写成普通一年级",
          deltas: { mood: 5, fame: 2, study: 2 },
          log: "稿子很平。她反而松了口气，训练时肩膀不那么紧了。"
        }
      ]
    },
    {
      id: "rival-scrim",
      week: 10,
      title: "白凛的邀请",
      text: function (state) {
        return "白凛发来消息，约周末开一场非正式对抗。周念说可以练节奏，苏晴说也可能受伤。";
      },
      choices: [
        {
          label: "打",
          deltas: { spike: 4, receive: 4, team: 3, energy: -14, fame: 3 },
          log: "她们赢了一局、输了两局。白凛走时比了个「六月」的口型。",
          flag: "rivalRespect"
        },
        {
          label: "养伤备战",
          deltas: { energy: 10, mood: 2, fitness: 2 },
          log: "她回了句「市赛见」。白凛只回了一个点头的表情。"
        }
      ]
    }
  ];

  var ENDINGS = [
    {
      id: "burnout",
      tag: "提前离队",
      title: "哨声停了",
      when: function (state) {
        return state.mood <= 20 || state.flags.quit;
      },
      text: function (state) {
        return "六月的名单里没有" + state.name + "。\n她把球衣叠好，放在器材室最上层。\n「不是不喜欢排球，」她说，「是这十二周把喜欢用完了。」\n你没有拦。有些结局发生在比赛之前。";
      }
    },
    {
      id: "injury",
      tag: "带伤遗憾",
      title: "左脚的夏天",
      when: function (state) {
        return state.flags.soreAnkle &&
          (state.flags.city === "group" || state.flags.city === "none") &&
          power(state) < 48;
      },
      text: function (state) {
        return "市赛开场前，队医摇头。\n" + state.name + "坐在替补席看完决赛，掌声隔得很远。\n白凛赛后走过来，把一瓶水放在她脚边：「明年我还在。」";
      }
    },
    {
      id: "ace",
      tag: "全国展望",
      title: "王牌主攻",
      when: function (state) {
        return power(state) >= 62 && state.spike >= 64 && state.jump >= 52 &&
          (state.flags.city === "champion" || state.flags.city === "final");
      },
      text: function (state) {
        return "最后一球，" + state.name + "斜线扣死。体育馆的顶灯像一排白热的太阳。\n省队观察员在看台上写了她的名字。\n苏晴只说：「还早。明天照常跑步。」\n可更衣室里，已经有人开始叫她王牌。";
      }
    },
    {
      id: "mvp",
      tag: "市赛金杯",
      title: "奖杯比人矮一点",
      when: function (state) {
        return state.flags.city === "champion";
      },
      text: function (state) {
        return "市立一中时隔三年再拿冠军。最有价值球员发给了" + state.name + "。\n她举杯的姿势有点笨，笑容却是真的。\n你在场边想：十二周其实很短。短，也够把一个人推到灯光底下。";
      }
    },
    {
      id: "twins",
      tag: "双人节奏",
      title: "二传与主攻",
      when: function (state) {
        return state.team >= 62 && state.flags.setterBond && state.spike >= 50 &&
          power(state) >= 52 && state.flags.city !== "champion";
      },
      text: function (state) {
        return "解说把镜头给了网前的两个人。\n周念的球到了，" + state.name + "不用看也能起跳。\n比赛没有走到最高领奖台，但更衣室里有人说：「这才叫一套进攻。」\n对一年级来说，这就够当种子。";
      }
    },
    {
      id: "scholar",
      tag: "试卷上的月亮",
      title: "学霸退队",
      when: function (state) {
        return state.study >= 72 && power(state) < 52;
      },
      text: function (state) {
        return "月考年级第十二。排球部的加练单被她退了回来。\n「我还可以喜欢排球，」" + state.name + "说，「只是不能再用喜欢当借口。」\n夏天过去了。她的手指上有墨，没有胶布。";
      }
    },
    {
      id: "idol",
      tag: "校园风云",
      title: "镜头比球网密",
      when: function (state) {
        return state.fame >= 70;
      },
      text: function (state) {
        return "校门口有人等她合影。扣球视频在班级群里转发。\n市赛成绩普通，人气榜却第一。\n" + state.name + "后来跟你开玩笑：「原来出名比拦网容易。」\n你知道这不是最好的结局，也不是最坏的。";
      }
    },
    {
      id: "starter",
      tag: "四强先发",
      title: "名字写在上场名单",
      when: function (state) {
        return state.flags.city === "final" || state.flags.city === "semi";
      },
      text: function (state) {
        return "一中止步四强。对上二中时，白凛赢了，但也看了她很久。\n" + state.name + "的名字印在先发栏。明年的四月，还会有人把球抛给她。";
      }
    },
    {
      id: "bench",
      tag: "普通的夏天",
      title: "替补席也能看见天空",
      when: function () {
        return true;
      },
      text: function (state) {
        return "市赛小组没出线。阳光很好，体育馆外面的蝉比观众多。\n" + state.name + "把护膝洗干净，挂在阳台。\n「我还要打，」她说。\n这不是奖杯结局。这是能把游戏再开一局的结局。";
      }
    }
  ];

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function power(state) {
    return Math.round(
      state.spike * 0.32 +
      state.receive * 0.24 +
      state.jump * 0.2 +
      state.fitness * 0.14 +
      state.team * 0.1
    );
  }

  function weekMeta(week) {
    var index = week - 1;
    var month = MONTHS[Math.floor(index / 4)];
    var weekInMonth = (index % 4) + 1;
    return {
      month: month,
      weekInMonth: weekInMonth,
      label: month + " · 第" + weekInMonth + "周",
      remain: Math.max(0, WEEKS_TOTAL - week + 1)
    };
  }

  function createState(name) {
    return {
      name: (name || "林晓雨").trim() || "林晓雨",
      week: 1,
      spike: 32,
      receive: 28,
      jump: 34,
      fitness: 30,
      team: 22,
      study: 42,
      fame: 12,
      mood: 72,
      energy: 84,
      money: 200,
      flags: {},
      log: ["你成为市立一中排球部的临时教练。十二周后，全市中学联赛。"]
    };
  }

  function applyDeltas(state, deltas) {
    var changes = [];
    if (!deltas) return changes;
    Object.keys(deltas).forEach(function (key) {
      var before = state[key];
      if (key === "money") {
        state.money = Math.max(0, state.money + deltas[key]);
      } else {
        state[key] = clamp(state[key] + deltas[key], 0, 100);
      }
      var diff = state[key] - before;
      if (diff !== 0) changes.push({ key: key, diff: diff });
    });
    return changes;
  }

  function labelFor(key) {
    var found = STAT_KEYS.filter(function (s) { return s.key === key; })[0];
    if (found) return found.label;
    if (key === "energy") return "体力";
    if (key === "money") return "金钱";
    return key;
  }

  function pickWeighted(list) {
    var total = 0;
    list.forEach(function (item) { total += item.weight || 1; });
    var roll = Math.random() * total;
    for (var i = 0; i < list.length; i++) {
      roll -= list[i].weight || 1;
      if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function pickRandomEvent(state, action) {
    var pool = RANDOM_EVENTS.filter(function (ev) {
      return !ev.when || ev.when(state, action);
    });
    if (!pool.length) return null;
    return pickWeighted(pool);
  }

  function calendarEvent(state) {
    if (state.week === 4) {
      var pass = state.study >= 45;
      return {
        title: "四月月考",
        text: pass
          ? "考场很静。数学最后一题她写完了。班主任在成绩单上点了点头，没再提退部的事。"
          : "两门亮红灯。班主任把你和她一起叫去：「再这样，市赛也救不了学分。」",
        deltas: pass ? { study: 3, mood: 4 } : { study: 2, mood: -8, energy: -6 },
        flag: pass ? "examPass" : "examFail"
      };
    }
    if (state.week === 8) {
      var p = power(state);
      var ok = p >= 42;
      return {
        title: "区预选赛",
        text: ok
          ? "预选赛打满三局。自由人扑救成功的那一瞬，看台上有人喊她的名字。一中出线。"
          : "一传乱了，她在四号位空跳了两次。预选险过，苏晴赛后开会开到很晚。",
        deltas: ok
          ? { team: 4, fame: 5, mood: 6, energy: -10 }
          : { team: 2, mood: -4, energy: -12 },
        flag: ok ? "districtWin" : "districtStruggle"
      };
    }
    if (state.week === 12) {
      return resolveCity(state);
    }
    return null;
  }

  function resolveCity(state) {
    var p = power(state);
    var city = "group";
    var text;
    if (state.mood <= 18) {
      state.flags.quit = true;
      city = "none";
      text = "名单公布前，她把球鞋放回了柜子。市赛没有她。";
    } else if (p >= 60 && state.energy >= 18) {
      city = "champion";
      text = "决赛对二中。第五局 16-14。白凛的拦网擦网出界。" + state.name + "站在场中央，好像才听见观众在喊。";
    } else if (p >= 50) {
      city = "final";
      text = "决赛输给二中。白凛走过来碰了一下拳：「你比四月强很多。」";
    } else if (p >= 40) {
      city = "semi";
      text = "四强战里，对方的高球把一中压在后排。她们打满三局，止步半决赛。";
    } else {
      city = "group";
      text = "小组赛第三场失利。体育馆的灯一排排关掉，木地板上只剩鞋印。";
    }
    state.flags.city = city;
    return {
      title: "全市中学联赛",
      text: text,
      deltas: city === "champion"
        ? { fame: 10, mood: 8, team: 4, energy: -15 }
        : { fame: 4, mood: city === "group" ? -6 : 2, energy: -12 }
    };
  }

  function getEnding(state) {
    for (var i = 0; i < ENDINGS.length; i++) {
      if (ENDINGS[i].when(state)) return ENDINGS[i];
    }
    return ENDINGS[ENDINGS.length - 1];
  }

  function actionAvailable(state, action) {
    if (state.energy < action.energy) return false;
    if (action.money && state.money < action.money) return false;
    return true;
  }

  function applyWeek(state, actionId) {
    var action = ACTIONS.filter(function (a) { return a.id === actionId; })[0];
    if (!action) throw new Error("未知行动");
    if (!actionAvailable(state, action)) {
      return { ok: false, reason: "这周做不了这件事。体力或金钱不够。" };
    }

    var allChanges = [];
    allChanges = allChanges.concat(applyDeltas(state, action.deltas));

    var lines = ["【" + action.name + "】", action.hint];
    var ev = pickRandomEvent(state, action);
    if (ev) {
      lines.push("", ev.text(state));
      allChanges = allChanges.concat(applyDeltas(state, ev.deltas));
      if (ev.flag) state.flags[ev.flag] = true;
    }

    var cal = calendarEvent(state);
    if (cal) {
      lines.push("", "—— " + cal.title + " ——", cal.text);
      allChanges = allChanges.concat(applyDeltas(state, cal.deltas));
      if (cal.flag) state.flags[cal.flag] = true;
    }

    if (state.energy <= 8) {
      state.flags.overwork = (state.flags.overwork || 0) + 1;
      allChanges = allChanges.concat(applyDeltas(state, { mood: -10 }));
      lines.push("", "体力见底。她还是把最后一组做完了，更衣室里没人说话。");
      if (state.flags.overwork >= 3) {
        lines.push("队医把加练单撕了：「再这样，人会先于赛季结束。」");
      }
    }

    if (state.mood <= 20) state.flags.quit = true;

    state.log.push(weekMeta(state.week).label + " · " + action.name);
    state.week += 1;

    return {
      ok: true,
      action: action,
      lines: lines.join("\n"),
      changes: allChanges,
      ended: state.week > WEEKS_TOTAL || state.flags.quit
    };
  }

  function introText(name) {
    return "市立第一中学，排球部。\n\n" +
      "三年前这里拿过市赛亚军，如今只剩半支残阵。校方把你空降过来，当临时教练。\n\n" +
      "部里有个一年级——" + name + "。个子不算顶尖，弹跳却有点意思。对抗时话很少，眼睛很亮。\n\n" +
      "全市中学联赛还有三个月。你只有十二周。\n把每周交给哪一件事，会改写她的夏天。";
  }

  function save(state, screen) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state: state, screen: screen }));
    } catch (e) { /* ignore quota */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- UI ---------- */

  var ui = {
    screen: "title",
    state: null,
    result: null,
    choice: null,
    about: false
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderBars(state) {
    return STAT_KEYS.map(function (s) {
      var v = state[s.key];
      var cls = s.key === "mood" ? " mood" : "";
      return '<div class="stat"><span class="label">' + s.label + '</span>' +
        '<div class="bar' + cls + '"><span style="width:' + v + '%"></span></div>' +
        '<span>' + v + '</span></div>';
    }).join("") +
      '<div class="stat"><span class="label">体力</span>' +
      '<div class="bar energy"><span style="width:' + state.energy + '%"></span></div>' +
      '<span>' + state.energy + '</span></div>' +
      '<div class="resources"><span>战力 ' + power(state) + '</span><span>金钱 ¥' + state.money + '</span></div>';
  }

  function renderTitle() {
    return '<section class="title-screen">' +
      '<div class="eyebrow">文字养成</div>' +
      '<h1>排球女孩</h1>' +
      '<p class="subtitle">文字养成原型　·　十二周　·　多种结局</p>' +
      '<div class="name-row">' +
      '<input id="girl-name" maxlength="8" value="林晓雨" aria-label="角色姓名">' +
      "</div>" +
      '<div class="menu">' +
      '<button class="btn primary" data-act="start">开始培养</button>' +
      (load() ? '<button class="btn" data-act="continue">继续上周</button>' : "") +
      '<button class="btn ghost" data-act="about">关于原型</button>' +
      "</div></section>";
  }

  function renderAbout() {
    return '<section class="panel">' +
      '<div class="eyebrow">原型说明</div>' +
      "<h2>这是能点完的骨架</h2>" +
      '<p class="story">灵感来自美少女梦工厂与心跳回忆：属性、周计划、随机事件、选项、多结局。\n' +
      "没有立绘。所有文本都在中文里。\n\n" +
      "你是教练。每周选一项安排。四月月考、五月预选、六月市赛会强制插入。\n" +
      "扣球、接发、弹跳、体能、团队、学业、人气、心情会改结局。\n\n" +
      "内容是第一版密度：事件池可继续往上堆。</p>" +
      '<div class="footer-actions"><button class="btn" data-act="title">返回</button></div>' +
      "</section>";
  }

  function renderIntro() {
    return '<section class="panel">' +
      '<div class="eyebrow">四月</div>' +
      '<p class="story">' + escapeHtml(introText(ui.state.name)) + "</p>" +
      '<div class="footer-actions"><button class="btn primary" data-act="hub">进入第一周</button></div>' +
      "</section>";
  }

  function renderHub() {
    var state = ui.state;
    var meta = weekMeta(state.week);
    var choice = CHOICE_EVENTS.filter(function (c) { return c.week === state.week; })[0];
    var actions = ACTIONS.map(function (a) {
      var disabled = !actionAvailable(state, a) ? " disabled" : "";
      return '<button class="btn" data-act="do" data-id="' + a.id + '"' + disabled + ' title="' + a.hint + '">' +
        a.name + "</button>";
    }).join("");

    var extra = "";
    if (choice) {
      extra = '<p class="action-hint">本周有一件等人拍板的事，选完安排后会遇上。</p>';
    }

    return '<div class="layout">' +
      '<aside class="panel">' +
      '<p class="girl-name">' + escapeHtml(state.name) + "</p>" +
      '<p class="meta">一年级　主攻　市立一中</p>' +
      renderBars(state) +
      "</aside>" +
      '<main class="panel">' +
      '<div class="header-row"><div class="week-title">' + meta.label + "</div>" +
      '<div class="week-sub">距市赛 ' + meta.remain + " 周</div></div>" +
      '<div class="court-line"></div>' +
      '<p class="story">本周把她交给哪一件事？</p>' +
      '<div class="actions">' + actions + extra + "</div>" +
      '<p class="action-hint">体力不够的项目会变灰。休息能把人拉回来。</p>' +
      '<p class="action-hint">记录：' + escapeHtml(state.log[state.log.length - 1]) + "</p>" +
      '<div class="footer-actions">' +
      '<button class="btn ghost" data-act="title">回标题</button>' +
      "</div></main></div>";
  }

  function renderResult() {
    var r = ui.result;
    var changeHtml = r.changes.length
      ? '<p class="changes">' + r.changes.map(function (c) {
          var cls = c.diff < 0 ? "neg" : "";
          var sign = c.diff > 0 ? "+" : "";
          return '<span class="' + cls + '">' + labelFor(c.key) + " " + sign + c.diff + "</span>";
        }).join("　") + "</p>"
      : "";
    var nextLabel = r.ended ? "查看结局" : "下一周";
    var nextAct = r.ended ? "ending" : (ui.pendingChoice ? "choice" : "hub");
    return '<div class="layout">' +
      '<aside class="panel">' +
      '<p class="girl-name">' + escapeHtml(ui.state.name) + "</p>" +
      renderBars(ui.state) +
      "</aside>" +
      '<main class="panel">' +
      '<p class="story">' + escapeHtml(r.lines) + "</p>" +
      changeHtml +
      '<div class="footer-actions"><button class="btn primary" data-act="' + nextAct + '">' + nextLabel + "</button></div>" +
      "</main></div>";
  }

  function renderChoice() {
    var c = ui.choice;
    var buttons = c.choices.map(function (ch, i) {
      return '<button class="btn" data-act="choose" data-i="' + i + '">' + ch.label + "</button>";
    }).join("");
    return '<section class="panel">' +
      '<div class="eyebrow">事件</div>' +
      "<h2>" + escapeHtml(c.title) + "</h2>" +
      '<p class="story">' + escapeHtml(c.text(ui.state)) + "</p>" +
      '<div class="footer-actions">' + buttons + "</div>" +
      "</section>";
  }

  function renderEnding() {
    var ending = getEnding(ui.state);
    return '<section class="panel ending">' +
      '<span class="tag">' + ending.tag + "</span>" +
      "<h2>" + ending.title + "</h2>" +
      '<p class="story">' + escapeHtml(ending.text(ui.state)) + "</p>" +
      '<p class="meta">战力 ' + power(ui.state) +
      "　扣球 " + ui.state.spike +
      "　学业 " + ui.state.study +
      "　人气 " + ui.state.fame +
      "　心情 " + ui.state.mood + "</p>" +
      '<div class="footer-actions">' +
      '<button class="btn primary" data-act="restart">再来一局</button>' +
      '<button class="btn" data-act="title">回标题</button>' +
      "</div></section>";
  }

  function render() {
    var app = document.getElementById("app");
    if (!app) return;
    var html = "";
    if (ui.screen === "title") html = renderTitle();
    else if (ui.screen === "about") html = renderAbout();
    else if (ui.screen === "intro") html = renderIntro();
    else if (ui.screen === "hub") html = renderHub();
    else if (ui.screen === "result") html = renderResult();
    else if (ui.screen === "choice") html = renderChoice();
    else if (ui.screen === "ending") html = renderEnding();
    app.innerHTML = html;
    if (ui.state && ui.screen !== "title") save(ui.state, ui.screen);
  }

  function pendingChoiceForWeek(week) {
    return CHOICE_EVENTS.filter(function (c) {
      return c.week === week && !ui.state.flags["choice:" + c.id];
    })[0] || null;
  }

  function onClick(ev) {
    var btn = ev.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");

    if (act === "start") {
      var input = document.getElementById("girl-name");
      ui.state = createState(input ? input.value : "林晓雨");
      ui.screen = "intro";
      ui.result = null;
      ui.choice = null;
      clearSave();
    } else if (act === "continue") {
      var saved = load();
      if (saved && saved.state) {
        ui.state = saved.state;
        ui.screen = saved.screen === "result" || saved.screen === "choice" ? "hub" : (saved.screen || "hub");
        if (ui.state.week > WEEKS_TOTAL) ui.screen = "ending";
      }
    } else if (act === "about") {
      ui.screen = "about";
    } else if (act === "title") {
      ui.screen = "title";
    } else if (act === "hub") {
      ui.screen = "hub";
    } else if (act === "do") {
      var id = btn.getAttribute("data-id");
      var beforeWeek = ui.state.week;
      var result = applyWeek(ui.state, id);
      if (!result.ok) return;
      ui.result = result;
      ui.pendingChoice = pendingChoiceForWeek(beforeWeek);
      ui.screen = "result";
    } else if (act === "choice") {
      ui.choice = ui.pendingChoice;
      ui.screen = "choice";
    } else if (act === "choose") {
      var index = Number(btn.getAttribute("data-i"));
      var picked = ui.choice.choices[index];
      var chg = applyDeltas(ui.state, picked.deltas);
      if (picked.flag) ui.state.flags[picked.flag] = true;
      ui.state.flags["choice:" + ui.choice.id] = true;
      ui.result = { ok: true, lines: picked.log, changes: chg, ended: ui.state.week > WEEKS_TOTAL || ui.state.flags.quit };
      ui.pendingChoice = null;
      ui.screen = "result";
    } else if (act === "ending") {
      ui.screen = "ending";
      clearSave();
    } else if (act === "restart") {
      ui.state = createState(ui.state.name);
      ui.screen = "intro";
      ui.result = null;
    }
    render();
  }

  function boot() {
    var app = document.getElementById("app");
    if (!app) return;
    app.addEventListener("click", onClick);
    render();
  }

  var api = {
    WEEKS_TOTAL: WEEKS_TOTAL,
    ACTIONS: ACTIONS,
    ENDINGS: ENDINGS,
    createState: createState,
    applyWeek: applyWeek,
    applyDeltas: applyDeltas,
    getEnding: getEnding,
    power: power,
    weekMeta: weekMeta,
    actionAvailable: actionAvailable,
    introText: introText,
    boot: boot
  };

  root.VolleyballGirl = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);

if (typeof module !== "undefined" && module.exports) {
  module.exports = globalThis.VolleyballGirl;
}
