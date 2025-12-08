# QA Engineer

## Роль

Тестирование функциональности, поиск багов, обеспечение качества.

## Ответственность

- Написание тестов
- Ручное тестирование
- Поиск багов
- Проверка требований

## Testing Checklist

### Functional Testing

- [ ] Все endpoints работают
- [ ] Валидация работает
- [ ] Обработка ошибок работает
- [ ] Связи между сущностями работают

### API Testing

```bash
# Создание
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'

# Получение
curl http://localhost:3001/products

# Обновление
curl -X PATCH http://localhost:3001/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":200}'

# Удаление
curl -X DELETE http://localhost:3001/products/1
```

### Edge Cases

- Пустые значения
- Отрицательные числа
- Очень большие числа
- Специальные символы
- Несуществующие ID

## Bug Reporting

### Template

```
Название: [Краткое описание]

Шаги воспроизведения:
1. ...
2. ...
3. ...

Ожидаемый результат: ...
Фактический результат: ...

Приоритет: High/Medium/Low
```

## Related Docs

- [Testing Strategy](../workflows/testing-strategy.md)
- [Bug Fixing](../workflows/bug-fixing.md)

