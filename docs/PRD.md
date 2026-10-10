# Crossroads — Product Requirements Document (PRD)

> **Working name:** Crossroads (final name to be decided)
> **Version:** 2.0 · **Date:** 2026-10-10 · **Build window:** 10–12 hours for the core product
> **Companion files:** `TRD.md` (technical design) · `phases/phase-00.md` … `phases/phase-11.md` (step-by-step build guide) · `phases/phase-12.md` (institutional layer, after every other phase: see F49–F57 below)
> **Stack in one line:** React (Vite + TypeScript) frontend · Node.js (Express + TypeScript) backend · PostgreSQL with Prisma · deployed on Vercel + Render + Neon

---

## Table of contents

1. Summary
2. The problem
3. Target users and personas
4. Goals, non-goals and success metrics
5. Product principles
6. Feature catalogue (every feature, priority and phase)
7. Requirements coverage check (your notes → features → phases)
8. Detailed functional requirements by module
9. Key user flows and the demo story
10. Gamification rules
11. Wellbeing, trust, safety and privacy requirements
12. UX and UI requirements (design system and screens)
13. Non-functional requirements
14. Release plan and time budget
15. Out of scope and future roadmap
16. Open questions to verify

---

## 1. Summary

Crossroads is a campus network where students — especially first years — get guidance from the seniors and alumni of **their own college**. It brings together:

- an **alumni and senior Q&A** ("Ask a Senior") where answers are stored and reused for every future batch,
- a **Reddit-style community feed** organised by topics,
- **people discovery and smart matching** that explains why each person is a good fit,
- **campus-specific placement intelligence**: company pages, structured interview experiences, a placement dashboard, AI roadmaps and an OA/interview simulator built from alumni experiences,
- **collaboration tools**: opportunities board, team finder, founder track, study circles and mentorship sessions,
- **gentle gamification** that rewards helping others, and
- **success stories** that inspire students,

all designed **wellbeing-first**: the product reduces the confusion, isolation and "falling behind" feeling of the first year, and gives every student the guidance that today only well-connected students get.

---

## 2. The problem

First years arrive with no map of college life. The guidance they need exists only in seniors' heads and in scattered WhatsApp groups.

| When | What the student struggles with | Effect on the student |
|---|---|---|
| First month | Information scattered across many WhatsApp groups; unclear rules on attendance, grading, hostel, campus | Confusion, missed deadlines, early stress |
| Semester 1 | Too many clubs and no idea which are worth it; "Should I start coding? DSA or development?"; how much CGPA matters | Overload, FOMO, wasted time |
| Semester 2 | No team for project or startup ideas; no idea which companies visit campus or what they test | Drifting, low confidence |
| First summer | No plan for the break; realising time was lost | Regret, comparing themselves to peers |
| Years 2–4 | Interview prep without campus-specific information; no idea what each company's rounds look like | Unfocused preparation, anxiety before placements |

Underneath all of this is an emotional layer: homesickness, isolation and feeling behind. Crossroads cannot replace counselling, but it reduces the uncertainty that feeds stress and points students to official support.

### Why current options fall short

| Channel | What works | What falls short |
|---|---|---|
| WhatsApp groups | Free, fast, everyone is there | Answers get buried, the same questions repeat, no way to tell good advice from bad |
| Seniors in person | Trusted and specific | Depends on who you know; unfair to shy or outstation students |
| Official college notices | Accurate | Formal, scattered, says nothing about which choices actually help |
| LinkedIn | Shows where alumni work | Not campus-specific; first years rarely use it; cold messages go unanswered |
| YouTube, Reddit, generic career sites | Lots of material | Generic, not about this college, its clubs or the companies that visit |
| Institutional alumni platforms | Built for alumni relations | Usually focused on alumni engagement and fundraising, not on first-year guidance *(verify current offerings before any pitch claim)* |

**The real competitor is WhatsApp.** Crossroads must be clearly better at specific jobs: **search, verified answers, finding the right people, and campus-specific knowledge**.

---

## 3. Target users and personas

### 3.1 User types

| User | Who | What they need | Role value in the system |
|---|---|---|---|
| First year (primary) | New students in any branch | This week's answers, direction, a team, belonging | `STUDENT` with `currentYear = 1` |
| Junior | 2nd and 3rd year students building skills | Interview experiences, mentors, teammates, opportunities, prep tracking | `STUDENT` with `currentYear = 2–3` |
| Senior | Final-year students who just went through placements | A low-effort way to help, recognition, juniors for projects | `SENIOR` |
| Alumni | Graduates in industry, research or startups | Optional giving back; finding interns and co-founders; reconnecting | `ALUMNI` |
| Moderator / admin | Student body or college staff | Keep content safe, accurate and current; manage events, stories and campaigns | `ADMIN` |

**Alumni are never required to post.** An alumnus can simply keep a profile (name, batch, branch, current company and role, LinkedIn and GitHub) and say what they can help with.

### 3.2 Personas used throughout the docs

- **Ananya** — first year, CSE-AI. Knows a little Python, interested in AI/ML, wants a product-company job one day, feels behind compared with classmates who "already know everything".
- **Rahul** — final-year senior. Did a computer vision internship, placed at a product company. Happy to help but tired of answering the same WhatsApp questions.
- **Meera** — alumna, ML engineer at a product company, mentors occasionally, open to referrals.
- **Karthik** — 3rd year, preparing for placements, needs company-specific prep and a team for a hackathon.
- **Admin (Student Council)** — manages This Week events, verifies seniors and alumni, reviews reports, publishes success stories.

---

## 4. Goals, non-goals and success metrics

### 4.1 Goals for the hackathon build

1. A first year signs up, completes onboarding and sees a feed and people that clearly fit them **within 2 minutes**.
2. A question gets a senior's answer, and that answer becomes **searchable and reusable** for everyone.
3. Every match, feed item, recommendation and AI answer explains **why** it was shown or **where** it came from.
4. Campus placement intelligence works end to end: company page → experiences → readiness → roadmap → practice.
5. The product **looks finished**: consistent, fast and polished on desktop and mobile, in light and dark mode.

### 4.2 Non-goals for the hackathon build

- Native mobile apps (the web app is responsive instead).
- Email digests and push notifications (in-app notifications only).
- Video calls inside the product.
- Real money movement without the college's financial approval (payments run in **test mode** only; see Phase 11).
- Ratings of individual faculty members.

