# Установка Node.js x64 на Windows ARM64

## Проблема
На Windows ARM64 по умолчанию устанавливается ARM64 версия Node.js, которая несовместима с Prisma engine.

## Решение

### Шаг 1: Скачайте Node.js x64 вручную

1. Перейдите на https://nodejs.org/
2. Скачайте **LTS версию для Windows x64** (не ARM64!)
3. Убедитесь, что файл называется `node-vXX.X.X-x64.msi` (должно быть `-x64`, а не `-arm64`)

### Шаг 2: Установите Node.js x64

1. Запустите скачанный `.msi` файл
2. **ВАЖНО**: Выберите опцию "Custom install" если она есть
3. Убедитесь, что устанавливается x64 версия
4. Завершите установку

### Шаг 3: Проверьте установку

Откройте **новый** PowerShell/терминал и выполните:

```powershell
node -p "process.arch"
```

Должно вывести `x64`, а не `arm64`.

### Шаг 4: Переустановите зависимости

```powershell
cd backend
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npm install
npx prisma generate
```

### Шаг 5: Запустите приложение

```powershell
npm run start:dev
```

## Альтернативное решение: Использование nvm-windows

1. Установите nvm-windows: https://github.com/coreybutler/nvm-windows/releases
2. Установите x64 версию через nvm:
   ```powershell
   nvm install 20.18.1 64
   nvm use 20.18.1
   ```
3. Проверьте: `node -p "process.arch"` должно вывести `x64`

## Проверка успешной установки

После установки Node.js x64:
- `node -p "process.arch"` → должно быть `x64`
- Prisma Client должен генерироваться без ошибок
- Приложение должно запускаться и работать с Prisma

