import { generateJSON, AIError } from '../../lib/ai';
import { logger } from '../../lib/logger';
import { aiEnabled } from '../../config/env';
import { aiAssistantOut, type AiAssistantOut, type SearchQuery } from '@crossroads/shared';
import { search } from '../search/search.service';
import { aiDiscoverPeople } from '../people/people.service';

type HistoryItem = { role: 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT = `You are the Crossroads Assistant, a concierge for a college mentorship platform. Decide the single best next action for the user's message and write a short, warm reply (at most 2 sentences, no markdown).
Actions:
- "people_search": they want to find a mentor, senior, alumni or peer. Set "query" to a short description of who they want.
- "search": they want to find existing content (questions, posts, opportunities, interview experiences, teams, companies, success stories). Set "searchType" to one of: question, post, opportunity, experience, team, company, story (use "all" only if genuinely unclear which), and "query" to the search text.
- "navigate": they want a specific platform feature rather than a search. Set "destination" to exactly one of: prep (placement readiness dashboard), roadmaps-generate (AI roadmap generator), people-mentor (mentor finder), ask-new (post a new question), sim-setup (mock interview simulator).
- "none": greetings, thanks, or anything that does not fit the above — reply conversationally and briefly suggest what you can help with.
Never invent a platform feature beyond the ones listed here. Return only valid JSON matching the given shape.`;

/** Keyword-based fallback used when AI is disabled or the call fails — same action shape, no model required. */
function deterministicAssistant(message: string): AiAssistantOut {
  const m = message.toLowerCase();
  if (/\b(mentor|senior|alumni|connect with|find (a|someone)|guide me)\b/.test(m)) {
    return { reply: "Here's who I found for you:", action: 'people_search', query: message };
  }
  if (/\b(prep|placement|readiness|aptitude)\b/.test(m)) {
    return { reply: 'Your placement prep dashboard tracks exactly this.', action: 'navigate', destination: 'prep' };
  }
  if (/\b(roadmap|skill gap|semester plan)\b/.test(m)) {
    return { reply: 'The roadmap generator can build you a plan.', action: 'navigate', destination: 'roadmaps-generate' };
  }
  if (/\b(mock interview|simulator|practice interview)\b/.test(m)) {
    return { reply: 'The interview simulator is a good place to practice.', action: 'navigate', destination: 'sim-setup' };
  }
  if (/\b(internship|opportunity|job|hiring)\b/.test(m)) {
    return { reply: 'Here is what I found in opportunities:', action: 'search', searchType: 'opportunity', query: message };
  }
  if (/\b(interview experience|rounds|company)\b/.test(m)) {
    return { reply: 'Here is what I found in interview experiences:', action: 'search', searchType: 'experience', query: message };
  }
  if (/\b(team|teammate|hackathon|project partner)\b/.test(m)) {
    return { reply: 'Here is what I found in open teams:', action: 'search', searchType: 'team', query: message };
  }
  if (/\b(question|doubt|how do i|how to)\b|\?/.test(m)) {
    return { reply: 'Here is what I found in questions:', action: 'search', searchType: 'question', query: message };
  }
  return {
    reply:
      "I can help you find a mentor, search past questions and interview experiences, or point you to prep tools. Try something like “find an alumni mentor in machine learning”.",
    action: 'none',
  };
}

export async function askAssistant(viewerId: string, message: string, history: HistoryItem[]) {
  let parsed: AiAssistantOut;
  let usedAI = false;

  if (!aiEnabled) {
    parsed = deterministicAssistant(message);
  } else {
    try {
      const convo = history.map((h) => `${h.role}: ${h.content}`).join('\n');
      parsed = await generateJSON({
        system: SYSTEM_PROMPT,
        user: `${convo ? `Conversation so far:\n${convo}\n\n` : ''}User: ${message}`,
        schema: aiAssistantOut,
        maxTokens: 300,
      });
      usedAI = true;
    } catch (err) {
      if (!(err instanceof AIError)) logger.warn({ err }, 'unexpected error in assistant');
      else logger.warn({ err }, 'AI call failed, serving the deterministic assistant fallback');
      parsed = deterministicAssistant(message);
    }
  }

  const base = { reply: parsed.reply, action: parsed.action, destination: parsed.destination, usedAI };

  if (parsed.action === 'people_search') {
    const { people } = await aiDiscoverPeople(viewerId, parsed.query || message);
    return { ...base, people: people.slice(0, 6) };
  }
  if (parsed.action === 'search') {
    const q: SearchQuery = { q: (parsed.query || message).slice(0, 80), type: parsed.searchType ?? 'all', limit: 6 };
    const results = await search(q);
    return { ...base, results };
  }
  return base;
}
