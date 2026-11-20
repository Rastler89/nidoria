import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl ?? req.url;
    const userId = req.user?.userId ?? req.user?.id ?? 'anon';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const statusCode = res.statusCode;
          const ms = Date.now() - now;
          this.logger.log(`${method} ${url} ${statusCode} ${ms}ms user=${userId}`);
        },
        error: (err) => {
          const statusCode = err?.status ?? 500;
          const ms = Date.now() - now;
          this.logger.warn(`${method} ${url} ${statusCode} ${ms}ms user=${userId} msg=${err?.message ?? 'error'}`);
        },
      }),
    );
  }
}
