import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'GhostGram API',
      version: '0.1.0',
      status: 'running',
      timestamp: new Date().toISOString()
    };
  }
}
