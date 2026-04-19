const QUERY_TYPES = {
  EXPLAIN: 'explain',
  LOCATE: 'locate',
  DEBUG: 'debug',
  SUMMARIZE: 'summarize',
  TRACE: 'trace',
  DEPENDENCY: 'dependency'
};

const patterns = [
  { type: QUERY_TYPES.EXPLAIN, keywords: ['explain', 'what does', 'how does', 'what is', 'describe', 'understand', 'mean', 'purpose of', 'why does'] },
  { type: QUERY_TYPES.LOCATE, keywords: ['where is', 'find', 'locate', 'which file', 'implemented', 'defined', 'declaration', 'where does', 'search for'] },
  { type: QUERY_TYPES.DEBUG, keywords: ['bug', 'error', 'fix', 'issue', 'wrong', 'broken', 'fail', 'crash', 'debug', 'problem', 'not working'] },
  { type: QUERY_TYPES.SUMMARIZE, keywords: ['summarize', 'overview', 'summary', 'high level', 'architecture', 'structure', 'about this'] },
  { type: QUERY_TYPES.TRACE, keywords: ['flow', 'trace', 'execution', 'call chain', 'steps', 'sequence', 'pipeline', 'lifecycle', 'process'] },
  { type: QUERY_TYPES.DEPENDENCY, keywords: ['depend', 'import', 'require', 'uses', 'connects to', 'relationship', 'coupled', 'dependency'] }
];

function classifyQuery(question) {
  const lower = question.toLowerCase();
  const scores = {};

  for (const { type, keywords } of patterns) {
    scores[type] = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) scores[type]++;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];

  if (topScore === 0) return { type: QUERY_TYPES.EXPLAIN, confidence: 0.3 };

  return {
    type: sorted[0][0],
    confidence: Math.min(topScore / 3, 1)
  };
}

export { classifyQuery, QUERY_TYPES };
