import type { OpportunityType, TeamKind } from './enums';
import type { PostCard } from './posts';
import type { PersonCard, UserLite } from './users';

/** An opportunity post plus why it is relevant to the viewer. */
export type OpportunityItem = PostCard & { reason: string | null };
export type OpportunityPage = { items: OpportunityItem[]; nextCursor: string | null };

export type AlertPrefs = {
  enabled: boolean;
  opportunityTypes: OpportunityType[];
  topicIds: number[];
  tags: string[];
};

export type TeamStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

type TeamBase = {
  id: string;
  kind: TeamKind;
  title: string;
  description: string;
  requiredSkills: string[];
  rolesNeeded: string[];
  commitment: string;
  maxMembers: number;
  meetingDetails: string;
  schedule: string;
  openJoin: boolean;
  status: TeamStatus;
  createdAt: string;
  owner: UserLite;
  /** Owner first, then accepted applicants */
  members: UserLite[];
  memberCount: number;
  /** The required skills the viewer already has */
  skillMatch: string[];
  isOwner: boolean;
};

export type TeamCard = TeamBase & {
  /** Only for the owner: how many applications are waiting */
  pendingCount: number | null;
  myApplicationStatus: ApplicationStatus | null;
};

export type TeamApplicant = {
  id: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  applicant: UserLite;
  /** Required skills this applicant has */
  skillOverlap: string[];
  /** The applicant is from another department than the owner */
  crossDepartment: boolean;
};

export type TeamDetail = TeamBase & {
  myApplication: { id: string; status: ApplicationStatus; message: string; createdAt: string } | null;
  /** Only for the owner; empty for everyone else */
  applications: TeamApplicant[];
  pendingCount: number | null;
  isFull: boolean;
};

/** Alumni and seniors who can advise founders, ranked for the viewer. */
export type Advisor = PersonCard & { foundedNote: string | null };
