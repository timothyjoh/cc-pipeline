# Generate Diagram Template

> **Instructions:** This template helps you create comprehensive Mermaid diagrams with accompanying analysis documentation. The AI agent will analyze existing code/flows, generate a diagram with high-contrast styling for readability, and create explanatory documentation with recommendations.

---

## 1. Diagram Request Overview

### Diagram Title

<!-- Provide a clear, specific title for this diagram -->

**Title:** [Brief, descriptive title of what you want to diagram]

### Goal Statement

<!-- One paragraph describing what should be documented -->

**Goal:** [Clear statement of what flow/system/architecture you want to visualize and why it would be helpful]

### Diagram Type

<!-- Specify the type of Mermaid diagram to create -->

**Type:** [flowchart/sequence/class/state/er/other]

---

## 2. Code Analysis & Flow Discovery

### Target Components

<!--
AI Agent: Analyze the specified files/systems to understand the flow.
Use codebase_search and read_file tools to gather comprehensive information.
-->

**Files/Systems to Analyze:**

- [File path 1: e.g., `/app/api/example/route.ts`]
- [File path 2: e.g., `/lib/services/example.ts`]
- [Directory: e.g., `/components/chat/`]
- [System: e.g., Authentication flow, Database operations]

### Flow Analysis

<!--
AI Agent: Document your findings from code analysis.
Map out the complete flow including:
- Entry points and triggers
- Decision points and conditionals
- Data transformations
- External service calls
- Error handling paths
- Response/output handling
-->

**Entry Points:**

- [Entry point 1: How the flow starts]
- [Entry point 2: Alternative triggers]

**Key Decision Points:**

- [Decision 1: Condition and outcomes]
- [Decision 2: Validation or routing logic]

**Data Flow:**

- [Step 1: Initial data/request format]
- [Step 2: Transformations and processing]
- [Step 3: External calls or database operations]
- [Step 4: Response format and handling]

**Error Paths:**

- [Error scenario 1: What happens when X fails]
- [Error scenario 2: Validation failures]

**External Dependencies:**

- [Service 1: API calls, database operations]
- [Service 2: Third-party integrations]

---

## 3. Diagram Generation

### Numbering Detection

<!--
AI Agent: Automatically detect the next diagram number.
1. List all files in `ai_docs/diagrams/`
2. Find files matching pattern `XXX_*.md` where XXX is a 3-digit number
3. Determine the highest number and increment by 1
4. Format as 3-digit number (e.g., 001, 012, 103)
-->

**Next Diagram Number:** [Auto-detected: e.g., 001, 012, etc.]

### File Naming

<!--
AI Agent: Create standardized file names.
Format: `XXX_descriptive_name.md`
- XXX = 3-digit auto-incremented number
- descriptive_name = snake_case version of diagram title
-->

**Diagram File:** `ai_docs/diagrams/[XXX_snake_case_name].md`
**Analysis File:** `ai_docs/diagrams/[XXX_snake_case_name]_analysis.md`

### Mermaid Diagram Code

<!--
AI Agent: Generate the complete Mermaid diagram based on your analysis.
Include:
- Proper diagram type syntax
- Clear node descriptions
- Logical flow connections
- Subgraphs for component grouping
- High-contrast styling with stroke colors and white text for readability
- Comments explaining complex parts

**CRITICAL SYNTAX RULES TO AVOID ERRORS:**

1. **Quote node labels with special characters:**
   - ❌ BAD: `Node[answer-transcript-question Task]` (hyphens cause "Unsupported markdown: list" error)
   - ✅ GOOD: `Node["answer-transcript-question Task"]`

2. **Quote labels with square brackets inside:**
   - ❌ BAD: `Node[Context: [MM:SS] text]` (nested brackets cause parse errors)
   - ✅ GOOD: `Node["Context: MM:SS text"]`

3. **Quote labels with hyphens surrounded by spaces:**
   - ❌ BAD: `Node[streams.pipe - answer]` (space-hyphen-space triggers markdown list parser)
   - ✅ GOOD: `Node["streams.pipe(answer)"]` or `Node["streams.pipe: answer"]`

