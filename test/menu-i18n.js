// 顾客页面的菜单名：越南语、韩语、俄语。日文、中文、英文在 menu.js 里。
// 按 id 对应（分类、小料、饮品的 id 不重复）；这里没有的名字，顾客页面用英文名。
// 改了 menu.js 里的饮品（新加、改 id），这里也要加上，tests/i18n_test.js 会检查缺了哪些。
(function () {
  "use strict";

  // id: [越南语, 韩语, 俄语]
  const NAMES = {
    // 分类
    milk: ["Trà sữa trân châu", "버블 밀크티", "Молочный чай с тапиокой"],
    fruit: ["Trà trái cây", "과일 티", "Фруктовый чай"],
    lemon: ["Trà chanh", "레몬 티", "Лимонный чай"],
    special: ["Món đặc trưng Chali", "차리 오리지널", "Фирменные напитки"],
    season: ["Theo mùa", "시즌 한정", "Сезонное меню"],

    // 小料
    cheese: ["Kem phô mai", "치즈폼", "Сырная пенка"],
    coconutPudding: ["Pudding dừa", "코코넛 푸딩", "Кокосовый пудинг"],
    pearl: ["Trân châu", "타피오카 펄", "Тапиока"],
    pudding: ["Pudding", "푸딩", "Пудинг"],
    nata: ["Thạch dừa", "나타데코코", "Ната-де-коко"],
    redBean: ["Đậu đỏ", "팥", "Адзуки"],
    sago: ["Trân châu nhỏ (sago)", "미니 타피오카 (사고)", "Мини-тапиока (саго)"],
    oreo: ["Oreo", "오레오", "Орео"],

    // 珍珠奶茶
    "oolong-milk": ["Trà sữa ô long rang", "로스트 우롱 밀크티", "Молочный чай с обжаренным улуном"],
    assam: ["Trà sữa Assam", "아쌈 밀크티", "Молочный чай «Ассам»"],
    "siji-naiqing": ["Trà sữa Tứ Quý", "사계춘 밀크티", "Молочный чай «Четыре сезона»"],
    moxiang: ["Trà xanh sữa nhài", "자스민 그린 밀크티", "Молочный жасминовый зелёный чай"],
    "oreo-milk": ["Trà sữa Oreo", "오레오 밀크티", "Молочный чай с орео"],
    trio: ["Trà sữa 3 anh em", "밀크티 삼형제", "Молочный чай «Три брата»"],
    "peach-oolong": ["Trà sữa ô long đào trắng", "백도 우롱 밀크티", "Молочный улун с белым персиком"],
    "lychee-oolong": ["Trà sữa ô long vải", "리치 우롱 밀크티", "Молочный улун с личи"],
    "osmanthus-oolong": ["Trà sữa ô long hoa quế", "계화 우롱 밀크티", "Молочный улун с османтусом"],
    "black-rice": ["Trà sữa nếp cẩm", "흑미 밀크티", "Молочный чай с фиолетовым рисом"],

    // 鲜果时光
    "kiwi-cheese": ["Trà kiwi kem phô mai", "키위 치즈티", "Чай с киви и сырной пенкой"],
    "dragon-cheese": ["Trà thanh long kem phô mai", "용과 치즈티", "Чай с питахайей и сырной пенкой"],
    "cherry-cheese": ["Trà cherry kem phô mai", "체리 치즈티", "Чай с черешней и сырной пенкой"],
    "grape-cheese": ["Trà nho kem phô mai", "포도 치즈티", "Чай с виноградом и сырной пенкой"],
    "straw-cheese": ["Trà dâu kem phô mai", "딸기 치즈티", "Чай с клубникой и сырной пенкой"],
    "straw-ole": ["Sữa dâu kem phô mai", "딸기 치즈 오레", "Клубничное молоко с сырной пенкой"],
    "peach-cheese": ["Trà đào kem phô mai", "복숭아 치즈티", "Чай с персиком и сырной пенкой"],
    "peach-ole": ["Sữa đào kem phô mai", "복숭아 치즈 오레", "Персиковое молоко с сырной пенкой"],
    "mango-cheese": ["Xoài kem phô mai", "망고 치즈", "Манго с сырной пенкой"],
    "longan-cheese": ["Trà nhãn kem phô mai", "용안 치즈티", "Чай с лонганом и сырной пенкой"],
    "longan-coco": ["Nhãn nước cốt dừa", "용안 코코넛 밀크", "Лонган с кокосовым молоком"],
    yangzhi: ["Dương chi cam lộ (xoài, bưởi, sago)", "양지감로 (망고 포멜로 사고)", "Манго, помело и саго"],
    "peach-coco": ["Đào nước cốt dừa", "복숭아 코코넛 밀크", "Персик с кокосовым молоком"],
    "dragon-coco": ["Thanh long nước cốt dừa", "용과 코코넛 밀크", "Питахайя с кокосовым молоком"],
    "grape-coco": ["Nho Kyoho nước cốt dừa", "거봉 코코넛 밀크", "Виноград кёхо с кокосовым молоком"],
    "kiwi-coco": ["Kiwi nước cốt dừa", "키위 코코넛 밀크", "Киви с кокосовым молоком"],
    "ume-salt": ["Trà mơ xanh muối", "청매실 솔트 티", "Чай с зелёной сливой и солью"],
    "ume-lychee": ["Soda mơ xanh vải", "청매실 리치 소다", "Газировка с зелёной сливой и личи"],
    "peach-sijichun": ["Trà đào Tứ Quý", "복숭아 사계춘 티", "Персиковый чай «Четыре сезона»"],
    "grape-tea": ["Trà nho", "포도 티", "Виноградный чай"],

    // 清爽爆柠茶
    "lemon-oolong": ["Trà ô long chanh", "레몬 우롱티", "Лимонный улун"],
    "lemon-black": ["Hồng trà chanh", "레몬 홍차", "Лимонный чёрный чай"],
    "lemon-sijiqing": ["Trà chanh Tứ Quý", "레몬 사계춘 티", "Лимонный чай «Четыре сезона»"],
    "lemon-green": ["Trà xanh nhài chanh", "레몬 자스민 그린티", "Лимонный жасминовый зелёный чай"],

    // 茶里特饮
    "durian-mango": ["Sầu riêng xoài", "두리안 망고", "Дуриан с манго"],
    "salt-osmanthus": ["Sữa hoa quế muối", "솔트 계화 밀크", "Солёное молоко с османтусом"],
    "coco-redbean": ["Sinh tố đậu đỏ", "팥 스무디", "Смузи с адзуки"],
    "avocado-yogurt": ["Sinh tố bơ", "아보카도 스무디", "Смузи с авокадо"],
    "berry-yogurt": ["Sinh tố dâu", "딸기 스무디", "Клубничный смузи"],
    "mango-yogurt": ["Sinh tố xoài", "망고 스무디", "Манговый смузи"],

    // 季节限定
    "guava-grape": ["Sữa ổi nho", "구아바 포도 밀크", "Гуава и виноград с молоком"],
    "guava-lemon": ["Trà ổi chanh", "구아바 레몬티", "Чай с гуавой и лимоном"],
    "lychee-guava": ["Sữa vải ổi", "리치 구아바 밀크", "Личи и гуава с молоком"],
    "guava-cheese": ["Trà ổi kem phô mai", "구아바 치즈티", "Чай с гуавой и сырной пенкой"],
    "passion-tea": ["Trà chanh dây", "패션프루트 티", "Чай с маракуйей"],
    "passion-milk": ["Sữa kiwi chanh dây", "키위 패션프루트 밀크", "Киви и маракуйя с молоком"],
    "grape-sago": ["Trà sữa nho xanh sago", "청포도 사고 밀크티", "Молочный чай с зелёным виноградом и саго"],
    "guava-mango-sago": ["Trà sữa ổi xoài sago", "구아바 망고 사고 밀크티", "Молочный чай с гуавой, манго и саго"],
  };

  const out = { vi: {}, ko: {}, ru: {} };
  for (const [id, [vi, ko, ru]] of Object.entries(NAMES)) {
    out.vi[id] = vi;
    out.ko[id] = ko;
    out.ru[id] = ru;
  }
  window.CHALI_MENU_I18N = out;
})();
