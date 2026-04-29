const BOARD_SIZE = 40;
const STARTING_MONEY = 1500;

const boardCells = [
 { id: 0, name: "Старт", type: "go", description: "Получите котоплату 200 лапок, когда проходите это поле вперёд" },
 { id: 1, name: "Подвальный переулок", type: "property", color: "brown", price: 60, mortgage: 30, mortgageCost: 33, baseRent: 4, colorRent: 8, houses: [20, 60, 180, 320], hotel: 450, houseCost: 50 },
 { id: 2, name: "Фонд \"Сытая морда\"", type: "community", description: "Карточка фонда" },
 { id: 3, name: "Улица Мурлыкина", type: "property", color: "brown", price: 60, mortgage: 30, mortgageCost: 33, baseRent: 4, colorRent: 8, houses: [20, 60, 180, 320], hotel: 450, houseCost: 50 },
 { id: 4, name: "Усатый налог", type: "tax", amount: 200 },
 { id: 5, name: "Тыгыдыдская железная дорога", type: "railroad", price: 200, rents: [25, 50, 100, 200] },
 { id: 6, name: "Проспект Усатого-Полосатого", type: "property", color: "blue", price: 100, mortgage: 50, mortgageCost: 55, baseRent: 6, colorRent: 12, houses: [30, 90, 270, 400], hotel: 550, houseCost: 50 },
 { id: 7, name: "Девятая жизнь", type: "chance", description: "Карточка шанса" },
 { id: 8, name: "Улица Тёплой Лежанки", type: "property", color: "blue", price: 100, mortgage: 50, mortgageCost: 55, baseRent: 6, colorRent: 12, houses: [30, 90, 270, 400], hotel: 550, houseCost: 50 },
 { id: 9, name: "Валерьяновый бульвар", type: "property", color: "blue", price: 120, mortgage: 60, mortgageCost: 66, baseRent: 8, colorRent: 16, houses: [40, 100, 300, 450], hotel: 600, houseCost: 50 },
 { id: 10, name: "Переноска", type: "jail", description: "В переноске или просто посетил переноску" },
 { id: 11, name: "Когтеточкинская площадь", type: "property", color: "purple", price: 140, mortgage: 70, mortgageCost: 77, baseRent: 10, colorRent: 20, houses: [50, 150, 450, 625], hotel: 750, houseCost: 100 },
 { id: 12, name: "Обогревание лапок", type: "utility", price: 150 },
 { id: 13, name: "Набережная Рыбьего Хвоста", type: "property", color: "purple", price: 140, mortgage: 70, mortgageCost: 77, baseRent: 10, colorRent: 20, houses: [50, 150, 450, 625], hotel: 750, houseCost: 100 },
 { id: 14, name: "Мяу-стрит", type: "property", color: "purple", price: 160, mortgage: 80, mortgageCost: 88, baseRent: 12, colorRent: 24, houses: [60, 180, 500, 700], hotel: 900, houseCost: 100 },
 { id: 15, name: "Мурманский вокзал", type: "railroad", price: 200, rents: [25, 50, 100, 200] },
 { id: 16, name: "Лапки Аллея", type: "property", color: "orange", price: 180, mortgage: 90, mortgageCost: 99, baseRent: 14, colorRent: 28, houses: [70, 200, 550, 750], hotel: 950, houseCost: 100 },
 { id: 17, name: "Фонд \"Сытая морда\"", type: "community", description: "Карточка фонда" },
 { id: 18, name: "Засадная улица", type: "property", color: "orange", price: 180, mortgage: 90, mortgageCost: 99, baseRent: 14, colorRent: 28, houses: [70, 200, 550, 750], hotel: 950, houseCost: 100 },
 { id: 19, name: "Ночной Дозор проспект", type: "property", color: "orange", price: 200, mortgage: 100, mortgageCost: 110, baseRent: 16, colorRent: 32, houses: [80, 220, 600, 800], hotel: 1000, houseCost: 100 },
 { id: 20, name: "Бесплатная картонная коробка", type: "free_space", description: "Ничего не происходит" },
 { id: 21, name: "Леопардовый проспект", type: "property", color: "red", price: 220, mortgage: 110, mortgageCost: 121, baseRent: 18, colorRent: 36, houses: [90, 250, 700, 875], hotel: 1050, houseCost: 150 },
 { id: 22, name: "Девятая жизнь", type: "chance", description: "Карточка шанса" },
 { id: 23, name: "Пантерный тупик", type: "property", color: "red", price: 220, mortgage: 110, mortgageCost: 121, baseRent: 18, colorRent: 36, houses: [90, 250, 700, 875], hotel: 1050, houseCost: 150 },
 { id: 24, name: "Красная улица", type: "property", color: "red", price: 240, mortgage: 120, mortgageCost: 132, baseRent: 20, colorRent: 40, houses: [100, 300, 750, 925], hotel: 1100, houseCost: 150 },
 { id: 25, name: "Станция \"Кошачья Мята\"", type: "railroad", price: 200, rents: [25, 50, 100, 200] },
 { id: 26, name: "Солнечный подоконник", type: "property", color: "yellow", price: 260, mortgage: 130, mortgageCost: 143, baseRent: 22, colorRent: 44, houses: [110, 330, 800, 975], hotel: 1150, houseCost: 150 },
 { id: 27, name: "Мурр-Молл", type: "property", color: "yellow", price: 260, mortgage: 130, mortgageCost: 143, baseRent: 22, colorRent: 44, houses: [110, 330, 800, 975], hotel: 1150, houseCost: 150 },
 { id: 28, name: "Чистые Лапки", type: "utility", price: 150 },
 { id: 29, name: "Золотой клубок", type: "property", color: "yellow", price: 280, mortgage: 140, mortgageCost: 154, baseRent: 24, colorRent: 48, houses: [120, 360, 850, 1025], hotel: 1200, houseCost: 150 },
 { id: 30, name: "Отправляйся в переноску", type: "go_to_jail", description: "Игрок отправляется на клетку переноски и не получает 200 лапок за старт" }
];