### 4.3 Pilot metrics (after launch)

These are **starting goals for a pilot, not industry benchmarks**. Adjust them after the first weeks of real data.

| Metric | What it shows | Pilot target |
|---|---|---|
| Weekly active first years after week 6 | A real habit, not novelty | 30% of signed-up first years |
| Median time to a verified answer | The senior network works | Under 24 hours |
| Share of questions answered by existing knowledge (similar questions / AI) | Answers compound | Rising month on month |
| Active senior and alumni contributors | Supply side is healthy | 30 or more |
| Confidence survey (start vs end of pilot) | Wellbeing impact | Clear improvement |
| Students who found a club, teammate or mentor through the app | Real-world connection | Tracked and reported |

---

## 5. Product principles

1. **Wellbeing first.** No public rankings of students, no comparison leaderboards for juniors, no streak guilt. Gamification rewards **helping others**, not grinding.
2. **Answer once, help every batch.** Every answer is stored, searchable and reused. Similar questions are shown before a new one is posted.
3. **Campus-specific.** Our clubs, our visiting companies, our alumni paths.
4. **Fair access.** Everyone gets what only well-connected students get today.
5. **Trust.** Verified college accounts; "Self-reported" labels wherever nothing has been verified; reporting and moderation; links to official counselling.
6. **Explain everything.** Matches, feed items and AI answers always show their reasons and sources.
7. **Privacy by default.** Users control which contact details are visible. Data is never sold. Recruiter-style access is out of scope.

---

## 6. Feature catalogue

**Priority:** **P0** = must work in the demo · **P1** = build if the phase is on time · **P2** = stretch inside the 12 hours (otherwise shown as a "Coming next" card) · **L** = later feature, built after the hackathon (Phase 11).

| # | Feature | What it does | Priority | Phase |
|---|---|---|---|---|
| F01 | Verified sign-up | College email + password; email verification code; alumni invited via allowlist; outsiders blocked | P0 | 2 |
| F02 | Onboarding wizard | Role, department/branch, batch, current company and role (alumni), skills, interests, target roles, target companies, goal track, "I can help with", "I'm looking for", LinkedIn, GitHub, visibility | P0 | 2 |
| F03 | People-first profiles | Department, academic year or graduation year, skills, interests, projects, achievements, target roles, experience, links, "I can help with", "I'm looking for", mentoring preferences, visibility controls, edit profile | P0 | 3 |
| F04 | Alumni profiles | Name, batch, branch, current company and role, LinkedIn and GitHub links, availability and help areas | P0 | 3 |
| F05 | Discover People | Search students, seniors and alumni; filter by department, batch/graduation year, role, skills, target role, interests, target company, mentor availability | P0 | 3 |
| F06 | Smart People Matching | Weighted matching on skills, interests, goals, experience, help-with ↔ looking-for; explanation for every suggestion; no trained ML model | P0 | 3 |
| F07 | Find My Alumni Mentor | Match students with alumni by target company, role, skills and experience; see availability and help areas | P0 | 3 |
| F08 | Connection and mentorship requests | Connect / mentorship / project collaboration / peer guidance requests with a specific reason; accept or decline; track pending, accepted, declined | P0 | 3 |
| F09 | Ask a Senior (alumni Q&A) | Ask with a topic (SDE interviews, internships, AI/ML…); seniors and alumni answer publicly or offer mentorship; best answer; "Helpful" votes; profile links | P0 | 4 |
| F10 | Community feed (Reddit-style) | Text posts with title, description and tags; comment; upvote/downvote; sort Latest / Top | P0 | 4 |
| F11 | Topic communities and follow | DSA and LeetCode · AI/ML and Generative AI · Placements and Interview Experiences · Internships and Referrals · Hackathons and Projects · Campus Life and Academics; tags act as lightweight communities | P0 | 4 |
| F12 | Connect with post authors | From any post or answer, open the author's profile and send a request | P0 | 4 |
| F13 | Similar questions before posting | While typing, show already-answered similar questions | P0 | 4 |
| F14 | Personalized home | Feed of recent discussions ranked for the user with reasons, topic filters, recommended people, pending mentorship requests, recent opportunities, quick links to update skills and interests | P0 | 5 |
| F15 | This Week | Academic-calendar feed: club recruitment, exams, hackathons, placement drives, deadlines | P0 | 5 |
| F16 | Year 1 quests | Private, non-competitive checklist for first years | P1 | 5 |
| F17 | Bookmarks | Save posts, questions, experiences, roadmaps, stories | P1 | 5 |
| F18 | Trending topics | Most active topics in the last 7 days | P1 | 5 |
| F19 | Search across college knowledge | One search across posts, questions, interview experiences, project/team listings, people, companies, stories; filters for topic, company, department, batch and post type; Cmd/Ctrl+K palette + full search page | P0 | 5 |
| F20 | Company pages | For each company that visits campus: roles, rounds, skills tested, alumni who work there, prep roadmap, interview experiences | P0 | 6 |
| F21 | Verified Interview Experiences | Structured: company, role, year, round-wise topics, difficulty, preparation resources, optional outcome; "Self-reported" unless verified | P0 | 6 |
| F22 | Clubs directory with honest ratings | What each club does, time commitment, skills gained, recruitment month; seniors rate usefulness and time cost | P0 | 6 |
| F23 | Path Twins | Alumni journeys of people who started where you are: year-by-year milestones | P1 | 6 |
| F24 | Career roadmaps from real students | Seniors share how they reached a goal (skills, projects, resources, mistakes); others save and follow | P0 | 6 |
| F25 | Roadmaps by goal | Product company job · Quant or finance · Build a startup · MS (higher studies) · MBA · Service company · Research | P0 | 6 + 9 |
| F26 | Opportunities board | Internships, hackathons, research openings, events, study groups, collaboration, referral and career-guidance opportunities as tagged posts; filter by category; connect with poster | P0 | 7 |
| F27 | Personalized opportunity alerts | Students choose interests (e.g. AI internships, hackathons, SDE roles) and get in-app alerts when matching posts appear | P1 | 7 |
| F28 | Team Finder | Project or hackathon listings with idea, required skills, commitment; apply; accept or reject | P0 | 7 |
| F29 | Cross-department collaboration | Listings ask for complementary roles (designer, business, ML engineer…); filter by role needed | P0 | 7 |
| F30 | Founder track | Startup listings seeking co-founders; alumni founders as advisors | P1 | 7 |
| F31 | Study circles | Create and join small groups for DSA, research reading, exam prep or projects; goal, schedule, meeting details (no video) | P1 | 7 |
| F32 | Mentorship sessions | Mentors list topics and simple availability; students request short sessions with a specific question; mark completed; follow-up actions tracked | P1 | 7 |
| F33 | In-app notifications | Answers, comments, requests, applications, badges, opportunity alerts | P0 | 7 |
| F34 | Gamification for contributors | Helpfulness points, levels, meaningful badges, contributions section on profiles | P0 | 8 |
| F35 | Trust and contribution system | Helpful votes, best answers, verified senior/alumni badges, self-reported labels, mentors who consistently contribute | P0 | 8 |
| F36 | Mentor wall | Opt-in monthly thank-you list of top helpers (seniors/alumni only) | P1 | 8 |
| F37 | Success stories and spotlights | Magazine-style section highlighting notable alumni and student achievements; spotlight on home | P1 | 8 |
| F38 | Reporting and moderation | Report spam, misleading opportunities or inappropriate posts; admin review queue; remove content | P0 | 8 |
| F39 | Admin tools | Reports queue, verify users, invite alumni, manage This Week events, companies, clubs, stories | P1 | 8 |
| F40 | AI answer assistant | Draft answer built only from existing senior answers with citations | P1 | 9 |
| F41 | AI-generated summaries | Summaries of long discussion threads and of a company's interview experiences | P2 | 9 |
| F42 | Experience-to-Roadmap generator | Converts alumni journeys, roadmaps and experiences into a step-by-step plan; maps skills to projects, resources and practice tasks; compares current skills with the target role; explains which gaps to address first and why | P1 | 9 |
| F43 | Personalized placement dashboard | Target companies, roles and upcoming recruitment; **OA, aptitude, technical interview and HR prep tracked separately**; readiness by skill; deadlines; recommended next actions; adapts to year and skill level | P1 | 9 |
| F44 | Campus OA and interview simulator | Mock assessments generated from alumni experiences; aptitude, coding, CS fundamentals, technical and HR rounds; adaptive difficulty; explanations, rubrics and revision suggestions; source and year shown for every question | P2 | 9 |
| F45 | Support page | Official counselling links (verified), wellbeing principles, community guidelines, how to report | P0 | 10 |
| F46 | Polished UI | Dark mode, responsive, empty states, skeletons, toasts, motion, accessibility | P0 | 0 + 10 |
| F47 | Event management and ticketing | Create and track reunions, regional chapter meets and webinars; RSVPs; paid tickets in test mode; QR check-in | L | 11 |
| F48 | Donation and fundraising gateway | Campaigns for infrastructure, research and scholarships; secure payments in test mode; progress, receipts, donor wall | L | 11 |
| F49 | Official channel | Verified "Official" posts and badges for the registrar, placement cell, alumni relations, departments and clubs; distinct from student posts; surfaced in This Week and personalized home | P0 | 12 |
| F50 | Placement cell data ownership | Placement-cell-owned company records, drive calendar and eligibility criteria; bulk import; "Verified by placement cell" state for interview experiences | P0 | 12 |
| F51 | Institution analytics dashboard | Staff-facing dashboard: engagement, questions, mentorship sessions, alumni response rate, per-department/batch breakdowns; CSV/PDF export | P0 | 12 |
| F52 | Alumni engagement record | Per-alumnus record of hours given, areas helped, students helped; auto-generated acknowledgement/certificate; feeds Mentor Wall | P1 | 12 |
| F53 | Faculty and staff role | `FACULTY_STAFF` role distinct from `ADMIN`: posts as a department/office, sees aggregate department analytics, no platform-wide moderation unless also admin | P1 | 12 |
| F54 | Safeguarding escalation path | Dedicated harassment/safety report category routed to a designated student-welfare contact; staff-coordinator visibility into first-year mentor–mentee threads, disclosed at request time | P0 | 12 |
| F55 | Consent and data rights | Sign-up consent screen, self-serve data export, self-serve account/data deletion, public data-processing notice | P0 | 12 |
| F56 | Vendor/landscape comparison note | Internal, re-verified-per-pitch comparison against existing institutional alumni platforms the college may already use | P2 | 12 |
| F57 | Pilot scorecard | Fixed, pre-agreed pilot success metrics tracked on the institution dashboard from day one of a pilot | P1 | 12 |

