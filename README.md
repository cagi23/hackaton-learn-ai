# ReviewLens

> **AI Code Review That Teaches You Why.**

ReviewLens is an interactive, AI-powered code review and deliberate practice platform. While traditional automated review tools and linters only tell developers *what* is wrong or dump generic patches, ReviewLens teaches developers *why* an issue matters, anchors it in foundational software engineering principles, tests comprehension through interactive challenges, and tracks skill growth across core engineering domains.

---

## Problem

With the rapid adoption of AI code generation tools, developers are merging code faster than ever before. However, this creates critical problems:
1. **Superficial Reviews:** Traditional automated linters focus on syntax and formatting, missing subtle architectural flaws, unhandled async failures, and boundary validation bugs.
2. **Developer Skill Atrophy:** Generic AI code-generation and copy-paste fixes encourage passive acceptance without understanding the underlying trade-offs.
3. **Lack of Context:** Developers are told *that* an issue exists, but not *why* it produces catastrophic runtime failures in production or *what principle* prevents similar defects in the future.

---

## Solution

ReviewLens transforms code review from a passive linting chore into an active learning experience:
- **Root-Cause Context ("Why Does This Matter?"):** Translates code defects into concrete production consequences (e.g., unhandled promise rejections, race conditions, memory leaks).
- **First Principles ("Engineering Principle"):** Connects every code defect to proven computer science and design principles (e.g., Null Safety, Fail-Fast, Single Responsibility, Boundary Validation).
- **Deliberate Practice ("Challenge Me"):** Generates interactive, contextual multi-choice quizzes directly from review findings to verify developer understanding.
- **Developer Skill Growth:** Tracks proficiency in real time across five core engineering categories (Bug Detection, Security, Maintainability, Type Safety, and Testing).

---

## Features

- **Preloaded Realistic Demo Example:** Instant one-click loading of `OrderService.ts`, a realistic enterprise TypeScript snippet featuring 4 common high-impact defects.
- **Structured Finding Cards:** Findings categorized by domain (`bug`, `security`, `maintainability`, `type-safety`, `testing`, `performance`, `readability`) and severity (`critical`, `high`, `medium`, `low`).
- **Pedagogical Finding Inspector:**
  - Code preview of the affected snippet.
  - Deep-dive **"Why Does This Matter?"** explanation.
  - Foundational **"Engineering Principle"** callout.
  - Actionable suggested improvement with clear, syntax-highlighted code.
- **Interactive "Challenge Me" Modal:**
  - 3-choice contextual quiz generated per finding.
  - Instant client-side deterministic grading.
  - In-depth pedagogical explanation of correct and incorrect answers.
- **Skill Scorecard & Visual Dashboard:**
  - Gamified score tracking across Bug Detection, Security, Maintainability, Type Safety, and Testing.
  - Deterministic score updates (+3 points for correct answers, clamped to 100).
  - Visual delta trends and badges.
  - LocalStorage persistence and score reset controls.
- **Dual Review Provider Architecture:**
  - **Mock Provider (Default):** 100% deterministic, zero-latency, offline review for flawless hackathon presentations.
  - **Live AI Provider:** Direct client-side integration with Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash`) and OpenAI (`gpt-4o-mini`).
- **Domain-Specific Loading State:** Animated step-by-step progress indicators demonstrating the review analysis pipeline.

---

## Architecture

ReviewLens is built with React 19, TypeScript (strict mode), and Tailwind CSS v4, organized in clean, decoupled layers:

```text
┌──────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                       │
│  App, Header, SkillDashboard, CodeInput, ReviewLoadingState,     │
│  FindingsList, FindingCard, FindingDetail, ChallengeModal        │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                          Service Layer                           │
│  ReviewService ──► [ MockReviewProvider | LLMReviewProvider ]     │
│  SkillService  ──► LocalStorage persistence & score calculation  │
│  ChallengeService ──► Deterministic answer evaluation            │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                       Domain & Validation Layer                  │
│  TypeScript Interfaces & Zod Runtime Schemas                     │
│  (CodeReviewSchema, FindingSchema, ReviewChallengeSchema, etc.)  │
└──────────────────────────────────────────────────────────────────┘
```

---

## AI Integration

ReviewLens enforces a strict schema-validated AI pipeline to guarantee reliable, structured output without free-form LLM degradation:

```text
Code Snippet
     │
     ▼
