/**
 * Application entry point
 * Loads environment variables and starts the WebSocket server
 */

import 'dotenv/config';
import { ChatWebSocketServer } from './server';

const port = parseInt(process.env.PORT || '3000', 10);
const server = new ChatWebSocketServer(port);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await server.shutdown();
  process.exit(0);
});