---

## 7. Requirements coverage check

Every line in your feature notes is listed below with the feature that implements it and the phase that builds it. Nothing has been left out.

### 7.1 "Features" section

| Your requirement | Covered by | Phase |
|---|---|---|
| Alumni profiles: name, batch, branch, current company and role, LinkedIn and GitHub | F02, F04 | 2, 3 |
| Company pages: roles, rounds, skills tested, alumni who work there, prep roadmap; alumni contribute interview experiences | F20, F21 | 6 |
| Roadmaps by goal (product company, quant/finance, startup, MS or MBA), AI-generated from available data | F24, F25, F42 | 6, 9 |
| Clubs directory | F22 | 6 |
| Founder track | F30 | 7 |
| Ask an alumnus | F09 | 4 |

### 7.2 Priority table from your notes

| Your requirement | Your priority | Covered by | Phase |
|---|---|---|---|
| Topic-based feed and tags | P0 | F10, F11 | 4 |
| Create posts and comments | P0 | F10 | 4 |
| Upvotes and downvotes | P0 | F10 | 4 |
| Follow topics | P0 | F11 | 4 |
| Connect with post authors | P0 | F12 | 4 |
| Sort by Latest and Top | P0 | F10 | 4 |
| Bookmarks | P1 | F17 | 5 |
| Trending topics | P1 | F18 | 5 |
| Reputation and badges | P2 in your notes → **P0 here** (gamification was requested) | F34, F35 | 8 |
| AI-generated summaries | P2 | F41 | 9 |

### 7.3 Modules A–E

