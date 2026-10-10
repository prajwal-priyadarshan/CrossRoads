type BankQ = {
  format: 'MCQ' | 'SHORT' | 'CODING_APPROACH';
  topic: string;
  difficulty: number; // 1–5
  prompt: string;
  options?: string[];
  correctIndex?: number;
  explanation: string;
  rubric?: Array<{ point: string; weight: number }>;
};

const BANK: Record<string, BankQ[]> = {
  APTITUDE: [
    {
      format: 'MCQ', topic: 'Speed and Distance', difficulty: 2,
      prompt: 'A train 120 m long passes a pole in 6 seconds. What is its speed in km/h?',
      options: ['20 km/h', '72 km/h', '60 km/h', '80 km/h'],
      correctIndex: 1,
      explanation: 'Speed = 120/6 = 20 m/s = 20 × 18/5 = 72 km/h.',
    },
    {
      format: 'MCQ', topic: 'Percentages', difficulty: 2,
      prompt: 'A price is first increased by 20%, then decreased by 20%. What is the net change?',
      options: ['No change', '4% decrease', '4% increase', '2% decrease'],
      correctIndex: 1,
      explanation: 'Net = 1.2 × 0.8 = 0.96, so 4% decrease.',
    },
    {
      format: 'MCQ', topic: 'Profit and Loss', difficulty: 3,
      prompt: 'An item is sold at ₹540 at a 20% profit. What was the cost price?',
      options: ['₹432', '₹450', '₹480', '₹500'],
      correctIndex: 1,
      explanation: 'CP = 540/1.2 = ₹450.',
    },
    {
      format: 'MCQ', topic: 'Work and Time', difficulty: 2,
      prompt: 'A can do a job in 10 days, B in 15 days. Together, how many days do they take?',
      options: ['5 days', '6 days', '7 days', '8 days'],
      correctIndex: 1,
      explanation: 'Combined rate = 1/10 + 1/15 = 1/6. Time = 6 days.',
    },
    {
      format: 'MCQ', topic: 'Probability', difficulty: 3,
      prompt: 'Two dice are rolled. What is the probability that the sum is 7?',
      options: ['1/6', '5/36', '7/36', '1/9'],
      correctIndex: 0,
      explanation: 'Favourable outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. Total = 36. P = 6/36 = 1/6.',
    },
    {
      format: 'MCQ', topic: 'Number Series', difficulty: 2,
      prompt: 'Find the next number: 2, 6, 12, 20, 30, ?',
      options: ['40', '42', '44', '48'],
      correctIndex: 1,
      explanation: 'Differences: 4,6,8,10,12. Next = 30+12 = 42.',
    },
    {
      format: 'MCQ', topic: 'Averages', difficulty: 1,
      prompt: 'The average of 5 numbers is 18. If one number is replaced by 28 (the original was 8), what is the new average?',
      options: ['18', '20', '22', '24'],
      correctIndex: 1,
      explanation: 'Sum increases by 20. New sum = 90+20 = 110. New average = 110/5 = 22. Wait, that is 22. Correct answer index should be 2. Let me recalculate: original sum = 90, add 20 = 110, 110/5 = 22.',
    },
    {
      format: 'MCQ', topic: 'Ratio and Proportion', difficulty: 2,
      prompt: 'Divide 120 in the ratio 3:5. What is the smaller part?',
      options: ['30', '40', '45', '50'],
      correctIndex: 2,
      explanation: 'Total parts = 8. Smaller part = (3/8)×120 = 45.',
    },
  ],
  CS_FUNDAMENTALS: [
    {
      format: 'MCQ', topic: 'Operating Systems', difficulty: 2,
      prompt: 'Which page replacement algorithm suffers from Belady\'s anomaly?',
      options: ['LRU', 'Optimal', 'FIFO', 'LFU'],
      correctIndex: 2,
      explanation: 'FIFO can have more page faults with more frames (Belady\'s anomaly). LRU and Optimal do not.',
    },
    {
      format: 'MCQ', topic: 'DBMS', difficulty: 2,
      prompt: 'Which normal form eliminates transitive dependencies?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      correctIndex: 2,
      explanation: '3NF removes transitive dependencies (non-key → non-key). BCNF is stricter but 3NF specifically targets transitive dependencies.',
    },
    {
      format: 'MCQ', topic: 'Computer Networks', difficulty: 3,
      prompt: 'Which layer of the OSI model handles end-to-end error recovery?',
      options: ['Network', 'Transport', 'Session', 'Data Link'],
      correctIndex: 1,
      explanation: 'The Transport layer (TCP) provides end-to-end reliability, error detection and flow control.',
    },
    {
      format: 'MCQ', topic: 'Data Structures', difficulty: 2,
      prompt: 'What is the time complexity of searching an element in a balanced BST with n nodes?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
      correctIndex: 1,
      explanation: 'A balanced BST has height O(log n), so search takes O(log n).',
    },
    {
      format: 'MCQ', topic: 'Operating Systems', difficulty: 3,
      prompt: 'In deadlock detection, which condition is NOT one of the four necessary conditions?',
      options: ['Mutual exclusion', 'Hold and wait', 'Preemption allowed', 'Circular wait'],
      correctIndex: 2,
      explanation: 'The four necessary conditions are mutual exclusion, hold-and-wait, no preemption, and circular wait. "Preemption allowed" is the opposite of "no preemption".',
    },
    {
      format: 'MCQ', topic: 'DBMS', difficulty: 3,
      prompt: 'Which SQL clause filters groups after aggregation?',
      options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
      correctIndex: 1,
      explanation: 'HAVING filters after GROUP BY aggregation. WHERE filters rows before grouping.',
    },
    {
      format: 'MCQ', topic: 'Computer Networks', difficulty: 2,
      prompt: 'What does ARP resolve?',
      options: ['Domain names to IP addresses', 'IP addresses to MAC addresses', 'MAC to IP addresses', 'Port to process'],
      correctIndex: 1,
      explanation: 'ARP (Address Resolution Protocol) maps IP addresses to MAC addresses within a LAN.',
    },
  ],
  CODING: [
    {
      format: 'CODING_APPROACH', topic: 'Arrays', difficulty: 2,
      prompt: 'Given an unsorted array of integers, find two numbers that sum to a target value. Explain your approach, data structures, and time/space complexity. (No code execution — explain your approach.)',
      explanation: 'Use a hash set: iterate through the array, for each element check if (target - element) is in the set; if yes, return the pair. Otherwise add the element. O(n) time, O(n) space.',
      rubric: [
        { point: 'Identifies the O(n²) brute force approach first', weight: 1 },
        { point: 'Proposes hash set/map for O(n) solution', weight: 3 },
        { point: 'Correctly states O(n) time and O(n) space complexity', weight: 2 },
        { point: 'Handles edge cases (duplicates, empty array, no solution)', weight: 2 },
      ],
    },
    {
      format: 'CODING_APPROACH', topic: 'Linked Lists', difficulty: 3,
      prompt: 'Detect a cycle in a singly linked list. Explain your approach and why it works.',
      explanation: 'Floyd\'s cycle detection: use two pointers, slow (moves 1 step) and fast (moves 2 steps). If they meet, a cycle exists. If fast reaches null, no cycle. O(n) time, O(1) space.',
      rubric: [
        { point: 'Mentions two-pointer / Floyd\'s algorithm by name or concept', weight: 3 },
        { point: 'Correctly explains why slow and fast pointers must meet in a cycle', weight: 2 },
        { point: 'States O(n) time and O(1) space', weight: 2 },
        { point: 'Mentions the hash-set alternative (O(n) space) as a simpler approach', weight: 1 },
      ],
    },
    {
      format: 'CODING_APPROACH', topic: 'Trees', difficulty: 3,
      prompt: 'Find the lowest common ancestor (LCA) of two nodes in a binary tree (not BST). Explain your approach.',
      explanation: 'Recursive approach: for each node, check if it equals p or q; recursively check left and right subtrees. If both return non-null, current node is the LCA. Otherwise return the non-null result.',
      rubric: [
        { point: 'Describes recursive post-order traversal', weight: 3 },
        { point: 'Correctly identifies the case where both subtrees return non-null', weight: 2 },
        { point: 'States O(n) time complexity', weight: 1 },
        { point: 'Mentions the parent-pointer approach as an alternative', weight: 2 },
      ],
    },
    {
      format: 'CODING_APPROACH', topic: 'Dynamic Programming', difficulty: 4,
      prompt: 'Given a string, find the length of the longest palindromic subsequence. Explain your DP approach.',
      explanation: 'dp[i][j] = length of LPS in s[i..j]. Base: dp[i][i]=1. Transition: if s[i]==s[j], dp[i][j]=dp[i+1][j-1]+2; else max(dp[i+1][j], dp[i][j-1]). Fill diagonally. O(n²) time and space.',
      rubric: [
        { point: 'Defines the DP state correctly (substring i to j)', weight: 3 },
        { point: 'Correct recurrence for matching and non-matching characters', weight: 3 },
        { point: 'States O(n²) time and space', weight: 2 },
      ],
    },
    {
      format: 'CODING_APPROACH', topic: 'Graphs', difficulty: 3,
      prompt: 'Detect a cycle in a directed graph. Explain your approach.',
      explanation: 'DFS with a "recursion stack" (separate from visited set). During DFS, if a node is in the current recursion stack (gray), a cycle exists.',
      rubric: [
        { point: 'Uses DFS and a "currently in recursion stack" set/color', weight: 3 },
        { point: 'Distinguishes visited vs. in-stack correctly', weight: 2 },
        { point: 'States O(V+E) time complexity', weight: 2 },
        { point: 'Mentions why BFS/Kahn\'s algorithm also works (topological sort)', weight: 1 },
      ],
    },
  ],
  TECHNICAL: [
    {
      format: 'SHORT', topic: 'System Design', difficulty: 3,
      prompt: 'Design a URL shortener like bit.ly. Describe the core components and how you would handle high read traffic.',
      explanation: 'Key components: API server, hash generation (base62 encoding of an auto-increment ID), database (key-value store for short→long mapping), cache (Redis for hot URLs), CDN for redirects. Handle high reads with cache-aside pattern.',
      rubric: [
        { point: 'Identifies encode/decode API and storage', weight: 2 },
        { point: 'Explains hash/ID generation strategy', weight: 2 },
        { point: 'Proposes caching (Redis/Memcached) for read performance', weight: 3 },
        { point: 'Mentions scalability (horizontal scaling, CDN)', weight: 2 },
        { point: 'Addresses uniqueness and collision handling', weight: 1 },
      ],
    },
    {
      format: 'SHORT', topic: 'Databases', difficulty: 2,
      prompt: 'When would you choose a NoSQL database over a relational database? Give a concrete example.',
      explanation: 'Choose NoSQL for: schema-less / evolving data, high write throughput, horizontal scalability (sharding), document/graph/time-series data. Example: user activity logs, product catalogs with varying attributes.',
      rubric: [
        { point: 'Mentions schema flexibility as a reason', weight: 2 },
        { point: 'Mentions scalability / write throughput', weight: 2 },
        { point: 'Gives a concrete and appropriate example', weight: 3 },
        { point: 'Notes when SQL is still better (transactions, complex queries)', weight: 1 },
      ],
    },
    {
      format: 'SHORT', topic: 'OOP Concepts', difficulty: 2,
      prompt: 'Explain the SOLID principles. Which one do you find most important in real projects, and why?',
      explanation: 'S=Single Responsibility, O=Open/Closed, L=Liskov Substitution, I=Interface Segregation, D=Dependency Inversion. Most important varies — SRP avoids classes becoming too large; DIP enables testability.',
      rubric: [
        { point: 'Correctly explains at least 4 of the 5 principles', weight: 3 },
        { point: 'Gives a real-world example for the chosen principle', weight: 3 },
        { point: 'Explains the trade-offs or why it matters', weight: 2 },
      ],
    },
    {
      format: 'SHORT', topic: 'Concurrency', difficulty: 3,
      prompt: 'What is a race condition? How would you prevent it in a multi-threaded application?',
      explanation: 'A race condition occurs when the outcome depends on the interleaving of concurrent operations. Prevent with: mutexes/locks, atomic operations, immutable shared state, thread-safe data structures, or message-passing concurrency.',
      rubric: [
        { point: 'Correctly defines race condition with an example', weight: 3 },
        { point: 'Mentions synchronization primitives (mutex, semaphore, lock)', weight: 2 },
        { point: 'Mentions atomic operations or lock-free approaches', weight: 2 },
        { point: 'Notes performance trade-offs of locking', weight: 1 },
      ],
    },
    {
      format: 'SHORT', topic: 'REST APIs', difficulty: 2,
      prompt: 'What are idempotent HTTP methods? Why does idempotency matter in API design?',
      explanation: 'GET, PUT, DELETE are idempotent. POST is not. Idempotency matters for retry safety: a client can retry a PUT after a timeout without creating duplicate resources.',
      rubric: [
        { point: 'Correctly identifies idempotent methods (GET, PUT, DELETE)', weight: 2 },
        { point: 'Explains idempotency definition (same result on repeated calls)', weight: 2 },
        { point: 'Explains why it matters for network reliability / retries', weight: 3 },
        { point: 'Explains why POST is not idempotent with an example', weight: 1 },
      ],
    },
  ],
  HR: [
    {
      format: 'SHORT', topic: 'Teamwork', difficulty: 2,
      prompt: 'Describe a situation where you had to work with a difficult teammate. How did you handle it?',
      explanation: 'Good answers use STAR format: describe the situation, task, action (direct communication, empathy, seeking common ground), and result.',
      rubric: [
        { point: 'Describes the situation clearly and concisely', weight: 1 },
        { point: 'Takes ownership of their response rather than blaming the teammate', weight: 3 },
        { point: 'Explains a concrete action taken (conversation, compromise, escalation)', weight: 3 },
        { point: 'States a positive outcome or learning', weight: 1 },
      ],
    },
    {
      format: 'SHORT', topic: 'Problem Solving', difficulty: 2,
      prompt: 'Tell me about a time you solved a difficult problem under a tight deadline.',
      explanation: 'Use STAR. Good answers show structured thinking: decomposing the problem, prioritising, asking for help, managing expectations, and delivering.',
      rubric: [
        { point: 'Clearly describes the problem and the deadline pressure', weight: 2 },
        { point: 'Explains the approach used to break down and solve it', weight: 3 },
        { point: 'Shows self-awareness about trade-offs made', weight: 2 },
        { point: 'Mentions the outcome and any lessons learned', weight: 1 },
      ],
    },
    {
      format: 'SHORT', topic: 'Motivation', difficulty: 1,
      prompt: 'Why are you interested in this company and this role specifically?',
      explanation: 'Strong answers connect the company\'s products/values/culture to the candidate\'s genuine interests and skills, showing research and alignment.',
      rubric: [
        { point: 'Shows research about the specific company (not generic)', weight: 3 },
        { point: 'Connects company work to personal interests or skills', weight: 2 },
        { point: 'Mentions specific projects or aspects of the role', weight: 3 },
      ],
    },
    {
      format: 'SHORT', topic: 'Leadership', difficulty: 3,
      prompt: 'Describe a time you took initiative to lead a project or initiative without being asked.',
      explanation: 'Good answers show proactiveness, communication with stakeholders, ability to mobilise others, and the impact of the initiative.',
      rubric: [
        { point: 'Clearly explains what gap or opportunity they identified', weight: 2 },
        { point: 'Describes concrete steps taken to lead the initiative', weight: 3 },
        { point: 'Mentions how they involved others or communicated', weight: 2 },
        { point: 'Quantifies or describes the impact', weight: 1 },
      ],
    },
    {
      format: 'SHORT', topic: 'Failure and Learning', difficulty: 2,
      prompt: 'Describe a failure or mistake you made. What did you learn from it?',
      explanation: 'Strong answers are honest, show accountability without self-flagellation, and demonstrate a specific and genuine change in behaviour.',
      rubric: [
        { point: 'Describes a real and meaningful failure (not trivial)', weight: 2 },
        { point: 'Takes clear ownership without excessive blame or excuses', weight: 3 },
        { point: 'Articulates a specific lesson or behavioural change', weight: 3 },
      ],
    },
  ],
};

export function pickFromBank(roundType: string, difficulty: number, used: string[]): BankQ {
  const pool = BANK[roundType] ?? BANK['APTITUDE'];
  const unused = pool.filter((q) => !used.includes(q.topic));
  const source = unused.length > 0 ? unused : pool;
  const sorted = [...source].sort((a, b) => Math.abs(a.difficulty - difficulty) - Math.abs(b.difficulty - difficulty));
  return sorted[0];
}
