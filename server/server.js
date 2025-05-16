#!/usr/bin/env node

import http from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from '@y/websocket-server/utils';

// Define port with fallback
const port = process.env.PORT || 4444;

// Create HTTP server
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Y-websocket server is running');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Handle connections
wss.on('connection', (conn, req) => {
  // Add error handling for the connection
  conn.on('error', (err) => {
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
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
server.listen(port, () => {
  console.log(`✅ Yjs WebSocket server running at ws://localhost:${port}`);
});