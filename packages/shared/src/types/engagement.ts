import type { UserLite } from './users';

export type EventCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  link: string | null;
  region: string | null;
  capacity: number | null;
  pricePaise: number;
  rsvpCount: number;
  seatsLeft: number | null;
  mine: boolean;
  myCode: string | null;
};

export type CampaignCard = {
  slug: string;
  title: string;
  category: 'INFRASTRUCTURE' | 'RESEARCH' | 'SCHOLARSHIPS';
  goalPaise: number;
  raisedPaise: number;
  donorCount: number;
  endsAt: string | null;
};

export type CampaignDetail = CampaignCard & {
  story: string;
  recent: Array<{ id: string; amountPaise: number; message: string; createdAt: string; donor: UserLite | null }>;
};

export type DonationReceipt = {
  receipt: string;
  amountPaise: number;
  campaignTitle: string;
  testMode: boolean;
  createdAt: string;
};

export type AdminAnalytics = {
  generatedAt: string;
  totals: { users: number; active30d: number; questions30d: number; answers30d: number; mentorshipsAccepted: number; mentorshipsCompleted: number };
  byRole: Record<string, number>;
  byDepartment: Array<{ department: string; users: number; answers: number }>;
  byBatch: Array<{ batchYear: number; users: number }>;
};