const chanceCards = [
 { text: " «Тыгыдык в 3 ночи — соседи вызвали патруль» Идите в Переноску (10). Не получаете 200 лапок за проход.", action: "goToJail" },
 { text: " «Кот увязался за клубком до соседнего района» Пройдите на 3 клетки назад.", action: "moveRelative", steps: -3 },
 { text: " «Мяу-навигатор сбился — вы запрыгнули не в ту коробку» Вернитесь на клетку «Подвальный переулок».", action: "moveTo", position: 1 },
 { text: " «Срочная ветеринарка — везите кота на такси» Пройдите на ближайшую Железную дорогу. Если она не ваша — заплатите двойную ренту.", action: "moveToNearestRailroad", doubleRent: true },
 { text: " «Котозагранпоездка — вы забыли переноску» Пройдите на клетку «Старт» и получите 200 лапок.", action: "moveTo", position: 0 },
 { text: " «Ваш кот снялся в рекламе Вискас» Получите 150 лапок.", action: "receive", amount: 150 },
 { text: " «Улов дня: золотая рыбка в аквариуме» Получите 100 лапок.", action: "receive", amount: 100 },
 { text: " «Победили в конкурсе \"Кот месяца\"» Получите 120 лапок от банка.", action: "receive", amount: 120 },
 { text: " «Сдали 10 кг корма в приют — возврат от спонсора» Получите 80 лапок.", action: "receive", amount: 80 },
 { text: " «Нашли под диваном древний кошачий клад — игрушку и монеты» Получите 200 лапок.", action: "receive", amount: 200 },
 { text: " «Кот случайно подписал контракт на рекламу наполнителя» Получите 130 лапок.", action: "receive", amount: 130 },
 { text: " «День хвостатого рождения: конверт от бабушки» Получите 50 лапок от каждого игрока.", action: "collectFromEachPlayer", amount: 50 },
 { text: " «Проглотил игрушку — операция» Заплатите 150 лапок.", action: "pay", amount: 150, category: "medical" },
 { text: " «Аллергия на новый корм — лечение» Заплатите 100 лапок.", action: "pay", amount: 100, category: "medical" },
 { text: " «Разодрали офисный диван» Заплатите 60 лапок.", action: "pay", amount: 60, category: "fine" },
 { text: " «Вызов клининга от шерсти во всей квартире» Заплатите 40 лапок.", action: "pay", amount: 40, category: "fine" },
 { text: " «Кот перегрыз зарядку от MacBook» Заплатите 120 лапок.", action: "pay", amount: 120, category: "fine" },
 { text: " «Отравился валерьянкой — капельница» Заплатите 90 лапок.", action: "pay", amount: 90, category: "medical" },
 { text: " «Заказал 100 коробок, пока вас не было» Заплатите 70 лапок.", action: "pay", amount: 70, category: "fine" },
 { text: " «Штраф за ночной концерт» Заплатите 50 лапок.", action: "pay", amount: 50, category: "fine" },
 { text: " «Ваша кошка признана Мяу-королевой города» Каждый игрок дарит вам 25 лапок.", action: "collectFromEachPlayer", amount: 25 },
 { text: " «Благотворительная раздача игрушек приюту» Заплатите 30 лапок или скиньте карту \"Выйти из Переноски\", если есть.", action: "payOrUseSpecificCard", amount: 30, cardKey: "jailFree", cardLabel: "Выход из Переноски", category: "fine" },
 { text: " «Кот решил, что вы бедный, и принёс вам мышь» Получите 10 лапок (но стыдно).", action: "receive", amount: 10 },
{ text: "«Чёрный кот пересёк путь — аура неудач» Следующий платёж (аренда/налог) увеличьте на 20%.", action: "setNextRentOrTaxMultiplier", multiplier: 1.2 },
 { text: " «Нашли 9-ю жизнь» Сохраните эту карту. Можно использовать как бесплатный выход из Переноски или продать.", action: "gainCard", cardKey: "nineLives", cardLabel: "9-я жизнь" },
 { text: " «Кот отжал у вас джойстик и выиграл в Котослотах» Получите 75 лапок.", action: "receive", amount: 75 },
 { text: " «Соседка попросила почесать за ушком — благодарность» Получите 60 лапок.", action: "receive", amount: 60 },
 { text: " «Вас назначили главным в фестивале кошачьих шляп» Пройдите на поле «Старт», получите 200 лапок.", action: "moveTo", position: 0 },
 { text: " «Отправляетесь в кошачий лагерь» Идите в Переноску. Без 200 лапок.", action: "goToJail" },
 { text: " «Сбор корма по району» Пройдите на ближайшую Железную дорогу, заплатите владельцу двойную ренту.", action: "moveToNearestRailroad", doubleRent: true },
 { text: " «Помогли потерявшемуся котёнку» Вернитесь на 5 клеток назад.", action: "moveRelative", steps: -5 },
 { text: " «Фонд \"Сытая Морда\": выплата за стерилизацию» Получите 75 лапок.", action: "receive", amount: 75 },
 { text: " «Ежегодная рыбная лотерея» Получите 90 лапок.", action: "receive", amount: 90 },
 { text: " «Ветпомощь спонсирует здоровый хвост» Получите 60 лапок.", action: "receive", amount: 60 },
 { text: " «Конкурс красоты среди трёхцветных» Получите 110 лапок.", action: "receive", amount: 110 },
 { text: " «Ваша кошка приютила котёнка — пособие» Получите 85 лапок.", action: "receive", amount: 85 },
 { text: " «Городской день чистки ковров» Заплатите 50 лапок.", action: "pay", amount: 50, category: "fine" },
 { text: " «Эпидемия блох — общественная обработка» Заплатите 45 лапок.", action: "pay", amount: 45, category: "medical" },
 { text: " «Строительство кошачьего парка» Заплатите 70 лапок.", action: "pay", amount: 70, category: "fine" },
 { text: " «Штраф за неправильный лоток в общественном месте» Заплатите 60 лапок.", action: "pay", amount: 60, category: "fine" },
 { text: " «Котопарад закрыл движение — возмещение» Заплатите 40 лапок.", action: "pay", amount: 40, category: "fine" },
 { text: " «Карта \"Сытая Морда\"» — оставьте. Можно в любой момент отменить одну оплату аренды.", action: "gainCard", cardKey: "rentCancel", cardLabel: "Карта \"Сытая Морда\"" },
 { text: " «Выход из Переноски» — карта освобождения.", action: "gainCard", cardKey: "jailFree", cardLabel: "Выход из Переноски" },
 { text: " «Ветеринарный взнос» — заплатите 50 лапок в банк или по 20 каждому игроку.", action: "vetContribution", bankAmount: 50, perPlayerAmount: 20 },
 { text: " «Кошачья солидарность» — получите 20 лапок от каждого игрока.", action: "collectFromEachPlayer", amount: 20 },
 { text: " «Кот выиграл гран-при на выставке породистых хвостов» Получите 200 лапок.", action: "receive", amount: 200 },
 { text: " «Пожертвование игрушек в приют от имени вашего кота» Заплатите 40 лапок в банк.", action: "pay", amount: 40, category: "fine" },
 { text: "«Срочный сбор средств на операцию бездомному коту» Заплатите 100 лапок или скиньте любую карту с руки (кроме освобождения).", action: "payOrDiscardAnyNonReleaseCard", amount: 100, category: "medical" },
 { text: " «Ваш кот получил открытку от тайного поклонника с купюрой» Получите 50 лапок.", action: "receive", amount: 50 },
 { text: " «Страховка \"Лапка-царапка\" возместила порчу мебели» Получите 65 лапок.", action: "receive", amount: 65 }
];

