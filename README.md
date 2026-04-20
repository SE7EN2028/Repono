# Repono

An AI-powered tool that helps you understand any codebase by asking questions in plain English.

Connect a GitHub repo, and Repono will parse the entire codebase, let you browse files, visualize dependencies, and chat with an AI that actually reads your code before answering.

## What it does

- **Chat with your code** — Ask things like "explain the authentication flow" or "find potential bugs" and get answers based on the actual source code, not generic responses.
- **File browser** — Browse the full repo tree, click any file to see its source with syntax highlighting and stats.
- **Code map** — Interactive dependency graph showing how directories and modules connect to each other.
- **Insights** — Auto-detects the tech stack, frameworks, entry points, and flags potential issues like hardcoded secrets or TODO comments.

## How it works

1. You paste a GitHub repo URL
2. Repono clones it, parses every file, and chunks the code into searchable pieces
3. When you ask a question, it finds the most relevant code chunks using keyword search
4. Those chunks get sent to Llama 3.3 70B (via Groq) which generates an explanation based on your actual code
5. Sources are shown alongside the answer so you can verify everything

## Tech stack

- **Frontend** — React, Vite
- **Backend** — Node.js, Express
- **AI** — Groq API with Llama 3.3 70B
- **Code parsing** — Custom chunker that splits code by functions, classes, and logical blocks
- **Search** — Keyword-based retrieval with code-aware scoring

## Running locally

```bash
git clone https://github.com/SE7EN2028/Repono.git
cd Repono
npm install
cd client && npm install && npm run build && cd ..
```

Create a `.env` file in the root:

```
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

Get a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys)

Start the server:

```bash
npm start
```

Open [http://localhost:3001](http://localhost:3001)

## Deploying on Render

1. Push to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Connect the repo
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add `GROQ_API_KEY` in environment variables

## Project structure

```
├── server/
│   ├── index.js                 # Express server, serves API + frontend
│   ├── routes/
│   │   ├── repo.js              # Clone, index, files, insights, deps endpoints
│   │   └── query.js             # Question answering endpoint
│   └── services/
│       ├── repoManager.js       # Git clone and repo management
│       ├── fileParser.js        # Walks repo and reads source files
│       ├── chunker.js           # Splits code into function-level chunks
│       ├── keywordSearch.js     # Finds relevant code by keyword matching
│       ├── ragPipeline.js       # Sends code + question to Groq LLM
│       ├── queryClassifier.js   # Classifies question type
│       ├── insightGenerator.js  # Scans for tech stack, issues, entry points
│       ├── dependencyAnalyzer.js # Builds import-based dependency graph
│       └── webSearch.js         # Wikipedia/DuckDuckGo lookup for concepts
├── client/
│   └── src/
│       ├── App.jsx              # Main app shell and state management
│       ├── api.js               # Backend API client
│       └── components/          # All UI components
└── package.json
```

## Limitations

- No conversation memory — each question is independent
- Keyword search, not semantic — might miss code that uses different terminology
- Context window limits how much code the AI sees per question
- Private repos need a GitHub token (not implemented yet)
- Chat history doesn't persist after refresh

## License

MIT