| Your requirement | Covered by | Phase |
|---|---|---|
| A. Search students, seniors and alumni | F05 | 3 |
| A. Filter by department, batch, skills, target role and interests | F05 | 3 |
| A. Display skills, projects, achievements and what each person can help with | F03 | 3 |
| A. Explain why a person matches the search | F06 | 3 |
| B. Request mentorship with a specific reason | F08 | 3 |
| B. Request project collaboration or peer guidance | F08 | 3 |
| B. Accept or decline incoming requests | F08 | 3 |
| B. Track pending, accepted and declined requests | F08 | 3 |
| C. Department, academic year or graduation year | F03 | 3 |
| C. Skills, interests, projects and target roles | F03 | 3 |
| C. "I can help with" and "I'm looking for" | F02, F03 | 2, 3 |
| C. Edit profile and control which contact information is visible | F03 | 3 |
| D. Share internships, hackathons, research openings and project-team requests | F26, F28 | 7 |
| D. Browse and filter posts by category | F26 | 7 |
| D. Connect with the person who posted an opportunity | F26, F12 | 7 |
| E. Recommended people | F14 | 5 |
| E. Pending mentorship requests | F14 | 5 |
| E. Recent community opportunities | F14 | 5 |
| E. Quick links to update skills and interests | F14 | 5 |

### 7.4 Reddit-inspired feed, Discover People, Profiles, Opportunities Board, Personalized Home

| Your requirement | Covered by | Phase |
|---|---|---|
| Create text posts with titles, descriptions and tags | F10 | 4 |
| Browse posts by topic community | F11 | 4 |
| Comment, upvote and downvote | F10 | 4 |
| Sort by Latest or Top | F10 | 4 |
| Open the author's profile and send a connection request | F12 | 4 |
| Six initial topic communities | F11 (seeded in Phase 1) | 1, 4 |
| Tags as lightweight communities | F11 (tag pages `/community/tag/:tag`) | 4 |
| Find people across departments and batches; seniors/alumni with relevant experience; peers with similar technologies | F05, F06 | 3 |
| View skills, experience, interests and mentoring preferences | F03 | 3 |
| Send a connection request with a short message | F08 | 3 |
| Profile with department, batch, skills, interests, experience and links | F03 | 3 |
| Opportunities: hackathons and project-team openings, internships and events, study groups and collaboration requests, referral and career-guidance opportunities — as tagged posts | F26 | 7 |
| Home: feed of recent discussions, topic filters, suggested people | F14 | 5 |

### 7.5 Numbered features 1–12

| # | Your requirement | Covered by | Phase |
|---|---|---|---|
| 1 | Ask a Senior: question form, topic tag, senior responses, profile links; seniors respond publicly or offer mentorship | F09 ("Offer mentorship" button on answers) | 4 |
| 2 | Smart People Matching with explanations (e.g. computer vision learner ↔ senior who built CV projects) | F06 (project text is also matched) | 3 |
| 3 | Team Finder: create listing, browse, apply, accept or reject | F28 | 7 |
| 4 | Verified Interview Experiences with self-reported labels | F21 | 6 |
| 5 | Study Circles: create, join, description, meeting details, goal and schedule | F31 | 7 |
| 6 | Trust and Contribution System: helpful votes and contributions section | F35, F34 | 8 |
| 7 | Career Roadmaps from real students: skills, projects, resources, mistakes; save and follow | F24 | 6 |
| 8 | Mentorship Sessions: topics, slots, short sessions, mark completed | F32 | 7 |
| 9 | Search across college knowledge with filters (topic, company, department, batch, post type); PostgreSQL full-text first | F19 | 5 |
| 10 | Personalized Opportunity Alerts (in-app only) | F27 | 7 |
| 11 | Cross-Department Collaboration | F29 | 7 |
| 12 | Helpful Content and Reporting: report, moderator controls, review | F38, F39 | 8 |

### 7.6 Alumni Experience Management + Campus-Specific Placement Intelligence

| Your requirement | Covered by | Phase |
|---|---|---|
| 1. Placement dashboard: select target companies, roles and upcoming recruitment | F43 | 9 |
| 1. Track OA, aptitude, technical interview and HR preparation separately | F43 (four prep tracks) | 9 |
| 1. Readiness by skill, upcoming deadlines, recommended next actions | F43 | 9 |
| 1. Adapt to year and current skill level | F43 | 9 |
| 2. Simulator: mock assessments from alumni experiences | F44 | 9 |
| 2. Aptitude, coding, CS fundamentals, technical and HR rounds | F44 | 9 |
| 2. Adjust difficulty by performance | F44 | 9 |
| 2. Explanations, rubrics and revision suggestions | F44 | 9 |
| 2. Source and year of the experience behind each question | F44 | 9 |
| 3. Experience-to-Roadmap: convert alumni journeys into plans | F42 | 9 |
| 3. Map skills to projects, resources and practice tasks | F42 | 9 |
| 3. Compare current skills against the target role | F42 | 9 |
| 3. Explain which gaps to address first and why | F42 | 9 |
| 4. Find My Alumni Mentor: match by target company, role, skills, experience | F07 | 3 |
| 4. Short, focused mentorship session with a specific question | F32 | 7 |
| 4. View alumni availability and help areas | F07, F03 | 3 |
| 4. Track requests, accepted sessions and follow-up actions | F08, F32 | 3, 7 |

### 7.7 Later features

| Your requirement | Covered by | Phase |
|---|---|---|
| Event management: create, track and sell tickets for reunions, regional chapter meets and webinars | F47 | 11 (after hackathon) |
| Donation and fundraising gateway for infrastructure, research and scholarships | F48 | 11 (after hackathon) |
| Success stories and spotlights magazine/blog | F37 — **pulled forward into the core build** because it is cheap and strengthens the demo | 8 |

### 7.8 Features from our earlier discussion

| Requirement | Covered by | Phase |
|---|---|---|
| First-year focus and wellbeing-first design | Principles §5, F15, F16, F45 | 5, 10 |
| Personalized feed for each user | F14 | 5 |
| Alumni Q&A system | F09, F13, F40 | 4, 9 |
| Gamification | F34–F36, F16 | 5, 8 |
| Novel features: Path Twins, honest club ratings, compounding answers, This Week, quests | F23, F22, F13/F40, F15, F16 | 4–6, 9 |
| Cut list and fallbacks for the time limit | `TRD.md` §15 | — |

---

## 8. Detailed functional requirements by module

Each requirement has an ID so the phase files can refer to it.

### 8.1 Accounts and onboarding (F01, F02)

