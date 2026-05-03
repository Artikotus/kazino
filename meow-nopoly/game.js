const BOARD_SIZE = 40;
const STARTING_MONEY = 1500;
const MAX_HOUSES = 32;
const MAX_HOTELS = 12;
const OWNABLE_TYPES = new Set(["property", "railroad", "utility"]);
const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
const ROOM_STORAGE_KEY = "meow-nopoly-rooms";
const ACTIVE_ROOM_STORAGE_KEY = "meow-nopoly-active-room";
const ROOM_RANK_ORDER = ["новичок", "игрок", "ветеран", "мастер", "грандмастер", "легенда", "админ"];

function readStorageJson(key, fallback) { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function writeStorageJson(key, value) { window.localStorage.setItem(key, JSON.stringify(value)); }
function getStoredUserProfile() { return readStorageJson("current_user", null) || readStorageJson("koto_user", null) || {}; }
function getCurrentRankLabel() { const user = getStoredUserProfile(); return String(user.rank || user.title || user.role || user.zvanie || window.localStorage.getItem("koto_user_rank") || "Новичок").trim(); }
function canCreateRoomByRank(rankLabel) { const rank = String(rankLabel || "").trim().toLowerCase(); return ROOM_RANK_ORDER.indexOf(rank) >= ROOM_RANK_ORDER.indexOf("мастер") || ["owner", "admin", "moderator"].includes(rank); }
function loadRoomList() { return readStorageJson(ROOM_STORAGE_KEY, []).filter((room) => room?.id && room?.playerCount); }
function saveRoomList(rooms) { writeStorageJson(ROOM_STORAGE_KEY, rooms.slice(0, 20)); }
function getActiveRoom() { return readStorageJson(ACTIVE_ROOM_STORAGE_KEY, null); }
function setActiveRoom(room) { writeStorageJson(ACTIVE_ROOM_STORAGE_KEY, room); }
function makeRoomId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function mountRoomMenu() {
  const overlay = document.getElementById("roomMenuOverlay");
  if (!overlay) return;
  const rankInfo = document.getElementById("roomRankInfo");
  const status = document.getElementById("roomMenuStatus");
  const roomPlayerCount = document.getElementById("roomPlayerCount");
  const friendsSelect = document.getElementById("friendsRoomSelect");
  const joinInput = document.getElementById("joinRoomIdInput");
  const createBtn = document.getElementById("createRoomBtn");
  const joinFriendsBtn = document.getElementById("joinFriendsRoomBtn");
  const joinByIdBtn = document.getElementById("joinRoomByIdBtn");
  const startBtn = document.getElementById("startRoomGameBtn");
  const roomBrief = document.getElementById("roomBrief");
  const rankLabel = getCurrentRankLabel();
  let selectedRoom = getActiveRoom();
  const setStatus = (text, isError = false) => { status.textContent = text; status.classList.toggle("error", isError); };
  const renderRooms = () => {
    const rooms = loadRoomList();
    friendsSelect.innerHTML = rooms.length ? rooms.map((room) => `<option value="${room.id}">#${room.id} • ${room.hostName || "Игрок"} • ${room.playerCount} игрока</option>`).join("") : '<option value="">Нет доступных комнат</option>';
    if (selectedRoom?.id && rooms.some((room) => room.id === selectedRoom.id)) friendsSelect.value = selectedRoom.id;
  };
  const selectRoom = (room, source) => {
    selectedRoom = room;
    setActiveRoom(room);
    roomPlayerCount.value = String(room.playerCount);
    if (roomBrief) roomBrief.textContent = `Комната #${room.id} • Хост: ${room.hostName || "Игрок"}`;
    startBtn.disabled = false;
    setStatus(`${source}: #${room.id} • ${room.playerCount} игрока • хост ${room.hostName || "Игрок"}`);
    renderRooms();
  };
  rankInfo.textContent = canCreateRoomByRank(rankLabel) ? `Твоё звание: ${rankLabel}. Создание комнаты доступно.` : `Твоё звание: ${rankLabel}. Создание комнаты доступно только со звания Мастер.`;
  createBtn.disabled = !canCreateRoomByRank(rankLabel);
  createBtn.addEventListener("click", () => {
    if (createBtn.disabled) return setStatus("Создание комнаты доступно только со звания Мастер.", true);
    const user = getStoredUserProfile();
    const room = { id: makeRoomId(), hostName: user.login || user.nickname || "Игрок", hostRank: rankLabel, playerCount: Number(roomPlayerCount.value || 2), createdAt: Date.now() };
    const rooms = loadRoomList().filter((item) => item.id !== room.id); rooms.unshift(room); saveRoomList(rooms); selectRoom(room, "Комната создана");
  });
  joinFriendsBtn.addEventListener("click", () => { const room = loadRoomList().find((item) => item.id === friendsSelect.value); if (!room) return setStatus("Нет комнаты для входа к друзьям.", true); selectRoom(room, "Вход к друзьям"); });
  joinByIdBtn.addEventListener("click", () => { const roomId = (joinInput.value || "").trim().toUpperCase(); const room = loadRoomList().find((item) => item.id === roomId); if (!room) return setStatus(`Комната #${roomId || "?"} не найдена.`, true); selectRoom(room, "Вход по ID"); });
  startBtn.addEventListener("click", () => { if (!selectedRoom) return; window.localStorage.setItem("meow-nopoly-player-count", String(selectedRoom.playerCount)); if (document.getElementById("playerCount")?.value !== String(selectedRoom.playerCount)) { window.location.reload(); return; } overlay.hidden = true; });
  renderRooms();
  if (selectedRoom) selectRoom(loadRoomList().find((item) => item.id === selectedRoom.id) || selectedRoom, "Выбрана комната");
}

const boardCells = [
  { id: 0, name: "Котоплата", type: "go", description: "При проходе вперёд получите 200 лапок." },
  { id: 1, name: "Подвальный переулок", type: "property", color: "brown", price: 60, mortgage: 30, mortgageCost: 33, baseRent: 4, colorRent: 8, houses: [20, 60, 180, 320], hotel: 450, houseCost: 50 },
  { id: 2, name: "Фонд \"Сытая морда\"", type: "community", description: "Тяните карточку фонда." },
  { id: 3, name: "Улица Мырлыкина", type: "property", color: "brown", price: 60, mortgage: 30, mortgageCost: 33, baseRent: 4, colorRent: 8, houses: [20, 60, 180, 320], hotel: 450, houseCost: 50 },
  { id: 4, name: "Усатый налог", type: "tax", amount: 200 },
  { id: 5, name: "Тыгыдыдская железная дорога", type: "railroad", price: 200, mortgage: 100, mortgageCost: 110, rents: [25, 50, 100, 200] },
  { id: 6, name: "Проспект Усатого-Полосатого", type: "property", color: "lightblue", price: 100, mortgage: 50, mortgageCost: 55, baseRent: 6, colorRent: 12, houses: [30, 90, 270, 400], hotel: 550, houseCost: 50 },
  { id: 7, name: "Девятая жизнь", type: "chance", description: "Тяните карточку." },
  { id: 8, name: "Улица Тёплой Лежанки", type: "property", color: "lightblue", price: 100, mortgage: 50, mortgageCost: 55, baseRent: 6, colorRent: 12, houses: [30, 90, 270, 400], hotel: 550, houseCost: 50 },
  { id: 9, name: "Валерьяновый бульвар", type: "property", color: "lightblue", price: 120, mortgage: 60, mortgageCost: 66, baseRent: 8, colorRent: 16, houses: [40, 100, 300, 450], hotel: 600, houseCost: 50 },
  { id: 10, name: "Переноска", type: "jail", description: "Просто посетил или находишься внутри." },
  { id: 11, name: "Когтеточкинская площадь", type: "property", color: "purple", price: 140, mortgage: 70, mortgageCost: 77, baseRent: 10, colorRent: 20, houses: [50, 150, 450, 625], hotel: 750, houseCost: 100 },
  { id: 12, name: "Обогревание лапок", type: "utility", price: 150, mortgage: 75, mortgageCost: 83 },
  { id: 13, name: "Набережная Рыбьего Хвоста", type: "property", color: "purple", price: 140, mortgage: 70, mortgageCost: 77, baseRent: 10, colorRent: 20, houses: [50, 150, 450, 625], hotel: 750, houseCost: 100 },
  { id: 14, name: "Мяу-стрит", type: "property", color: "purple", price: 160, mortgage: 80, mortgageCost: 88, baseRent: 12, colorRent: 24, houses: [60, 180, 500, 700], hotel: 900, houseCost: 100 },
  { id: 15, name: "Мурманский вокзал", type: "railroad", price: 200, mortgage: 100, mortgageCost: 110, rents: [25, 50, 100, 200] },
  { id: 16, name: "Лапки Аллея", type: "property", color: "orange", price: 180, mortgage: 90, mortgageCost: 99, baseRent: 14, colorRent: 28, houses: [70, 200, 550, 750], hotel: 950, houseCost: 100 },
  { id: 17, name: "Фонд \"Сытая морда\"", type: "community", description: "Тяните карточку." },
  { id: 18, name: "Засадная улица", type: "property", color: "orange", price: 180, mortgage: 90, mortgageCost: 99, baseRent: 14, colorRent: 28, houses: [70, 200, 550, 750], hotel: 950, houseCost: 100 },
  { id: 19, name: "Ночной Дозор проспект", type: "property", color: "orange", price: 200, mortgage: 100, mortgageCost: 110, baseRent: 16, colorRent: 32, houses: [80, 220, 600, 800], hotel: 1000, houseCost: 100 },
  { id: 20, name: "Бесплатная картонная коробка", type: "free_space", description: "Ничего не происходит." },
  { id: 21, name: "Леопардовый проспект", type: "property", color: "red", price: 220, mortgage: 110, mortgageCost: 121, baseRent: 18, colorRent: 36, houses: [90, 250, 700, 875], hotel: 1050, houseCost: 150 },
  { id: 22, name: "Девятая жизнь", type: "chance", description: "Тяните карточку." },
  { id: 23, name: "Пантерный тупик", type: "property", color: "red", price: 220, mortgage: 110, mortgageCost: 121, baseRent: 18, colorRent: 36, houses: [90, 250, 700, 875], hotel: 1050, houseCost: 150 },
  { id: 24, name: "Малиновый Зализ", type: "property", color: "red", price: 240, mortgage: 120, mortgageCost: 132, baseRent: 20, colorRent: 40, houses: [100, 300, 750, 925], hotel: 1100, houseCost: 150 },
  { id: 25, name: "Станция \"Кошачья Мята\"", type: "railroad", price: 200, mortgage: 100, mortgageCost: 110, rents: [25, 50, 100, 200] },
  { id: 26, name: "Солнечный подоконник", type: "property", color: "yellow", price: 260, mortgage: 130, mortgageCost: 143, baseRent: 22, colorRent: 44, houses: [110, 330, 800, 975], hotel: 1150, houseCost: 150 },
  { id: 27, name: "Мурр-Молл", type: "property", color: "yellow", price: 260, mortgage: 130, mortgageCost: 143, baseRent: 22, colorRent: 44, houses: [110, 330, 800, 975], hotel: 1150, houseCost: 150 },
  { id: 28, name: "Чистые Лапки", type: "utility", price: 150, mortgage: 75, mortgageCost: 83 },
  { id: 29, name: "Золотой клубок", type: "property", color: "yellow", price: 280, mortgage: 140, mortgageCost: 154, baseRent: 24, colorRent: 48, houses: [120, 360, 850, 1025], hotel: 1200, houseCost: 150 },
  { id: 30, name: "Отправляйся в переноску", type: "go_to_jail", description: "Идите на клетку 10 без котоплаты." },
  { id: 31, name: "Мятный переулок", type: "property", color: "green", price: 300, mortgage: 150, mortgageCost: 165, baseRent: 26, colorRent: 52, houses: [130, 390, 900, 1100], hotel: 1275, houseCost: 200 },
  { id: 32, name: "Кошачья Лужайка", type: "property", color: "green", price: 300, mortgage: 150, mortgageCost: 165, baseRent: 26, colorRent: 52, houses: [130, 390, 900, 1100], hotel: 1275, houseCost: 200 },
  { id: 33, name: "Фонд \"Сытая морда\"", type: "community", description: "Тяните карточку." },
  { id: 34, name: "Проезд Дремлющих Котов", type: "property", color: "green", price: 320, mortgage: 160, mortgageCost: 176, baseRent: 28, colorRent: 56, houses: [150, 450, 1000, 1200], hotel: 1400, houseCost: 200 },
  { id: 35, name: "Аэропорт \"Шерсть\"", type: "railroad", price: 200, mortgage: 100, mortgageCost: 110, rents: [25, 50, 100, 200] },
  { id: 36, name: "Девятая жизнь", type: "chance", description: "Тяните карточку." },
  { id: 37, name: "Улица Лишнего Корма", type: "property", color: "darkblue", price: 350, mortgage: 175, mortgageCost: 193, baseRent: 35, colorRent: 70, houses: [175, 500, 1100, 1300], hotel: 1500, houseCost: 200 },
  { id: 38, name: "Превышение скорости ночного тыгыдыга", type: "tax", amount: 100 },
  { id: 39, name: "Банк Мур-мур", type: "property", color: "darkblue", price: 400, mortgage: 200, mortgageCost: 220, baseRent: 50, colorRent: 100, houses: [200, 600, 1400, 1700], hotel: 2000, houseCost: 200 }
];

const chanceCards = [
  { text: "Тыгыдык в 3 ночи: идите в Переноску.", action: "goToJail" },
  { text: "Пройдите на 3 клетки назад.", action: "moveRelative", steps: -3 },
  { text: "Вернитесь на \"Подвальный переулок\".", action: "moveTo", position: 1 },
  { text: "Пройдите на \"Котоплату\" и получите 200 лапок.", action: "moveTo", position: 0 },
  { text: "Пройдите на ближайшую железную дорогу. Если она не ваша, платите двойную ренту.", action: "moveToNearestRailroad", doubleRent: true },
  { text: "Получите 150 лапок.", action: "receive", amount: 150 },
  { text: "Получите 100 лапок.", action: "receive", amount: 100 },
  { text: "Получите 50 лапок от каждого игрока.", action: "collectFromEachPlayer", amount: 50 },
  { text: "Заплатите 150 лапок.", action: "pay", amount: 150 },
  { text: "Заплатите 60 лапок.", action: "pay", amount: 60 },
  { text: "Нашли 9-ю жизнь. Сохраните карту.", action: "gainCard", cardKey: "nineLives", cardLabel: "9-я жизнь" },
  { text: "Выход из Переноски. Сохраните карту.", action: "gainCard", cardKey: "jailFree", cardLabel: "Выход из Переноски" }
];

const communityCards = [
  { text: "Получите 100 лапок.", action: "receive", amount: 100 },
  { text: "Получите 120 лапок.", action: "receive", amount: 120 },
  { text: "Получите 50 лапок.", action: "receive", amount: 50 },
  { text: "Получите 20 лапок от каждого игрока.", action: "collectFromEachPlayer", amount: 20 },
  { text: "Все игроки получают по 50 лапок.", action: "allPlayersReceive", amount: 50 },
  { text: "Заплатите 25 лапок.", action: "pay", amount: 25 },
  { text: "Заплатите 40 лапок.", action: "pay", amount: 40 },
  { text: "Заплатите 50 лапок.", action: "pay", amount: 50 },
  { text: "Идите в Переноску.", action: "goToJail" },
  { text: "Пройдите на \"Мяу-стрит\".", action: "moveTo", position: 14 },
  { text: "Выход из Переноски. Сохраните карту.", action: "gainCard", cardKey: "jailFree", cardLabel: "Выход из Переноски" },
  { text: "Нашли 9-ю жизнь. Сохраните карту.", action: "gainCard", cardKey: "nineLives", cardLabel: "9-я жизнь" }
];

class Player {
  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.position = 0;
    this.money = STARTING_MONEY;
    this.properties = [];
    this.inJail = false;
    this.jailTurns = 0;
    this.doubleCount = 0;
    this.bankrupt = false;
    this.cards = {
      jailFree: 0,
      nineLives: 0
    };
  }
}

