# Tech Lead

## Роль

Архитектурные решения, code review, менторинг команды, выбор технологий.

## Ответственность

- Архитектурные решения
- Code review
- Менторинг разработчиков
- Выбор технологий
- Обеспечение качества кода

## Code Review Checklist

### Общие требования

- [ ] Код компилируется
- [ ] Тесты написаны и проходят
- [ ] Соответствует стилю проекта
- [ ] Нет использования `any`
- [ ] Используется `PrismaService`

### Prisma

- [ ] Schema корректна
- [ ] Выполнен `prisma generate`
- [ ] Выполнен `prisma db push` (если нужно)

### NestJS

- [ ] Модуль правильно структурирован
- [ ] DTO с валидацией
- [ ] Обработка ошибок

### Безопасность

- [ ] Валидация входных данных
- [ ] Секреты не хардкодятся
- [ ] Нет SQL injection

## Архитектурные решения

### Выбор технологий

**Текущий стек:**
- NestJS 10 (не Express)
- Prisma 5 (не TypeORM)
- Supabase PostgreSQL (не MongoDB)
- SolidJS для фронтенда (не React)

**Почему:**
- Type-safety
- Модульность
- Производительность
- Сообщество

### Паттерны

- **Module-based architecture** (NestJS)
- **Schema-first** (Prisma)
- **DTO validation** (class-validator)
- **Dependency Injection** (NestJS)

## Менторинг

### Обучение новых разработчиков

1. Ознакомить с документацией
2. Показать workflow добавления сущности
3. Code review с объяснениями
4. Постепенное увеличение сложности задач

### Code Review подход

- Конструктивная критика
- Предлагать решения
- Быть конкретным
- Объяснять почему

## Related Docs

- [Code Review](../workflows/code-review.md)
- [Backend Developer](./backend-developer.md)