const communityCards = [
 { text: " «Вам вручили \"Премию усатых надежд\" и конверт» Получите 100 лапок.", action: "receive", amount: 100 },
 { text: " «Кот толкнул вазу с подоконника» Заплатите 35 лапок за ремонт.", action: "pay", amount: 35, category: "fine" },
 { text: " «Салон красоты для пушистых — скидка от совета города» Заплатите 30 лапок и получите карту \"Выход из Переноски\", если есть в банке.", action: "payAndGainCard", amount: 30, category: "fine", cardKey: "jailFree", cardLabel: "Выход из Переноски" },
 { text: " «Выиграли годовой запас тунца — продали излишки» Получите 120 лапок.", action: "receive", amount: 120 },
 { text: " «Ваш кот записал альбом с мурчанием — роялти» Получите 90 лапок.", action: "receive", amount: 90 },
 { text: " «Общественная чистка зубов котам — налог» Заплатите 25 лапок.", action: "pay", amount: 25, category: "tax" },
 { text: " «Кот сбежал в отпуск в коробке — вам компенсация от отеля» Получите 70 лапок.", action: "receive", amount: 70 },
 { text: " «Штраф за незаконный выгул без поводка» Заплатите 55 лапок.", action: "pay", amount: 55, category: "fine" },
 { text: " «Кот сломал лежанку в гостях — извинительный взнос» Заплатите 45 лапок.", action: "pay", amount: 45, category: "fine" },
 { text: " «День кошачьего непослушания — беспорядки» Заплатите 30 лапок в общественный фонд или потеряйте следующую аренду.", action: "payOrLoseNextRent", amount: 30 },
 { text: " «Открыли котобанковский счёт с бонусом» Получите 95 лапок.", action: "receive", amount: 95 },
 { text: " «Кот нашёл на улице плюшевую мышь и чек» Получите 35 лапок.", action: "receive", amount: 35 },
 { text: " «Вашу кошку выбрали лицом обложки журнала \"Мурзилка\"» Получите 150 лапок.", action: "receive", amount: 150 },
 { text: " «Бесплатная вакцинация от города — сэкономлено» Получите 55 лапок из банка.", action: "receive", amount: 55 },
 { text: " «Штраф за громкий тыгыдык после 22:00» Заплатите 50 лапок.", action: "pay", amount: 50, category: "fine" },
 { text: " «Кот выпил вашу валерьянку — вызвали скорую» Заплатите 75 лапок.", action: "pay", amount: 75, category: "medical" },
 { text: " «Выигрыш в кото-лотерее \"Лапки-царапки\"» Получите 130 лапок.", action: "receive", amount: 130 },
 { text: " «Специальный билет на поезд для кота — возмещение проезда» Получите 40 лапок.", action: "receive", amount: 40 },
 { text: " «Ваш кот нарыбачил в фонтане у мэрии» Штраф 65 лапок.", action: "pay", amount: 65, category: "fine" },
 { text: " «Подарок от города за лучший кошачий сад» Получите 75 лапок.", action: "receive", amount: 75 },
 { text: " «Налог на усы свыше 10 см» Заплатите 30 лапок.", action: "pay", amount: 30, category: "tax" },
 { text: " «Карнавал кошачьих масок — вы выиграли приз» Получите 85 лапок.", action: "receive", amount: 85 },
 { text: " «Субботник по вычёсыванию шерсти — вам компенсация» Получите 45 лапок.", action: "receive", amount: 45 },
 { text: " «Поздравление от кошачьего мэра с конвертом» Получите 70 лапок.", action: "receive", amount: 70 },
 { text: " «Внеплановая проверка лотка — штраф за несоответствие» Заплатите 40 лапок.", action: "pay", amount: 40, category: "fine" },
 { text: " «Кассовый чек от кота: 20 мышей и банка тунца» Заплатите 25 лапок.", action: "pay", amount: 25, category: "fine" },
 { text: "«Кот украл носок и выменял на монетку» Получите 20 лапок.", action: "receive", amount: 20 },
 { text: " «Звание \"Почётный мышелов района\"» Получите 80 лапок.", action: "receive", amount: 80 },
 { text: " «Приют для пожилых котов получил грант — ваша доля» Получите 55 лапок.", action: "receive", amount: 55 },
 { text: " «Чрезвычайный сбор на ремонт кошачьей площадки» Заплатите 45 лапок.", action: "pay", amount: 45, category: "fine" },
 { text: " «Выдача \"Талон Кото-Доктор\"» Сохраните карту. Можно использовать для отмены одного медицинского штрафа.", action: "gainCard", cardKey: "medicalPass", cardLabel: "Талон Кото-Доктор" },
 { text: " «Ваш кот стащил игрушку у соседа — штраф» Заплатите 20 лапок.", action: "pay", amount: 20, category: "fine" },
 { text: " «Фонд \"Пушистые лапы\" выплатил вам компенсацию за корм» Получите 65 лапок.", action: "receive", amount: 65 },
 { text: " «Патруль усов задержал за незаконное мяуканье» Заплатите 55 лапок.", action: "pay", amount: 55, category: "fine" },
 { text: " «Спонсор подарил годовой запас кошачьей мяты» Получите 95 лапок (продали).", action: "receive", amount: 95 },
 { text: " «Кот испортил важный документ — платите нотариусу» Заплатите 70 лапок.", action: "pay", amount: 70, category: "fine" },
 { text: " «Посылка с игрушками — возврат средств за брак» Получите 30 лапок.", action: "receive", amount: 30 },
 { text: " «Совет котов одобрил вам рыбную субсидию» Получите 80 лапок.", action: "receive", amount: 80 },
 { text: " «День подарков в Мяу-нополии» Каждый игрок дарит вам 15 лапок.", action: "collectFromEachPlayer", amount: 15 },
 { text: " «Кот сдал назад налоговую декларацию — возмещение» Получите 70 лапок.", action: "receive", amount: 70 },
 { text: " «Оплата уборки городской когтеточки» Заплатите 25 лапок.", action: "pay", amount: 25, category: "fine" },
 { text: " «Ваша лежанка признана лучшей — премия банка» Получите 60 лапок.", action: "receive", amount: 60 },
 { text: "«Тайный Санта среди котов — вы получили купюру» Получите 50 лапок.", action: "receive", amount: 50 },
 { text: " «Пени за просрочку оплаты наполнителя» Заплатите 35 лапок.", action: "pay", amount: 35, category: "fine" },
 { text: " «Спонтанный кошачий флешмоб — компенсация за шум» Заплатите 20 лапок.", action: "pay", amount: 20, category: "fine" },
 { text: " «Ваш кот — лицо бренда \"Мяу-кола\"» Получите 140 лапок.", action: "receive", amount: 140 },
 { text: " «Игрушка-мышь вызвала ажиотаж — выигрыш от продажи» Получите 100 лапок.", action: "receive", amount: 100 },
 { text: " «Кот сбил горшок с цветком — нервы соседа» Заплатите 50 лапок.", action: "pay", amount: 50, category: "fine" },
 { text: " «Всемирный день кота — универсальная выплата» Все игроки получают по 50 лапок.", action: "allPlayersReceive", amount: 50 },
 { text: " «Билет \"Второй шанс\"» — можно один раз перебросить кубики при попадании на чужую улицу.", action: "gainCard", cardKey: "secondChance", cardLabel: "Билет \"Второй шанс\"" },
 { text: " «Карта \"Мяу-прощение\"» — аннулирует один любой штраф или налог.", action: "gainCard", cardKey: "forgiveness", cardLabel: "Карта \"Мяу-прощение\"" }
];