class MonopolyGame {
  constructor() {
    this.playerCountSelect = document.getElementById("playerCount");
    this.players = this.createPlayers();
    this.currentPlayerIndex = 0;
    this.gameOver = false;
    this.chanceDeck = this.shuffleDeck(chanceCards);
    this.communityDeck = this.shuffleDeck(communityCards);
    this.propertyStates = this.createPropertyStates();
    this.cellElements = new Map();
    this.lastDiceText = "Броска ещё не было";

    this.gameBoard = document.getElementById("gameBoard");
    this.boardCenterInfo = document.getElementById("boardCenterInfo");
    this.currentPlayerName = document.getElementById("currentPlayerName");
    this.currentPlayerStatus = document.getElementById("currentPlayerStatus");
    this.currentPlayerPanel = document.getElementById("playerInfo");
    this.allPlayersPanel = document.getElementById("allPlayers");
    this.currentCellPanel = document.getElementById("currentCell");
    this.diceResult = document.getElementById("diceResult");
    this.gameLog = document.getElementById("gameLog");
    this.rollDiceBtn = document.getElementById("rollDice");
    this.payJailFineBtn = document.getElementById("payJailFine");
    this.useJailCardBtn = document.getElementById("useJailCard");
    this.buildBtn = document.getElementById("buildBtn");
    this.sellBuildingBtn = document.getElementById("sellBuildingBtn");
    this.mortgageBtn = document.getElementById("mortgageBtn");
    this.unmortgageBtn = document.getElementById("unmortgageBtn");
    this.restartBtn = document.getElementById("restartGame");
    this.centerFeedMessages = [];

    this.initBoard();
    this.initPlayers();
    this.bindEvents();
    this.updateUI();
    this.addLog(`Игра началась. Первым ходит ${this.getCurrentPlayer().name}.`);
  }

