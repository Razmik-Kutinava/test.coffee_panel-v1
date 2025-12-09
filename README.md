# ☕ Coffee Panel v1.0

**Admin Hub** для управления сетью кофеен с real-time функциями для баристов и TV-бордами.

---

## 🎯 Возможности

### 🖥️ **Admin Hub (Web)**
- 📊 **Dashboard** - статистика продаж, заказов, пользователей
- 🛍️ **Каталог** - управление категориями, товарами, модификаторами
- 📍 **Точки** - управление локациями кофеен
- 📦 **Заказы** - просмотр и управление всеми заказами
- 👥 **Клиенты** - база пользователей и статистика
- 🎁 **Маркетинг** - промокоды, рассылки
- 👨‍💼 **Персонал** - управление сотрудниками

### ☕ **Barista Dashboard (Web)**
- Real-time отображение активных заказов
- Управление статусами заказов
- Управление складом товаров
- WebSocket для мгновенных обновлений

### 📺 **TV-Board (Web)**
- Публичный экран для клиентов
- Отображение готовящихся и готовых заказов
- Анимации и звуковые уведомления
- Real-time обновления

---

## 🚀 Tech Stack

- **Backend:** NestJS + Prisma ORM + PostgreSQL (Supabase)
- **Frontend:** Solid.js + TypeScript
- **Real-time:** Socket.io (WebSocket)
- **Deployment:** Vercel (Frontend) + Railway (Backend)

---

## 🛠️ Локальная разработка

### Требования
- Node.js 24.x
- PostgreSQL (или Supabase)
- PowerShell (для Windows)

### Быстрый старт

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/Razmik-Kutinava/test.coffee_panel-v1.git
cd test.coffee_panel-v1
```

2. **Настройте переменные окружения:**
```bash
# Backend
cd backend
cp .env.example .env
# Отредактируйте .env (DATABASE_URL, SUPABASE_URL и т.д.)
cd ..
```

3. **Запустите проект:**
```powershell
# Windows PowerShell
.\RELIABLE-START.ps1
```

Или вручную:
```bash
# Terminal 1 - Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

4. **Откройте в браузере:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 📦 Deployment

### Быстрый деплой:

1. **Backend → Railway** (или Render)
   - Подключите GitHub репозиторий
   - Настройте переменные окружения (`DATABASE_URL`, `PORT`)
   - Deploy автоматически

2. **Frontend → Vercel**
   - Подключите GitHub репозиторий
   - Добавьте `VITE_API_URL` в Environment Variables
   - Deploy автоматически

**Подробная инструкция:** см. [`DEPLOYMENT.md`](./DEPLOYMENT.md) и [`VERCEL_SETUP.md`](./VERCEL_SETUP.md)

---

## 📚 Документация

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Полное руководство по деплою
- [`VERCEL_SETUP.md`](./VERCEL_SETUP.md) - Настройка Vercel
- [`docs/QUICKSTART.md`](./docs/QUICKSTART.md) - Быстрый старт разработки
- [`docs/specs/PRD_MASTER.md`](./docs/specs/PRD_MASTER.md) - Полная спецификация проекта

---

## 🏗️ Структура проекта

```
test.coffee_panel-v1/
├── backend/              # NestJS API + WebSocket
│   ├── src/
│   │   ├── barista/     # Barista Dashboard API
│   │   ├── tv-board/    # TV-Board API
│   │   ├── websocket/   # WebSocket Gateway
│   │   ├── categories/  # CRUD Categories
│   │   ├── products/    # CRUD Products
│   │   ├── orders/      # CRUD Orders
│   │   ├── locations/   # CRUD Locations
│   │   ├── users/       # CRUD Users
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/             # Solid.js Admin Hub
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Catalog.tsx
│   │   │   ├── Barista.tsx      # Barista Dashboard
│   │   │   ├── TVBoard.tsx      # TV-Board
│   │   │   └── ...
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
│
├── docs/                 # Документация
├── vercel.json          # Vercel config
├── .vercelignore        # Vercel ignore
├── DEPLOYMENT.md        # Deployment guide
└── README.md            # Этот файл
```

---

## 🎨 Скриншоты

### Admin Hub - Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Barista Dashboard
![Barista](https://via.placeholder.com/800x400?text=Barista+Dashboard+Screenshot)

### TV-Board
![TVBoard](https://via.placeholder.com/800x400?text=TV-Board+Screenshot)

---

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'feat: add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📝 License

MIT License - см. [LICENSE](./LICENSE)

---

## 👤 Author

**Razmik Giurdzhian**  
GitHub: [@Razmik-Kutinava](https://github.com/Razmik-Kutinava)

---

## 🔗 Links

- **Production Frontend:** https://test-coffee-panel-v1.vercel.app
- **Production Backend:** (будет после деплоя на Railway)
- **GitHub:** https://github.com/Razmik-Kutinava/test.coffee_panel-v1

---

## ⚠️ Важные замечания

- 🤖 **Telegram Bot** - в разработке (отдельно)
- 📱 **Client App (Flutter)** - в разработке (отдельно)
- 💳 **Payments** - интеграция запланирована для v2.0

**Admin Hub полностью функционален и готов к продакшену!** 🎉
