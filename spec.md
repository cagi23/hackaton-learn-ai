# MISSION

You are the Lead Engineering Agent responsible for delivering a hackathon Proof of Concept called:

# ReviewLens

> AI Code Review That Teaches You Why.

You are operating inside an existing repository using OpenCode.

Your responsibility is NOT simply to generate code.

Your responsibility is to execute a disciplined software engineering workflow:

DISCOVER
→ SPEC
→ PLAN
→ IMPLEMENT
→ TEST
→ CODE REVIEW
→ FIX
→ VERIFY
→ DEMO

The final result must be a working, tested, demo-ready application.

---

# 0. CORE PRODUCT IDEA

ReviewLens is an AI-powered code review learning application.

Traditional AI code review tools answer:

> "What is wrong with this code?"

ReviewLens must additionally answer:

> "Why is this a problem, and how can I learn to recognize this problem myself?"

The product combines:

- AI code review
- software engineering education
- deliberate practice
- gamification

Core value proposition:

> Don't just review my code.
> Teach me to become a better reviewer.

---

# 1. PRIMARY EXPERIENCE

The complete user journey is:

```text
Paste Code
    ↓
AI Review
    ↓
Structured Findings
    ↓
Explore Finding
    ↓
Why Does This Matter?
    ↓
Engineering Principle
    ↓
Suggested Improvement
    ↓
Challenge Me
    ↓
Developer Answers
    ↓
Explanation
    ↓
Skill Score Updated
```

This path is the highest priority.

Every architectural decision must support making this path:

- simple
- reliable
- understandable
- visually compelling
- demo-ready

---

# 2. ENGINEERING PRINCIPLES

Follow these priorities:

```text
Working software
>
architecture diagrams
```

```text
Demo reliability
>
technical sophistication
```

```text
Simple architecture
>
premature abstraction
```

```text
Structured AI output
>
free-form LLM text
```

```text
User learning
>
number of AI findings
```

Do NOT over-engineer the PoC.

---

# 3. AGENT WORKFLOW

Execute the following phases IN ORDER.

Do not jump directly to implementation.

Each phase must use the artifacts produced by the previous phase.

```text
PHASE 0   Repository Discovery

PHASE 1   Product Specification

PHASE 2   Technical Planning

PHASE 3   Implementation

PHASE 4   Automated Verification

PHASE 5   Independent Code Review

PHASE 6   Fix

PHASE 7   Final Verification

PHASE 8   Demo Preparation
```

---

# PHASE 0 — REPOSITORY DISCOVERY

Before changing anything, inspect the repository.

Identify:

- project structure
- framework
- package manager
- TypeScript configuration
- dependencies
- testing framework
- linting
- formatting
- build scripts
- AI SDKs
- environment configuration
- existing documentation
- agent instructions
- skills
- hackathon-specific files

Search specifically for:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
README.md

scope.md
prd.md
spec.md

.skills/
skills/
.agents/
.opencode/
```

Also inspect package.json and relevant configuration files.

If hackathon instructions or skills exist, READ THEM before continuing.

Repository-local instructions take precedence over assumptions in this prompt.

Do not modify code during this phase.

---

# PHASE 1 — PRODUCT SPECIFICATION

Before implementation, create or update:

```text
scope.md
prd.md
spec.md
```

If the hackathon provides a required format, follow it.

Otherwise use the structures below.

---

# scope.md

Define the strict MVP boundary.

## IN SCOPE

- paste TypeScript/JavaScript code
- built-in demo example
- AI code review
- structured findings
- finding details
- Why Does This Matter?
- engineering principle
- suggested improvement
- Challenge Me
- multiple-choice challenge
- challenge feedback
- skill score
- local persistence
- mock/demo AI mode
- loading/error/empty states

## OUT OF SCOPE

Explicitly exclude:

- authentication
- GitHub integration
- repository analysis
- AST indexing
- Application Knowledge Graph
- RAG
- vector databases
- multi-agent production architecture
- billing
- teams
- cloud persistence
- CI/CD integrations

Do not implement OUT OF SCOPE features.

---

# prd.md

Document:

## Problem

AI generates increasing amounts of software code.

Developers can accept AI suggestions without understanding the underlying software engineering reasoning.

Traditional code review tools identify issues but rarely train developers to recognize those issues themselves.

## Product

ReviewLens combines AI code review with deliberate practice.

## Target User

Software developers, initially TypeScript/JavaScript developers.

## Core Jobs To Be Done

When reviewing code:

- tell me what matters
- explain why
- teach me the principle
- test whether I understood it
- show my progress

## Primary Flow

Document the complete user journey.

## Success Criteria

A new user should understand ReviewLens within approximately 10 seconds.

A judge should complete the main demo flow in less than 2 minutes.

---

# spec.md

Turn the PRD into implementation requirements.

Include:

- functional requirements
- UI states
- domain models
- AI schema
- challenge behavior
- skill scoring behavior
- error handling
- mock mode
- acceptance criteria

Every requirement should be testable where practical.

---

# SPEC CHECKPOINT

Before implementation:

Review:

scope.md
prd.md
spec.md

Check for:

- contradictions
- unnecessary features
- missing acceptance criteria
- unclear requirements
- hackathon requirement violations

Fix documentation before continuing.

---

# PHASE 2 — TECHNICAL PLAN

Create:

```text
plan.md
```

The plan must map requirements to implementation.

Use small implementation tasks.

Example:

```text
TASK-01
Create ReviewFinding domain model.