  createPlayers() {
    const savedCount = Number(window.localStorage.getItem("meow-nopoly-player-count") || "2");
    const selectedValue = Number(this.playerCountSelect?.value || savedCount || 2);
    const count = Number.isInteger(selectedValue) ? Math.max(2, Math.min(6, selectedValue)) : 2;

    if (this.playerCountSelect) {
      this.playerCountSelect.value = String(count);
    }
    window.localStorage.setItem("meow-nopoly-player-count", String(count));

    return Array.from({ length: count }, (_, index) => (
      new Player(index, `Игрок ${index + 1}`, PLAYER_COLORS[index])
    ));
  }

  createPropertyStates() {
    const states = new Map();
    boardCells.forEach((cell) => {
      if (OWNABLE_TYPES.has(cell.type)) {
        states.set(cell.id, {
          ownerId: null,
          mortgaged: false,
          buildingLevel: 0
        });
      }
    });
    return states;
  }

  bindEvents() {
    this.rollDiceBtn.addEventListener("click", () => this.rollDice());
    this.payJailFineBtn.addEventListener("click", () => this.payJailFine());
    this.useJailCardBtn.addEventListener("click", () => this.useJailCard());
    this.buildBtn.addEventListener("click", () => this.handleBuildAction());
    this.sellBuildingBtn.addEventListener("click", () => this.handleSellBuildingAction());
    this.mortgageBtn.addEventListener("click", () => this.handleMortgageAction());
    this.unmortgageBtn.addEventListener("click", () => this.handleUnmortgageAction());
    this.restartBtn.addEventListener("click", () => {
      if (this.playerCountSelect) {
        window.localStorage.setItem("meow-nopoly-player-count", this.playerCountSelect.value);
      }
      window.location.reload();
    });
    this.playerCountSelect?.addEventListener("change", () => {
      window.localStorage.setItem("meow-nopoly-player-count", this.playerCountSelect.value);
    });
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getActivePlayers() {
    return this.players.filter((player) => !player.bankrupt);
  }

  getOtherActivePlayers(player) {
    return this.players.filter((other) => other.id !== player.id && !other.bankrupt);
  }

  shuffleDeck(cards) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i -= 1) {
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
    if (card.action !== "gainCard") {
      this[deckName].push(card);
    }
    return card;
  }

  returnStoredCardToDeck(cardKey) {
    if (cardKey === "jailFree") {
      this.communityDeck.push({ text: "Выход из Переноски. Сохраните карту.", action: "gainCard", cardKey: "jailFree", cardLabel: "Выход из Переноски" });
      return;
    }
    if (cardKey === "nineLives") {
      this.chanceDeck.push({ text: "Нашли 9-ю жизнь. Сохраните карту.", action: "gainCard", cardKey: "nineLives", cardLabel: "9-я жизнь" });
    }
  }

