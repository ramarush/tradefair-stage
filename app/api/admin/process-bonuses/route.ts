import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

const prisma = new PrismaClient();

/**
 * Automated Campaign Bonus Processor API Route
 * 
 * This API endpoint processes campaign bonuses:
 * 1. Fetch unprocessed completed deposit transactions
 * 2. Check for any active campaigns with bonuses
 * 3. Calculate and credit bonus amounts to user bonus balance
 * 4. Call transferMoney API to make balance available on trading platform
 * 5. Create bonus transaction records
 * 6. Update processing checkpoint
 */

async function processCampaignBonuses() {
  console.log(`[${new Date().toISOString()}] Starting campaign bonus processing...`);
  
  try {
    // Get the last processed transaction ID from checkpoint
    let checkpoint = await prisma.processingCheckpoint.findFirst({
      orderBy: { id: 'desc' }
    });

    const lastProcessedId = checkpoint?.lastProcessedTransactionId || 0;
    console.log(`Last processed transaction ID: ${lastProcessedId}`);

    // Fetch unprocessed completed deposit transactions
    const unprocessedDeposits = await prisma.transaction.findMany({
      where: {
        id: { gt: lastProcessedId },
        type: 'deposit',
        status: 'completed',
        balanceType: 'wallet' // Only process wallet deposits, not bonus transactions
      },
      include: {
        user: {
          select: {
            id: true,
            bonusBalance: true,
            currency: true,
            tradingPlatformUserId: true,
            tradingPlatformAccountId: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${unprocessedDeposits.length} unprocessed deposit transactions`);

    if (unprocessedDeposits.length === 0) {
      console.log('No new transactions to process');
      return {
        success: true,
        message: 'No new transactions to process',
        processed: 0,
        bonusesAwarded: 0
      };
    }

    // Fetch all active campaigns with bonuses
    const now = new Date();
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        startDateTime: { lte: now },
        endDateTime: { gte: now },
        percentageBonus: { gt: 0 }
      }
    });

    console.log(`Found ${activeCampaigns.length} active campaigns with bonuses`);

    if (activeCampaigns.length === 0) {
      console.log('No active campaigns with bonuses found');
      // Still update checkpoint to mark transactions as processed
      const lastTransactionId = unprocessedDeposits[unprocessedDeposits.length - 1]?.id || lastProcessedId;
      await updateCheckpoint(checkpoint, lastTransactionId);
      return {
        success: true,
        message: 'No active campaigns with bonuses found',
        processed: unprocessedDeposits.length,
        bonusesAwarded: 0
      };
    }

    let processedCount = 0;
    let bonusesAwarded = 0;
    let lastProcessedTransactionId = lastProcessedId;

    for (const transaction of unprocessedDeposits) {
      try {
        lastProcessedTransactionId = transaction.id;
        
        let userReceivedBonus = false;

        // Check each active campaign for this user
        for (const campaign of activeCampaigns) {
          try {
            // Check user targeting (if specific users, verify user is in target list)
            if (campaign.targetUserType === 'specific_users') {
              if (!campaign.targetUserIds || !campaign.targetUserIds.includes(transaction.userId)) {
                console.log(`Transaction ${transaction.id}: User ${transaction.userId} not in campaign ${campaign.campaignId} target list`);
                continue;
              }
            }

            // Check bonus type and user eligibility
            if (campaign.bonusType === 'first_deposit_only') {
              // Check if user has ANY previous completed deposits
              const previousDeposits = await prisma.transaction.count({
                where: {
                  userId: transaction.userId,
                  type: 'deposit',
                  status: 'completed',
                  balanceType: 'wallet',
                  id: { lt: transaction.id } // Only count deposits before current one
                }
              });
              
              if (previousDeposits > 0) {
                console.log(`Transaction ${transaction.id}: User ${transaction.userId} already has previous deposits, skipping first deposit only campaign ${campaign.campaignId}`);
                continue;
              }
            } else if (campaign.bonusType === 'every_deposit') {
              // Check recurrence limit for this specific campaign
              const userBonusCount = await prisma.transaction.count({
                where: {
                  userId: transaction.userId,
                  type: 'deposit',
                  balanceType: 'bonus',
                  notes: { contains: `Campaign: ${campaign.campaignId}` }
                }
              });

              if (userBonusCount >= campaign.userRecurrence) {
                console.log(`Transaction ${transaction.id}: User ${transaction.userId} has reached campaign ${campaign.campaignId} recurrence limit (${campaign.userRecurrence})`);
                continue;
              }
            }

            // Calculate bonus amount
            const bonusAmount = (Number(transaction.amount) * Number(campaign.percentageBonus)) / 100;
            console.log(`Transaction ${transaction.id}: Calculating bonus for campaign ${campaign.campaignId}: ${transaction.amount} * ${campaign.percentageBonus}% = ${bonusAmount}`);

            // Use transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
              // Update user bonus balance
              await tx.user.update({
                where: { id: transaction.userId },
                data: {
                  bonusBalance: {
                    increment: bonusAmount
                  }
                }
              });

              // Create bonus transaction record
              await tx.transaction.create({
                data: {
                  userId: transaction.userId,
                  type: 'deposit',
                  amount: bonusAmount,
                  currency: transaction.currency,
                  status: 'completed',
                  balanceType: 'bonus',
                  notes: `Campaign bonus: ${campaign.percentageBonus}% of ${transaction.amount} ${transaction.currency} deposit (${campaign.bonusType}). Campaign: ${campaign.campaignId}`,
                  mtrNumber: `BONUS-${transaction.id}-${campaign.campaignId}-${Date.now()}`,
                  closingBalance: 0, // Bonus balance is tracked separately
                  approvedAt: new Date()
                }
              });
            });

            // Call transferMoney API to make bonus available on trading platform
            if (transaction.user.tradingPlatformUserId && transaction.user.tradingPlatformAccountId) {
              try {
                const transferResult = await tradingPlatformApi.transferMoney({
                  receiverAccountId: parseInt(String(transaction.user.tradingPlatformAccountId || '0')),
                  senderUserId: parseInt(String(transaction.user.tradingPlatformUserId || '0')), // This will be overridden to main account
                  amount: bonusAmount,
                  currency: transaction.currency,
                  isWithdrawal: false // This is a deposit (from main account to user)
                });

                if (transferResult.success) {
                  console.log(`✅ Trading platform transfer successful for bonus: ${bonusAmount} ${transaction.currency} to user ${transaction.userId}`);
                } else {
                  console.error(`❌ Trading platform transfer failed for bonus: ${transferResult.message}`);
                  // Note: We don't rollback the local bonus as the user should still get it locally
                }
              } catch (transferError) {
                console.error(`❌ Error calling transferMoney API for user ${transaction.userId}:`, transferError);
                // Continue processing - local bonus is still awarded
              }
            } else {
              console.log(`Transaction ${transaction.id}: User ${transaction.userId} has no trading platform account, skipping transfer`);
            }

            console.log(`✅ Transaction ${transaction.id}: Awarded ${bonusAmount} ${transaction.currency} bonus to user ${transaction.userId} from campaign ${campaign.campaignId}`);
            bonusesAwarded++;
            userReceivedBonus = true;

          } catch (campaignError) {
            console.error(`❌ Error processing campaign ${campaign.campaignId} for transaction ${transaction.id}:`, campaignError);
            // Continue with next campaign
          }
        }

        if (!userReceivedBonus) {
          console.log(`Transaction ${transaction.id}: No eligible campaigns found for user ${transaction.userId}`);
        }

        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.id}:`, error);
        processedCount++;
        // Continue processing other transactions even if one fails
      }
    }

    // Update checkpoint
    await updateCheckpoint(checkpoint, lastProcessedTransactionId);

    console.log(`✅ Processing completed: ${processedCount} transactions processed, ${bonusesAwarded} bonuses awarded`);

    return {
      success: true,
      message: 'Campaign bonus processing completed successfully',
      processed: processedCount,
      bonusesAwarded: bonusesAwarded
    };

  } catch (error) {
    console.error('❌ Error in campaign bonus processing:', error);
    throw error;
  }
}

/**
 * Helper function to update processing checkpoint
 */
async function updateCheckpoint(checkpoint: any, lastProcessedTransactionId: number) {
  try {
    if (checkpoint) {
      await prisma.processingCheckpoint.update({
        where: { id: checkpoint.id },
        data: {
          lastProcessedTransactionId,
          lastProcessedAt: new Date()
        }
      });
    } else {
      await prisma.processingCheckpoint.create({
        data: {
          lastProcessedTransactionId,
          lastProcessedAt: new Date()
        }
      });
    }
    console.log(`Updated checkpoint to transaction ID: ${lastProcessedTransactionId}`);
  } catch (error) {
    console.error('❌ Error updating checkpoint:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await processCampaignBonuses();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Fatal error in bonus processing API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during bonus processing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  // Allow GET requests to trigger processing as well for easier testing
  return POST(request);
}
