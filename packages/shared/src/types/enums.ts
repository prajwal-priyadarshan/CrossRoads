// String unions mirroring the Prisma enums, so the web app doesn't import Prisma.
export type Role = 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN';
export type GoalTrack = 'PRODUCT' | 'SERVICE' | 'QUANT_FINANCE' | 'RESEARCH' | 'STARTUP' | 'MS' | 'MBA' | 'UNDECIDED';
export type PostKind = 'DISCUSSION' | 'QUESTION' | 'OPPORTUNITY';
export type OpportunityType =
  | 'INTERNSHIP'
  | 'HACKATHON'
  | 'RESEARCH'
  | 'EVENT'
  | 'REFERRAL'
  | 'STUDY_GROUP'
  | 'COLLABORATION'
  | 'CAREER_GUIDANCE';
export type ConnectionKind = 'CONNECT' | 'MENTORSHIP' | 'COLLAB' | 'PEER_GUIDANCE';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
export type TeamKind = 'HACKATHON' | 'PROJECT' | 'STARTUP' | 'STUDY_CIRCLE';
export type PrepCategory = 'OA' | 'APTITUDE' | 'TECHNICAL' | 'HR';
export type SimRoundType = 'APTITUDE' | 'CODING' | 'CS_FUNDAMENTALS' | 'TECHNICAL' | 'HR';
export type EventCategory =
  | 'DEADLINE'
  | 'CLUB'
  | 'EXAM'
  | 'HACKATHON'
  | 'PLACEMENT'
  | 'EVENT'
  | 'REUNION'
  | 'CHAPTER_MEET'
  | 'WEBINAR';
