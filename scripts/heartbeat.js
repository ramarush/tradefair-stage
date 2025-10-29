#!/usr/bin/env node

/**
 * Trading Platform Heartbeat Script
 * 
 * This script keeps the trading platform session alive by calling the heartbeat API
 * every 5 minutes using the stored token from token.json
 */

import fs from 'fs/promises';
import path from 'path';

// Load environment variables from .env file
async function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
}

// Load environment variables before using them
await loadEnvFile();

class TradingPlatformHeartbeat {
  constructor() {
    this.baseUrl = process.env.TRADING_PLATFORM_BASE_URL || '';
    this.companyName = process.env.TRADING_PLATFORM_COMPANY_NAME || '';
    this.username = process.env.TRADING_PLATFORM_USERNAME || '';
    this.password = process.env.TRADING_PLATFORM_PASSWORD || '';
    this.tokenFilePath = path.join(process.cwd(), 'token.json');
    this.heartbeatInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.intervalId = null;
    
    if (!this.baseUrl || !this.companyName || !this.username || !this.password) {
      throw new Error('Trading platform environment variables are required: TRADING_PLATFORM_BASE_URL, TRADING_PLATFORM_COMPANY_NAME, TRADING_PLATFORM_USERNAME, TRADING_PLATFORM_PASSWORD');
    }
  }

  /**
   * Login to trading platform and get new token
   */
  async loginAndGetToken() {
    try {
      console.log(`[${new Date().toISOString()}] Logging into trading platform...`);
      
      const response = await fetch(`${this.baseUrl}/login/public/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: this.companyName,
          password: this.password,
          userName: this.username,
        }),
      });

      if (!response.ok) {
        throw new Error(`Trading platform login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(`Trading platform login failed: ${data.message}`);
      }

      const token = data.data.token;
      // Set token expiry time (assuming 24 hours validity)
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);

      // Save token to file
      await this.saveToken(token, expiryTime);

      console.log(`[${new Date().toISOString()}] Login successful, token saved`);
      return token;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Login error:`, error.message);
      throw error;
    }
  }

  /**
   * Save token to token.json file
   */
  async saveToken(token, expiryTime) {
    try {
      const tokenData = {
        token,
        expiryTime,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.tokenFilePath, JSON.stringify(tokenData, null, 2));
      console.log(`[${new Date().toISOString()}] Token saved to token.json`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error saving token:`, error.message);
      // Don't throw error - token persistence failure shouldn't stop the heartbeat
    }
  }

  /**
   * Load token from token.json file or login if token is missing/expired
   */
  async loadToken() {
    try {
      const tokenData = await fs.readFile(this.tokenFilePath, 'utf-8');
      const parsedData = JSON.parse(tokenData);
      
      if (!parsedData.token) {
        console.log(`[${new Date().toISOString()}] No token found in token.json, logging in...`);
        return await this.loginAndGetToken();
      }
      
      // Check if token is expired
      if (parsedData.expiryTime && Date.now() >= parsedData.expiryTime) {
        console.log(`[${new Date().toISOString()}] Token has expired, logging in...`);
        return await this.loginAndGetToken();
      }
      
      console.log(`[${new Date().toISOString()}] Using existing valid token`);
      return parsedData.token;
    } catch (error) {
      // If file doesn't exist or can't be read, login to get new token
      console.log(`[${new Date().toISOString()}] Error loading token (${error.message}), logging in...`);
      return await this.loginAndGetToken();
    }
  }

  /**
   * Call the heartbeat API to keep session alive
   */
  async sendHeartbeat() {
    try {
      let token = await this.loadToken();
      
      console.log(`[${new Date().toISOString()}] Sending heartbeat...`);
      
      let response = await fetch(`${this.baseUrl}/admin/public/api/v1/heartbeat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // If we get 401 Unauthorized, the session has expired on server side
      if (response.status === 401) {
        console.log(`[${new Date().toISOString()}] Session expired on server, getting new token...`);
        
        // Get a new token
        token = await this.loginAndGetToken();
        
        // Retry the heartbeat with new token
        console.log(`[${new Date().toISOString()}] Retrying heartbeat with new token...`);
        response = await fetch(`${this.baseUrl}/admin/public/api/v1/heartbeat`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${new Date().toISOString()}] Heartbeat failed: ${response.status} ${response.statusText}`);
        console.error('Response:', errorText);
        return false;
      }

      const result = await response.json();
      console.log(`[${new Date().toISOString()}] Heartbeat successful:`, result.message || 'OK');
      return true;
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Heartbeat error:`, error.message);
      return false;
    }
  }

  /**
   * Start the heartbeat service */
  async start() {
    console.log(`[${new Date().toISOString()}] Starting Trading Platform Heartbeat Service`);
    console.log(`Heartbeat interval: ${this.heartbeatInterval / 1000} seconds`);
    
    // Send initial heartbeat
    await this.sendHeartbeat();
    
    // Set up recurring heartbeat
    this.intervalId = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.heartbeatInterval);
    
    console.log(`[${new Date().toISOString()}] Heartbeat service started successfully`);
  }

  /**
   * Stop the heartbeat service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[${new Date().toISOString()}] Heartbeat service stopped`);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.heartbeatService) {
    global.heartbeatService.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  if (global.heartbeatService) {
    global.heartbeatService.stop();
  }
  process.exit(0);
});

// Start the service if this script is run directly
// In ES modules, we check if import.meta.url matches the main module
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
if (process.argv[1] === __filename) {
  async function main() {
    try {
      const heartbeatService = new TradingPlatformHeartbeat();
      global.heartbeatService = heartbeatService;
      await heartbeatService.start();
      
      // Keep the process running
      console.log('Press Ctrl+C to stop the heartbeat service');
      
    } catch (error) {
      console.error('Failed to start heartbeat service:', error.message);
      
    }
  }
  
  main();
}

export default TradingPlatformHeartbeat;