Structured Prompt (Senior Engineer & Mentor Persona)
     │
     ▼
LLM Generation (Gemini 1.5/2.0 Flash or OpenAI GPT-4o-mini)
     │
     ▼
JSON Extraction (Markdown fence stripping & raw JSON discovery)
     │
     ▼
Zod Schema Validation (Runtime type parsing, ID uniqueness refinements)
     │
     ▼
Validated CodeReview Domain Model
     │
     ▼
UI Presentation & Interactive Challenge Flow
```

- **Prompt Engineering:** The review prompt instructs the model to act as a senior staff engineer and empathetic educator, demanding structured JSON conforming to the domain schema.
- **Defensive Extraction (`jsonExtractor`):** Tolerates common LLM output quirks such as leading/trailing markdown code fences, conversational preambles, and embedded whitespace.
- **Validation Refinements:** Enforces unique finding IDs and answer IDs to prevent React rendering collisions and inconsistent state.
- **Security & Sanitization:** All provider errors undergo API key redaction (`[REDACTED_API_KEY]`) before reaching the UI or logs.

---

## Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation
Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd hackaton
npm install
```

---

## Environment Variables

ReviewLens requires **no environment variables** for standard operation!

- By default, ReviewLens runs in **Mock Mode**, providing complete offline capability, instant execution, and zero setup for evaluators and judges.
- To use **Live AI Mode**, click the **Settings (gear icon)** in the application header:
  - Select your provider (**Google Gemini** or **OpenAI**).
  - Enter your API Key.
  - Optionally specify a custom model identifier.
  - Keys are stored securely in browser `localStorage` and never transmitted to external telemetry servers.

---

## Run

To start the local development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

To build the production distribution bundle:

```bash
npm run build
```

---

## Test

ReviewLens features comprehensive test coverage across schemas, providers, services, UI components, and end-to-end integration flows:

```bash
npm test
```

All 20 test suites and 212 unit/integration tests run using Vitest.

---

## Demo

See [`DEMO.md`](./DEMO.md) for the complete, step-by-step 90–120 second scripted hackathon presentation and judge walkthrough guide.

### Automated Demo Video Recording:
ReviewLens includes an automated Chrome recording agent using Playwright that navigates the full demo workflow and produces a high-definition video:

```bash
npm run demo:record
```

The resulting video is saved directly to `recordings/reviewlens-demo.webm`.

### Quick Demo Summary:
1. Open the application.
2. Click **"Load Demo Example"** to populate `OrderService.ts`.
3. Click **"Review My Code"** to trigger the analysis pipeline.
4. Review findings summary and select **"Unsafe Undefined Access on Array Search Result"**.
5. Examine **"Why Does This Matter?"** and **"Engineering Principle"**.
6. Click **"Challenge Me"**, select the correct idiomatic TypeScript pattern, and observe the instant **Skill Score** increase (`Type Safety: 63 → 66 (+3)`).

---

## Limitations

As a hackathon Proof of Concept, ReviewLens intentionally limits scope to maximize reliability:
- **Single-File Snippet Scope:** Analyzes isolated files and functions rather than entire multi-package workspaces.
- **Client-Side Persistence:** Skill progress and configurations are stored in browser `localStorage` rather than a centralized cloud database.
- **Language Focus:** Optimized and tuned for TypeScript and modern JavaScript codebases.

---

## Roadmap

```text
ReviewLens PoC
      ↓
GitHub Pull Request Integration
      ↓
AST / Repository Indexer
      ↓
Repository-Aware Review
      ↓
Application Knowledge Graph
      ↓
Architecture-Aware Review
```

### Roadmap Milestones:
1. **ReviewLens PoC (Current):** Interactive web application with pedagogical code reviews, deliberate practice quizzes, and developer skill scoring.
2. **GitHub Pull Request Integration:** GitHub App / Action commenting "Why Does This Matter?" context and interactive challenge links directly onto pull requests.
3. **AST / Repository Indexer:** Parsing full repository ASTs, symbol tables, and cross-file type definitions.
4. **Repository-Aware Review:** Detecting subtle cross-file breaking changes, dependency misconfigurations, and contract mismatches across services.
5. **Application Knowledge Graph:** Constructing domain ontology, data flow graphs, and service dependency maps.
6. **Architecture-Aware Review:** Verifying enterprise architectural fitness, event-driven contract integrity, and system-wide security posture.
