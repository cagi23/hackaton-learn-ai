# ReviewLens — Product Requirements Document (PRD)

## 1. Problem Statement
AI code generation tools are producing software at an unprecedented rate. Developers increasingly accept suggestions without understanding the underlying software engineering reasoning, security implications, or architectural impact. 

Traditional automated code review tools tell developers **what** is wrong (linters, static analyzers) or dump generic fixes. They do not train developers to recognize these patterns themselves or explain the deeper engineering trade-offs.

## 2. Product Overview
**ReviewLens** is an AI-powered code review and deliberate practice platform built on the thesis:
> *"Don't just review my code. Teach me to become a better reviewer."*

ReviewLens elevates standard code reviews by providing:
1. Architectural and practical context ("Why Does This Matter?").
2. Core software engineering principles (Null Safety, Single Responsibility, Fail-Fast).
3. Active learning via interactive challenges ("Challenge Me").
4. A gamified developer skill scorecard.

## 3. Target User
Software engineers (initially TypeScript/JavaScript practitioners) ranging from junior developers looking to level up their review skills to senior developers desiring structured mentorship tools.

## 4. Core Jobs To Be Done (JTBD)
- **Prioritize:** Tell me what issues truly matter (avoiding trivial linter noise).
- **Explain Context:** Explain the practical runtime consequences if this code reaches production.
- **Teach Foundations:** Ground the issue in fundamental software design principles.
- **Verify Comprehension:** Test whether I can spot and resolve similar issues through deliberate practice.
- **Show Growth:** Track my review proficiency across categories over time.

## 5. Primary Flow
```text
Paste Code (or Load Demo)
    ↓
AI Review (Mock or Live)
    ↓
Structured Findings Summary
    ↓
Select Finding
    ↓
"Why Does This Matter?" & "Engineering Principle"
    ↓
Suggested Improvement & Diff
    ↓
"Challenge Me"
    ↓
Answer Multiple-Choice Question
    ↓
Deterministic Evaluation & Deep Explanation
    ↓
Skill Score Updated (+3 pts, max 100)
```

## 6. Success Criteria
- **10-Second Test:** A judge or developer immediately grasps the educational value proposition within 10 seconds of opening the application.
- **2-Minute Demo:** A full review and challenge cycle can be smoothly demonstrated in under 2 minutes with zero flakiness.
- **100% Demo Reliability:** Zero crash guarantee via pre-tested `MockReviewProvider`.
