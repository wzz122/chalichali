// 外卖单识别：把外卖平台（Uber Eats、熊猫外卖、Rocket Now）订单上的文字变成订单行。
// 文字从哪来：iPad 的「扫描文本」、拍照识别、复制粘贴都行，这里只管认字以后的部分。
//
// 接单屏（staff.html）用这个文件；收银 App 用同一套规则的 Swift 版
// （ChaliPOS.swiftpm/Model/DeliveryReader.swift）。两边都跑 tests/delivery-samples/ 里的样本，
// 改规则两边一起改，再加一个样本。
//
// 认法：
//   - 一行里能认出菜单上的饮品名（中文、日文、英文、店员教过的叫法都行，允许 OCR 认错一两个字）就是新的一杯
//   - 饮品下面几行是它的选项：大小、冰量、甜度、小料、数量
//   - 有价格或数量、但认不出来的行放进 unknown，让店员选一次，以后就记住（aliases）
(function (root) {
  "use strict";

  const SWEET_LEVELS = [120, 100, 70, 50, 30, 0];

  // ---------------------------------------------------------------------------
  // 文字整理
  // ---------------------------------------------------------------------------

  // 比对名字用：全角半角统一、平假名变片假名、OCR 常认错的字统一、去掉长音和标点
  const SAME = {
    "口": "ロ", "力": "カ", "二": "ニ", "工": "エ", "八": "ハ", "卜": "ト", "夕": "タ",
    "ァ": "ア", "ィ": "イ", "ゥ": "ウ", "ェ": "エ", "ォ": "オ", "ャ": "ヤ", "ュ": "ユ", "ョ": "ヨ", "ヮ": "ワ",
    // ツ/シ 常认错，统一成 シ；小字ッ也直接变 シ（只换一次，变成 ツ 的话整理两次结果不一样，教过的「ホット…」就对不上）
    "ッ": "シ", "ツ": "シ", "ソ": "ン",
    "烏": "乌", "龍": "龙", "鮮": "鲜", "檸": "柠", "楊": "杨", "紅": "红", "綠": "绿", "緑": "绿", "黃": "黄",
    "雙": "双", "兩": "两", "凍": "冻", "優": "优", "奧": "奥", "麗": "丽", "葉": "叶", "鳳": "凤", "異": "异",
    "蘆": "芦", "薈": "荟", "車": "车", "釐": "厘", "島": "岛", "長": "长", "腸": "肠", "芒": "芒",
  };
  const DROP = /[\s・·\-‐－—―ー一~〜～'’.,，、。:：;；!！?？()（）「」『』【】\[\]〔〕<>＜＞"“”/／|｜+＋*＊#＃]/g;

  function normName(text) {
    let s = String(text || "").normalize("NFKC").toLowerCase()
      .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    s = [...s].map((ch) => SAME[ch] || ch).join("");
    return s.replace(DROP, "");
  }

  // 找关键词用：全角半角统一、大写、去空格
  function compact(text) {
    return String(text || "").normalize("NFKC").toUpperCase().replace(/\s+/g, "");
  }

  const PRICE_RE = /[+＋]?\s*[¥￥]\s*[\d,，.]+|[+＋]?[\d,，]+\s*円/g;
  const QTY_LEAD_RE = /^\s*(\d{1,2})\s*(?:[xX×✕*＊]|点|個|杯|份)\s*/;
  const QTY_BARE_LEAD_RE = /^\s*(\d{1,2})\s+(?=\D)/;
  const QTY_TAIL_RE = /[xX×✕*＊]\s*(\d{1,2})(?!\d)/;
  const QTY_UNIT_RE = /(\d{1,2})\s*(?:点|個|杯|份)(?!\d)/;
  const QTY_FIELD_RE = /数量\s*[:：]?\s*(\d{1,2})/;

  // 名字部分：去掉价格、数量、【人気】这类装饰；括号里的内容（例如「(タピオカ入り)」）也去掉
  function nameCore(raw) {
    let s = String(raw || "").normalize("NFKC").replace(PRICE_RE, " ");
    s = s.replace(QTY_LEAD_RE, " ").replace(QTY_TAIL_RE, " ").replace(QTY_UNIT_RE, " ").replace(QTY_FIELD_RE, " ");
    const plain = s.replace(/【[^】]*】|\[[^\]]*\]|〔[^〕]*〕|\([^)]*\)|（[^）]*）/g, " ");
    const core = normName(plain);
    return core || normName(s);
  }

  function quantityOf(raw) {
    const s = String(raw || "").normalize("NFKC");
    const m = QTY_LEAD_RE.exec(s) || QTY_TAIL_RE.exec(s.replace(PRICE_RE, " ")) || QTY_UNIT_RE.exec(s.replace(PRICE_RE, " "))
      || QTY_FIELD_RE.exec(s) || QTY_BARE_LEAD_RE.exec(s);
    if (!m) return null;
    const n = Number(m[1]);
    return n >= 1 && n <= 50 ? n : null;
  }

  // 饮品本身的价格（「¥900」）；选项加价前面有「+」（「+¥70」「(+¥120)」）
  function hasMainPrice(raw) {
    const s = String(raw || "").normalize("NFKC");
    return [...s.matchAll(PRICE_RE)].some((m) => !/^[+＋]/.test(m[0].trim()));
  }

  function hasPrice(raw) {
    PRICE_RE.lastIndex = 0;
    const r = PRICE_RE.test(String(raw || "").normalize("NFKC"));
    PRICE_RE.lastIndex = 0;
    return r;
  }

  // ---------------------------------------------------------------------------
  // 名字比对
  // ---------------------------------------------------------------------------

  function bigrams(s) {
    const out = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  }

  // 候选名字有多少能在这一行里找到：完全包含算全部字数；否则按两字组覆盖率估算（容许 OCR 认错一两个字）
  function matchedChars(name, core) {
    if (name.length < 2 || !core) return 0;
    if (core.includes(name)) return name.length;
    if (name.length < 5) return 0;
    const pool = bigrams(core);
    const want = bigrams(name);
    let hit = 0;
    for (const b of want) {
      const i = pool.indexOf(b);
      if (i >= 0) { hit++; pool.splice(i, 1); }
    }
    const cover = hit / want.length;
    return cover >= 0.75 ? cover * name.length : 0;
  }

  function makeIndex(menu, aliases) {
    const items = menu.items.map((it) => ({
      it, names: [it.name, it.nameJP, it.nameEN].filter(Boolean).map(normName).filter((n) => n.length >= 2),
    }));
    const toppings = menu.toppings.map((t) => ({
      t, names: [t.name, t.nameJP, t.nameEN].filter(Boolean).map(normName).filter((n) => n.length >= 2),
    }));
    const taught = Object.entries(aliases || {})
      .map(([k, id]) => ({ key: normName(k), it: menu.items.find((i) => i.id === id) }))
      .filter((a) => a.key.length >= 2 && a.it);
    return { items, toppings, taught };
  }

  function matchItem(core, index) {
    let best = null;
    for (const a of index.taught) {
      if (core.includes(a.key) && (!best || a.key.length > best.score - 100)) best = { it: a.it, score: 100 + a.key.length };
    }
    if (best) return best;
    for (const e of index.items) {
      for (const n of e.names) {
        const score = matchedChars(n, core);
        if (score >= 3 && (!best || score > best.score)) best = { it: e.it, score };
      }
    }
    return best;
  }

  // 一行里所有的小料（长名字先认，认过的部分去掉，「ミニタピオカ」不会再认成「タピオカ」）
  function findToppings(core, index) {
    const names = [];
    for (const e of index.toppings) for (const n of e.names) names.push({ n, t: e.t });
    names.sort((a, b) => b.n.length - a.n.length);
    const found = [];
    let rest = core;
    for (const { n, t } of names) {
      if (rest.includes(n)) {
        if (!found.includes(t)) found.push(t);
        rest = rest.split(n).join("|");
      }
    }
    return found;
  }

  function longestTopping(core, index) {
    let len = 0;
    for (const e of index.toppings) for (const n of e.names) if (core.includes(n)) len = Math.max(len, n.length);
    return len;
  }

  // ---------------------------------------------------------------------------
  // 选项
  // ---------------------------------------------------------------------------

  const SIZE_L = /(^|[^A-Z])L(サイズ|SIZE)?(?![A-Z])|ラージ|LARGE|大杯|大サイズ/;
  const SIZE_M = /(^|[^A-Z])M(サイズ|SIZE)?(?![A-Z])|ミディアム|MEDIUM|REGULAR|レギュラー|中杯|中サイズ/;

  const TEMP_WORDS = [
    ["noIce", /氷なし|氷無し|氷抜き|氷ぬき|ノンアイス|去冰|无冰|無冰|不要冰|不加冰|NOICE|ICEFREE|WITHOUTICE/],
    ["lessIce", /氷少なめ|氷少な目|氷少|少なめ氷|氷控えめ|氷ひかえめ|少冰|微冰|LESSICE|LIGHTICE/],
    ["hot", /ホット|HOT|热饮|熱飲|温かい|あたたかい|^热的?$|^熱$/],
    ["roomTemp", /常温|常溫|ROOMTEMP/],
    ["normalIce", /氷普通|普通氷|氷あり|氷有り|正常冰|普通冰|标准冰|標準冰|多冰|REGULARICE|NORMALICE/],
  ];
  const TEMP_IN_GROUP = [
    ["noIce", /^(なし|無し|ナシ|NONE|NO|不要|无|無)$/],
    ["lessIce", /少なめ|少な目|控えめ|ひかえめ|^少$|LESS|LIGHT/],
    ["hot", /ホット|HOT|热|熱/],
    ["roomTemp", /常温|常溫/],
    ["normalIce", /普通|ふつう|標準|标准|正常|REGULAR|NORMAL|あり|多め|^多$|EXTRA/],
  ];

  const SWEET_WORDS = [
    [0, /無糖|无糖|不加糖|不要糖|零糖|甘さなし|甘さ無し|甘さゼロ|砂糖なし|シュガーレス|ノンシュガー|NOSUGAR|SUGARFREE|ZEROSUGAR/],
    [30, /三分糖|3分糖|二分糖|2分糖|一分糖|1分糖|微糖/],
    [50, /五分糖|5分糖|半糖|甘さ半分|甘さ控えめ|甘さひかえめ|HALFSUGAR/],
    [70, /七分糖|7分糖|少糖|甘さ少なめ|甘さ少な目|LESSSUGAR|LESSSWEET/],
    [120, /多糖|^加糖|甘め|甘さ多め|EXTRASUGAR|MORESUGAR/],
    [100, /全糖|正常糖|标准糖|標準糖|十分糖|甘さ普通|普通の甘さ|REGULARSUGAR|NORMALSUGAR|FULLSUGAR/],
  ];
  const SWEET_IN_GROUP = [
    [0, /なし|無し|ゼロ|^無$|^无$|NONE|^NO$/],
    [50, /控えめ|ひかえめ|半分/],
    [70, /少なめ|少な目|LESS/],
    [120, /多め|甘め|EXTRA|MORE/],
    [100, /普通|ふつう|標準|标准|正常|REGULAR|NORMAL/],
  ];

  const GROUPS = [
    ["temp", /^(氷の量|氷量|冰量|冰度|温度|アイス|ICE)/],
    ["sweet", /^(甘さ|甘み|甜度|糖度|糖分|SWEET|SUGAR)/],
    ["size", /^(サイズ|SIZE|规格|規格|容量|杯型)/],
    ["topping", /^(トッピング|TOPPING|加料|小料|オプション|OPTION|追加)/],
  ];
  const PERCENT_RE = /(\d{1,3})\s*[%％]/;
  const DISCOUNT_RE = /OFF|割引|引き|折扣|优惠|優惠|クーポン/;
  const NEGATE_RE = /なし|無し|抜き|ぬき|不要|不加|去掉|^去|NO(?![A-Z])|WITHOUT/;
  const EXTRA_RE = /追加|増量|多め|加料|^加|加\S|多加|EXTRA|ADD|ダブル|DOUBLE/;

  function snapSweet(value, allowed) {
    const list = allowed && allowed.length ? allowed : SWEET_LEVELS;
    let best = list[0];
    for (const v of list) {
      const d = Math.abs(v - value);
      const bd = Math.abs(best - value);
      if (d < bd || (d === bd && v > best)) best = v;
    }
    return best;
  }

  function tempOf(c, group) {
    for (const [t, re] of TEMP_WORDS) if (re.test(c)) return t;
    if (group === "temp") for (const [t, re] of TEMP_IN_GROUP) if (re.test(c)) return t;
    const p = PERCENT_RE.exec(c);
    if (p && (/氷|冰|ICE/.test(c) || group === "temp")) {
      const n = Number(p[1]);
      return n === 0 ? "noIce" : n < 100 ? "lessIce" : "normalIce";
    }
    return null;
  }

  function sweetOf(c, group) {
    if (/氷|冰|ICE/.test(c) && !/甘|糖|SWEET|SUGAR/.test(c)) return null;
    for (const [v, re] of SWEET_WORDS) if (re.test(c)) return v;
    if (group === "sweet") for (const [v, re] of SWEET_IN_GROUP) if (re.test(c)) return v;
    const p = PERCENT_RE.exec(c);
    if (p && !DISCOUNT_RE.test(c) && group !== "temp") return Number(p[1]);
    return null;
  }

  function sizeOf(c) {
    if (SIZE_L.test(c)) return "L";
    if (SIZE_M.test(c)) return "M";
    return null;
  }

  // ---------------------------------------------------------------------------
  // 整张单
  // ---------------------------------------------------------------------------

  const NOTE_RE = /^(お客様からのリクエスト|お客様からのメモ|顾客备注|顧客備考|特別な指示|特别要求|リクエスト|ご要望|要望|備考|备注|メモ|留言|NOTES?)\s*[:：]?\s*(.*)$/i;
  const STOP_RE = /小計|小计|合計|合计|総額|總額|总额|消費税|消费税|配達料|配送费|配送料|送料|サービス料|手数料|服务费|打包费|包装费|割引|优惠|折扣|クーポン|SUBTOTAL|TOTAL|お支払|支払い|实收|預計|预计收入|商品合计|商品小计|商品合計/;
  const IGNORE_RE = /UBER|HUNGRYPANDA|ROCKETNOW|熊猫|熊貓|パンダ|ロケット|火箭|注文|订单|訂單|ORDER|配達|配送|送达|受取|受け取り|お客様|様$|顾客|顧客|客户|电话|電話|地址|住所|予定|時刻|時間|骑手|ライダー|配達員|ピックアップ|PICKUP|DELIVERY|店舗|店铺|支払|支付|取餐|^#|^商品$|^メニュー$/;
  const SUBTOTAL_RE = /(?:小計|小计|商品合計|商品合计|商品小计|SUBTOTAL)\D*?([\d,，]+)/;
  const REF_LABEL_RE = /(?:注文番号|注文ID|注文NO\.?|オーダー番号|オーダーID|订单号|订单编号|訂單號碼?|訂單編號|ORDERID|ORDERNO\.?|ORDER#|ORDERNUMBER)[.:：#]*([A-Z0-9-]{3,})/;
  const REF_HASH_RE = /#([A-Z0-9]{3,12})/;

  function platformOf(text) {
    const c = compact(text);
    if (/UBEREATS|UBER|ウーバー/.test(c)) return "uber";
    if (/HUNGRYPANDA|熊猫|熊貓|パンダ/.test(c)) return "panda";
    if (/ROCKETNOW|ROCKET|ロケット|火箭/.test(c)) return "rocket";
    return null;
  }

  // 平台订单号：印在杯贴上，骑手取餐时对号。超过 6 位只留后 4 位
  function refOf(lines) {
    let hash = null;
    for (const raw of lines) {
      const c = compact(raw);
      const m = REF_LABEL_RE.exec(c);
      if (m) return shortRef(m[1]);
      const h = REF_HASH_RE.exec(c);
      if (h && !hash) hash = h[1];
    }
    return hash ? shortRef(hash) : "";
  }
  function shortRef(s) {
    const clean = s.replace(/[^A-Z0-9]/g, "");
    return clean.length > 6 ? clean.slice(-4) : clean;
  }

  function newLine(item, raw, quantity) {
    return {
      itemID: item.id,
      size: item.prices[item.defaultSize.toLowerCase()] != null ? item.defaultSize : (item.prices.l != null ? "L" : "M"),
      temp: item.defaultTemp,
      sweetness: item.defaultSweetness,
      toppings: [],
      quantity: quantity || 1,
      source: raw,
      options: [],
      extras: [],
      warnings: [],
      // 单上明确写了的选项（没写的用默认值）
      said: {},
    };
  }

  // 把一行选项用到这一杯上。返回 true 表示这一行看懂了（或是「冰量」这种标题）
  function applyOptions(line, item, raw, isItemLine, ctx, index) {
    const c = compact(raw);
    let hit = false;
    let titled = false;
    for (const [g, re] of GROUPS) if (re.test(c)) { ctx.group = g; titled = true; }

    const size = sizeOf(c);
    if (size) { line.size = size; line.said.size = true; hit = true; }
    const temp = tempOf(c, ctx.group);
    if (temp) { line.temp = temp; line.said.temp = true; hit = true; }
    const sweet = sweetOf(c, ctx.group);
    if (sweet != null) { line.sweetness = sweet; line.said.sweetness = true; hit = true; }

    if (!isItemLine) {
      const q = QTY_FIELD_RE.exec(raw.normalize("NFKC")) || /^[xX×✕]\s*(\d{1,2})$/.exec(c);
      if (q) { line.quantity = Number(q[1]); hit = true; }
      const core = nameCore(raw);
      const tops = findToppings(core, index);
      if (tops.length) {
        hit = true;
        if (NEGATE_RE.test(c)) {
          line.extras.push(raw.trim());
        } else {
          for (const t of tops) {
            const included = (item.includedToppingIDs || []).includes(t.id);
            if (included && !EXTRA_RE.test(c)) continue;
            if (!line.toppings.includes(t.id)) line.toppings.push(t.id);
          }
        }
      }
      if (hit || titled) line.options.push(raw.trim());
      else if (nameCore(raw).replace(/\d/g, "").length >= 1) line.extras.push(raw.trim());
    }
    return hit || titled;
  }

  // 选项不在这款饮品允许的范围里：改回能做的，并提醒店员
  function settle(line, item, menu) {
    const sizes = Object.keys(item.prices).map((k) => k.toUpperCase());
    if (!sizes.includes(line.size)) {
      if (line.said.size) line.warnings.push("「" + item.name + "」没有 " + line.size + " 杯，改成 " + sizes[0]);
      line.size = sizes.includes(item.defaultSize) ? item.defaultSize : sizes[0];
    }
    if (!item.allowedTemps.includes(line.temp)) {
      const label = { hot: "HOT", lessIce: "少冰", noIce: "去冰", roomTemp: "常温", normalIce: "普通冰" }[line.temp] || line.temp;
      if (line.said.temp) line.warnings.push("「" + item.name + "」不能做" + label + "，改成默认");
      line.temp = item.defaultTemp;
    }
    if (!item.allowedSweetness.includes(line.sweetness)) {
      const snapped = snapSweet(line.sweetness, item.allowedSweetness);
      line.warnings.push("甜度 " + line.sweetness + "% 改成 " + snapped + "%");
      line.sweetness = snapped;
    }
    line.toppings = line.toppings.filter((id) => (item.allowedToppingIDs || []).includes(id) && menu.toppings.some((t) => t.id === id));
  }

  function read(text, menu, aliases) {
    const index = makeIndex(menu, aliases);
    const rows = String(text || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const out = { platform: platformOf(text), ref: refOf(rows), note: "", subtotal: null, lines: [], unknown: [] };
    let cur = null;
    let curItem = null;
    let justStarted = false;
    let pendingQty = null;
    let noteNext = false;
    const ctx = { group: null };

    for (const raw of rows) {
      const c = compact(raw);
      const wasJust = justStarted;
      justStarted = false;

      if (noteNext) { out.note = (out.note ? out.note + " " : "") + raw; noteNext = false; continue; }
      const nm = NOTE_RE.exec(raw);
      if (nm) { if (nm[2].trim()) out.note = (out.note ? out.note + " " : "") + nm[2].trim(); else noteNext = true; continue; }

      // 只有数量的一行：「2」→ 下一杯的数量；「×2」紧跟在饮品后面 → 这一杯的数量
      if (/^\d{1,2}$/.test(c)) { pendingQty = Number(c); continue; }
      const tailQty = /^[xX×✕]\s*(\d{1,2})$/.exec(c);
      if (tailQty && cur && wasJust) { cur.quantity = Number(tailQty[1]); continue; }

      // 只有价格的一行（OCR 把价格单独认成一行）
      if (!raw.normalize("NFKC").replace(PRICE_RE, "").replace(/[\s()（）]/g, "")) continue;

      const core = nameCore(raw);
      const im = matchItem(core, index);
      if (im && im.score > longestTopping(core, index)) {
        cur = newLine(im.it, raw, quantityOf(raw) || pendingQty || 1);
        curItem = im.it;
        pendingQty = null;
        ctx.group = null;
        applyOptions(cur, curItem, raw, true, ctx, index);
        out.lines.push(cur);
        justStarted = true;
        continue;
      }
      pendingQty = null;

      const sub = SUBTOTAL_RE.exec(c);
      if (sub && out.subtotal == null) out.subtotal = Number(sub[1].replace(/[,，]/g, ""));
      if (STOP_RE.test(c)) { cur = null; continue; }
      if (IGNORE_RE.test(c)) continue;

      const looksLikeItem = hasPrice(raw) || QTY_LEAD_RE.test(raw.normalize("NFKC")) || /[xX×✕]\s*\d{1,2}\s*$/.test(raw.normalize("NFKC").replace(PRICE_RE, " ").trim());
      if (cur) {
        const before = cur.extras.length;
        const understood = applyOptions(cur, curItem, raw, false, ctx, index);
        if (!understood && looksLikeItem && (quantityOf(raw) || /[xX×✕]/.test(c) || hasMainPrice(raw))) {
          // 带数量或主价格、认不出来的一行是另一款饮品，不是上一杯的选项（只撤掉这一行刚记下的，上一杯原有的不动）
          cur.extras.splice(before);
          out.unknown.push({ text: raw, key: nameCore(raw), quantity: quantityOf(raw) || 1 });
          cur = null;
        }
        continue;
      }
      if (looksLikeItem && core.replace(/\d/g, "").length >= 2) out.unknown.push({ text: raw, key: core, quantity: quantityOf(raw) || 1 });
    }

    for (const line of out.lines) settle(line, menu.items.find((i) => i.id === line.itemID), menu);
    return out;
  }

  // 测试和日志用：「peach-oolong|L|lessIce|50|cheese|1」
  function brief(line) {
    return [line.itemID, line.size, line.temp, line.sweetness, line.toppings.slice().sort().join("+"), line.quantity].join("|");
  }

  const api = { read, normName, nameCore, brief, platformOf, snapSweet };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CHALI_DELIVERY = api;
})(typeof window !== "undefined" ? window : this);
