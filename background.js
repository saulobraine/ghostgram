// Background service worker - Refactored with SOLID and Object Calisthenics
import { BackgroundService } from './src/background/BackgroundService.js';

const service = new BackgroundService();
service.initialize();