TASK-02
Create structured AI response schema.

TASK-03
Create mock review provider.

TASK-04
Create LLM review provider.

TASK-05
Create code input experience.

TASK-06
Create review findings UI.

TASK-07
Create finding detail.

TASK-08
Create Challenge Me interaction.

TASK-09
Create skill scoring.

TASK-10
Add persistence.

TASK-11
Add tests.

TASK-12
Polish demo.
```

For every task identify:

- objective
- files
- dependencies
- acceptance criteria

Keep tasks small enough that failures can be isolated.

---

# ARCHITECTURE

Prefer the smallest architecture appropriate for the repository.

Conceptual boundaries:

```text
┌─────────────────────────────────┐
│              UI                 │
│                                 │
│ Code Input                      │
│ Review Results                  │
│ Finding Detail                  │
│ Challenge                       │
│ Skill Dashboard                 │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│       APPLICATION LOGIC         │
│                                 │
│ Review Service                  │
│ Challenge Service               │
│ Skill Service                   │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│            AI LAYER             │
│                                 │
│ Review Provider                 │
│ Prompt                          │
│ Schema Validation               │
│ Mock Provider                   │
└─────────────────────────────────┘
```

Do not introduce layers without an immediate purpose.

---

# REVIEW PROVIDER

Use an abstraction equivalent to:

```ts
interface ReviewProvider {
    review(request: ReviewRequest): Promise<CodeReview>;
}
```

Possible implementations:

```text
LLMReviewProvider
MockReviewProvider
```

The UI must not know which provider generated the review.

This allows reliable hackathon demonstrations.

---

# AI RESPONSE CONTRACT

Use a runtime-validated structured schema equivalent to:

```ts
interface CodeReview {

    summary: {
        overallQuality: string;
        findingsCount: number;
    };

    findings: ReviewFinding[];
}

interface ReviewFinding {

    id: string;

    title: string;

    category:
        | "bug"
        | "security"
        | "maintainability"
        | "type-safety"
        | "testing"
        | "performance"
        | "readability";

    severity:
        | "critical"
        | "high"
        | "medium"
        | "low";

    affectedCode?: string;

    description: string;

    whyItMatters: string;

    principle: string;

    suggestion: string;

    improvedCode?: string;

    challenge: {

        question: string;

        code?: string;

        answers: Array<{
            id: string;
            text: string;
        }>;

        correctAnswerId: string;

        explanation: string;
    };
}
```

Do not trust LLM output without validation.

---

# AI REVIEW PHILOSOPHY

The AI acts as:

> Senior Software Engineer + Code Review Mentor

NOT:

> Linter generating as many comments as possible.

AI instructions must prioritize:

1. correctness
2. runtime bugs
3. security
4. type safety
5. maintainability
6. testing
7. meaningful performance issues

Avoid:

- trivial formatting criticism
- subjective naming comments
- invented issues
- excessive findings

Target:

3–5 high-value findings for typical demo code.

---

# AI PROMPT

Store the prompt separately from provider logic.

The core instructions should communicate:

```text
You are an expert senior software engineer and
code-review mentor.

Your objective is not simply to find defects.

Your objective is to teach developers how to
recognize important software engineering problems.

For every meaningful finding:

1. identify the problem
2. explain why it matters
3. identify the engineering principle
4. propose an improvement
5. provide improved code when useful
6. create a short challenge that teaches the
   developer how to recognize the same class
   of problem

Prefer a few high-value findings over many
low-value observations.

Return only structured data matching the
required schema.
```

Improve the production prompt as needed.

---

# DEMO EXAMPLE

Create one realistic TypeScript example.

It should intentionally contain approximately 4 issues.

Prefer:

- unsafe undefined access
- weak typing
- mixed responsibilities
- poor error handling

Example domain:

```text
UserService
OrderService
PaymentService
ShoppingCart
```

Do NOT create obviously absurd code.

The example should resemble code produced during normal application development.

---

# CHALLENGE ENGINE

For every finding, allow:

```text
Challenge Me
```

Challenge flow:

```text
finding
   ↓
