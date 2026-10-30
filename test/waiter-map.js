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

    // 店里在 Waiter 里是来一单点一个号码桌：每天开店从 1 号开始按顺序往后点（用户 2026-10-30 说的）。
    // 扫码单（桌子上的、前台的都一样）接单屏也照这个顺序自动排号，店员在卡片上 −/+ 可以改；
    // 「已录入」时这个号存成取餐号，顾客手机上显示的就是 Waiter 小票上的号。排到 maxTable 以后回到 1 号。
    maxTable: 60,

    categories: {},   // 例：milk: "ミルクティー"
    items: {},        // 例：moxiang: "ジャスミンミルクティー"
    toppings: {},     // 例：pudding: "プリン"

    sizes: { M: "M", L: "L" },
    temps: { hot: "HOT", normalIce: "氷普通", lessIce: "氷少なめ", roomTemp: "常温", noIce: "氷なし" },
    sweetness: (n) => "甘さ" + n + "%",

    // 要不要把 Q 单号写进 Waiter 的メモ：Waiter 号就是顾客的取餐号，不用再写
    memoQ: (o) => false,

    // 外卖单（接单屏「🛵 外卖单」扫进来的）：在 Waiter 里先点哪里、メモ写什么。
    // 店里外卖单在 Waiter 里另有按钮或客层的话改这里
    // 店里的 Waiter 在六七十号桌后面另有「熊猫」「火箭」「Uber」三格，外卖单点对应平台那一格
    deliveryTable: (d) => ({ panda: "最后面的「熊猫」", rocket: "最后面的「火箭」", uber: "最后面的「Uber」" })[d.platform] || "テイクアウト",
    deliveryMemo: (d, platform) => (platform ? platform.name : d.platform) + (d.ref ? " #" + d.ref : ""),
  };
})();
