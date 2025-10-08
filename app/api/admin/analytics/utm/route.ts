import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch UTM analytics data
export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Get UTM source breakdown
    const utmSourceStats = await prisma.user.groupBy({
      by: ['utmSource'],
      where: {
        utmSource: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Get UTM medium breakdown
    const utmMediumStats = await prisma.user.groupBy({
      by: ['utmMedium'],
      where: {
        utmMedium: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Get UTM campaign breakdown
    const utmCampaignStats = await prisma.user.groupBy({
      by: ['utmCampaign'],
      where: {
        utmCampaign: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Get detailed user list with UTM data
    const usersWithUtm = await prisma.user.findMany({
      where: {
        OR: [
          { utmSource: { not: null } },
          { utmMedium: { not: null } },
          { utmCampaign: { not: null } },
          { campaignId: { not: null } }
        ],
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        campaignId: true,
        createdAt: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 users
    });

    // Get total users with and without UTM data
    const totalUsersWithUtm = await prisma.user.count({
      where: {
        OR: [
          { utmSource: { not: null } },
          { utmMedium: { not: null } },
          { utmCampaign: { not: null } },
          { campaignId: { not: null } }
        ],
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      }
    });

    const totalUsersWithoutUtm = await prisma.user.count({
      where: {
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        campaignId: null,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      }
    });

    return NextResponse.json({
      summary: {
        totalUsersWithUtm,
        totalUsersWithoutUtm,
        totalUsers: totalUsersWithUtm + totalUsersWithoutUtm
      },
      breakdown: {
        sources: utmSourceStats.map(stat => ({
          source: stat.utmSource,
          count: stat._count.id
        })),
        mediums: utmMediumStats.map(stat => ({
          medium: stat.utmMedium,
          count: stat._count.id
        })),
        campaigns: utmCampaignStats.map(stat => ({
          campaign: stat.utmCampaign,
          count: stat._count.id
        }))
      },
      users: usersWithUtm.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        utm_source: user.utmSource,
        utm_medium: user.utmMedium,
        utm_campaign: user.utmCampaign,
        campaign_id: user.campaignId,
        created_at: user.createdAt.toISOString(),
        is_active: user.isActive
      }))
    });

  } catch (error) {
    console.error('Error fetching UTM analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UTM analytics' },
      { status: 500 }
    );
  }
}