question
   ↓
3 answers
   ↓
developer selection
   ↓
evaluate
   ↓
feedback
   ↓
explanation
   ↓
skill update
```

Evaluation must be deterministic.

The LLM generates the challenge.

The application evaluates the selected answer.

Do NOT call the LLM again simply to determine whether the answer is correct.

---

# SKILL MODEL

Track:

```text
Bug Detection
Security
Maintainability
Type Safety
Testing
```

Map finding categories to skills.

Use a simple deterministic algorithm.

Example:

```text
correct answer
→ +3 skill points
```

Cap scores at 100.

Persist scores using localStorage if appropriate.

Do not represent the score as scientifically validated.

It is a gamification mechanism.

---

# PHASE 3 — IMPLEMENTATION

Implement tasks from plan.md incrementally.

For every task:

```text
READ REQUIREMENT
      ↓
IMPLEMENT
      ↓
TYPECHECK
      ↓
TEST RELEVANT BEHAVIOR
      ↓
CONTINUE
```

Do not wait until the end to discover compilation failures.

---

# UI REQUIREMENTS

Build a polished developer-oriented interface.

Main areas:

```text
ReviewLens
AI Code Review That Teaches You Why


┌────────────────────────────────────┐
│ CODE                               │
│                                    │
│                                    │
└────────────────────────────────────┘

[ Load Example ]

[ Review My Code ]
```

After analysis:

```text
REVIEW COMPLETE

4 Findings

Critical     1
Warnings     2
Improvement  1
```

Finding:

```text
HIGH · TYPE SAFETY

Possible undefined access

users.find() can return undefined.

[ Explore Issue ]
```

Finding detail:

```text
WHY DOES THIS MATTER?

...

ENGINEERING PRINCIPLE

Null Safety


HOW TO IMPROVE IT

...


[ Challenge Me ]
```

---

# SKILL DASHBOARD

Display something similar to:

```text
YOUR REVIEW SKILLS

Bug Detection       72
Security            51
Maintainability     84
Type Safety         63
Testing             55
```

After successful challenge:

```text
Type Safety

63 → 66 ↑
```

The feedback should feel rewarding but subtle.

---

# LOADING STATE

Do not use only:

```text
Loading...
```

Use domain-specific feedback such as:

```text
Reviewing your code...

Checking correctness
Checking type safety
Checking maintainability
Preparing learning challenges
```

Do not fake precise analysis progress if it is not actually known.

---

# ERROR HANDLING

Handle:

- empty input
- network errors
- AI provider failure
- malformed response
- schema validation failure
- no findings

Never allow a failed LLM response to crash the application.

---

# MOCK MODE

Mock mode is mandatory.

It exists for:

- local development
- tests
- hackathon demo reliability

For the built-in example, return realistic deterministic findings.

Clearly indicate in configuration/code whether MockReviewProvider or LLMReviewProvider is active.

Do NOT falsely present mock results as live AI results.

---

# PHASE 4 — AUTOMATED VERIFICATION

Run all available repository checks.

At minimum where supported:

```text
lint
typecheck
tests
build
```

Add focused tests covering:

### Schema

Valid AI response accepted.

Malformed response rejected.

### Challenge

Correct answer detected.

Incorrect answer detected.

### Skill score

Correct challenge increments appropriate skill.

Score cannot exceed 100.

### Review Service

Provider response validated before reaching UI.

### Mock Provider

Returns deterministic valid CodeReview.

Do not create tests simply to inflate coverage.

Test important behavior.

---

# PHASE 5 — INDEPENDENT CODE REVIEW

IMPORTANT:

The implementation agent must NOT simply review its own work informally.

Use an independent review context/subagent if OpenCode provides one.

The reviewer must assume the implementation may contain mistakes.

Review against:

```text
scope.md
prd.md
spec.md
plan.md
```

Perform review from multiple perspectives.

---

# REVIEW PASS 1 — CORRECTNESS

Look for:

- broken behavior
- incorrect state transitions
- asynchronous errors
- challenge bugs
- score bugs
- invalid assumptions

---

# REVIEW PASS 2 — TYPESCRIPT

Look for:

- unsafe casts
- `any`
- weak narrowing
- nullable values
- invalid assumptions
- duplicated domain types

---

# REVIEW PASS 3 — AI BOUNDARY

This is especially important.

Check:

```text
LLM
 ↓
untrusted data
 ↓
schema validation
 ↓
