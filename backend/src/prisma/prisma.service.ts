import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '.prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient | null = null;
  private isInitialized = false;
  private initError: Error | null = null;

  constructor() {
    // Lazy initialization - создаем PrismaClient только при первом использовании
    // Это позволяет приложению запуститься даже если Prisma engine несовместим
  }

  private async initializePrisma() {
    if (this.isInitialized) {
      if (this.initError) throw this.initError;
      if (this.prisma) return this.prisma;
    }

    this.isInitialized = true;

    try {
      // Создаем PrismaClient в try-catch, так как он может упасть при создании
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
      
      await Promise.race([
        this.prisma.$connect(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        ),
      ]);
      
      this.logger.log('✅ Prisma connected successfully');
      return this.prisma;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      this.initError = error;
      
      if (errorMessage.includes('not a valid Win32 application') || 
          errorMessage.includes('ARM64') ||
          errorMessage.includes('query_engine')) {
        this.logger.warn('⚠️ Prisma engine несовместим с ARM64 Windows.');
        this.logger.warn('💡 Решения:');
        this.logger.warn('   1. Установите Node.js x64 версию (рекомендуется)');
        this.logger.warn('   2. Используйте Docker или WSL');
        this.logger.warn('   3. Используйте Prisma 7+ с Data Proxy/Accelerate');
        this.logger.warn('📌 Приложение запущено, но Prisma запросы будут недоступны');
      } else {
        this.logger.error(`❌ Prisma connection error: ${errorMessage}`);
      }
      throw error;
    }
  }

  async onModuleInit() {
    // Не инициализируем здесь - делаем lazy loading
    this.logger.log('PrismaService готов к использованию (lazy initialization)');
  }

  async onModuleDestroy() {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
      } catch (error) {
        // Игнорируем ошибки при отключении
      }
    }
  }

  private async getClientAsync(): Promise<PrismaClient> {
    if (!this.isInitialized) {
      await this.ensureInitialized();
    }
    if (!this.prisma || this.initError) {
      if (this.initError) {
        throw this.initError;
      }
      throw new Error('Prisma не инициализирован');
    }
    return this.prisma;
  }

  private getClient(): PrismaClient {
    if (!this.prisma) {
      // При синхронном доступе пытаемся создать PrismaClient
      // Если это не удалось из-за ошибки инициализации, выбрасываем понятную ошибку
      if (this.initError) {
        throw this.initError;
      }
      throw new Error(
        'Prisma не инициализирован. Используйте async методы или дождитесь инициализации.\n' +
        'Для работы с Prisma на ARM64 Windows установите Node.js x64 или используйте Docker/WSL.'
      );
    }
    return this.prisma;
  }

  // Lazy getters - инициализируют Prisma при первом использовании
  // Используем async инициализацию через метод
  async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        await this.initializePrisma();
      } catch (error) {
        // Ошибка уже залогирована в initializePrisma
        throw error;
      }
    }
    if (this.initError) {
      throw this.initError;
    }
  }

  // Асинхронные методы для получения моделей с автоматической инициализацией
  async getUserModel() {
    await this.ensureInitialized();
    return this.getClient().user;
  }

  // Синхронные геттеры (deprecated - используйте async методы выше)
  get user() {
    if (this.prisma) {
      return this.prisma.user;
    }
    throw new Error(
      'Используйте await prisma.getUserModel() вместо prisma.user. ' +
      'Prisma требует async инициализацию на ARM64 Windows.'
    );
  }


  // Проксируем методы PrismaClient с автоматической инициализацией
  async $connect() {
    await this.ensureInitialized();
    return this.getClient().$connect();
  }

  async $disconnect() {
    if (this.prisma) {
      return this.prisma.$disconnect();
    }
    return Promise.resolve();
  }

  $transaction(...args: Parameters<PrismaClient['$transaction']>) {
    return this.getClient().$transaction(...(args as [any, ...any[]]));
  }

  $executeRaw(...args: Parameters<PrismaClient['$executeRaw']>) {
    return this.getClient().$executeRaw(...(args as [any, ...any[]]));
  }

  $queryRaw(...args: Parameters<PrismaClient['$queryRaw']>) {
    return this.getClient().$queryRaw(...(args as [any, ...any[]]));
  }
}