4. **When in doubt, always quote node labels:**
   - Use double quotes for any node label with: hyphens, colons, parentheses, brackets, or special chars
   - Example: `Node["My Label"]` is always safe

**Required Styling Pattern:**
```
%% High contrast styling for readability
classDef category1 fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
classDef category2 fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
classDef category3 fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
classDef category4 fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
classDef category5 fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
classDef category6 fill:#8BC34A,stroke:#689F38,stroke-width:2px,color:#fff
```
-->

```mermaid
[AI AGENT: Insert complete Mermaid diagram code here based on analysis]
```

---

## 4. Documentation Generation

### Diagram File Structure

<!--
AI Agent: Create the main diagram file with this structure:
1. Title and overview
2. Mermaid diagram
3. Key components explanation
4. Related files list
-->

**Main Diagram File Content:**

````markdown
# [Diagram Title]

## Overview

[Brief description of what this diagram shows]

## Diagram

```mermaid
[Insert diagram code]
```
````

## Key Components

[Explain main components and their roles]

## Related Files

[List relevant source files]

````

### Analysis File Structure
<!--
AI Agent: Create separate analysis file with detailed explanations:
1. Flow explanation in plain English
2. Step-by-step walkthrough
3. Decision logic explanation
4. Error handling coverage
5. Recommendations and improvements
-->

**Analysis File Content:**
```markdown
# [Diagram Title] - Flow Analysis

## Flow Summary
[Concise explanation of how everything flows through the system]

## Step-by-Step Walkthrough
[Detailed explanation of each major step in the diagram]

## Decision Logic
[Explain key decision points and their criteria]

## Error Handling
[Document error scenarios and how they're handled]

## Recommendations & Ideas
[Bullet points with potential improvements, optimizations, or considerations]
````

---

## 5. Implementation Instructions

### File Creation Steps

<!--
AI Agent: Follow these steps to create the diagram files:
1. Detect next diagram number by listing `ai_docs/diagrams/` directory
2. Create the main diagram file with proper naming
3. Create the analysis file with `_analysis` suffix
4. Ensure both files follow the documented structure
5. Verify Mermaid syntax is valid
-->

**Steps to Execute:**

- [ ] Analyze specified code/systems thoroughly
- [ ] Auto-detect next diagram number (XXX format)
- [ ] Generate Mermaid diagram based on analysis
- [ ] Create main diagram file: `ai_docs/diagrams/XXX_name.md`
- [ ] Create analysis file: `ai_docs/diagrams/XXX_name_analysis.md`
- [ ] Validate Mermaid syntax
- [ ] Include comprehensive explanations and recommendations

### Quality Checklist

- [ ] Diagram accurately represents the analyzed flow
- [ ] All major decision points are included
- [ ] Error paths are documented
- [ ] External dependencies are clearly shown
- [ ] **High-contrast styling applied** with stroke colors and white text for readability
- [ ] Analysis explains the flow in simple terms
- [ ] Recommendations are actionable and specific
- [ ] File naming follows XXX_name convention
- [ ] Both files are properly formatted and complete

---

## 6. Template Usage Examples

### Example Request Format

```
"Please generate a diagram showing the authentication flow in our Next.js app.
Analyze /lib/auth.ts, /app/api/auth/*, and /middleware.ts to understand how
users log in, sessions are managed, and protected routes work."
```

### Example Diagram Types by Use Case

- **Flowchart (`graph TD`)**: API request flows, business logic, decision trees
- **Sequence (`sequenceDiagram`)**: User interactions, API communications, service calls
- **Class (`classDiagram`)**: Component relationships, data models, inheritance
- **State (`stateDiagram-v2`)**: User states, application states, process states
- **ER (`erDiagram`)**: Database relationships, data structures

---

_Template Version: 1.0_  
_Last Updated: 7/26/2025_  
_Created By: Brandon Hancock_  
_Focus: Mermaid Diagram Generation with Code Analysis_
