import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
      
      // Таймаут подключения (по умолчанию 15 секунд, можно настроить через PRISMA_CONNECT_TIMEOUT)
      const connectTimeout = parseInt(process.env.PRISMA_CONNECT_TIMEOUT || '15000', 10);
      this.logger.log(`🔄 Подключение к базе данных (таймаут: ${connectTimeout}ms)...`);
      
      let timeoutId: NodeJS.Timeout | undefined;
      const connectPromise = this.prisma.$connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Connection timeout after ${connectTimeout}ms. Проверьте настройки DATABASE_URL и доступность базы данных.`));
        }, connectTimeout);
      });

      try {
        await Promise.race([connectPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        this.logger.log('✅ Prisma connected successfully');
        return this.prisma;
      } catch (raceError) {
        if (timeoutId) clearTimeout(timeoutId);
        throw raceError;
      }
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error ? error.message : String(error)) || String(error);
      this.initError = error instanceof Error ? error : new Error(String(error));
      
      if (errorMessage.includes('not a valid Win32 application') || 
          errorMessage.includes('ARM64') ||
          errorMessage.includes('query_engine')) {
        this.logger.warn('⚠️ Prisma engine несовместим с ARM64 Windows.');
        this.logger.warn('💡 Решения:');
        this.logger.warn('   1. Установите Node.js x64 версию (рекомендуется)');
        this.logger.warn('   2. Используйте Docker или WSL');
        this.logger.warn('   3. Используйте Prisma 7+ с Data Proxy/Accelerate');
        this.logger.warn('📌 Приложение запущено, но Prisma запросы будут недоступны');
      } else if (errorMessage.includes('Connection timeout')) {
        this.logger.error(`❌ Prisma connection timeout: ${errorMessage}`);
        this.logger.error('💡 Проверьте:');
        this.logger.error('   1. Правильность DATABASE_URL в .env файле');
        this.logger.error('   2. Доступность базы данных Supabase');
        this.logger.error('   3. Интернет соединение');
        this.logger.error('   4. Настройки файрвола/сети');
      } else if (errorMessage.includes('P1000') || errorMessage.includes('Authentication failed')) {
        this.logger.error(`❌ Prisma authentication error: ${errorMessage}`);
        this.logger.error('💡 Проверьте учетные данные DATABASE_URL в .env файле');
        this.logger.error('   См. документацию: backend/SUPABASE_SETUP.md');
      } else {
        this.logger.error(`❌ Prisma connection error: ${errorMessage}`);
      }
      throw this.initError;
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

  // Публичный метод для получения клиента с гарантией инициализации
  async client(): Promise<PrismaClient> {
    await this.ensureInitialized();
    return this.getClient();
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
  async getUserModel(): Promise<PrismaClient['user']> {
    await this.ensureInitialized();
    return this.getClient().user;
  }

  async getLocationModel(): Promise<PrismaClient['location']> {
    await this.ensureInitialized();
    return this.getClient().location;
  }

  async getProductModel(): Promise<PrismaClient['product']> {
    await this.ensureInitialized();
    return this.getClient().product;
  }

  async getOrderModel(): Promise<PrismaClient['order']> {
    await this.ensureInitialized();
    return this.getClient().order;
  }

  async getPromocodeModel(): Promise<PrismaClient['promocode']> {
    await this.ensureInitialized();
    return this.getClient().promocode;
  }

  async getStaffModel(): Promise<PrismaClient['locationStaff']> {
    await this.ensureInitialized();
    return this.getClient().locationStaff;
  }

  async getModifierGroupModel(): Promise<PrismaClient['modifierGroup']> {
    await this.ensureInitialized();
    return this.getClient().modifierGroup;
  }

  async getModifierOptionModel(): Promise<PrismaClient['modifierOption']> {
    await this.ensureInitialized();
    return this.getClient().modifierOption;
  }

  async getLocationProductModel(): Promise<PrismaClient['locationProduct']> {
    await this.ensureInitialized();
    return this.getClient().locationProduct;
  }

  async getOrderItemModel(): Promise<PrismaClient['orderItem']> {
    await this.ensureInitialized();
    return this.getClient().orderItem;
  }

  async getOrderItemModifierModel(): Promise<PrismaClient['orderItemModifier']> {
    await this.ensureInitialized();
    return this.getClient().orderItemModifier;
  }

  async getOrderStatusHistoryModel(): Promise<PrismaClient['orderStatusHistory']> {
    await this.ensureInitialized();
    return this.getClient().orderStatusHistory;
  }

  async getCategoryModel(): Promise<PrismaClient['category']> {
    await this.ensureInitialized();
    return this.getClient().category;
  }

  async getLocationCategoryModel(): Promise<PrismaClient['locationCategory']> {
    await this.ensureInitialized();
    return this.getClient().locationCategory;
  }

  async getProductModifierGroupModel(): Promise<PrismaClient['productModifierGroup']> {
    await this.ensureInitialized();
    return this.getClient().productModifierGroup;
  }

  async getLocationStaffModel(): Promise<PrismaClient['locationStaff']> {
    await this.ensureInitialized();
    return this.getClient().locationStaff;
  }

  async getPermissionModel(): Promise<PrismaClient['permission']> {
    await this.ensureInitialized();
    return this.getClient().permission;
  }

  async getBroadcastModel(): Promise<PrismaClient['broadcast']> {
    await this.ensureInitialized();
    return this.getClient().broadcast;
  }

  async getBroadcastLogModel(): Promise<PrismaClient['broadcastLog']> {
    await this.ensureInitialized();
    return this.getClient().broadcastLog;
  }

  async getNotificationModel(): Promise<PrismaClient['notification']> {
    await this.ensureInitialized();
    return this.getClient().notification;
  }

  async getBotSessionModel(): Promise<PrismaClient['botSession']> {
    await this.ensureInitialized();
    return this.getClient().botSession;
  }

  async getAuditLogModel(): Promise<PrismaClient['auditLog']> {
    await this.ensureInitialized();
    return this.getClient().auditLog;
  }

  async getPromocodeUsageModel(): Promise<PrismaClient['promocodeUsage']> {
    await this.ensureInitialized();
    return this.getClient().promocodeUsage;
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

  $transaction(...args: Parameters<PrismaClient['$transaction']>): ReturnType<PrismaClient['$transaction']> {
    return this.getClient().$transaction(...args);
  }

  $executeRaw(...args: Parameters<PrismaClient['$executeRaw']>): ReturnType<PrismaClient['$executeRaw']> {
    return this.getClient().$executeRaw(...args);
  }

  $queryRaw(...args: Parameters<PrismaClient['$queryRaw']>): ReturnType<PrismaClient['$queryRaw']> {
    return this.getClient().$queryRaw(...args);
  }
}

