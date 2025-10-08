#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Automated Campaign Bonus Processor
 * 
 * This script calls the Next.js API endpoint to process campaign bonuses:
 * 1. Generate admin token for authentication
 * 2. Call /api/admin/process-bonuses endpoint
 * 3. Display results
 */

async function generateAdminToken() {
  try {
    // Find the first admin user to generate token for
    const adminUser = await prisma.user.findFirst({
      where: {
        isAdmin: true,
        isActive: true
      },
      select: {
        id: true,
        email: true
      }
    });

    if (!adminUser) {
      throw new Error('No active admin user found. Please create an admin user first.');
    }

    // Generate JWT token using the same secret as the auth system
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024';
    const token = jwt.sign(
      { userId: adminUser.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Generated token for admin user: ${adminUser.email}`);
    return token;
  } catch (error) {
    console.error('Error generating admin token:', error);
    throw error;
  }
}

async function processCampaignBonuses() {
  console.log(`[${new Date().toISOString()}] Starting campaign bonus processing...`);
  
  try {
    // Generate admin token for API authentication
    const token = await generateAdminToken();
    
    // Determine the API endpoint URL
    const apiUrl = 'https://tradefair.onrender.com';
    const endpoint = `${apiUrl}/api/admin/process-bonuses`;
    
    console.log(`Calling bonus processing API: ${endpoint}`);
    
    // Call the Next.js API endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Bonus processing completed successfully!`);
      console.log(`📊 Results: ${result.processed} transactions processed, ${result.bonusesAwarded} bonuses awarded`);
      console.log(`💬 Message: ${result.message}`);
    } else {
      console.error(`❌ Bonus processing failed: ${result.message}`);
      if (result.error) {
        console.error(`🔍 Error details: ${result.error}`);
      }
    }

    return result;

  } catch (error) {
    console.error('❌ Error in campaign bonus processing:', error);
    throw error;
  }
  // Note: Don't disconnect prisma here since we're running continuously
}

// Global variable to track the interval
let processingInterval;

// Function to start continuous processing
function startContinuousProcessing() {
  console.log(`[${new Date().toISOString()}] Starting continuous bonus processing (every 1 minute)...`);
  
  // Run immediately on start
  processCampaignBonuses()
    .catch((error) => {
      console.error('❌ Error in initial bonus processing:', error);
    });
  
  // Set up interval to run every minute (60000 ms)
  processingInterval = setInterval(async () => {
    try {
      await processCampaignBonuses();
    } catch (error) {
      console.error('❌ Error in scheduled bonus processing:', error);
      // Continue running even if one iteration fails
    }
  }, 60000); // 60 seconds = 1 minute
}

// Graceful shutdown handling
function gracefulShutdown() {
  console.log(`\n[${new Date().toISOString()}] Received shutdown signal. Stopping bonus processing...`);
  
  if (processingInterval) {
    clearInterval(processingInterval);
    console.log('✅ Bonus processing interval cleared');
  }
  
  // Close database connection
  prisma.$disconnect()
    .then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error closing database connection:', error);
      process.exit(1);
    });
}

// Handle process termination signals
process.on('SIGINT', gracefulShutdown);  // Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Termination signal
process.on('SIGQUIT', gracefulShutdown); // Quit signal

// Start the continuous processing
startContinuousProcessing();
