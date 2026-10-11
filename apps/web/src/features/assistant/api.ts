import { useMutation } from '@tanstack/react-query';
import type { GuideAnswer, PersonCard, SearchResults } from '@crossroads/shared';
import { api } from '@/lib/api';

export type AssistantHistoryItem = { role: 'user' | 'assistant'; content: string };

export type AssistantResponse = {
  reply: string;
  action: 'search' | 'people_search' | 'navigate' | 'docs' | 'none';
  destination?: 'prep' | 'roadmaps-generate' | 'people-mentor' | 'ask-new' | 'sim-setup';
  usedAI: boolean;
  people?: PersonCard[];
  results?: SearchResults;
  docs?: GuideAnswer;
};

export const useAssistantAsk = () =>
  useMutation({
    mutationFn: (body: { message: string; history: AssistantHistoryItem[] }) =>
      api<AssistantResponse>('/assistant/ask', { method: 'POST', json: body }),
  });
