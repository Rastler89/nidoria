import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    const [type, credentials] = authHeader.split(' ');

    if (type !== 'Basic' || !credentials) {
      throw new UnauthorizedException('Invalid Authorization Type');
    }

    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    const adminUser = process.env.AI_ADMIN_USER || 'admin';
    const adminPass = process.env.AI_ADMIN_PASS || 'nidoria2024';

    if (user === adminUser && pass === adminPass) {
      return true;
    }

    throw new UnauthorizedException('Invalid Credentials');
  }
}