class Player {
 constructor(id, name, color, startPosition = 0) {
 this.id = id;
 this.name = name;
 this.color = color;
 this.position = startPosition;
 this.money = STARTING_MONEY;
 this.properties = [];
 this.inJail = false;
 this.jailTurns = 0;
 this.doubleCount = 0;
 this.cards = {
 jailFree: 0,
 nineLives: 0,
 rentCancel: 0,
 medicalPass: 0,
 secondChance: 0,
 forgiveness: 0
 };
 this.statusEffects = {
 nextRentOrTaxMultiplier: 1,
 skipNextRentPayment: false
 };
 }

 move(spaces) {
 const nextPosition = this.position + spaces;
 const passedStart = nextPosition >= BOARD_SIZE;
 this.position = nextPosition % BOARD_SIZE;
 return passedStart;
 }

 addProperty(cellId) {
 this.properties.push(cellId);
 }

 pay(amount) {
 this.money -= amount;
 return this.money >= 0;
 }

 receive(amount) {
 this.money += amount;
 }

 goToJail() {
 this.position = 10;
 this.inJail = true;
 this.jailTurns = 0;
 }
}

class MonopolyGame {
 constructor() {
 this.players = [
 new Player(0, "Игрок 1", "#ef4444"),
 new Player(1, "Игрок 2", "#3b82f6")
 ];
 this.currentPlayerIndex = 0;
 this.gameBoard = document.getElementById("gameBoard");
 this.playerInfo = document.getElementById("playerInfo");
 this.diceResult = document.getElementById("diceResult");
 this.gameLog = document.getElementById("gameLog");
 this.rollDiceBtn = document.getElementById("rollDice");
 this.chanceDeck = this.shuffleDeck(chanceCards);
 this.communityDeck = this.shuffleDeck(communityCards);

 this.initBoard();
 this.initPlayers();
 this.updateUI();
 this.addLog(" Игра началась! Первым ходит " + this.getCurrentPlayer().name);

 this.rollDiceBtn.addEventListener("click", () => this.rollDice());
 }

 getCurrentPlayer() {
 return this.players[this.currentPlayerIndex];
 }

 shuffleDeck(cards) {
 const deck = [...cards];
 for (let i = deck.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [deck[i], deck[j]] = [deck[j], deck[i]];
 }
 return deck;
 }

 drawDeckCard(type) {
 const deckName = type === "chance" ? "chanceDeck" : "communityDeck";

 if (this[deckName].length === 0) {
 this[deckName] = this.shuffleDeck(type === "chance" ? chanceCards : communityCards);
 }

 const card = this[deckName].shift();
 this[deckName].push(card);
 return card;
 }

 awardStartMoney(player) {
 player.receive(200);
 this.addLog(` ${player.name} получает котоплату 200 лапок!`);
 }

