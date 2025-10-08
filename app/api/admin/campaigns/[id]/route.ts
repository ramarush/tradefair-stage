import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const resolvedParams = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(resolvedParams.id) }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      campaign: {
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
      }
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { campaign_name, campaign_id, user_recurrence, percentage_bonus, bonus_type, target_user_type, target_user_ids, is_active, start_date_time, end_date_time } = body;

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: parseInt(resolvedParams.id) }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Validation
    if (!campaign_name || !campaign_id || !start_date_time || !end_date_time) {
      return NextResponse.json(
        { error: 'Campaign name, campaign ID, start date, and end date are required' },
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

    // Check if campaign_id already exists (excluding current campaign)
    if (campaign_id !== existingCampaign.campaignId) {
      const duplicateCampaign = await prisma.campaign.findUnique({
        where: { campaignId: campaign_id }
      });

      if (duplicateCampaign) {
        return NextResponse.json(
          { error: 'Campaign ID already exists' },
          { status: 409 }
        );
      }
    }

    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: parseInt(resolvedParams.id) },
      data: {
        campaignName: campaign_name,
        campaignId: campaign_id,
        userRecurrence: user_recurrence || 1,
        percentageBonus: percentage_bonus !== undefined ? percentage_bonus : 0,
        bonusType: bonus_type || existingCampaign.bonusType,
        targetUserType: target_user_type || existingCampaign.targetUserType,
        targetUserIds: target_user_ids !== undefined ? target_user_ids : existingCampaign.targetUserIds,
        isActive: is_active !== undefined ? is_active : true,
        startDateTime: startDate,
        endDateTime: endDate,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign: {
        id: updatedCampaign.id,
        campaign_name: updatedCampaign.campaignName,
        campaign_id: updatedCampaign.campaignId,
        user_recurrence: updatedCampaign.userRecurrence,
        percentage_bonus: updatedCampaign.percentageBonus,
        bonus_type: updatedCampaign.bonusType,
        target_user_type: updatedCampaign.targetUserType,
        target_user_ids: updatedCampaign.targetUserIds,
        is_active: updatedCampaign.isActive,
        start_date_time: updatedCampaign.startDateTime.toISOString(),
        end_date_time: updatedCampaign.endDateTime.toISOString(),
        created_at: updatedCampaign.createdAt.toISOString(),
        updated_at: updatedCampaign.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const resolvedParams = await params;
    
    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: parseInt(resolvedParams.id) }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Delete campaign
    await prisma.campaign.delete({
      where: { id: parseInt(resolvedParams.id) }
    });

    return NextResponse.json({
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
