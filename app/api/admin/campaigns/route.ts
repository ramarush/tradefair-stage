import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch all campaigns
export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { campaignName: { contains: search, mode: 'insensitive' } },
        { campaignId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        campaign_name: campaign.campaignName,
        campaign_id: campaign.campaignId,
        user_recurrence: campaign.userRecurrence,
        percentage_bonus: campaign.percentageBonus,
        bonus_type: campaign.bonusType,
        target_user_type: campaign.targetUserType,
        target_user_ids: campaign.targetUserIds,
        is_active: campaign.isActive,
        start_date_time: campaign.startDateTime.toISOString(),
        end_date_time: campaign.endDateTime.toISOString(),
        created_at: campaign.createdAt.toISOString(),
        updated_at: campaign.updatedAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { 
      campaign_name, 
      campaign_id, 
      user_recurrence, 
      percentage_bonus,
      bonus_type,
      target_user_type,
      target_user_ids,
      is_active, 
      start_date_time, 
      end_date_time 
    } = body;

    // Validation
    if (!campaign_name || !campaign_id || !start_date_time || !end_date_time) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_name, campaign_id, start_date_time, end_date_time' },
        { status: 400 }
      );
    }

    // Validate percentage_bonus
    if (percentage_bonus !== undefined && (percentage_bonus < 0 || percentage_bonus > 100)) {
      return NextResponse.json(
        { error: 'Percentage bonus must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate bonus_type
    if (bonus_type && !['first_deposit_only', 'every_deposit'].includes(bonus_type)) {
      return NextResponse.json(
        { error: 'Bonus type must be either "first_deposit_only" or "every_deposit"' },
        { status: 400 }
      );
    }

    // Validate target_user_type
    if (target_user_type && !['all_users', 'specific_users'].includes(target_user_type)) {
      return NextResponse.json(
        { error: 'Target user type must be either "all_users" or "specific_users"' },
        { status: 400 }
      );
    }

    // Validate target_user_ids when targeting specific users
    if (target_user_type === 'specific_users' && (!target_user_ids || target_user_ids.length === 0)) {
      return NextResponse.json(
        { error: 'Target user IDs are required when targeting specific users' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date_time);
    const endDate = new Date(end_date_time);
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Check if campaign_id already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { campaignId: campaign_id }
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign ID already exists' },
        { status: 409 }
      );
    }

    // Create campaign
    const newCampaign = await prisma.campaign.create({
      data: {
        campaignName: campaign_name,
        campaignId: campaign_id,
        userRecurrence: user_recurrence || 1,
        percentageBonus: percentage_bonus || 0,
        bonusType: bonus_type || 'every_deposit',
        targetUserType: target_user_type || 'all_users',
        targetUserIds: target_user_ids || [],
        isActive: is_active !== undefined ? is_active : true,
        startDateTime: new Date(start_date_time),
        endDateTime: new Date(end_date_time)
      }
    });

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign: {
        id: newCampaign.id,
        campaign_name: newCampaign.campaignName,
        campaign_id: newCampaign.campaignId,
        user_recurrence: newCampaign.userRecurrence,
        percentage_bonus: newCampaign.percentageBonus,
        bonus_type: newCampaign.bonusType,
        target_user_type: newCampaign.targetUserType,
        target_user_ids: newCampaign.targetUserIds,
        is_active: newCampaign.isActive,
        start_date_time: newCampaign.startDateTime.toISOString(),
        end_date_time: newCampaign.endDateTime.toISOString(),
        created_at: newCampaign.createdAt.toISOString(),
        updated_at: newCampaign.updatedAt.toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