 initBoard() {
 this.gameBoard.innerHTML = "";
 const gridSize = 11;
 
 for (let row = 0; row < gridSize; row++) {
 for (let col = 0; col < gridSize; col++) {
 const cell = document.createElement("div");
 cell.className = "cell";
 
 const cellIndex = this.getCellIndex(row, col);
 
 if (cellIndex !== null && boardCells[cellIndex]) {
 const cellData = boardCells[cellIndex];
 cell.dataset.id = cellIndex;
 
 if (cellData.color) {
 cell.classList.add(cellData.color);
 }

 if (cellData.type === "go") cell.classList.add("go");
 else if (cellData.type === "jail") cell.classList.add("jail");
 else if (cellData.type === "go_to_jail") cell.classList.add("go_to_jail");
 else if (cellData.type === "tax") cell.classList.add("special");
 else if (cellData.type === "chance" || cellData.type === "community") cell.classList.add("special");
 else if (cellData.type === "free_space") cell.classList.add("free_space");
 else if (cellData.type === "parking") cell.classList.add("parking");

 const name = document.createElement("div");
 name.className = "cell-name";
 name.textContent = cellData.name;
 cell.appendChild(name);

 if (cellData.price) {
 const price = document.createElement("div");
 price.className = "cell-price";
 price.textContent = `${cellData.price} лапок`;
 cell.appendChild(price);
 }
 } else {
 cell.style.background = "rgba(255, 255, 255, 0.05)";
 }

 this.gameBoard.appendChild(cell);
 }
 }
 }

 getCellIndex(row, col) {
 const gridSize = 11;
 const sideLength = 10;
 
 if (row === 0 && col === 0) {
 return 10;
 } else if (row === 0 && col === gridSize - 1) {
 return 30;
 } else if (row === gridSize - 1 && col === 0) {
 return 0;
 } else if (row === gridSize - 1) {
 return col;
 } else if (col === gridSize - 1) {
 return sideLength + (gridSize - 1 - row);
 } else if (row === 0) {
 return 2 * sideLength + (gridSize - 1 - col);
 } else if (col === 0) {
 return 3 * sideLength + (gridSize - 1 - row);
 }
 
 return null;
 }

 initPlayers() {
 this.players.forEach((player, index) => {
 const token = document.createElement("div");
 token.className = "player-token";
 token.style.backgroundColor = player.color;
 token.id = `token-${player.id}`;
 
 const startPos = this.getGridPosition(0);
 const gridSize = 11;
 const cellIndexInDOM = startPos.row * gridSize + startPos.col;
 
 this.gameBoard.children[cellIndexInDOM].appendChild(token);
 });
 }

 rollDice() {
 const player = this.getCurrentPlayer();

 if (player.inJail && this.tryUseJailFreeCard(player)) {
 this.updateUI();
 }

 if (player.inJail) {
 this.handleJailTurn(player);
 return;
 }

 this.rollDiceBtn.disabled = true;
 
 let dice1, dice2;
 let doubles = 0;
 let totalRoll = 0;

 do {
 dice1 = Math.floor(Math.random() * 6) + 1;
 dice2 = Math.floor(Math.random() * 6) + 1;
 const isDouble = dice1 === dice2;
 
 if (isDouble) {
 doubles++;
 player.doubleCount++;
 this.addLog(` ${player.name} выбросил дубль: ${dice1}+${dice2}=${dice1+dice2}`);
 
 if (doubles === 3) {
 this.addLog(` ${player.name} выбросил 3 дубля подряд! Идёт в переноску!`);
 player.goToJail();
 this.movePlayerToken(player, 10);
 this.nextTurn();
 return;
 }
 } else {
 this.addLog(` ${player.name} выбросил: ${dice1}+${dice2}=${dice1+dice2}`);
 }
 
 totalRoll += dice1 + dice2;
 
 if (!isDouble || doubles === 0) {
 break;
 }
 } while (true);

 const passedStart = player.move(totalRoll);
 this.movePlayerToken(player, player.position);

 if (passedStart) {
 this.awardStartMoney(player);
 }
 
 this.checkCell(player);

 if (player.inJail) {
 player.doubleCount = 0;
 this.nextTurn();
 } else if (dice1 !== dice2) {
 player.doubleCount = 0;
 this.nextTurn();
 } else {
 this.rollDiceBtn.disabled = false;
 this.addLog(` ${player.name} выбросил дубль! Ходит ещё раз!`);
 }
 }

 handleJailTurn(player) {
 player.jailTurns++;
 
 const dice1 = Math.floor(Math.random() * 6) + 1;
 const dice2 = Math.floor(Math.random() * 6) + 1;
 
 this.addLog(` ${player.name} в переноске выбросил: ${dice1}+${dice2}=${dice1+dice2}`);
 
 if (dice1 === dice2) {
 player.inJail = false;
 player.jailTurns = 0;
 player.pay(50);
 this.addLog(`🆓 ${player.name} выходит из переноски по дублю и платит 50 лапок`);
 
 const passedStart = player.move(dice1 + dice2);
 this.movePlayerToken(player, player.position);

 if (passedStart) {
 this.awardStartMoney(player);
 }

 this.checkCell(player);
 
 this.nextTurn();
 } else if (player.jailTurns >= 3) {
 player.inJail = false;
 player.jailTurns = 0;
 this.addLog(` ${player.name} отсидел 3 хода в переноске и выйдет на следующий ход`);
 this.nextTurn();
 } else {
 this.addLog(`⏳ ${player.name} остаётся в переноске (${player.jailTurns}/3)`);
 this.nextTurn();
 }
 }

 movePlayerToken(player, newPosition) {
 const token = document.getElementById(`token-${player.id}`);
 const gridSize = 11;
 
 const cellIndex = this.getGridPosition(newPosition);
 const cellIndexInDOM = cellIndex.row * gridSize + cellIndex.col;
 
 const cell = this.gameBoard.children[cellIndexInDOM];
 cell.appendChild(token);
 }

 getGridPosition(cellIndex) {
 const gridSize = 11;
 const sideLength = 10;
 
 if (cellIndex === 10) {
 return { row: 0, col: 0 };
 } else if (cellIndex === 30) {
 return { row: 0, col: gridSize - 1 };
 } else if (cellIndex === 0) {
 return { row: gridSize - 1, col: 0 };
 } else if (cellIndex < 10) {
 return { row: gridSize - 1, col: cellIndex };
 } else if (cellIndex < 20) {
 return { row: gridSize - 1 - (cellIndex - 10), col: gridSize - 1 };
 } else if (cellIndex < 30) {
 return { row: 0, col: gridSize - 1 - (cellIndex - 20) };
 } else if (cellIndex < 40) {
 return { row: gridSize - 1 - (cellIndex - 30), col: 0 };
 }
 
 return { row: gridSize - 1, col: 0 };
 }