- **FR-AUTH-1** A user registers with email, password (min 8 characters, at least one letter and one number) and full name.
- **FR-AUTH-2** The email must belong to an allowed college domain **or** be on the invite allowlist (alumni with personal emails). Otherwise registration fails with "Use your college email address. Alumni can ask an admin for an invite."
- **FR-AUTH-3** After registering, a 6-digit verification code is sent to the email. The account is usable only after verification. In demo mode the code is printed in the server log (see TRD §9).
- **FR-AUTH-4** Login with email and password. Five failed attempts in 15 minutes from one IP are rate-limited.
- **FR-AUTH-5** Sessions use an httpOnly cookie; logout clears it.
- **FR-AUTH-6** Users who have not finished onboarding are always redirected to `/onboarding`.
- **FR-ONB-1** Four steps: **About you** (role/year, department/branch, batch or graduation year, company and job title for alumni) → **Skills and interests** → **Goals** (goal track, target roles, target companies, topics to follow) → **Connect** (I can help with, I'm looking for, LinkedIn, GitHub, visibility, consent).
- **FR-ONB-2** Validation per step; Back keeps entered values; progress bar shows step N of 4.
- **FR-ONB-3** The role is decided by the server: invited alumni → `ALUMNI`; `currentYear ≥ 4` → `SENIOR`; otherwise `STUDENT`. Users can never select `ADMIN`.

### 8.2 Profiles, people and matching (F03–F08)

- **FR-PROF-1** Public profile shows: name, role badge, verified badge, department, year or graduation year, current company and role (alumni), bio, skills, interests, target roles, projects (title, description, link), achievements, experience (journey milestones), "I can help with", "I'm looking for", mentoring availability, badges, contributions.
- **FR-PROF-2** Email, LinkedIn and GitHub are shown only if the owner enabled them.
- **FR-PROF-3** The owner can edit every field, add and remove projects and milestones, toggle mentor availability, set mentor topics and slots, and opt in or out of the mentor wall.
- **FR-PPL-1** Discover People lists onboarded users except the viewer, with filters: free text, department, role, year or graduation year, skills, interests, target role, target company (alumni currently there or students targeting it), mentor available.
- **FR-PPL-2** Every result shows a match score (0–100) and up to 2 reasons; profile pages show up to 3.
- **FR-PPL-3** Sort: Best match (default), Most helpful (points), Newest.
- **FR-PPL-4** "Find my alumni mentor" mode shows only alumni and seniors with mentor availability, ranked by target company, target role, skills and experience.
- **FR-REQ-1** Request types: Connect, Mentorship, Project collaboration, Peer guidance. A message of 10–500 characters is required; mentorship also needs a specific question or topic.
- **FR-REQ-2** Duplicate requests of the same type to the same person are blocked with a friendly message.
- **FR-REQ-3** Recipients accept or decline; both sides see the status (Pending, Accepted, Declined, Completed).
- **FR-REQ-4** Accepted requests reveal contact links that the recipient has made visible.

### 8.3 Ask a Senior and community (F09–F13)

- **FR-ASK-1** A question has a title (10–200 characters), details (optional, up to 5,000), a required topic, and up to 5 tags.
- **FR-ASK-2** While the title is typed (≥ 8 characters), up to 5 similar existing questions appear, with answer counts and a "Best answer" tag.
- **FR-ASK-3** Anyone can answer; answers from seniors and alumni are visually highlighted.
- **FR-ASK-4** Every answer has a "Helpful" vote and an "Offer mentorship" (author) / "Request mentorship" (reader) action.
- **FR-ASK-5** The asker can mark one answer as best; it is pinned to the top.
- **FR-ASK-6** Question list tabs: Unanswered, Newest, Top; filter by topic.
- **FR-COM-1** Posts (discussions) have title, description and tags; comments support one level of replies.
- **FR-COM-2** Posts and comments can be upvoted or downvoted; clicking the same vote again removes it.
- **FR-COM-3** Sort: Latest; Top (this week / all time).
- **FR-COM-4** Topic pages show description, follower count and a Follow button; tag pages list posts with that tag.
- **FR-COM-5** Every post and answer shows the author with a link to the profile and a Connect button.

### 8.4 Home, search and discovery (F14–F19)

- **FR-HOME-1** Home shows a greeting, a composer (Ask a senior / Start a discussion), feed tabs For you / Latest / Top this week, and topic filter chips.
- **FR-HOME-2** "For you" ranking uses followed topics, interests and skills, goal, opportunity match, author seniority, recency and quality; each card shows one reason chip.
- **FR-HOME-3** Right rail: This Week, Year 1 quests (first years) or Ways to help (seniors/alumni), recommended people, pending requests, recent opportunities, trending topics, success-story spotlight, and quick links to update skills and interests.
- **FR-WEEK-1** This Week lists events in the next 7 days for the user's year, with category colours and countdowns.
- **FR-QUEST-1** Quests are private, computed from real data, and never ranked.
- **FR-BM-1** Bookmark posts, questions, experiences, roadmaps and stories; `/bookmarks` lists them by type.
- **FR-SRCH-1** Cmd/Ctrl+K opens a palette with grouped results across questions, posts, opportunities, experiences, teams, people, companies and stories.
- **FR-SRCH-2** `/search` page with filters: type, topic, company, department, batch.

### 8.5 Campus intelligence (F20–F25)

- **FR-CO-1** Company list with search; tiles show roles, experience count and alumni count.
- **FR-CO-2** Company page tabs: Overview (rounds timeline, skills tested with "you have X of Y"), Experiences (filters: year, role, difficulty), Alumni (people currently there, Connect), Prep roadmap.
- **FR-EXP-1** Experience form: company, role, year, rounds (name, type, topics, difficulty 1–5, notes), prep weeks, resources, tips, optional outcome (Selected / Not selected / Prefer not to say).
- **FR-EXP-2** Experiences show "Self-reported" unless an admin verified them.
- **FR-EXP-3** The form warns against sharing questions covered by confidentiality agreements.
- **FR-CLUB-1** Clubs list with category filter and sort (Most useful, Least time, A–Z); meters for usefulness and time cost; review count; recruitment month.
- **FR-CLUB-2** Only students who are not first years can review; one review per club per user (editable).
- **FR-TWIN-1** Path Twins shows the viewer's starting point and the top 3 seniors/alumni with similar starting points, each with a year-by-year milestone timeline and reasons.
- **FR-RM-1** Roadmaps list filtered by goal track; detail page groups steps by semester; users can save a roadmap and tick steps; seniors/alumni can publish roadmaps with steps, projects, resources and "mistakes I made".

### 8.6 Collaboration (F26–F33)

- **FR-OPP-1** Opportunity post fields: title, description, type (Internship, Hackathon, Research, Event, Referral, Study group, Collaboration, Career guidance), organisation, topic, tags, deadline, external link.
- **FR-OPP-2** Filters by type; sort Closing soon / Newest; past deadlines hidden by default.
- **FR-OPP-3** "Connect with poster" from every opportunity.
- **FR-ALERT-1** Users choose alert preferences (opportunity types, topics, tags). New matching opportunities create in-app notifications.
- **FR-TEAM-1** Team listing: kind (Hackathon, Project, Startup, Study circle), title, idea, required skills, roles needed, commitment, max members, meeting details, schedule.
- **FR-TEAM-2** Apply with a message; owner accepts or rejects; owner can close the listing; accepted members are shown.
- **FR-TEAM-3** Study circles can be set to "open join" so members join instantly.
- **FR-TEAM-4** Founder track tab shows startup listings and alumni advisors.
- **FR-MENT-1** Mentors set availability, topics and simple slots (text).
- **FR-MENT-2** Accepted mentorship requests show "Mark session completed" for the mentor and a "Follow-up actions" checklist for both people.
- **FR-NOTIF-1** Bell with unread count (polled every 30 seconds), popover with the latest 8, `/notifications` page, mark as read.

### 8.7 Gamification, trust, stories and moderation (F34–F39)

- **FR-GAME-1** Points, levels and badges follow §10.
- **FR-GAME-2** Points of first years and juniors are never shown publicly.
- **FR-TRUST-1** Verified badges for seniors and alumni verified by an admin; "Self-reported" labels on unverified experiences.
- **FR-STORY-1** Admins (and invited authors) publish success stories with title, cover image URL, excerpt, body, tags, featured person; a story can be "spotlighted" on home and the landing page.
- **FR-MOD-1** Report button on posts, comments, experiences, profiles, teams and stories (reasons: spam, misleading, inappropriate, harassment, other).
- **FR-MOD-2** Admin can remove content (hidden everywhere) or dismiss a report.
- **FR-ADMIN-1** Admin panel tabs: Reports, Users (verify, invite alumni), This Week events, Companies, Clubs, Stories.

### 8.8 AI and placement intelligence (F40–F44)

- **FR-AI-1** AI answers use only existing senior answers as sources and show numbered citations.
- **FR-AI-2** AI output is always labelled and always has a non-AI fallback.
- **FR-AI-3** Rate limit: 20 AI calls per user per hour.
- **FR-RMGEN-1** Inputs: goal track, target role, target companies. Output: summary, skill gaps (skill, why, priority), steps by semester with linked projects, resources and practice tasks.
- **FR-DASH-1** Dashboard: target companies and roles; readiness per company; four prep tracks (OA, Aptitude, Technical, HR) with checklists and progress; deadlines in 30 days; next actions; copy adapts to year.
- **FR-SIM-1** Simulator: pick company and round type; questions generated from that company's experiences; each question shows source experience year and role; multiple choice for aptitude and CS fundamentals; short written answers for technical and HR with rubric-based feedback; coding questions show the problem and evaluate an explanation of the approach (no code execution).
- **FR-SIM-2** Difficulty moves up after 2 correct answers in a row and down after 2 wrong answers in a row.
- **FR-SIM-3** Session summary: score, topics to revise, links to related experiences.

### 8.9 Later features (F47, F48)

- **FR-EVT-1** Admins create events (reunion, chapter meet, webinar) with date, location or link, capacity, free or paid.
- **FR-EVT-2** Users RSVP (free) or buy a ticket (paid, test mode); tickets have a QR code; admins check in attendees.
- **FR-DON-1** Admins create campaigns (infrastructure, research, scholarship) with goal amount and story.
- **FR-DON-2** Donors pay through a payment gateway in test mode; donations update progress; donors can stay anonymous; receipts are generated.
- **FR-LEGAL-1** No real payments until the college's finance office approves the flow, accounts and tax receipts.

---

## 9. Key user flows and the demo story

### 9.1 Demo story (must be flawless)

1. **Ananya** (first year, CSE-AI) signs in with her college email.
2. Onboarding: skills *Python*; interests *AI/ML*; goal *Product company job*; target company *two visiting companies*; looking for *mentorship, teammates*.
3. **Home** shows This Week ("Coding club recruitment closes Friday"), her Year 1 quests, recommended people and a feed with reason chips ("Because you follow AI/ML").
4. She types "Which coding club should I join?" — **similar answered questions** appear and the **AI assistant** drafts an answer citing two seniors.
5. **Discover People** → "Find my alumni mentor": **Meera** matched "because she works at your target company, knows Computer Vision and can help with interview prep". Ananya sends a mentorship request with a specific question.
6. **Company page** shows rounds, skills tested ("you have 2 of 6"), round-wise experiences and alumni who work there.
7. **Path Twins** shows how **Rahul**, who started where she is, reached a product company.
8. **Generate my roadmap** gives a semester plan with skill gaps explained.
9. **Placement dashboard** shows readiness and the four prep tracks; she tries a 5-question **aptitude simulation** sourced from 2025 experiences.
10. **Teams** → she applies to a cross-department hackathon team.
11. Switch to **Rahul**: he answers a question, earns helpfulness points and a badge (celebration toast), accepts a request.
12. Close on **Success stories** and the **Support** page: wellbeing first.

### 9.2 User stories

| As a… | I want to… | So that… |
|---|---|---|
| First year | see what matters this week | I don't miss deadlines or recruitment |
| First year | ask without being judged and see similar answered questions first | I get a trusted answer fast |
| First year | find seniors with my interests | I have someone to learn from |
| First year | know which clubs are worth my time | I choose with real information |
| First year | see alumni who started like me | I see a realistic path |
| Junior | read structured experiences per company | I prepare for what our campus actually gets |
| Junior | track OA, aptitude, technical and HR prep separately | I know where I'm weak |
| Junior | practise with questions based on real campus experiences | I feel ready, not anxious |
| Junior | find teammates with complementary skills | I can build projects and enter hackathons |
| Junior | get alerts for opportunities I care about | I don't miss them |
| Senior | answer once and have it reused | I help many students without burning out |
| Senior / alumni | control my visible contact info | my privacy is respected |
| Senior / alumni | be recognised for helping | contributing feels worthwhile |
| Alumni | find motivated juniors and co-founders | helping is worth my time |
| Admin | review reports, verify users, manage events and stories | the space stays safe, accurate and inspiring |

---

## 10. Gamification rules

Gamification exists to **reward helping**, never to make students compare themselves.

| Action | Points | Related badge |
|---|---|---|
| Answer a question | 5 | First Answer (1 answer), Answer Machine (10 answers) |
| Answer receives a "Helpful" vote | 2 per voter | — |
| Answer marked best | 15 | Trusted Voice (3 best answers) |
| Share an interview experience | 20 | Experience Sharer |
| Review a club | 5 | Club Reviewer |
| Publish a roadmap | 20 | Roadmap Author |
| Complete a mentorship session (mentor) | 25 | Mentor |
| 10 accepted connections | — | Bridge Builder |
| Featured in a success story | — | Spotlight |

- **Levels:** Newcomer (0) → Helper (50) → Guide (150) → Mentor (400) → Legend (1000).
- **Year 1 quests** (private checklist): complete profile · follow 3 topics · ask your first question · explore 3 clubs · send your first request · save a roadmap.
- **Ways to help** (seniors/alumni): unanswered questions in your skills · clubs you can review · pending mentorship requests.
- **Mentor wall:** opt-in, seniors/alumni only, "Thank you, mentors" wording.
- **Never:** streaks, public points for juniors, loss mechanics, leaderboards of students.

---

## 11. Wellbeing, trust, safety and privacy requirements

- Verified college email accounts; alumni through the invite allowlist.
- "Self-reported" labels everywhere nothing has been verified.
- Report button on every piece of user content and every profile.
- Admin review queue; removed content disappears from feeds, search and pages.
- Support page linking to **verified** official college counselling contacts. The product does not provide counselling or medical advice.
- Contact visibility controls (email, LinkedIn, GitHub).
- Community guidelines shown on the ask and post forms (be kind, no ragging, no confidential interview content).
- No faculty ratings; no hosting of exam papers until college policy is confirmed.
- Minimal personal data; consent checkbox at onboarding; delete-account option (P1). India's **Digital Personal Data Protection Act, 2023** applies to personal data processing — **verify its current obligations before any real launch.**
- Payment features (Phase 11) run only in test mode until the college approves them.

---

## 12. UX and UI requirements

### 12.1 Visual identity

**Feeling:** a warm, trustworthy campus mentor. Calm indigo for trust, warm amber for encouragement, soft cards, generous spacing, friendly but professional.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | `#4F46E5` (indigo 600) | `#818CF8` (indigo 400) | Primary buttons, links, active nav |
| `--primary-soft` | `#EEF2FF` | `#1E1B4B` | Selected chips, tinted panels |
| `--accent` | `#F59E0B` (amber 500) | `#FBBF24` (amber 400) | Points, badges, This Week highlights |
| `--success` | `#059669` | `#34D399` | Best answer, accepted, verified |
| `--warning` | `#EA580C` | `#FB923C` | Deadlines soon |
| `--danger` | `#E11D48` | `#FB7185` | Destructive actions, reports, exams |
| `--background` | `#FAFAFB` | `#0B0B12` | Page background |
| `--card` | `#FFFFFF` | `#14141F` | Cards, panels, dialogs |
| `--border` | `#E7E7EE` | `#262635` | Card borders, dividers |
| `--foreground` | `#0F0F1A` | `#EDEDF5` | Main text |
| `--muted-foreground` | `#6B6B80` | `#A1A1B5` | Secondary text |
| Radius | 14px cards, 12px inputs, 999px chips | same | Rounded, soft |

**Typography**

- Headings: **Plus Jakarta Sans** (600/700). Body and UI: **Inter** (400/500/600). Both from Google Fonts via `@fontsource` packages (see TRD).
- Scale: page title 28/36 semibold · section title 18/28 semibold · card title 16/24 semibold · body 15/24 · meta 13/20 · micro 12/16.
- `tracking-tight` on headings; tabular numbers for counts and scores.

**Logo:** wordmark "Crossroads" in Plus Jakarta Sans 700 with a small arch icon (an arc over two dots) in indigo with an amber dot. Delivered as an SVG in `client/public/logo.svg`.

**Iconography:** lucide-react only; 18px in navigation, 16px in chips and buttons, 1.75 stroke.

### 12.2 Layout

- **Desktop (≥ 1024px):** fixed left sidebar 248px (logo, primary nav, secondary nav, user card with level at the bottom); sticky top bar (search button "Search… ⌘K", notification bell, theme toggle, avatar menu); content max width 1120px; right rail 320px on Home, Community and Ask detail.
- **Tablet (768–1023px):** collapsible sidebar (icons only), right rail moves below content.
- **Mobile (< 768px):** bottom tab bar (Home, Ask, People, Opportunities, Me) with safe-area padding; filters open in bottom sheets; dialogs become full-height sheets.
- 8px spacing grid; cards `p-5`; sections separated by `gap-6`.

### 12.3 Component patterns

| Component | Specification |
|---|---|
| Card | 1px border, `shadow-sm`, radius 14px; hover lift `-translate-y-0.5` + `shadow-md` (150 ms) on clickable cards |
| Reason chip (signature) | Indigo-soft pill with a sparkles icon: "Because you follow AI/ML", "Shared: Computer Vision" |
| Match ring | 44px SVG ring, score in the middle; ≥ 70 emerald, 40–69 indigo, < 40 grey |
| Avatar | Photo or initials on a two-colour gradient derived from the user id |
| Role badges | First year · Junior · Senior · Alumni (indigo); Verified (emerald check); Self-reported (grey outline) |
| Vote control | Vertical arrows with count; optimistic; up = indigo, down = rose |
| Deadline badge | Grey (> 7 days), amber (≤ 7 days), rose (≤ 2 days), muted strike (passed) |
| Empty state | Lucide icon in a soft circle, one sentence, one primary action |
| Loading | Skeletons shaped like the content; never a blank page or full-page spinner |
| Toasts | Every mutation shows success or failure; points earned shown as "+5 helpfulness" |
| Motion | Page fade-in 150 ms; list stagger 30 ms; badge celebration once; all disabled under `prefers-reduced-motion` |
| Forms | Labels above inputs, inline errors, disabled + spinner while submitting |
| Accessibility | Visible focus rings, 4.5:1 contrast, keyboard-operable dialogs and menus, `aria-label` on icon buttons |

### 12.4 Screens

| Screen | Route | Key elements |
|---|---|---|
| Landing | `/` | Hero, value line, feature cards, story spotlight, sign-in / register CTAs |
| Register | `/register` | Name, college email, password, domain hint |
| Verify email | `/verify` | 6-digit code input, resend with cooldown |
| Login | `/login` | Email, password, "Demo login" helpers in demo mode |
| Onboarding | `/onboarding` | 4-step wizard with progress bar and chip pickers |
| Home | `/home` | Greeting, composer, feed tabs, topic chips, right rail |
| Ask a Senior | `/ask`, `/ask/new`, `/ask/:id` | Tabs, topic filter, similar questions, AI panel, answers, best answer |
| Community | `/community`, `/community/:topic`, `/community/tag/:tag`, `/post/:id` | Topic tabs, Latest/Top, post cards, comments |
| Discover People | `/people` | Filters, "Find my alumni mentor" toggle, person cards with match ring and reasons |
| Profile | `/u/:handle`, `/settings/profile` | Header, sections, badges, contributions, edit |
| Requests | `/requests` | Incoming / Outgoing / Completed tabs; follow-ups |
| Companies | `/companies`, `/companies/:slug` | Tiles; Overview, Experiences, Alumni, Prep tabs |
| Share experience | `/experiences/new` | 4-step structured form |
| Clubs | `/clubs`, `/clubs/:slug` | Meters, reviews, review form |
| Path Twins | `/path-twins` | Starting point, twin timelines |
| Roadmaps | `/roadmaps`, `/roadmaps/:id`, `/roadmaps/new`, `/roadmaps/generate` | Goal tracks, steps, generator |
| Opportunities | `/opportunities`, `/opportunities/new` | Type filters, deadline badges, alerts settings |
| Teams | `/teams`, `/teams/:id`, `/teams/new` | Tabs incl. Founder track and Study circles; applicants |
| Notifications | `/notifications` | Grouped list, mark all read |
| Bookmarks | `/bookmarks` | Tabs by type |
| Search | `/search` | Query, type and facet filters, grouped results |
| Placement dashboard | `/prep` | Targets, readiness, four prep tracks, deadlines, next actions |
| Simulator | `/prep/simulator`, `/prep/simulator/:sessionId` | Setup, question flow, feedback, summary |
| Stories | `/stories`, `/stories/:slug` | Magazine grid, article page |
| Support | `/support` | Counselling links, guidelines |
| Admin | `/admin/*` | Reports, users, events, companies, clubs, stories |
| Events (later) | `/events`, `/events/:id` | RSVP, tickets, QR |
| Give (later) | `/give`, `/give/:slug` | Campaigns, donate |

---

## 13. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | API p95 < 300 ms on demo data; first contentful paint < 2 s on campus Wi-Fi; route-level code splitting |
| Responsiveness | 360px to 1440px+ without horizontal scroll |
| Accessibility | WCAG 2.1 AA contrast, keyboard navigation, focus management in dialogs |
| Reliability | A deployed build always works; unfinished P2 features hidden behind a flag and shown as "Coming next" |
| Security | Passwords hashed with bcrypt; httpOnly cookies; input validation with zod on every endpoint; role checks on every protected route; rate limits on auth and AI |
| Privacy | Contact visibility enforced on the server, not just hidden in the UI |
| Scalability | One college at launch; data model can add `collegeId` for multiple colleges later |
| Observability | Request logging with request IDs; error responses never leak stack traces in production |

---

## 14. Release plan and time budget

| Phase | Title | Time box | Cumulative |
|---|---|---|---|
| 00 | Workspace, tooling, design system and app shell | 0:50 | 0:50 |
| 01 | Database schema, search setup and base seed | 0:40 | 1:30 |
| 02 | Authentication and onboarding | 1:05 | 2:35 |
| 03 | Profiles, Discover People, matching and requests | 1:05 | 3:40 |
| 04 | Ask a Senior and community feed | 1:15 | 4:55 |
| 05 | Personalized home, This Week, quests, bookmarks, search | 0:55 | 5:50 |
| 06 | Companies, experiences, clubs, Path Twins, roadmaps | 1:10 | 7:00 |
| 07 | Opportunities, alerts, teams, study circles, mentorship, notifications | 1:05 | 8:05 |
| 08 | Gamification, trust, success stories, moderation, admin | 0:55 | 9:00 |
| 09 | AI layer, placement dashboard, simulator | 1:20 | 10:20 |
| 10 | Seed content, polish, deploy, demo | 1:00 | 11:20 |
| — | Buffer | 0:40 | 12:00 |
| 11 | Later features: events and ticketing, donations | after the hackathon | — |

**Honest note on scope:** the full P0 + P1 set fits in about 11–12 focused hours only if the time boxes are respected. P2 items (AI summaries, the simulator's adaptive written-answer feedback) are the first to slip; the cut list in `TRD.md` §15 says exactly what to drop and in which order.

---

## 15. Out of scope and future roadmap

**Out of scope for the hackathon:** native apps, email/push notifications, video calls, real payments, faculty ratings, exam paper hosting, code execution in the simulator.

**Future roadmap (pitch only):**

- Semantic search with embeddings (pgvector).
- Code execution sandbox for coding rounds in the simulator.
- Multi-college workspaces with local student ambassadors.
- Consented, anonymised cross-college career-path insights.
- Email digests and push notifications.
- Live events (Phase 11) and approved fundraising (Phase 11) in production.

---

## 16. Open questions to verify

| Question | Why it matters |
|---|---|
| What is the college's real student email domain (and staff/alumni domains)? | Sign-up restriction |
| Who are the official counselling contacts? | Support page must be accurate |
| Is the college comfortable with club ratings and interview experiences being shared? | Avoid conflict with administration |
| Which companies' details can be shown publicly within the campus? | Company pages |
| What does the DPDP Act 2023 require for this kind of student data today? | Legal compliance before launch |
| Who would own payments and receipts for events and donations? | Phase 11 cannot go live without this |
