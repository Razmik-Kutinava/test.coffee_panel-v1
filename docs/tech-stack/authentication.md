# Authentication

## Overview

Система аутентификации на основе JWT токенов для защиты API endpoints.

## Quick Reference

```typescript
// Guard для защиты маршрута
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

## JWT Strategy

### Установка

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

### Настройка

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
```

### JWT Strategy

```typescript
// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

## Guards

### JWT Auth Guard

```typescript
// jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Использование

```typescript
// Защита одного endpoint
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}

// Защита всего контроллера
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {}
```

## Login

### Service

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

### Controller

```typescript
// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
```

## Registration

### Service

```typescript
async register(email: string, password: string, name?: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await this.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  const payload = { email: user.email, sub: user.id };
  return {
    access_token: this.jwtService.sign(payload),
  };
}
```

## Password Hashing

### Установка

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

### Использование

```typescript
import * as bcrypt from 'bcrypt';

// Хеширование
const hashedPassword = await bcrypt.hash(password, 10);

// Проверка
const isValid = await bcrypt.compare(password, hashedPassword);
```

## Request User

### Получение пользователя

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user; // { userId: 1, email: 'user@example.com' }
}
```

### Custom Decorator

```typescript
// user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Использование
@Get('profile')
getProfile(@CurrentUser() user: any) {
  return user;
}
```

## Environment Variables

```env
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1d"
```

## Common Issues

### Ошибка: "Unauthorized"

**Причина:** Токен отсутствует или невалиден

**Решение:**
- Проверить наличие заголовка `Authorization: Bearer <token>`
- Проверить валидность токена
- Проверить `JWT_SECRET` в `.env`

### Ошибка: "Token expired"

**Причина:** Токен истек

**Решение:**
- Обновить токен через refresh token
- Или заново авторизоваться

## Best Practices

### 1. Использовать сильный секрет

```env
# ✅ ПРАВИЛЬНО - случайная строка
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# ❌ НЕПРАВИЛЬНО - слабый секрет
JWT_SECRET="secret"
```

### 2. Устанавливать разумное время жизни

```typescript
// ✅ ПРАВИЛЬНО
signOptions: { expiresIn: '1d' }

// ❌ НЕПРАВИЛЬНО - слишком долго
signOptions: { expiresIn: '1y' }
```

### 3. Хешировать пароли

```typescript
// ✅ ПРАВИЛЬНО
const hashedPassword = await bcrypt.hash(password, 10);

// ❌ НЕПРАВИЛЬНО - хранить в открытом виде
const password = "plaintext";
```

## Related Docs

- [Backend NestJS](./backend-nestjs.md)
- [API Design](./api-design.md)

