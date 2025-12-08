import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  
  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      console.error(`💡 Trying to free port ${port}...`);
      
      // Попытка автоматически освободить порт (только на Windows)
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
          const lines = result.trim().split('\n');
          const pids = new Set<string>();
          
          for (const line of lines) {
            const match = line.trim().split(/\s+/).pop();
            if (match && !isNaN(Number(match))) {
              pids.add(match);
            }
          }
          
          for (const pid of pids) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`✅ Stopped process PID ${pid}`);
            } catch (e) {
              // Игнорируем ошибки
            }
          }
          
          // Ждем освобождения порта и пробуем снова
          await new Promise(resolve => setTimeout(resolve, 2000));
          await app.listen(port);
          console.log(`🚀 Application is running on: http://localhost:${port}`);
          return;
        } catch (autoFreeError) {
          // Если автоматическое освобождение не удалось
        }
      }
      
      console.error(`❌ Could not free port ${port}. Please stop the application using this port manually.`);
      console.error(`   On Windows: netstat -ano | findstr :${port}`);
      console.error(`   Then: taskkill /F /PID <PID>`);
      process.exit(1);
    }
    throw error;
  }
}
bootstrap();
