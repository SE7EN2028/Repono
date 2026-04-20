async function searchWikipedia(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' programming')}&format=json&srlimit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.length) return null;

    const title = searchData.query.search[0].title;
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&format=json`;
    const extractRes = await fetch(extractUrl);
    const extractData = await extractRes.json();

    const pages = extractData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page?.extract) return null;

    let text = page.extract;
    if (text.length > 400) text = text.slice(0, 400).replace(/\.[^.]*$/, '.');

    return {
      title: 'Wikipedia — ' + title,
      text,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

async function searchWeb(query) {
  const wiki = await searchWikipedia(query);
  if (wiki) return [wiki];

  try {
    const searchQuery = encodeURIComponent(query + ' programming');
    const url = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.AbstractText && data.AbstractText.length > 30) {
      return [{
        title: data.AbstractSource || 'Web',
        text: data.AbstractText,
        url: data.AbstractURL || '',
      }];
    }
  } catch {}

  return [];
}

function extractConcept(question) {
  const patterns = [
    /what (?:does|is|are) (?:the |a |an )?(.+?)(?:\?|$| in | on | for | do )/i,
    /explain (?:the |a |an )?(.+?)(?:\?|$| in | on | for )/i,
    /how does (?:the |a |an )?(.+?)(?:\?|$| work| function)/i,
    /tell me about (?:the |a |an )?(.+?)(?:\?|$)/i,
    /describe (?:the |a |an )?(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      let concept = match[1].trim();
      concept = concept.replace(/\b(the|a|an|this|that|my|our)\b/gi, '').trim();
      return concept;
    }
  }

  const stopWords = new Set(['what','how','does','is','are','the','a','an','in','on','for','do','this','that','my','our','tell','me','show','explain','where','why','can','you']);
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  return words.slice(0, 3).join(' ');
}

export { searchWeb, extractConcept };