trusted application model
```

Look for:

- missing validation
- partial validation
- prompt/output mismatch
- unsafe rendering
- malformed challenge data
- duplicate IDs
- missing answers
- invalid correctAnswerId

---

# REVIEW PASS 4 — SECURITY

Check:

- API keys
- secrets
- client-side exposure
- unsafe HTML
- code rendering
- injection risks
- error leakage

Never commit secrets.

---

# REVIEW PASS 5 — UX

Evaluate the application as a first-time hackathon judge.

Ask:

> Can I understand the product in 10 seconds?

> Can I complete the demo without explanation?

> Is Challenge Me obvious?

> Is Why Does This Matter prominent?

> Does the educational differentiation feel real?

---

# REVIEW PASS 6 — SCOPE

Search for unnecessary implementation.

Flag:

- premature abstractions
- unnecessary infrastructure
- unused dependencies
- features outside scope.md
- speculative architecture

---

# REVIEW OUTPUT

Create:

```text
review-report.md
```

Each issue must use:

```text
ID:
Severity:
File:
Location:
Problem:
Why it matters:
Suggested fix:
```

Severity:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Do NOT modify implementation during this phase.

The reviewer reports.

The implementation agent fixes.

---

# PHASE 6 — FIX

Read review-report.md.

Fix in order:

```text
BLOCKER
↓
HIGH
↓
MEDIUM
↓
LOW
```

BLOCKER and HIGH issues MUST be resolved.

MEDIUM issues should be resolved when reasonable.

LOW issues should only be fixed when they improve the PoC without introducing unnecessary complexity.

After fixes, update review-report.md with status:

```text
RESOLVED
ACCEPTED
DEFERRED
```

Any deferred issue requires justification.

---

# PHASE 7 — FINAL VERIFICATION

Run again:

```text
lint
typecheck
tests
build
```

Then manually reason through the complete acceptance flow:

```text
Open ReviewLens
      ↓
Load Example
      ↓
Review My Code
      ↓
Review returned
      ↓
Findings displayed
      ↓
Explore Finding
      ↓
Why Does This Matter?
      ↓
Engineering Principle
      ↓
Challenge Me
      ↓
Answer challenge
      ↓
Feedback
      ↓
Skill score increases
```

Every step must work.

---

# PHASE 8 — DEMO PREPARATION

Create:

```text
DEMO.md
```

Prepare a 90–120 second demo.

Use this narrative.

## Opening

"AI is writing more code than ever.

But developers still need to understand whether that code is actually good."

## Problem

"Most AI review tools tell you what's wrong.

ReviewLens teaches you why."

## Demo

Load Example.

Review My Code.

Show findings.

Open:

```text
Possible undefined access
```

Show:

```text
WHY DOES THIS MATTER?
```

Then:

```text
ENGINEERING PRINCIPLE
```

Then activate:

```text
CHALLENGE ME
```

Answer the challenge.

Show:

```text
Correct
```

Then show:

```text
Type Safety

63 → 66
```

## Closing

Finish with:

> ReviewLens doesn't just review your code.
> It teaches you to become a better reviewer.

---

# README

Ensure README contains:

```text
# ReviewLens

## Problem

## Solution

## Features

## Architecture

## AI Integration

## Setup

## Environment Variables

## Run

## Test

## Demo

## Limitations

## Roadmap
```

Roadmap:

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

Do NOT implement roadmap features.

---

# DEFINITION OF DONE

ReviewLens is DONE only when:

- application runs
- demo example loads
- review works
- structured output is validated
- mock provider works
- findings render
- finding detail works
- Why Does This Matter? works
- engineering principle is visible
- Challenge Me works
- answer evaluation works
- skill scores update
- important behavior is tested
- lint passes
- typecheck passes
- tests pass
- production build passes
- independent review completed
- BLOCKER issues resolved
- HIGH issues resolved
- README complete
- DEMO.md complete
- hackathon-required artifacts complete

Generating files is NOT equivalent to completing the task.

Working software is the definition of completion.

---

# FINAL REPORT

At completion respond with:

## STATUS

READY / NOT READY

## IMPLEMENTED

Short feature summary.

## ARCHITECTURE

Explain major components.

## AI FLOW

Explain:

```text
Code
→ Prompt
→ LLM
→ Schema Validation
→ CodeReview
→ UI
```

## VERIFICATION

Report actual results:

```text
Lint:
Typecheck:
Tests:
Build:
```

Never report PASS unless the command actually passed.

## CODE REVIEW

Report:

```text
Blocker:
High:
Medium:
Low:
```

and resolution status.

## DEMO

Give exact demo steps.

## LIMITATIONS

List genuine PoC limitations.

## NEXT STEP

Recommend exactly ONE next engineering improvement.

---

# START

Begin now.

Do NOT start coding yet.

Execute:

PHASE 0 — REPOSITORY DISCOVERY

Then:

PHASE 1 — PRODUCT SPECIFICATION

Then continue through the workflow unless repository-local instructions explicitly require a checkpoint.

Do not ask me questions that can be answered by inspecting the repository.