  initBoard() {
    this.gameBoard.innerHTML = "";
    const gridSize = 11;

    for (let row = 0; row < gridSize; row += 1) {
      for (let col = 0; col < gridSize; col += 1) {
        const cell = document.createElement("div");
        cell.className = "cell";
        const cellIndex = this.getCellIndex(row, col);

        if (cellIndex !== null && boardCells[cellIndex]) {
          const cellData = boardCells[cellIndex];
          cell.dataset.id = String(cellIndex);
          cell.classList.add(cellData.type);
          if (cellData.color) {
            cell.classList.add(cellData.color);
          }

          const title = document.createElement("div");
          title.className = "cell-name";
          title.textContent = cellData.name;
          cell.appendChild(title);

          if (cellData.price || cellData.type === "tax") {
            const price = document.createElement("div");
            price.className = "cell-price";
            price.textContent = cellData.type === "tax"
              ? `-${cellData.amount} лапок`
              : `${cellData.price} лапок`;
            cell.appendChild(price);
          }

          const state = document.createElement("div");
          state.className = "cell-state";
          state.id = `cell-state-${cellIndex}`;
          cell.appendChild(state);

          const tokens = document.createElement("div");
          tokens.className = "cell-tokens";
          tokens.id = `cell-tokens-${cellIndex}`;
          cell.appendChild(tokens);

          this.cellElements.set(cellIndex, cell);
        } else {
          cell.classList.add("empty-cell");
        }

        this.gameBoard.appendChild(cell);
      }
    }
  }

  initPlayers() {
    this.players.forEach((player) => {
      const token = document.createElement("div");
      token.className = "player-token";
      token.id = `token-${player.id}`;
      token.style.backgroundColor = player.color;
      token.title = player.name;
      this.getTokenContainer(0).appendChild(token);
    });
  }

  getTokenContainer(cellId) {
    return document.getElementById(`cell-tokens-${cellId}`);
  }

  movePlayerToken(player, cellId) {
    const token = document.getElementById(`token-${player.id}`);
    const target = this.getTokenContainer(cellId);
    if (token && target) {
      target.appendChild(token);
    }
  }

  getCellIndex(row, col) {
    const gridSize = 11;

    if (row === gridSize - 1 && col === gridSize - 1) return 0;
    if (row === gridSize - 1 && col === 0) return 10;
    if (row === 0 && col === 0) return 20;
    if (row === 0 && col === gridSize - 1) return 30;
    if (row === gridSize - 1) return gridSize - 1 - col;
    if (col === 0) return 10 + (gridSize - 1 - row);
    if (row === 0) return 20 + col;
    if (col === gridSize - 1) return 30 + row;
    return null;
  }

