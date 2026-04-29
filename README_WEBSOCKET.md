# WebSocket сервер для Мяу-нополии

## Установка зависимостей

```bash
pip install -r requirements.txt
```

## Запуск сервера

```bash
python websocket_server.py
```

Сервер запустится на `ws://localhost:8765`

## API сервера

### Создание игры

```javascript
{
    "type": "create_game",
    "player": {
        "name": "Игрок 1",
        "color": "#ef4444"
    }
}
```

**Ответ:**
```javascript
{
    "type": "game_created",
    "game_id": "abc12345",
    "player_id": 0,
    "game_state": {...}
}
```

### Присоединение к игре

```javascript
{
    "type": "join_game",
    "game_id": "abc12345",
    "player": {
        "name": "Игрок 2",
        "color": "#3b82f6"
    }
}
```

**Ответ:**
```javascript
{
    "type": "joined_game",
    "game_id": "abc12345",
    "player_id": 1,
    "game_state": {...}
}
```

### Начало игры

```javascript
{
    "type": "start_game"
}
```

### Бросок кубиков

```javascript
{
    "type": "roll_dice"
}
```

### Покупка недвижимости

```javascript
{
    "type": "buy_property",
    "property_id": 1
}
```

### Следующий ход

```javascript
{
    "type": "next_turn"
}
```

### Список доступных игр

```javascript
{
    "type": "get_games"
}
```

**Ответ:**
```javascript
{
    "type": "games_list",
    "games": [
        {
            "game_id": "abc12345",
            "players_count": 1,
            "game_started": false
        }
    ]
}
```

## Типы сообщений от сервера

- `game_created` - игра создана
- `joined_game` - игрок присоединился
- `player_joined` - новый игрок присоединился к игре
- `player_disconnected` - игрок отключился
- `game_started` - игра началась
- `dice_rolled` - бросок кубиков
- `property_bought` - недвижимость куплена
- `turn_changed` - смена хода
- `game_state` - текущее состояние игры
- `games_list` - список игр
- `error` - ошибка

## Формат состояния игры

```javascript
{
    "type": "game_state",
    "game_id": "abc12345",
    "players": [
        {
            "id": 0,
            "name": "Игрок 1",
            "color": "#ef4444",
            "money": 1500,
            "position": 0,
            "properties": [1, 3],
            "in_jail": false,
            "jail_turns": 0,
            "connected": true
        }
    ],
    "current_player": 0,
    "board": [...],
    "game_started": true,
    "dice_result": {
        "dice1": 3,
        "dice2": 5,
        "total": 8
    },
    "last_action": {...}
}
```

## Особенности

- До 4 игроков в одной игре
- Автоматическая очистка игр, когда все игроки отключились
- Синхронизация состояния игры в реальном времени
- Обработка отключений игроков
- Уникальные идентификаторы игр
