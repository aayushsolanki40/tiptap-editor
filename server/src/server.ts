#!/usr/bin/env node

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from '@y/websocket-server/utils';
import { IncomingMessage } from 'http';

// Define port with fallback
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 4444;

// Create HTTP server
const server: http.Server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Y-websocket server is running');
});

// Create WebSocket server
const wss: WebSocketServer = new WebSocketServer({ server });

// Handle connections
wss.on('connection', (conn: WebSocket, req: IncomingMessage) => {
  // Add error handling for the connection
  conn.on('error', (err: Error) => {
    console.error('WebSocket connection error:', err);
  });
  
  // Setup the Y-websocket connection with proper error handling
  try {
    setupWSConnection(conn, req);
    console.log('Client connected');
  } catch (err) {
    console.error('Failed to set up WebSocket connection:', err);
    conn.close();
  }
});

// Handle process errors
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
server.listen(port, () => {
  console.log(`✅ Yjs WebSocket server running at ws://localhost:${port}`);
});