 getOtherPlayers(player) {
 return this.players.filter(otherPlayer => otherPlayer.id !== player.id);
 }

 movePlayerBy(player, steps, checkCellAfterMove = true) {
 const passedStart = steps > 0 && player.position + steps >= BOARD_SIZE;
 const nextPosition = ((player.position + steps) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE;
 player.position = nextPosition;
 this.movePlayerToken(player, nextPosition);

 if (passedStart) {
 this.awardStartMoney(player);
 }

 if (checkCellAfterMove) {
 this.checkCell(player);
 }
 }

 movePlayerTo(player, targetPosition, checkCellAfterMove = true) {
 const passedStart = targetPosition < player.position;
 player.position = targetPosition;
 this.movePlayerToken(player, targetPosition);

 if (passedStart && targetPosition === 0) {
 this.awardStartMoney(player);
 }

 if (checkCellAfterMove) {
 this.checkCell(player);
 }
 }

 getCardInventory(player) {
 const labels = {
 jailFree: "Выход из Переноски",
 nineLives: "9-я жизнь",
 rentCancel: "Карта \"Сытая Морда\"",
 medicalPass: "Талон Кото-Доктор",
 secondChance: "Билет \"Второй шанс\"",
 forgiveness: "Карта \"Мяу-прощение\""
 };

 return Object.entries(player.cards)
 .filter(([, count]) => count > 0)
 .map(([key, count]) => `${labels[key]} x${count}`);
 }

 addCardToPlayer(player, cardKey, cardLabel) {
 player.cards[cardKey] = (player.cards[cardKey] || 0) + 1;
 this.addLog(`🃏 ${player.name} получает карту "${cardLabel}"`);
 }

 usePlayerCard(player, cardKey, cardLabel) {
 if (!player.cards[cardKey]) {
 return false;
 }

 player.cards[cardKey]--;
 this.addLog(`🃏 ${player.name} использует карту "${cardLabel}"`);
 return true;
 }

 tryUseJailFreeCard(player) {
 if (player.cards.jailFree > 0) {
 this.usePlayerCard(player, "jailFree", "Выход из Переноски");
 } else if (player.cards.nineLives > 0) {
 this.usePlayerCard(player, "nineLives", "9-я жизнь");
 } else {
 return false;
 }

 player.inJail = false;
 player.jailTurns = 0;
 this.addLog(`🆓 ${player.name} выходит из переноски по карте и продолжает ход`);
 return true;
 }

 applyPaymentModifiers(player, amount, category) {
 let finalAmount = amount;

 if (category === "rent" && player.statusEffects.skipNextRentPayment) {
 player.statusEffects.skipNextRentPayment = false;
 this.addLog(` ${player.name} пропускает следующую оплату аренды`);
 return 0;
 }

 if (category === "rent" && player.cards.rentCancel > 0) {
 this.usePlayerCard(player, "rentCancel", "Карта \"Сытая Морда\"");
 this.addLog(` Аренда для ${player.name} отменена`);
 return 0;
 }

 if (category === "medical" && player.cards.medicalPass > 0) {
 this.usePlayerCard(player, "medicalPass", "Талон Кото-Доктор");
 this.addLog(` Медицинский штраф для ${player.name} отменён`);
 return 0;
 }

 if ((category === "fine" || category === "tax") && player.cards.forgiveness > 0) {
 this.usePlayerCard(player, "forgiveness", "Карта \"Мяу-прощение\"");
 this.addLog(` Штраф или налог для ${player.name} аннулирован`);
 return 0;
 }

 if ((category === "rent" || category === "tax") && player.statusEffects.nextRentOrTaxMultiplier > 1) {
 finalAmount = Math.ceil(finalAmount * player.statusEffects.nextRentOrTaxMultiplier);
 player.statusEffects.nextRentOrTaxMultiplier = 1;
this.addLog(`Следующий платёж ${player.name} увеличен на 20%: ${finalAmount} лапок`);
 }

 return finalAmount;
 }

 chargePlayer(player, amount, category = "generic", recipient = null) {
 const finalAmount = this.applyPaymentModifiers(player, amount, category);

 if (finalAmount <= 0) {
 return 0;
 }

 player.pay(finalAmount);

 if (recipient) {
 recipient.receive(finalAmount);
 }

 return finalAmount;
 }

 collectFromEachPlayer(player, amount) {
 let totalCollected = 0;

 for (const otherPlayer of this.getOtherPlayers(player)) {
 otherPlayer.pay(amount);
 player.receive(amount);
 totalCollected += amount;
 }

 this.addLog(` ${player.name} получает ${totalCollected} лапок от других игроков`);
 }

 payEachPlayer(player, amount) {
 let totalPaid = 0;

 for (const otherPlayer of this.getOtherPlayers(player)) {
 player.pay(amount);
 otherPlayer.receive(amount);
 totalPaid += amount;
 }

 return totalPaid;
 }

 payBankOrLoseNextRent(player, amount) {
 if (player.money >= amount) {
 const paid = this.chargePlayer(player, amount);
 this.addLog(` ${player.name} платит ${paid} лапок в общественный фонд`);
 return;
 }

 player.statusEffects.skipNextRentPayment = true;
 this.addLog(` ${player.name} теряет следующую оплату аренды вместо платежа в фонд`);
 }

 payVetContribution(player, bankAmount, perPlayerAmount) {
 const totalToPlayers = perPlayerAmount * this.getOtherPlayers(player).length;

 if (totalToPlayers > 0 && totalToPlayers < bankAmount) {
 const paid = this.payEachPlayer(player, perPlayerAmount);
 this.addLog(` ${player.name} платит ${paid} лапок другим игрокам по ветеринарному взносу`);
 return;
 }

 const paid = this.chargePlayer(player, bankAmount, "medical");
 this.addLog(` ${player.name} платит ${paid} лапок в банк по ветеринарному взносу`);
 }

 discardAnyNonReleaseCard(player) {
 const discardableCards = [
 ["rentCancel", "Карта \"Сытая Морда\""],
 ["medicalPass", "Талон Кото-Доктор"],
 ["secondChance", "Билет \"Второй шанс\""],
 ["forgiveness", "Карта \"Мяу-прощение\""]
 ];

 for (const [cardKey, cardLabel] of discardableCards) {
 if (player.cards[cardKey] > 0) {
 this.usePlayerCard(player, cardKey, cardLabel);
 this.addLog(` ${player.name} сбрасывает карту "${cardLabel}" вместо платежа`);
 return true;
 }
 }

 return false;
 }

 rerollFromSecondChance(player) {
 const dice1 = Math.floor(Math.random() * 6) + 1;
 const dice2 = Math.floor(Math.random() * 6) + 1;
 const total = dice1 + dice2;
 const passedStart = player.move(total);

 this.addLog(` ${player.name} перебрасывает кубики: ${dice1}+${dice2}=${total}`);
 this.movePlayerToken(player, player.position);

 if (passedStart) {
 this.awardStartMoney(player);
 }

 this.checkCell(player);
 }

 getNextRailroadPosition(position) {
 const railroadPositions = boardCells
 .filter(cell => cell.type === "railroad")
 .map(cell => cell.id)
 .sort((a, b) => a - b);

 for (const railroadPosition of railroadPositions) {
 if (railroadPosition > position) {
 return railroadPosition;
 }
 }

 return railroadPositions[0] ?? 0;
 }

 moveToNearestRailroadFromCard(player, doubleRent = false) {
 const destination = this.getNextRailroadPosition(player.position);
 const passedStart = destination < player.position;

 player.position = destination;
 this.movePlayerToken(player, destination);
 this.addLog(` ${player.name} перемещается на ближайшую железную дорогу`);

 if (passedStart) {
 this.awardStartMoney(player);
 }

 const cell = boardCells[destination];
 const owner = this.findPropertyOwner(cell.id);

 if (owner === null) {
 if (player.money >= cell.price) {
 player.addProperty(cell.id);
 player.pay(cell.price);
 this.addLog(` ${player.name} купил "${cell.name}" за ${cell.price} лапок`);
 } else {
 this.addLog(` ${player.name} не хватает лапок для покупки "${cell.name}"`);
 }
 return;
 }

 if (owner.id === player.id) {
 this.addLog(` ${player.name} уже владеет "${cell.name}"`);
 return;
 }

 const railroadCount = this.getRailroadCount(owner);
 const baseRent = cell.rents[Math.min(railroadCount - 1, 3)];
 const rent = doubleRent ? baseRent * 2 : baseRent;
 const paid = this.chargePlayer(player, rent, "rent", owner);
 this.addLog(` ${player.name} платит ${paid} лапок ренты за "${cell.name}"`);
 }

 resolveCardDraw(player, type) {
 const card = this.drawDeckCard(type);
 this.addLog(` ${player.name} тянет карточку: ${card.text}`);
 this.applyCardEffect(player, card);
 }

 applyCardEffect(player, card) {
 switch (card.action) {
 case "receive":
 player.receive(card.amount);
 this.addLog(` ${player.name} получает ${card.amount} лапок`);
 break;

 case "pay": {
 const paid = this.chargePlayer(player, card.amount, card.category);
 this.addLog(` ${player.name} платит ${paid} лапок`);
 break;
 }

 case "collectFromEachPlayer":
 this.collectFromEachPlayer(player, card.amount);
 break;

 case "allPlayersReceive":
 this.players.forEach(gamePlayer => gamePlayer.receive(card.amount));
 this.addLog(` Все игроки получают по ${card.amount} лапок`);
 break;

 case "moveRelative":
 this.movePlayerBy(player, card.steps);
 break;

 case "moveTo":
 this.movePlayerTo(player, card.position);
 break;

 case "goToJail":
 player.goToJail();
 this.movePlayerToken(player, 10);
 this.addLog(` ${player.name} отправляется в переноску по карточке`);
 break;

 case "moveToNearestRailroad":
 this.moveToNearestRailroadFromCard(player, card.doubleRent);
 break;

 case "gainCard":
 this.addCardToPlayer(player, card.cardKey, card.cardLabel);
 break;

 case "payAndGainCard": {
 const paid = this.chargePlayer(player, card.amount, card.category);
 this.addLog(` ${player.name} платит ${paid} лапок`);
 this.addCardToPlayer(player, card.cardKey, card.cardLabel);
 break;
 }

 case "payOrUseSpecificCard":
 if (!this.usePlayerCard(player, card.cardKey, card.cardLabel)) {
 const paid = this.chargePlayer(player, card.amount, card.category);
 this.addLog(` ${player.name} платит ${paid} лапок`);
 }
 break;

 case "setNextRentOrTaxMultiplier":
 player.statusEffects.nextRentOrTaxMultiplier = card.multiplier;
 this.addLog(`Следующая аренда или налог для ${player.name} увеличатся на 20%`);
 break;

 case "payOrLoseNextRent":
 this.payBankOrLoseNextRent(player, card.amount);
 break;

 case "vetContribution":
 this.payVetContribution(player, card.bankAmount, card.perPlayerAmount);
 break;

 case "payOrDiscardAnyNonReleaseCard":
 if (!this.discardAnyNonReleaseCard(player)) {
 const paid = this.chargePlayer(player, card.amount, card.category);
 this.addLog(` ${player.name} платит ${paid} лапок`);
 }
 break;
 }
 }

 checkCell(player) {
 const cell = boardCells[player.position];
 
 if (!cell) return;

 this.addLog(` ${player.name} попал на "${cell.name}"`);

 switch (cell.type) {
 case "go":
 if (player.position === 0) {
 this.addLog(` ${player.name} находится на старте`);
 }
 break;
 
 case "tax":
 this.addLog(` ${player.name} платит усатый налог ${this.chargePlayer(player, cell.amount, "tax")} лапок`);
 break;
 
 case "property":
 this.handleProperty(player, cell);
 break;
 
 case "jail":
 this.addLog(` ${player.name} просто посетил переноску`);
 break;
 
 case "go_to_jail":
 this.addLog(` ${player.name} отправляется в переноску!`);
 player.goToJail();
 this.movePlayerToken(player, 10);
 this.addLog(` ${player.name} не получает 200 лапок за проход через старт`);
 break;
 
 case "parking":
 this.addLog(`🅿 ${player.name} отдыхает на бесплатной парковке`);
 break;
 
 case "free_space":
 this.addLog(` ${player.name} отдыхает в бесплатной картонной коробке`);
 break;
 
 case "chance":
 this.resolveCardDraw(player, "chance");
 break;

 case "community":
 this.resolveCardDraw(player, "community");
 break;
 
 case "utility":
 this.handleUtility(player, cell);
 break;
 
 case "railroad":
 this.handleRailroad(player, cell);
 break;
 }

 this.updateUI();
 }

 handleProperty(player, cell) {
 const owner = this.findPropertyOwner(cell.id);
 
 if (owner === null) {
 if (player.money >= cell.price) {
 player.addProperty(cell.id);
 player.pay(cell.price);
 this.addLog(` ${player.name} купил "${cell.name}" за ${cell.price} лапок`);
 } else {
 this.addLog(` ${player.name} не хватает лапок для покупки "${cell.name}"`);
 }
 } else if (owner.id !== player.id) {
 if (player.cards.secondChance > 0) {
 this.usePlayerCard(player, "secondChance", "Билет \"Второй шанс\"");
 this.rerollFromSecondChance(player);
 return;
 }

 const rent = this.calculateRent(cell, owner);
 const paid = this.chargePlayer(player, rent, "rent", owner);
 this.addLog(` ${player.name} платит ${paid} лапок ренты ${owner.name}`);
 } else {
 this.addLog(` ${player.name} владеет "${cell.name}"`);
 }
 }

 findPropertyOwner(cellId) {
 for (const player of this.players) {
 if (player.properties.includes(cellId)) {
 return player;
 }
 }
 return null;
 }

 calculateRent(cell, owner) {
 const ownerProperties = this.getColorGroupProperties(owner, cell.color);
 const allPropertiesInGroup = boardCells.filter(c => c.color === cell.color);
 
 if (ownerProperties.length === allPropertiesInGroup.length) {
 return cell.colorRent;
 }
 
 return cell.baseRent;
 }

 getColorGroupProperties(player, color) {
 return player.properties.filter(id => {
 const cell = boardCells[id];
 return cell && cell.color === color;
 });
 }

 handleUtility(player, cell) {
 const owner = this.findPropertyOwner(cell.id);
 
 if (owner === null) {
 if (player.money >= cell.price) {
 player.addProperty(cell.id);
 player.pay(cell.price);
 this.addLog(` ${player.name} купил "${cell.name}" за ${cell.price} лапок`);
 } else {
 this.addLog(` ${player.name} не хватает лапок для покупки "${cell.name}"`);
 }
 } else if (owner.id !== player.id) {
 const utilityCount = this.getUtilityCount(owner);
 let multiplier = utilityCount === 2 ? 10 : 4;
 
 let totalRoll = 0;
 let rolls = 0;
 let isDouble = false;
 
 do {
 const dice1 = Math.floor(Math.random() * 6) + 1;
 const dice2 = Math.floor(Math.random() * 6) + 1;
 const rollSum = dice1 + dice2;
 totalRoll += rollSum;
 rolls++;
 isDouble = dice1 === dice2;
 
 this.addLog(` ${player.name} бросил: ${dice1}+${dice2}=${rollSum}`);
 
 if (!isDouble || rolls >= 3) {
 break;
 }
 } while (true);
 
 const rent = totalRoll * multiplier;
 const paid = this.chargePlayer(player, rent, "rent", owner);
 this.addLog(` ${player.name} платит ${paid} лапок за "${cell.name}" (умножение на ${multiplier})`);
 } else {
 this.addLog(` ${player.name} владеет "${cell.name}"`);
 }
 }

 getUtilityCount(player) {
 return player.properties.filter(id => {
 const cell = boardCells[id];
 return cell && cell.type === "utility";
 }).length;
 }

 handleRailroad(player, cell) {
 const owner = this.findPropertyOwner(cell.id);
 
 if (owner === null) {
 if (player.money >= cell.price) {
 player.addProperty(cell.id);
 player.pay(cell.price);
 this.addLog(` ${player.name} купил "${cell.name}" за ${cell.price} лапок`);
 } else {
 this.addLog(` ${player.name} не хватает лапок для покупки "${cell.name}"`);
 }
 } else if (owner.id !== player.id) {
 const railroadCount = this.getRailroadCount(owner);
 const rent = cell.rents[Math.min(railroadCount - 1, 3)];

 const paid = this.chargePlayer(player, rent, "rent", owner);
 this.addLog(` ${player.name} платит ${paid} лапок ренты за "${cell.name}" (${railroadCount} дорог у владельца)`);
 } else {
 this.addLog(` ${player.name} владеет "${cell.name}"`);
 }
 }

 getRailroadCount(player) {
 return player.properties.filter(id => {
 const cell = boardCells[id];
 return cell && cell.type === "railroad";
 }).length;
 }

 nextTurn() {
 this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
 this.updateUI();
 this.rollDiceBtn.disabled = false;
 }

 updateUI() {
 const player = this.getCurrentPlayer();
 const playerCards = this.getCardInventory(player);
 
 this.playerInfo.innerHTML = `
 <h2> ${player.name}</h2>
 <div class="player-money"> ${player.money} лапок</div>
 <div class="player-properties">
 <strong>Собственность (${player.properties.length}):</strong>
 ${player.properties.map(id => {
 const cell = boardCells[id];
 return cell ? `<div>${cell.name}</div>` : '';
 }).join('')}
 </div>
 <div class="player-properties">
 <strong>Карты (${playerCards.length}):</strong>
 ${playerCards.length ? playerCards.map(card => `<div>${card}</div>`).join('') : '<div>Нет карт</div>'}
 </div>
 `;
 }

 addLog(message) {
 const entry = document.createElement("div");
 entry.className = "log-entry";
 entry.textContent = message;
 this.gameLog.appendChild(entry);
 this.gameLog.scrollTop = this.gameLog.scrollHeight;
 }
}

document.addEventListener("DOMContentLoaded", () => {
 new MonopolyGame();
});
