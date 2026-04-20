async function searchWeb(query) {
  const searchQuery = encodeURIComponent(query);

  const sources = [
    { url: `https://api.duckduckgo.com/?q=${searchQuery}+javascript+programming&format=json&no_html=1`, name: 'Programming' },
    { url: `https://api.duckduckgo.com/?q=${searchQuery}+developer+documentation&format=json&no_html=1`, name: 'Docs' },
  ];

  const builtin = getBuiltinExplanation(query);
  if (builtin) return [builtin];

  const wiki = await searchWikipedia(query);
  if (wiki) return [wiki];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      const data = await response.json();

      if (data.AbstractText && data.AbstractText.length > 30) {
        return [{
          title: data.AbstractSource || source.name,
          text: data.AbstractText,
          url: data.AbstractURL || '',
        }];
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const results = [];
        for (const topic of data.RelatedTopics.slice(0, 3)) {
          if (topic.Text && topic.Text.length > 30) {
            results.push({
              title: topic.FirstURL ? decodeURIComponent(topic.FirstURL.split('/').pop().replace(/_/g, ' ')) : source.name,
              text: topic.Text,
              url: topic.FirstURL || '',
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      continue;
    }
  }

  return [];
}

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

function getBuiltinExplanation(query) {
  const lower = query.toLowerCase();

  const explanations = {
    'await': {
      title: 'JavaScript Reference',
      text: 'The await keyword pauses the execution of an async function until a Promise is resolved or rejected. It can only be used inside async functions. When used, it unwraps the resolved value of the Promise, making asynchronous code look and behave like synchronous code.',
    },
    'async': {
      title: 'JavaScript Reference',
      text: 'The async keyword is used to declare an asynchronous function. It automatically wraps the return value in a Promise and allows the use of await inside the function body. Async functions make it easier to work with Promises without chaining .then() calls.',
    },
    'promise': {
      title: 'JavaScript Reference',
      text: 'A Promise is an object representing the eventual completion or failure of an asynchronous operation. It can be in one of three states: pending, fulfilled, or rejected. Promises are used to handle async operations like API calls, file reads, and timers.',
    },
    'callback': {
      title: 'JavaScript Reference',
      text: 'A callback is a function passed as an argument to another function, which is then invoked inside the outer function. Callbacks are used to handle asynchronous operations and event-driven programming.',
    },
    'middleware': {
      title: 'Web Development',
      text: 'Middleware is software that sits between the request and response in a web application. In Express.js, middleware functions have access to the request object, response object, and the next middleware function. They can execute code, modify request/response, end the cycle, or call next().',
    },
    'express': {
      title: 'Node.js Framework',
      text: 'Express is a minimal and flexible Node.js web application framework that provides a set of features for web and mobile applications. It provides HTTP utility methods and middleware for creating APIs quickly and easily.',
    },
    'router': {
      title: 'Express.js',
      text: 'A Router in Express is a mini-application that can handle routes and middleware. It allows you to organize route handlers into separate modules. Routes define URL patterns and HTTP methods that the server responds to.',
    },
    'import': {
      title: 'JavaScript Modules',
      text: 'The import statement is used to import bindings that are exported by another module. ES modules use import/export syntax to share code between files. Named imports use curly braces, default imports do not.',
    },
    'export': {
      title: 'JavaScript Modules',
      text: 'The export statement is used to export functions, objects, or values from a module so they can be used in other modules via import. Default exports allow one main export per file, while named exports allow multiple.',
    },
    'react': {
      title: 'Frontend Library',
      text: 'React is a JavaScript library for building user interfaces using components. Components are reusable pieces of UI that manage their own state. React uses a virtual DOM for efficient updates and JSX syntax for describing UI structure.',
    },
    'usestate': {
      title: 'React Hook',
      text: 'useState is a React Hook that lets you add state to functional components. It returns an array with the current state value and a function to update it. When state changes, the component re-renders.',
    },
    'useeffect': {
      title: 'React Hook',
      text: 'useEffect is a React Hook for performing side effects in functional components. It runs after render and can handle data fetching, subscriptions, and DOM manipulation. The dependency array controls when the effect re-runs.',
    },
    'fetch': {
      title: 'Web API',
      text: 'The Fetch API provides a modern interface for making HTTP requests. It returns a Promise that resolves to a Response object. fetch() is used to call REST APIs, load data, and communicate with servers.',
    },
    'api': {
      title: 'Web Development',
      text: 'An API (Application Programming Interface) is a set of rules and protocols for building and interacting with software applications. REST APIs use HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources.',
    },
    'cors': {
      title: 'Web Security',
      text: 'CORS (Cross-Origin Resource Sharing) is a security mechanism that allows web pages to make requests to a different domain than the one that served the page. Servers must include CORS headers to allow cross-origin requests.',
    },
    'embedding': {
      title: 'AI/ML',
      text: 'An embedding is a numerical representation (vector) of data like text or code. Embeddings capture semantic meaning so similar items have similar vectors. They are used in search, recommendation systems, and RAG pipelines.',
    },
    'vector': {
      title: 'AI/ML',
      text: 'A vector in AI/ML is an array of numbers that represents data in a high-dimensional space. Vector databases store and search these vectors using similarity measures like cosine similarity to find semantically related items.',
    },
    'rag': {
      title: 'AI Architecture',
      text: 'RAG (Retrieval-Augmented Generation) is a technique that combines information retrieval with text generation. It first retrieves relevant documents/code using semantic search, then feeds them as context to an LLM to generate accurate answers.',
    },
    'contextbridge': {
      title: 'Electron API',
      text: 'contextBridge is an Electron module that creates a safe bridge between the isolated preload script and the renderer process. It uses exposeInMainWorld() to selectively expose APIs to the renderer without giving it full Node.js access. This is essential for security — it prevents the renderer from accessing Node.js internals while still allowing controlled communication via IPC.',
    },
    'ipcrenderer': {
      title: 'Electron API',
      text: 'ipcRenderer is an Electron module used in the renderer process to send asynchronous and synchronous messages to the main process. It communicates via channels using send() and invoke() methods. Combined with ipcMain in the main process, it enables secure inter-process communication.',
    },
    'ipcmain': {
      title: 'Electron API',
      text: 'ipcMain is an Electron module used in the main process to handle messages sent from renderer processes via ipcRenderer. It listens for events on named channels using on() and handle() methods.',
    },
    'electron': {
      title: 'Desktop Framework',
      text: 'Electron is a framework for building cross-platform desktop applications using web technologies (HTML, CSS, JavaScript). It combines Chromium for rendering and Node.js for backend capabilities. Apps have a main process (Node.js) and renderer processes (browser windows).',
    },
    'nodejs': {
      title: 'Runtime Environment',
      text: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine. It allows running JavaScript on the server side. Node.js uses an event-driven, non-blocking I/O model that makes it efficient for building scalable network applications like web servers, APIs, and real-time apps.',
    },
    'npm': {
      title: 'Package Manager',
      text: 'npm (Node Package Manager) is the default package manager for Node.js. It manages project dependencies defined in package.json. Commands: npm install (install deps), npm run (run scripts), npm init (create project). The node_modules folder contains installed packages.',
    },
    'git': {
      title: 'Version Control',
      text: 'Git is a distributed version control system for tracking changes in source code. It enables collaboration through branches, commits, merges, and pull requests. Common commands: git add, git commit, git push, git pull, git branch.',
    },
    'css': {
      title: 'Web Styling',
      text: 'CSS (Cascading Style Sheets) is used to style HTML elements. It controls layout, colors, fonts, spacing, and animations. Modern CSS includes flexbox, grid, custom properties (variables), and media queries for responsive design.',
    },
    'html': {
      title: 'Web Markup',
      text: 'HTML (HyperText Markup Language) is the standard markup language for creating web pages. It defines the structure and content of a page using elements like headings, paragraphs, links, images, forms, and semantic tags.',
    },
    'javascript': {
      title: 'Programming Language',
      text: 'JavaScript is a high-level, interpreted programming language used for web development. It runs in browsers (frontend) and on servers via Node.js (backend). It supports object-oriented, functional, and event-driven programming paradigms.',
    },
    'typescript': {
      title: 'Programming Language',
      text: 'TypeScript is a superset of JavaScript that adds static type checking. It compiles to plain JavaScript and helps catch errors at compile time. Features include interfaces, generics, enums, and type inference.',
    },
    'preload': {
      title: 'Electron Security',
      text: 'A preload script in Electron runs before the renderer process loads. It has access to both Node.js APIs and the DOM. With contextIsolation enabled, it acts as a secure bridge — using contextBridge to expose only specific functions to the renderer.',
    },
    'webview': {
      title: 'Electron Component',
      text: 'A webview tag in Electron embeds external web content in a separate process. It provides isolation from the app, its own session, and can be controlled via JavaScript. Used for embedding third-party sites safely within an Electron app.',
    },
  };

  const normalized = lower.replace(/[\s_-]+/g, '');
  for (const [key, value] of Object.entries(explanations)) {
    if (normalized.includes(key) || lower.includes(key)) return value;
  }

  return null;
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
