import { randomBytes } from 'crypto';
import type { CampaignCard, CampaignDetail, DonateInput, DonationReceipt } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { userLiteSelect } from '../users/users.serializers';

const RUPEE_TO_PAISE = 100;
const DAY_MS = 864e5;

const daysLeft = (endsAt: Date | null) => (endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY_MS)) : null);

/** Money raised and donors: each signed-in donor counts once, and each anonymous donation counts as its own donor. */
async function totals(campaignId: string) {
  const sum = await prisma.donation.aggregate({ where: { campaignId }, _sum: { amountPaise: true } });
  const named = await prisma.donation.findMany({ where: { campaignId, userId: { not: null } }, distinct: ['userId'], select: { userId: true } });
  const anonymous = await prisma.donation.count({ where: { campaignId, userId: null } });
  return { raisedPaise: sum._sum.amountPaise ?? 0, donorCount: named.length + anonymous };
}

export async function listCampaigns(): Promise<CampaignCard[]> {
  const rows = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
  return Promise.all(
    rows.map(async (c) => ({
      slug: c.slug,
      title: c.title,
      category: c.category,
      goalPaise: c.goalPaise,
      endsAt: c.endsAt?.toISOString() ?? null,
      ...(await totals(c.id)),
    })),
  );
}

export async function getCampaign(slug: string): Promise<CampaignDetail> {
  const c = await prisma.campaign.findUnique({ where: { slug } });
  if (!c) throw notFound('Campaign not found');
  const recent = await prisma.donation.findMany({
    where: { campaignId: c.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, amountPaise: true, message: true, anonymous: true, createdAt: true, user: { select: userLiteSelect } },
  });
  return {
    slug: c.slug,
    title: c.title,
    category: c.category,
    goalPaise: c.goalPaise,
    endsAt: c.endsAt?.toISOString() ?? null,
    story: c.story,
    ...(await totals(c.id)),
    recent: recent.map((d) => ({
      id: d.id,
      amountPaise: d.amountPaise,
      message: d.message,
      createdAt: d.createdAt.toISOString(),
      donor: d.anonymous ? null : d.user,
    })),
  };
}

export async function donate(viewerId: string, slug: string, input: DonateInput): Promise<DonationReceipt> {
  const c = await prisma.campaign.findUnique({ where: { slug } });
  if (!c) throw notFound('Campaign not found');
  const receipt = `RCPT-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const d = await prisma.donation.create({
    data: {
      campaignId: c.id,
      userId: viewerId,
      amountPaise: input.amountRupees * RUPEE_TO_PAISE,
      anonymous: input.anonymous,
      message: input.message,
      receipt,
      // Test mode until the college's payment gateway and finance approval are in place
      testMode: true,
    },
  });
  return { receipt: d.receipt, amountPaise: d.amountPaise, campaignTitle: c.title, testMode: d.testMode, createdAt: d.createdAt.toISOString() };
}
