import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Интерцептор для автоматической сериализации BigInt в строки.
 * Решает проблему "Do not know how to serialize a BigInt"
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.serializeBigInt(data)),
    );
  }

  private serializeBigInt(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'bigint') {
      return data.toString();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.serializeBigInt(item));
    }

    if (typeof data === 'object') {
      if (data instanceof Date) {
        return data;
      }
      
      const result: any = {};
      for (const key of Object.keys(data)) {
        result[key] = this.serializeBigInt(data[key]);
      }
      return result;
    }

    return data;
  }
}

