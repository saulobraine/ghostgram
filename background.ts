// Background service worker (MV3) - ES module
import { BackgroundService } from './src/background/BackgroundService.js';

const service = new BackgroundService();
service.initialize();
