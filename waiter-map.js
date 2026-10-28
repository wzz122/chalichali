// スマレジ・ウェイター 里的叫法：接单屏「照着点」模式用（新订单卡片按 Waiter 的名字和点击顺序显示）。
//
// 现在 Waiter 里真实的商品名、分类名还不知道，先用 menu.js 的日文名代替（confirmed: false，卡片上会提示「名称待确认」）。
// 拿到 Smaregi 后台导出的商品 CSV 以后：
//   1. 在 categories / items / toppings 里按 menu.js 的 id 填上 Waiter 里的名字（没填的继续用 menu.js 的日文名）
//   2. 选项（大小、冰量、甜度）在 Waiter 里怎么叫，改 sizes / temps / sweetness
//   3. 都对上以后把 confirmed 改成 true
(function () {
  "use strict";

  window.CHALI_WAITER = {
    confirmed: false,

    // 在 Waiter 里先点哪里：店内有桌号点那张桌子，外带点「テイクアウト」
    table: (o) => (o.dining === "eatIn" && o.seat ? "テーブル " + o.seat : o.dining === "eatIn" ? "店内（席なし）" : "テイクアウト"),

    categories: {},   // 例：milk: "ミルクティー"
    items: {},        // 例：moxiang: "ジャスミンミルクティー"
    toppings: {},     // 例：pudding: "プリン"

    sizes: { M: "M", L: "L" },
    temps: { hot: "HOT", normalIce: "氷普通", lessIce: "氷少なめ", roomTemp: "常温", noIce: "氷なし" },
    sweetness: (n) => "甘さ" + n + "%",

    // 外带单把单号写进 Waiter 的メモ（贴纸上有单号，取餐时对得上）；店内单有桌号就不用写
    memoQ: (o) => o.dining !== "eatIn" || !o.seat,
  };
})();