  rollTwoDice() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return {
      dice1,
      dice2,
      total: dice1 + dice2,
      isDouble: dice1 === dice2
    };
  }

  setDiceResult(text) {
    this.lastDiceText = text;
    this.diceResult.textContent = text;
  }

  awardStartMoney(player) {
    player.money += 200;
    this.addLog(`${player.name} получает котоплату 200 лапок.`);
  }

  movePlayerBy(player, steps, checkCellAfterMove = true) {
    const nextRaw = player.position + steps;
    const passedStart = steps > 0 && nextRaw >= BOARD_SIZE;
    player.position = ((nextRaw % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
    this.movePlayerToken(player, player.position);
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
    if (passedStart) {
      this.awardStartMoney(player);
    }
    if (checkCellAfterMove) {
      this.checkCell(player);
    }
  }

  rollDice() {
    if (this.gameOver) {
      return;
    }

    const player = this.getCurrentPlayer();
    if (player.bankrupt) {
      return;
    }

    if (player.inJail) {
      this.handleJailRoll(player);
      return;
    }

    const roll = this.rollTwoDice();
    this.setDiceResult(`${player.name}: ${roll.dice1} + ${roll.dice2} = ${roll.total}`);

    if (roll.isDouble) {
      player.doubleCount += 1;
      this.addLog(`${player.name} выбросил дубль ${roll.dice1} и ${roll.dice2}.`);
      if (player.doubleCount >= 3) {
        this.sendPlayerToJail(player, "Три дубля подряд.");
        player.doubleCount = 0;
        this.endTurn();
        return;
      }
    } else {
      player.doubleCount = 0;
      this.addLog(`${player.name} выбросил ${roll.total}.`);
    }

    const passedStart = player.position + roll.total >= BOARD_SIZE;
    player.position = (player.position + roll.total) % BOARD_SIZE;
    this.movePlayerToken(player, player.position);
    if (passedStart) {
      this.awardStartMoney(player);
    }

    this.checkCell(player);
    if (this.gameOver || player.bankrupt) {
      this.updateUI();
      return;
    }

    if (player.inJail) {
      player.doubleCount = 0;
      this.endTurn();
      return;
    }

    if (roll.isDouble) {
      this.addLog(`${player.name} ходит ещё раз.`);
      this.updateUI();
      return;
    }

    this.endTurn();
  }

  handleJailRoll(player) {
    player.jailTurns += 1;
    const roll = this.rollTwoDice();
    this.setDiceResult(`${player.name} в переноске: ${roll.dice1} + ${roll.dice2} = ${roll.total}`);
    this.addLog(`${player.name} бросает на выход из переноски: ${roll.dice1} и ${roll.dice2}.`);

    if (roll.isDouble) {
      player.inJail = false;
      player.jailTurns = 0;
      this.addLog(`${player.name} выходит по дублю и двигается на ${roll.total} клеток.`);
      player.position = (player.position + roll.total) % BOARD_SIZE;
      this.movePlayerToken(player, player.position);
      this.checkCell(player);
      if (!this.gameOver && !player.bankrupt) {
        this.endTurn();
      }
      return;
    }

    if (player.jailTurns >= 3) {
      if (!this.collectPayment(player, 50, null, "обязательный выход из переноски")) {
        this.updateUI();
        return;
      }

      player.inJail = false;
      player.jailTurns = 0;
      this.addLog(`${player.name} после трёх попыток платит 50 и выходит на ${roll.total} клеток.`);
      player.position = (player.position + roll.total) % BOARD_SIZE;
      this.movePlayerToken(player, player.position);
      this.checkCell(player);
      if (!this.gameOver && !player.bankrupt) {
        this.endTurn();
      }
      return;
    }

    this.addLog(`${player.name} остаётся в переноске (${player.jailTurns}/3).`);
    this.endTurn();
  }

  payJailFine() {
    const player = this.getCurrentPlayer();
    if (!player.inJail || this.gameOver) {
      return;
    }

    if (!this.collectPayment(player, 50, null, "выход из переноски")) {
      this.updateUI();
      return;
    }

    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`${player.name} платит 50 лапок и готов ходить.`);
    this.updateUI();
  }

  useJailCard() {
    const player = this.getCurrentPlayer();
    if (!player.inJail || this.gameOver) {
      return;
    }

    if (player.cards.jailFree > 0) {
      player.cards.jailFree -= 1;
      this.returnStoredCardToDeck("jailFree");
      this.addLog(`${player.name} использует карту "Выход из Переноски".`);
    } else if (player.cards.nineLives > 0) {
      player.cards.nineLives -= 1;
      this.returnStoredCardToDeck("nineLives");
      this.addLog(`${player.name} использует карту \"9-я жизнь\".`);
    } else {
      return;
    }

    player.inJail = false;
    player.jailTurns = 0;
    this.updateUI();
  }

  sendPlayerToJail(player, reason = "") {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.movePlayerToken(player, 10);
    this.addLog(`${player.name} отправляется в переноску.${reason ? ` ${reason}` : ""}`);
  }

  checkCell(player) {
    const cell = boardCells[player.position];
    if (!cell) {
      return;
    }

    this.addLog(`${player.name} попал на \"${cell.name}\".`);

    switch (cell.type) {
      case "go":
        this.addLog(`${player.name} остановился на Котоплате.`);
        break;
      case "tax":
        this.collectPayment(player, cell.amount, null, cell.name);
        break;
      case "free_space":
        this.addLog(`${player.name} отдыхает в картонной коробке.`);
        break;
      case "jail":
        this.addLog(`${player.name} просто посетил переноску.`);
        break;
      case "go_to_jail":
        this.sendPlayerToJail(player, "Без котоплаты за проход.");
        break;
      case "chance":
        this.resolveCardDraw(player, "chance");
        break;
      case "community":
        this.resolveCardDraw(player, "community");
        break;
      case "property":
      case "railroad":
      case "utility":
        this.resolveOwnableCell(player, cell);
        break;
      default:
        break;
    }

    this.updateUI();
  }

  resolveOwnableCell(player, cell) {
    const state = this.propertyStates.get(cell.id);
    const owner = this.getPlayerById(state.ownerId);

    if (!owner) {
      this.offerPropertyPurchase(player, cell);
      return;
    }

    if (owner.id === player.id) {
      this.addLog(`${player.name} уже владеет этой клеткой.`);
      return;
    }

    if (state.mortgaged) {
      this.addLog(`Клетка "${cell.name}" заложена, рента не платится.`);
      return;
    }

    let rent = 0;
    if (cell.type === "property") {
      rent = this.calculatePropertyRent(cell, owner);
    } else if (cell.type === "railroad") {
      rent = this.calculateRailroadRent(owner, cell);
    } else if (cell.type === "utility") {
      rent = this.calculateUtilityRent(player, owner, cell);
    }

    if (rent <= 0) {
      return;
    }

    const paid = this.collectPayment(player, rent, owner, `рента за \"${cell.name}\"`);
    if (paid) {
      this.addLog(`${player.name} платит ${paid} лапок игроку ${owner.name}.`);
    }
  }

  offerPropertyPurchase(player, cell) {
    const wantsToBuy = window.confirm(`${player.name}, купить "${cell.name}" за ${cell.price} лапок?\nЕсли отказаться, начнётся аукцион.`);
    if (wantsToBuy && player.money >= cell.price) {
      player.money -= cell.price;
      this.transferProperty(cell.id, player.id);
      this.addLog(`${player.name} покупает \"${cell.name}\" за ${cell.price} лапок.`);
      return;
    }

    if (wantsToBuy && player.money < cell.price) {
      this.addLog(`${player.name} не хватает лапок на прямую покупку \"${cell.name}\".`);
    } else {
      this.addLog(`${player.name} отказывается от покупки \"${cell.name}\".`);
    }

    this.runAuction(cell);
  }

  runAuction(cell) {
    const bidders = this.getActivePlayers();
    let highestBid = 0;
    let highestBidder = null;

    this.addLog(`Банк запускает аукцион за "${cell.name}".`);

    bidders.forEach((bidder) => {
      const raw = window.prompt(`Аукцион за "${cell.name}".\n${bidder.name}, ваша ставка? Оставьте пусто, чтобы пропустить.\nМинимум: ${highestBid + 1}`);
      if (raw === null || raw.trim() === "") {
        this.addLog(`${bidder.name} пропускает аукцион.`);
        return;
      }

      const bid = Number(raw);
      if (!Number.isFinite(bid) || bid <= highestBid || bid > bidder.money) {
        this.addLog(`${bidder.name} сделал недействительную ставку.`);
        return;
      }

      highestBid = bid;
      highestBidder = bidder;
      this.addLog(`${bidder.name} лидирует со ставкой ${bid} лапок.`);
    });

    if (!highestBidder) {
      this.addLog(`На "${cell.name}" никто не сделал ставку. Клетка остаётся свободной.`);
      return;
    }

    highestBidder.money -= highestBid;
    this.transferProperty(cell.id, highestBidder.id);
    this.addLog(`${highestBidder.name} выигрывает аукцион за \"${cell.name}\" за ${highestBid} лапок.`);
  }

  transferProperty(cellId, newOwnerId) {
    const state = this.propertyStates.get(cellId);
    if (!state) {
      return;
    }

    const previousOwner = this.getPlayerById(state.ownerId);
    if (previousOwner) {
      previousOwner.properties = previousOwner.properties.filter((id) => id !== cellId);
    }

    state.ownerId = newOwnerId;
    state.mortgaged = false;
    const newOwner = this.getPlayerById(newOwnerId);
    if (newOwner && !newOwner.properties.includes(cellId)) {
      newOwner.properties.push(cellId);
    }
  }

  getPlayerById(id) {
    return this.players.find((player) => player.id === id) || null;
  }

  getPropertyState(cellId) {
    return this.propertyStates.get(cellId);
  }

  getColorGroupCells(color) {
    return boardCells.filter((cell) => cell.color === color);
  }

  playerOwnsFullColorGroup(player, color) {
    const group = this.getColorGroupCells(color);
    return group.length > 0 && group.every((cell) => this.getPropertyState(cell.id)?.ownerId === player.id);
  }

  groupHasMortgagedProperty(color) {
    return this.getColorGroupCells(color).some((cell) => this.getPropertyState(cell.id)?.mortgaged);
  }

  calculatePropertyRent(cell, owner) {
    const state = this.getPropertyState(cell.id);
    const level = state.buildingLevel;
    if (level >= 1 && level <= 4) {
      return cell.houses[level - 1];
    }
    if (level === 5) {
      return cell.hotel;
    }
    if (this.playerOwnsFullColorGroup(owner, cell.color) && !this.groupHasMortgagedProperty(cell.color)) {
      return cell.colorRent;
    }
    return cell.baseRent;
  }

  calculateRailroadRent(owner, cell) {
    const count = owner.properties.filter((id) => boardCells[id]?.type === "railroad").length;
    return cell.rents[Math.max(0, Math.min(count - 1, cell.rents.length - 1))];
  }

  calculateUtilityRent(visitor, owner) {
    const utilityCount = owner.properties.filter((id) => boardCells[id]?.type === "utility").length;
    const multiplier = utilityCount >= 2 ? 10 : 4;
    let total = 0;
    let rolls = 0;
    let keepRolling = true;

    while (keepRolling && rolls < 3) {
      const roll = this.rollTwoDice();
      total += roll.total;
      rolls += 1;
      keepRolling = roll.isDouble;
      this.addLog(`${visitor.name} для коммуналки бросает ${roll.dice1} и ${roll.dice2}.`);
      if (!roll.isDouble) {
        break;
      }
    }

    const rent = total * multiplier;
    this.addLog(`Коммунальная рента: ${total} x ${multiplier} = ${rent}.`);
    return rent;
  }

  resolveCardDraw(player, type) {
    const card = this.drawDeckCard(type);
    this.addLog(`${player.name} тянет карточку: ${card.text}`);
    this.applyCardEffect(player, card);
  }

  applyCardEffect(player, card) {
    switch (card.action) {
      case "receive":
        player.money += card.amount;
        this.addLog(`${player.name} получает ${card.amount} лапок.`);
        break;
      case "pay":
        this.collectPayment(player, card.amount, null, "карточка");
        break;
      case "collectFromEachPlayer":
        this.getOtherActivePlayers(player).forEach((otherPlayer) => {
          this.collectPayment(otherPlayer, card.amount, player, `платёж по карточке для ${player.name}`);
        });
        break;
      case "allPlayersReceive":
        this.getActivePlayers().forEach((activePlayer) => {
          activePlayer.money += card.amount;
        });
        this.addLog(`Все активные игроки получают по ${card.amount} лапок.`);
        break;
      case "moveRelative":
        this.movePlayerBy(player, card.steps);
        break;
      case "moveTo":
        this.movePlayerTo(player, card.position);
        break;
      case "goToJail":
        this.sendPlayerToJail(player);
        break;
      case "moveToNearestRailroad":
        this.moveToNearestRailroadFromCard(player, card.doubleRent);
        break;
      case "gainCard":
        player.cards[card.cardKey] = (player.cards[card.cardKey] || 0) + 1;
        this.addLog(`${player.name} сохраняет карту \"${card.cardLabel}\".`);
        break;
      default:
        break;
    }
  }

  getNextRailroadPosition(position) {
    const railroads = boardCells.filter((cell) => cell.type === "railroad").map((cell) => cell.id).sort((a, b) => a - b);
    return railroads.find((id) => id > position) ?? railroads[0];
  }

  moveToNearestRailroadFromCard(player, doubleRent) {
    const destination = this.getNextRailroadPosition(player.position);
    const passedStart = destination < player.position;
    player.position = destination;
    this.movePlayerToken(player, destination);
    if (passedStart) {
      this.awardStartMoney(player);
    }

    const cell = boardCells[destination];
    const state = this.getPropertyState(destination);
    const owner = this.getPlayerById(state.ownerId);
    this.addLog(`${player.name} перемещается на \"${cell.name}\".`);

    if (!owner) {
      this.offerPropertyPurchase(player, cell);
      return;
    }

    if (owner.id === player.id || state.mortgaged) {
      return;
    }

    const rent = this.calculateRailroadRent(owner, cell) * (doubleRent ? 2 : 1);
    const paid = this.collectPayment(player, rent, owner, `двойная рента за \"${cell.name}\"`);
    if (paid) {
      this.addLog(`${player.name} платит ${paid} лапок за железную дорогу.`);
    }
  }

  collectPayment(player, amount, recipient = null, reason = "платёж") {
    if (amount <= 0 || player.bankrupt) {
      return 0;
    }

    if (!this.ensureFunds(player, amount)) {
      this.handleBankruptcy(player, recipient, reason);
      return 0;
    }

    player.money -= amount;
    if (recipient) {
      recipient.money += amount;
    }
    this.addLog(`${player.name} платит ${amount} лапок${recipient ? ` игроку ${recipient.name}` : " банку"} (${reason}).`);
    return amount;
  }

  ensureFunds(player, amountNeeded) {
    while (player.money < amountNeeded) {
      if (this.autoSellOneBuilding(player)) {
        continue;
      }
      if (this.autoMortgageOneProperty(player)) {
        continue;
      }
      return false;
    }
    return true;
  }

  autoSellOneBuilding(player) {
    const candidates = player.properties
      .map((id) => boardCells[id])
      .filter((cell) => cell && cell.type === "property" && this.canSellBuildingOnCell(player, cell.id))
      .sort((a, b) => b.houseCost - a.houseCost);

    if (candidates.length === 0) {
      return false;
    }

    const cell = candidates[0];
    const state = this.getPropertyState(cell.id);
    state.buildingLevel -= 1;
    player.money += Math.floor(cell.houseCost / 2);
    this.addLog(`${player.name} автоматически продаёт улучшение на \"${cell.name}\" за ${Math.floor(cell.houseCost / 2)} лапок.`);
    return true;
  }

  autoMortgageOneProperty(player) {
    const candidates = player.properties
      .map((id) => boardCells[id])
      .filter((cell) => cell && this.canMortgageCell(player, cell.id))
      .sort((a, b) => b.mortgage - a.mortgage);

    if (candidates.length === 0) {
      return false;
    }

    const cell = candidates[0];
    const state = this.getPropertyState(cell.id);
    state.mortgaged = true;
    player.money += cell.mortgage;
    this.addLog(`${player.name} автоматически закладывает \"${cell.name}\" за ${cell.mortgage} лапок.`);
    return true;
  }

  canBuildOnCell(player, cellId) {
    const cell = boardCells[cellId];
    const state = this.getPropertyState(cellId);
    if (!cell || cell.type !== "property" || state.ownerId !== player.id || state.mortgaged) {
      return false;
    }
    if (!this.playerOwnsFullColorGroup(player, cell.color) || this.groupHasMortgagedProperty(cell.color)) {
      return false;
    }

    const group = this.getColorGroupCells(cell.color);
    const levels = group.map((groupCell) => this.getPropertyState(groupCell.id).buildingLevel);
    const ownLevel = state.buildingLevel;
    const minLevel = Math.min(...levels);

    if (ownLevel !== minLevel || ownLevel >= 5) {
      return false;
    }

    if (ownLevel < 4) {
      return this.getCurrentHouseCount() < MAX_HOUSES;
    }
    return this.getCurrentHotelCount() < MAX_HOTELS;
  }

  canSellBuildingOnCell(player, cellId) {
    const cell = boardCells[cellId];
    const state = this.getPropertyState(cellId);
    if (!cell || cell.type !== "property" || state.ownerId !== player.id || state.buildingLevel <= 0) {
      return false;
    }

    const group = this.getColorGroupCells(cell.color);
    const levels = group.map((groupCell) => this.getPropertyState(groupCell.id).buildingLevel);
    const maxLevel = Math.max(...levels);
    return state.buildingLevel === maxLevel;
  }

  canMortgageCell(player, cellId) {
    const cell = boardCells[cellId];
    const state = this.getPropertyState(cellId);
    if (!cell || state.ownerId !== player.id || state.mortgaged) {
      return false;
    }

    if (cell.type === "property") {
      const group = this.getColorGroupCells(cell.color);
      return group.every((groupCell) => this.getPropertyState(groupCell.id).buildingLevel === 0);
    }

    return true;
  }

  getCurrentHouseCount() {
    let count = 0;
    this.propertyStates.forEach((state) => {
      if (state.buildingLevel >= 1 && state.buildingLevel <= 4) {
        count += state.buildingLevel;
      }
    });
    return count;
  }

  getCurrentHotelCount() {
    let count = 0;
    this.propertyStates.forEach((state) => {
      if (state.buildingLevel === 5) {
        count += 1;
      }
    });
    return count;
  }

  handleBuildAction() {
    const player = this.getCurrentPlayer();
    const options = player.properties.filter((id) => this.canBuildOnCell(player, id));
    if (!options.length) {
      return;
    }

    const choice = this.promptPropertyChoice("Выберите клетку для строительства", options);
    if (choice === null) {
      return;
    }

    const cell = boardCells[choice];
    if (player.money < cell.houseCost) {
      window.alert("Не хватает лапок на строительство.");
      return;
    }

    player.money -= cell.houseCost;
    this.getPropertyState(choice).buildingLevel += 1;
    this.addLog(`${player.name} улучшает \"${cell.name}\" за ${cell.houseCost} лапок.`);
    this.updateUI();
  }

  handleSellBuildingAction() {
    const player = this.getCurrentPlayer();
    const options = player.properties.filter((id) => this.canSellBuildingOnCell(player, id));
    if (!options.length) {
      return;
    }

    const choice = this.promptPropertyChoice("Выберите клетку для продажи улучшения", options);
    if (choice === null) {
      return;
    }

    const cell = boardCells[choice];
    this.getPropertyState(choice).buildingLevel -= 1;
    const refund = Math.floor(cell.houseCost / 2);
    player.money += refund;
    this.addLog(`${player.name} продаёт улучшение на \"${cell.name}\" за ${refund} лапок.`);
    this.updateUI();
  }

  handleMortgageAction() {
    const player = this.getCurrentPlayer();
    const options = player.properties.filter((id) => this.canMortgageCell(player, id));
    if (!options.length) {
      return;
    }

    const choice = this.promptPropertyChoice("Выберите клетку для залога", options);
    if (choice === null) {
      return;
    }

    const cell = boardCells[choice];
    this.getPropertyState(choice).mortgaged = true;
    player.money += cell.mortgage;
    this.addLog(`${player.name} закладывает \"${cell.name}\" за ${cell.mortgage} лапок.`);
    this.updateUI();
  }

  handleUnmortgageAction() {
    const player = this.getCurrentPlayer();
    const options = player.properties.filter((id) => {
      const state = this.getPropertyState(id);
      return state?.mortgaged && player.money >= boardCells[id].mortgageCost;
    });
    if (!options.length) {
      return;
    }

    const choice = this.promptPropertyChoice("Выберите клетку для выкупа из залога", options);
    if (choice === null) {
      return;
    }

    const cell = boardCells[choice];
    player.money -= cell.mortgageCost;
    this.getPropertyState(choice).mortgaged = false;
    this.addLog(`${player.name} выкупает \"${cell.name}\" за ${cell.mortgageCost} лапок.`);
    this.updateUI();
  }

  promptPropertyChoice(title, propertyIds) {
    const lines = propertyIds.map((id, index) => {
      const cell = boardCells[id];
      return `${index + 1}. ${cell.name}`;
    });
    const raw = window.prompt(`${title}:\n${lines.join("\n")}`);
    if (raw === null || raw.trim() === "") {
      return null;
    }

    const index = Number(raw) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= propertyIds.length) {
      window.alert("Неверный выбор.");
      return null;
    }

    return propertyIds[index];
  }

  handleBankruptcy(player, recipient, reason) {
    if (player.bankrupt) {
      return;
    }

    this.addLog(`${player.name} банкротится (${reason}).`);
    if (recipient && !recipient.bankrupt) {
      recipient.money += Math.max(player.money, 0);
      recipient.cards.jailFree += player.cards.jailFree;
      recipient.cards.nineLives += player.cards.nineLives;

      player.properties.forEach((propertyId) => {
        const state = this.getPropertyState(propertyId);
        if (state) {
          state.buildingLevel = 0;
          state.ownerId = recipient.id;
          if (!recipient.properties.includes(propertyId)) {
            recipient.properties.push(propertyId);
          }
        }
      });
    } else {
      player.properties.forEach((propertyId) => {
        const state = this.getPropertyState(propertyId);
        if (state) {
          state.ownerId = null;
          state.mortgaged = false;
          state.buildingLevel = 0;
        }
      });
    }

    player.money = 0;
    player.properties = [];
    player.cards.jailFree = 0;
    player.cards.nineLives = 0;
    player.bankrupt = true;
    player.inJail = false;
    player.jailTurns = 0;
    player.doubleCount = 0;

    const token = document.getElementById(`token-${player.id}`);
    if (token) {
      token.classList.add("bankrupt-token");
    }

    this.checkForWinner();
    if (!this.gameOver && player.id === this.currentPlayerIndex) {
      this.endTurn();
    }
  }

  checkForWinner() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.gameOver = true;
      this.addLog(`Побеждает ${activePlayers[0].name}.`);
    }
  }

  endTurn() {
    if (this.gameOver) {
      this.updateUI();
      return;
    }

    let nextIndex = this.currentPlayerIndex;
    do {
      nextIndex = (nextIndex + 1) % this.players.length;
    } while (this.players[nextIndex].bankrupt);

    this.currentPlayerIndex = nextIndex;
    this.addLog(`Ход переходит к ${this.getCurrentPlayer().name}.`);
    this.updateUI();
  }

  getCardInventory(player) {
    const labels = {
      jailFree: "Выход из Переноски",
      nineLives: "9-я жизнь"
    };
    return Object.entries(player.cards)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${labels[key]} x${count}`);
  }

  describeBuildings(cellId) {
    const state = this.getPropertyState(cellId);
    if (!state || state.buildingLevel === 0) {
      return "без улучшений";
    }
    if (state.buildingLevel === 5) {
      return "лежанка";
    }
    return `${state.buildingLevel} когтет.`;
  }

  renderCurrentPlayerPanel(player) {
    const cards = this.getCardInventory(player);
    const properties = player.properties.map((id) => {
      const cell = boardCells[id];
      const state = this.getPropertyState(id);
      const parts = [cell.name];
      if (state.mortgaged) {
        parts.push("залог");
      }
      if (cell.type === "property") {
        parts.push(this.describeBuildings(id));
      }
      return `<div class="property-line">${parts.join(" • ")}</div>`;
    }).join("") || '<div class="property-line muted">Нет собственности</div>';

    this.currentPlayerPanel.innerHTML = `
      <div class="player-money">${player.money} лапок</div>
      <div class="section-title">Собственность</div>
      ${properties}
      <div class="section-title">Карты</div>
      ${cards.length ? cards.map((card) => `<div class="property-line">${card}</div>`).join("") : '<div class="property-line muted">Нет карт</div>'}
    `;
  }

  renderAllPlayersPanel() {
    const rankedPlayers = [...this.players].sort((left, right) => {
      if (left.bankrupt !== right.bankrupt) {
        return left.bankrupt ? 1 : -1;
      }
      return this.getPlayerNetWorth(right) - this.getPlayerNetWorth(left);
    });

    this.allPlayersPanel.innerHTML = rankedPlayers.map((player, index) => {
      const status = [];
      if (player.bankrupt) status.push("банкрот");
      if (player.inJail) status.push(`в переноске ${player.jailTurns}/3`);
      if (!status.length) status.push("в игре");
      const netWorth = this.getPlayerNetWorth(player);
      return `
        <div class="player-summary ${player.id === this.currentPlayerIndex ? "active" : ""} ${player.bankrupt ? "bankrupt" : ""}">
          <div class="player-summary-head">
            <span class="player-rank">#${index + 1}</span>
            <span class="player-dot" style="background:${player.color}"></span>
            <strong>${player.name}</strong>
          </div>
          <div>${player.money} лапок</div>
          <div>Капитал: ${netWorth}</div>
          <div>${status.join(" • ")}</div>
          <div>Собственность: ${player.properties.length}</div>
        </div>
      `;
    }).join("");
  }

  getPlayerNetWorth(player) {
    let total = player.money;
    player.properties.forEach((id) => {
      const cell = boardCells[id];
      const state = this.getPropertyState(id);
      if (!cell || !state) {
        return;
      }

      total += state.mortgaged ? cell.mortgage : cell.price;
      if (cell.type === "property" && state.buildingLevel > 0) {
        const buildingCount = state.buildingLevel === 5 ? 5 : state.buildingLevel;
        total += buildingCount * cell.houseCost;
      }
    });
    return total;
  }

  renderCurrentCell(player) {
    const cell = boardCells[player.position];
    const state = this.getPropertyState(player.position);
    const parts = [`<strong>${cell.name}</strong>`, `<div>${cell.type}</div>`];

    if (cell.price) {
      parts.push(`<div>Цена: ${cell.price}</div>`);
    }
    if (cell.type === "property") {
      parts.push(`<div>Рента: ${cell.baseRent} / комплект ${cell.colorRent}</div>`);
      parts.push(`<div>Улучшения: ${this.describeBuildings(cell.id)}</div>`);
    }
    if (state) {
      const owner = this.getPlayerById(state.ownerId);
      parts.push(`<div>Владелец: ${owner ? owner.name : "банк"}</div>`);
      if (state.mortgaged) {
        parts.push("<div>Статус: в залоге</div>");
      }
    }

    this.currentCellPanel.innerHTML = parts.join("");
  }

  updateBoardStates() {
    boardCells.forEach((cell) => {
      const stateEl = document.getElementById(`cell-state-${cell.id}`);
      const cellEl = this.cellElements.get(cell.id);
      if (!stateEl || !cellEl) {
        return;
      }

      for (let ownerIndex = 0; ownerIndex < 6; ownerIndex += 1) {
        cellEl.classList.remove(`owner-${ownerIndex}`);
      }
      cellEl.classList.remove("mortgaged-cell");
      if (!OWNABLE_TYPES.has(cell.type)) {
        stateEl.textContent = "";
        return;
      }

      const state = this.getPropertyState(cell.id);
      const owner = this.getPlayerById(state.ownerId);
      const bits = [];
      if (owner) {
        bits.push(`И${owner.id + 1}`);
        cellEl.classList.add(`owner-${owner.id}`);
      }
      if (state.mortgaged) {
        bits.push("залог");
        cellEl.classList.add("mortgaged-cell");
      }
      if (cell.type === "property") {
        if (state.buildingLevel >= 1 && state.buildingLevel <= 4) {
          bits.push(`${state.buildingLevel}К`);
        } else if (state.buildingLevel === 5) {
          bits.push("Л");
        }
      }
      stateEl.textContent = bits.join(" • ");
    });
  }

  updateButtons(player) {
    const hasJailCard = player.cards.jailFree > 0 || player.cards.nineLives > 0;
    const canBuild = player.properties.some((id) => this.canBuildOnCell(player, id));
    const canSell = player.properties.some((id) => this.canSellBuildingOnCell(player, id));
    const canMortgage = player.properties.some((id) => this.canMortgageCell(player, id));
    const canUnmortgage = player.properties.some((id) => {
      const state = this.getPropertyState(id);
      return state?.mortgaged && player.money >= boardCells[id].mortgageCost;
    });

    this.rollDiceBtn.disabled = this.gameOver || player.bankrupt;
    this.payJailFineBtn.disabled = this.gameOver || !player.inJail;
    this.useJailCardBtn.disabled = this.gameOver || !player.inJail || !hasJailCard;
    this.buildBtn.disabled = this.gameOver || player.inJail || !canBuild;
    this.sellBuildingBtn.disabled = this.gameOver || !canSell;
    this.mortgageBtn.disabled = this.gameOver || !canMortgage;
    this.unmortgageBtn.disabled = this.gameOver || !canUnmortgage;
  }

  updateUI() {
    const player = this.getCurrentPlayer();
    this.currentPlayerName.textContent = player.name;

    const status = [];
    const room = getActiveRoom();
    const roomBrief = document.getElementById("roomBrief");
    if (room?.id) {
      status.push(`Комната #${room.id}`);
      if (roomBrief) {
        roomBrief.textContent = `Комната #${room.id} • Хост: ${room.hostName || "Игрок"}`;
      }
    } else if (roomBrief) {
      roomBrief.textContent = "Комната не выбрана";
    }
    if (this.gameOver) {
      status.push("Игра завершена");
    }
    status.push(`Игроков в комнате: ${this.players.length}`);
    if (player.inJail) {
      status.push(`Переноска ${player.jailTurns}/3`);
    }
    status.push(`Домов на поле: ${this.getCurrentHouseCount()}/${MAX_HOUSES}`);
    status.push(`Лежанок: ${this.getCurrentHotelCount()}/${MAX_HOTELS}`);
    this.currentPlayerStatus.textContent = status.join(" • ");

    this.renderCurrentPlayerPanel(player);
    this.renderAllPlayersPanel();
    this.renderCurrentCell(player);
    this.updateBoardStates();
    this.updateButtons(player);
    this.diceResult.textContent = this.lastDiceText;
  }

  addLog(message) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = message;
    this.gameLog.appendChild(entry);
    this.gameLog.scrollTop = this.gameLog.scrollHeight;

    if (this.boardCenterInfo) {
      this.centerFeedMessages.unshift(message);
      this.centerFeedMessages = this.centerFeedMessages.slice(0, 8);
      this.boardCenterInfo.innerHTML = this.centerFeedMessages
        .map((item) => `<div class="board-center-entry">${item}</div>`)
        .join("");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  mountRoomMenu();
  new MonopolyGame();
});
