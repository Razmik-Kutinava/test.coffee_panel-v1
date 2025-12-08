# Security Specialist

## Роль

Обеспечение безопасности приложения, проверка уязвимостей, security review.

## Ответственность

- Security review кода
- Проверка уязвимостей
- Настройка безопасности
- Обучение команды

## Security Checklist

### Authentication

- [ ] JWT токены используются правильно
- [ ] Секреты не хардкодятся
- [ ] Пароли хешируются (bcrypt)
- [ ] Токены имеют разумное время жизни

### Input Validation

- [ ] Все входные данные валидируются
- [ ] DTO с class-validator
- [ ] SQL injection защита (Prisma)

### Secrets Management

- [ ] `.env` не коммитится
- [ ] Разные ключи для dev/prod
- [ ] Секреты ротируются

### CORS

- [ ] CORS настроен правильно
- [ ] Только разрешенные origins

## Common Vulnerabilities

### 1. SQL Injection

```typescript
// ✅ БЕЗОПАСНО - Prisma защищает
await prisma.user.findMany({
  where: { email: userInput },
});

// ❌ НЕБЕЗОПАСНО - прямой SQL
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

### 2. XSS

```typescript
// ✅ БЕЗОПАСНО - валидация
@IsString()
name: string;

// ❌ НЕБЕЗОПАСНО - нет валидации
name: any;
```

### 3. Sensitive Data Exposure

```typescript
// ✅ БЕЗОПАСНО - не возвращать пароль
return {
  id: user.id,
  email: user.email,
  // password не включаем
};

// ❌ НЕБЕЗОПАСНО
return user; // Может содержать password
```

## Related Docs

- [Authentication](../tech-stack/authentication.md)
- [Code Review](../workflows/code-review.md)

