// 顾客页面的菜单名：越南语、韩语、俄语、泰语、印尼语。日文、中文、英文在 menu.js 里。
// 按 id 对应（分类、小料、饮品的 id 不重复）；这里没有的名字，顾客页面用英文名。
// 改了 menu.js 里的饮品（新加、改 id），这里也要加上，tests/i18n_test.js 会检查缺了哪些。
(function () {
  "use strict";

  // id: [越南语, 韩语, 俄语, 泰语, 印尼语]
  const NAMES = {
    // 分类
    milk: ["Trà sữa trân châu", "버블 밀크티", "Молочный чай с тапиокой", "ชานมไข่มุก", "Milk Tea Boba"],
    fruit: ["Trà trái cây", "과일 티", "Фруктовый чай", "ชาผลไม้", "Teh Buah"],
    lemon: ["Trà chanh", "레몬 티", "Лимонный чай", "ชามะนาว", "Teh Lemon"],
    special: ["Món đặc trưng Chali", "차리 오리지널", "Фирменные напитки", "เมนูพิเศษของ Chali", "Spesial Chali"],
    season: ["Theo mùa", "시즌 한정", "Сезонное меню", "เมนูตามฤดูกาล", "Menu Musiman"],

    // 小料
    cheese: ["Kem phô mai", "치즈폼", "Сырная пенка", "ชีสโฟม", "Cheese foam"],
    coconutPudding: ["Pudding dừa", "코코넛 푸딩", "Кокосовый пудинг", "พุดดิ้งมะพร้าว", "Puding kelapa"],
    pearl: ["Trân châu", "타피오카 펄", "Тапиока", "ไข่มุก", "Boba"],
    pudding: ["Pudding", "푸딩", "Пудинг", "พุดดิ้ง", "Puding"],
    nata: ["Thạch dừa", "나타데코코", "Ната-де-коко", "วุ้นมะพร้าว", "Nata de coco"],
    redBean: ["Đậu đỏ", "팥", "Адзуки", "ถั่วแดง", "Kacang merah"],
    sago: ["Trân châu nhỏ (sago)", "미니 타피오카 (사고)", "Мини-тапиока (саго)", "สาคูเม็ดเล็ก", "Sagu mutiara"],
    oreo: ["Oreo", "오레오", "Орео", "โอรีโอ", "Oreo"],

    // 珍珠奶茶
    "oolong-milk": ["Trà sữa ô long rang", "로스트 우롱 밀크티", "Молочный чай с обжаренным улуном", "ชานมอูหลงคั่ว", "Milk Tea Oolong Panggang"],
    assam: ["Trà sữa Assam", "아쌈 밀크티", "Молочный чай «Ассам»", "ชานมอัสสัม", "Milk Tea Assam"],
    "siji-naiqing": ["Trà sữa Tứ Quý", "사계춘 밀크티", "Молочный чай «Четыре сезона»", "ชานมสี่ฤดู", "Milk Tea Empat Musim"],
    moxiang: ["Trà xanh sữa nhài", "자스민 그린 밀크티", "Молочный жасминовый зелёный чай", "ชาเขียวนมมะลิ", "Milk Tea Hijau Melati"],
    "oreo-milk": ["Trà sữa Oreo", "오레오 밀크티", "Молочный чай с орео", "ชานมโอรีโอ", "Milk Tea Oreo"],
    trio: ["Trà sữa 3 anh em", "밀크티 삼형제", "Молочный чай «Три брата»", "ชานมสามสหาย", "Milk Tea Tiga Saudara"],
    "peach-oolong": ["Trà sữa ô long đào trắng", "백도 우롱 밀크티", "Молочный улун с белым персиком", "ชานมอูหลงพีชขาว", "Milk Tea Oolong Persik Putih"],
    "lychee-oolong": ["Trà sữa ô long vải", "리치 우롱 밀크티", "Молочный улун с личи", "ชานมอูหลงลิ้นจี่", "Milk Tea Oolong Leci"],
    "osmanthus-oolong": ["Trà sữa ô long hoa quế", "계화 우롱 밀크티", "Молочный улун с османтусом", "ชานมอูหลงดอกหอมหมื่นลี้", "Milk Tea Oolong Osmanthus"],
    "black-rice": ["Trà sữa nếp cẩm", "흑미 밀크티", "Молочный чай с фиолетовым рисом", "ชานมข้าวเหนียวดำ", "Milk Tea Ketan Hitam"],

    // 鲜果时光
    "kiwi-cheese": ["Trà kiwi kem phô mai", "키위 치즈티", "Чай с киви и сырной пенкой", "ชากีวีชีสโฟม", "Teh Kiwi Cheese Foam"],
    "dragon-cheese": ["Trà thanh long kem phô mai", "용과 치즈티", "Чай с питахайей и сырной пенкой", "ชาแก้วมังกรชีสโฟม", "Teh Buah Naga Cheese Foam"],
    "grape-cheese": ["Trà nho kem phô mai", "포도 치즈티", "Чай с виноградом и сырной пенкой", "ชาองุ่นชีสโฟม", "Teh Anggur Cheese Foam"],
    "straw-cheese": ["Trà dâu kem phô mai", "딸기 치즈티", "Чай с клубникой и сырной пенкой", "ชาสตรอว์เบอร์รีชีสโฟม", "Teh Stroberi Cheese Foam"],
    "straw-ole": ["Sữa dâu kem phô mai", "딸기 치즈 오레", "Клубничное молоко с сырной пенкой", "นมสตรอว์เบอร์รีชีสโฟม", "Susu Stroberi Cheese Foam"],
    "peach-cheese": ["Trà đào kem phô mai", "복숭아 치즈티", "Чай с персиком и сырной пенкой", "ชาพีชชีสโฟม", "Teh Persik Cheese Foam"],
    "peach-ole": ["Sữa đào kem phô mai", "복숭아 치즈 오레", "Персиковое молоко с сырной пенкой", "นมพีชชีสโฟม", "Susu Persik Cheese Foam"],
    "mango-cheese": ["Xoài kem phô mai", "망고 치즈", "Манго с сырной пенкой", "มะม่วงชีสโฟม", "Mangga Cheese Foam"],
    "longan-cheese": ["Trà nhãn kem phô mai", "용안 치즈티", "Чай с лонганом и сырной пенкой", "ชาลำไยชีสโฟม", "Teh Lengkeng Cheese Foam"],
    "longan-coco": ["Nhãn nước cốt dừa", "용안 코코넛 밀크", "Лонган с кокосовым молоком", "ลำไยนมมะพร้าว", "Lengkeng Susu Kelapa"],
    yangzhi: ["Dương chi cam lộ (xoài, bưởi, sago)", "양지감로 (망고 포멜로 사고)", "Манго, помело и саго", "หยางจือกานลู่ (มะม่วง ส้มโอ สาคู)", "Yang Zhi Gan Lu (mangga, jeruk bali, sagu)"],
    "peach-coco": ["Đào nước cốt dừa", "복숭아 코코넛 밀크", "Персик с кокосовым молоком", "พีชนมมะพร้าว", "Persik Susu Kelapa"],
    "dragon-coco": ["Thanh long nước cốt dừa", "용과 코코넛 밀크", "Питахайя с кокосовым молоком", "แก้วมังกรนมมะพร้าว", "Buah Naga Susu Kelapa"],
    "grape-coco": ["Nho Kyoho nước cốt dừa", "거봉 코코넛 밀크", "Виноград кёхо с кокосовым молоком", "องุ่นเคียวโฮนมมะพร้าว", "Anggur Kyoho Susu Kelapa"],
    "kiwi-coco": ["Kiwi nước cốt dừa", "키위 코코넛 밀크", "Киви с кокосовым молоком", "กีวีนมมะพร้าว", "Kiwi Susu Kelapa"],
    "ume-salt": ["Trà mơ xanh muối", "청매실 솔트 티", "Чай с зелёной сливой и солью", "ชาบ๊วยเขียวเกลือ", "Teh Plum Hijau Asin"],
    "ume-lychee": ["Soda mơ xanh vải", "청매실 리치 소다", "Газировка с зелёной сливой и личи", "โซดาบ๊วยเขียวลิ้นจี่", "Soda Plum Hijau Leci"],
    "peach-sijichun": ["Trà đào Tứ Quý", "복숭아 사계춘 티", "Персиковый чай «Четыре сезона»", "ชาพีชสี่ฤดู", "Teh Persik Empat Musim"],
    "grape-tea": ["Trà nho", "포도 티", "Виноградный чай", "ชาองุ่น", "Teh Anggur"],

    // 清爽爆柠茶
    "lemon-oolong": ["Trà ô long chanh", "레몬 우롱티", "Лимонный улун", "ชาอูหลงมะนาว", "Teh Oolong Lemon"],
    "lemon-black": ["Hồng trà chanh", "레몬 홍차", "Лимонный чёрный чай", "ชาดำมะนาว", "Teh Hitam Lemon"],
    "lemon-sijiqing": ["Trà chanh Tứ Quý", "레몬 사계춘 티", "Лимонный чай «Четыре сезона»", "ชามะนาวสี่ฤดู", "Teh Lemon Empat Musim"],
    "lemon-green": ["Trà xanh nhài chanh", "레몬 자스민 그린티", "Лимонный жасминовый зелёный чай", "ชาเขียวมะลิมะนาว", "Teh Hijau Melati Lemon"],

    // 茶里特饮
    "salt-osmanthus": ["Sữa hoa quế muối", "솔트 계화 밀크", "Солёное молоко с османтусом", "นมดอกหอมหมื่นลี้เกลือ", "Susu Osmanthus Asin"],
    "coco-redbean": ["Sinh tố đậu đỏ", "팥 스무디", "Смузи с адзуки", "สมูทตี้ถั่วแดง", "Smoothie Kacang Merah"],
    "avocado-yogurt": ["Sinh tố bơ", "아보카도 스무디", "Смузи с авокадо", "สมูทตี้อะโวคาโด", "Smoothie Alpukat"],
    "berry-yogurt": ["Sinh tố dâu", "딸기 스무디", "Клубничный смузи", "สมูทตี้สตรอว์เบอร์รี", "Smoothie Stroberi"],
    "mango-yogurt": ["Sinh tố xoài", "망고 스무디", "Манговый смузи", "สมูทตี้มะม่วง", "Smoothie Mangga"],

    // 季节限定
    "pear-longan": ["Lê nhãn trân châu", "용안 배 타피오카", "Груша с лонганом и тапиокой", "สาลี่ลำไยไข่มุก", "Pir Lengkeng Boba"],
    "pear-coco": ["Sữa dừa lê", "배 코코넛 밀크", "Груша с кокосовым молоком", "นมมะพร้าวสาลี่", "Susu Kelapa Pir"],
    "pear-cheese": ["Trà lê kem phô mai", "배 치즈티", "Чай с грушей и сырной пенкой", "ชาสาลี่ชีสโฟม", "Teh Pir Cheese Foam"],
    "pear-passion": ["Trà lê chanh dây", "패션프루트 배 티", "Чай с грушей и маракуйей", "ชาสาลี่เสาวรส", "Teh Pir Markisa"],
  };

  const out = { vi: {}, ko: {}, ru: {}, th: {}, id: {} };
  for (const [key, [vi, ko, ru, th, idn]] of Object.entries(NAMES)) {
    out.vi[key] = vi;
    out.ko[key] = ko;
    out.ru[key] = ru;
    out.th[key] = th;
    out.id[key] = idn;
  }
  window.CHALI_MENU_I18N = out;
})();
