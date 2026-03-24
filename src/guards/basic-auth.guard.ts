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
    const response = context.switchToHttp().getResponse();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return this.promptAuth(response);
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Basic') {
      return this.promptAuth(response);
    }

    const credentials = parts[1];
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    const adminUser = process.env.AI_ADMIN_USER || 'admin';
    const adminPass = process.env.AI_ADMIN_PASS || 'nidoria2024';

    if (user === adminUser && pass === adminPass) {
      return true;
    }

    return this.promptAuth(response);
  }

  private promptAuth(response: any): boolean {
    response.setHeader('WWW-Authenticate', 'Basic realm="Nidoria AI Manager"');
    throw new UnauthorizedException('Authentication Required');
  }
}
