# Python AI Task Template

> **Instructions:** This template helps you create appropriately-sized task documents for AI-driven Python development. **Read the complexity triage below FIRST** to avoid creating unnecessarily verbose documents.

---

## 🎯 TASK COMPLEXITY TRIAGE - READ THIS FIRST

**Choose your task complexity and ONLY fill out the appropriate sections:**

### 🟢 **SIMPLE TASK** (Use sections 1,4,10,11 only - ~150 lines)

**Examples:** Configuration changes, single file updates, adding imports, simple bug fixes, dependency additions
**Sections to use:** Task Overview, Problem Definition, Code Quality Standards, Implementation Plan (includes Task Completion Tracking)
**Skip:** Strategic analysis, codebase analysis, database changes, error handling, impact analysis

### 🟡 **STANDARD TASK** (Use sections 1,3,4,6,8,10,11,15 - ~400 lines)

**Examples:** New features spanning multiple files, API endpoint additions, database schema changes, service integrations
**Sections to use:** Full analysis but skip the most detailed sections
**Skip:** Deep second-order impact, extensive error handling for simple changes

### 🔴 **COMPLEX TASK** (Use all sections - ~600+ lines)

**Examples:** Multi-service integration, architecture overhauls, breaking changes with broad system impact
**Sections to use:** All sections with full detail and analysis

### 🚀 **QUICK-START TEMPLATE** (For 80% of tasks)

```markdown
## Problem

[1-2 sentences describing what's broken/missing]

## Solution

[1-2 sentences describing the fix]

## Implementation

- [ ] **Task 1:** [Specific action]
  - Files: [path/to/file.py]
  - Details: [What to change]
- [ ] **Task 2:** [Specific action]
  - Files: [path/to/file.py]
  - Details: [What to change]

## Files to Modify

- `path/to/file.py` - [What changes]

**Time Estimate:** [X minutes/hours]
```

**👉 For simple tasks, USE THE QUICK-START TEMPLATE ABOVE and skip the rest!**

---

## 1. Task Overview

### Task Title

<!-- Provide a clear, specific title for this task -->

**Title:** [Brief, descriptive title of what you're building/fixing]

### Goal Statement

<!-- One paragraph describing the high-level objective -->

**Goal:** [Clear statement of what you want to achieve and why it matters]

---

## 2. 🟡🔴 MANDATORY: Existing Codebase Analysis (SKIP for 🟢 Simple Tasks)

### When to Use This Section:

✅ **USE:** New features, unfamiliar codebase, multi-service changes, complex integrations
❌ **SKIP:** Configuration changes, single file updates, simple bug fixes, adding imports

### 🚨 CRITICAL WORKFLOW REQUIREMENT

**⚠️ BEFORE ANY PLANNING OR IMPLEMENTATION: You MUST thoroughly analyze the existing codebase to understand:**

1. **What services/modules already exist** that handle similar functionality
2. **How the current workflow processes** the type of data you're working with
3. **Whether this is an extension** of existing code or truly new functionality
4. **What patterns and architectures** are already established

**🛑 NEVER start planning implementation without this analysis!**

### Existing Services & Modules Analysis

<!--
AI Agent: MANDATORY - Use list_dir, read_file, and codebase_search to systematically analyze:
-->

#### Step 1: Project Structure Discovery

```bash
# Commands you MUST run to understand the project:
list_dir("")  # Get overall project structure
list_dir("src/") or list_dir("[main_module]/")  # Find main code directory
list_dir("[main_module]/services/")  # Analyze existing services
```

#### Step 2: Related Service Discovery

**REQUIRED: Search for services related to your task. For example:**

- If working on video processing: Look for `video_processing_service.py`, `media_service.py`, etc.
- If working on user management: Look for `user_service.py`, `auth_service.py`, etc.
- If working on data processing: Look for `processing_service.py`, `data_service.py`, etc.

**🔍 MANDATORY ANALYSIS QUESTIONS:**

- [ ] **What services already exist** that are related to your task?
- [ ] **How does the current workflow** process similar data/requests?
- [ ] **What patterns are established** for error handling, logging, database access?
- [ ] **Where should new functionality be added** - existing services or new modules?

#### Step 3: Current Workflow Understanding

**CRITICAL: For your specific task, map out:**

```
Current Flow: [Describe how similar requests are currently processed]
Entry Point: [Which service/module receives requests]
Processing Steps: [What steps happen in order]
Database Operations: [How data is stored/retrieved]
Output/Response: [What gets returned to the user]
```

#### Step 4: Function Definition Analysis (CRITICAL)

**🚨 MANDATORY: Inspect actual function signatures before implementation**

**ALWAYS inspect function definitions to understand:**

- [ ] **Parameter types**: What exact types does the function expect?
- [ ] **Import requirements**: Which modules/packages need to be imported?
- [ ] **Return types**: What does the function return?
- [ ] **Method signatures**: How should objects be constructed?

**🔍 FUNCTION INSPECTION WORKFLOW:**

```python
# BEFORE writing code, inspect the actual function:
# 1. Use IDE "Go to Definition" or documentation
# 2. Check function signature: def function_name(param: Type) -> ReturnType
# 3. Verify import statements and type requirements
# 4. Look for usage examples in the codebase

# Example: Instead of guessing parameter types
# WRONG: content = Content(parts=[{"text": "hello"}])  # Guessing dictionary format
# RIGHT: Check definition, find it needs Part objects
# content = Content(parts=[Part(text="hello")])  # Correct based on inspection
```

**🚨 CRITICAL EXAMPLES:**

- **External APIs**: Check actual SDK documentation for parameter types
- **Class constructors**: Verify required parameters and their types
- **Method calls**: Ensure you're using the correct signature
- **Type conversions**: Use proper type constructors, not raw dictionaries

**Common Inspection Methods:**

- [ ] **IDE navigation**: Use "Go to Definition" to see actual function
- [ ] **Documentation lookup**: Check official docs for parameter types
- [ ] **Codebase search**: Find existing usage examples in the project
- [ ] **Type hints**: Read function annotations for parameter/return types

#### Step 5: Integration vs New Code Decision

**🎯 INTEGRATION DECISION MATRIX:**

**✅ EXTEND EXISTING SERVICE WHEN:**

- [ ] Similar functionality already exists in a service
- [ ] The workflow naturally fits into existing processing pipeline
- [ ] Adding new steps to existing methods makes logical sense
- [ ] Maintains consistency with established patterns

**✅ CREATE NEW SERVICE WHEN:**

- [ ] Functionality is completely different from existing services
- [ ] New service would be reusable across multiple workflows
- [ ] Existing services are already complex and adding more would hurt maintainability
- [ ] New functionality requires different dependencies/patterns

**📋 ANALYSIS RESULTS:**

- **Existing Related Services:** [List actual services found]
- **Current Workflow:** [Describe how similar tasks are currently handled]
- **Integration Decision:** [Extend existing vs create new - with justification]
- **Recommended Entry Point:** [Which existing method/service to modify or where to add new code]

### Existing Technology Stack

<!--
AI Agent: After analyzing the codebase, document what you found:
-->

- **Python Version:** [From pyproject.toml]
- **Primary Framework:** [FastAPI, Flask, etc.]
- **Database:** [PostgreSQL, SQLite, etc.]
- **Existing AI/ML Services:** [List all found - Vertex AI, OpenAI, etc.]
- **Authentication Patterns:** [How AI services authenticate]
- **Processing Pipeline:** [How files/data currently get processed]

### 🚨 INTEGRATION REQUIREMENTS

**Based on your analysis, document:**

- **Files to Modify:** [Specific existing files that need changes]
- **New Files Needed:** [Only if truly necessary]
- **Dependencies to Add:** [Only if existing ones can't handle the task]
- **Migration Needed:** [If existing code needs to be updated]

---

## 3. 🟡🔴 Strategic Analysis & Solution Options (SKIP for 🟢 Simple Tasks)

### When to Use Strategic Analysis

<!--
AI Agent: Use your judgement to determine when strategic analysis is needed vs direct implementation.

**✅ CONDUCT STRATEGIC ANALYSIS WHEN:**
- Multiple viable technical approaches exist
- Trade-offs between different solutions are significant
- User requirements could be met through different architectural patterns
- Implementation approach affects performance, security, or maintainability significantly
- Change touches multiple systems or has broad impact
- User has expressed uncertainty about the best approach

**❌ SKIP STRATEGIC ANALYSIS WHEN:**
- Only one obvious technical solution exists
- It's a straightforward bug fix or minor enhancement
- The implementation pattern is clearly established in the codebase
- Change is small and isolated with minimal impact
- User has already specified the exact approach they want

**DEFAULT BEHAVIOR:** When in doubt, provide strategic analysis. It's better to over-communicate than to assume.
-->

### Problem Context

<!-- Restate the problem and why it needs strategic consideration -->

[Explain the problem and why multiple solutions should be considered - what makes this decision important?]

### Solution Options Analysis

#### Option 1: [Solution Name]

**Approach:** [Brief description of this solution approach]

**Pros:**

- ✅ [Advantage 1 - specific benefit]
- ✅ [Advantage 2 - quantified when possible]
- ✅ [Advantage 3 - why this is better]

**Cons:**

- ❌ [Disadvantage 1 - specific limitation]
- ❌ [Disadvantage 2 - trade-off or cost]
- ❌ [Disadvantage 3 - risk or complexity]

**Implementation Complexity:** [Low/Medium/High] - [Brief justification]
**Risk Level:** [Low/Medium/High] - [Primary risk factors]

#### Option 2: [Solution Name]

**Approach:** [Brief description of this solution approach]

**Pros:**

- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons:**

- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]
- ❌ [Disadvantage 3]

**Implementation Complexity:** [Low/Medium/High] - [Brief justification]
**Risk Level:** [Low/Medium/High] - [Primary risk factors]

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option [X] - [Solution Name]

**Why this is the best choice:**

1. **[Primary reason]** - [Specific justification]
2. **[Secondary reason]** - [Supporting evidence]
3. **[Additional reason]** - [Long-term considerations]

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option [X]), or would you prefer a different approach?

---

## 4. Context & Problem Definition

### Problem Statement

<!-- What specific problem are you solving? -->

[Detailed explanation of the problem, including pain points, user impact, and why this needs to be solved now]

### Success Criteria

<!-- How will you know this is complete and successful? -->

- [ ] [Specific, measurable outcome 1]
- [ ] [Specific, measurable outcome 2]
- [ ] [Specific, measurable outcome 3]

---

## 5. Development Mode Context

### Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate services/modules as needed
- **Database schema changes** - can be applied without complex migration strategies
- **API breaking changes** - acceptable since no production integrations exist

### 🚨 CRITICAL: Fix Root Problems, Don't Work Around Them

- **If existing code is BROKEN → FIX IT completely**, don't maintain broken contracts
- **If field names are WRONG → CHANGE THEM everywhere**, don't transform between formats
- **If types are INCORRECT → USE PROPER TYPES**, don't add compatibility layers
- **If APIs are MALFORMED → REDESIGN THEM**, don't preserve bad interfaces
- **"Backwards compatibility" means preserving WORKING functionality, not broken implementations**
- **When in doubt: Fix the root cause rather than adding workarounds**

---

## 6. 🟡🔴 Technical Requirements (SKIP for 🟢 Simple Config Changes)

### When to Use This Section:

✅ **USE:** New features, API endpoints, performance requirements, security considerations
❌ **SKIP:** Simple bug fixes, configuration updates, adding imports

### Functional Requirements

<!-- What should the system do? -->

- [Requirement 1: API endpoint can...]
- [Requirement 2: System will process...]
- [Requirement 3: When X happens, then Y...]

### Non-Functional Requirements

<!-- Performance, security, usability, etc. -->

- **Performance:** [API response time, throughput, memory usage, database query performance]
- **Security:** [Authentication, input validation, data protection, authorization]
- **Scalability:** [Concurrent request handling, horizontal scaling capability, resource usage optimization]
- **Reliability:** [Error handling, retry logic, circuit breaker patterns, graceful degradation]

### Technical Constraints

<!-- What limitations exist? -->

- [Constraint 1: Must use existing X database schema]
- [Constraint 2: Cannot modify Y API contract]
- [Constraint 3: Must be backward compatible with Z]

---

## 7. 🟡🔴 Data & Database Changes (SKIP if no database changes)

### When to Use This Section:

✅ **USE:** Schema changes, new tables, data migrations, model updates
❌ **SKIP:** No database involvement, configuration-only changes

### Database Schema Changes

<!-- If any database changes are needed -->

```sql
-- Example: New table creation
-- Include all DDL statements, migrations, indexes
-- Consider vector indexes for AI/ML workloads if needed
```

### Data Model Updates

<!-- Changes to Pydantic models, database schemas, etc. -->

```python
# Example: New Pydantic models or database schema updates
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NewDataModel(BaseModel):
    id: Optional[int] = None
    name: str
    created_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy compatibility
```

### Data Migration Plan

<!-- How to handle existing data -->

- [ ] [Migration step 1: Schema changes]
- [ ] [Migration step 2: Data transformation]
- [ ] [Data validation and rollback strategy]

---

## 8. 🟡🔴 API & Backend Changes (SKIP for internal-only changes)

### When to Use This Section:

✅ **USE:** New API endpoints, external integrations, service interfaces
❌ **SKIP:** Internal code changes, configuration updates, bug fixes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**MANDATORY: Follow these Python patterns strictly:**

**API ROUTES** → `main.py` or `routers/[feature].py`

- [ ] **FastAPI Routes** - RESTful endpoints with proper HTTP methods
- [ ] Examples: `POST /users`, `GET /users/{user_id}`, `PUT /users/{user_id}`
- [ ] Must use Pydantic models for request/response validation
- [ ] Include proper HTTP status codes and error responses

**BUSINESS LOGIC** → `services/[feature].py` or dedicated modules

- [ ] **Service Layer** - Core business logic separated from API routes
- [ ] Example: `services/user_service.py` with `create_user()`, `get_user()` functions
- [ ] Keep routes thin - delegate to service layer

**DATABASE ACCESS** → `repositories/[feature].py` or `database/[feature].py`

- [ ] **Repository Pattern** - Database operations abstracted from business logic
- [ ] Example: `repositories/user_repository.py` with SQL queries or ORM calls
- [ ] Use connection pooling and async database operations when possible

### API Endpoints

<!-- New or modified API endpoints -->

- [ ] **`POST /api/[resource]`** - [Description of create operation]
- [ ] **`GET /api/[resource]/{id}`** - [Description of read operation]
- [ ] **`PUT /api/[resource]/{id}`** - [Description of update operation]
- [ ] **`DELETE /api/[resource]/{id}`** - [Description of delete operation]

### External Integrations

<!-- Third-party APIs, services, etc. -->

- [Service 1: Purpose and configuration - API client setup]
- [Service 2: Authentication and rate limiting considerations]

**🚨 For Google AI integrations, see Section 10 "Code Quality Standards" for package compliance requirements**

---

## 9. Code Organization & File Structure (SKIP for simple single-file changes)

### When to Use This Section:

✅ **USE:** Multi-file changes, new modules, restructuring code organization
❌ **SKIP:** Single file modifications, configuration changes, simple bug fixes

### New Files to Create

```
project-root/
├── [feature_name]/
│   ├── __init__.py                   # Package initialization
│   ├── models.py                     # Pydantic models and schemas
│   ├── services.py                   # Business logic layer
│   ├── repository.py                 # Database access layer
│   └── router.py                     # FastAPI routes
├── utils/
│   ├── __init__.py
│   ├── database.py                   # Database connection utilities
│   ├── logging.py                    # Logging configuration
│   └── exceptions.py                 # Custom exception classes
└── main.py                           # FastAPI application entry point
```

**Module Organization Pattern:**

- Use feature-based packages: `user_management/`, `document_processing/`, etc.
- Keep shared utilities in `utils/` or `common/`
- Configuration in `config.py` at root level
- Database models/schemas in `models/` or within feature packages

### Files to Modify

- [ ] **`main.py`** - [Add new route registration]
- [ ] **`config.py`** - [Add new configuration settings]
- [ ] **`pyproject.toml`** - [Add new dependencies]

### Import Pattern Requirements

**🚨 CRITICAL: Follow these import patterns strictly:**

- **ALWAYS use relative imports** within the same package: `from .models import MyModel`
- **NEVER use absolute imports** for internal modules: ❌ `from package_name.models import MyModel`
- **Use absolute imports ONLY** for external packages: ✅ `from fastapi import FastAPI`
- **Package installation required**: Ensure `uv sync` installs the package for `python -m package_name` execution

### Dependencies to Add to pyproject.toml

**⚠️ CRITICAL: Use uv commands, never pip install directly**

```toml
[project.dependencies]
# Add to existing dependencies in pyproject.toml
"new-package>=1.0.0"
"another-package>=2.0.0"

# RECOMMENDED: Modern Google AI packages (use modern packages ONLY)
"vertexai>=1.38.0"       # For Vertex AI (multimodal, embeddings, models)
"google-genai>=1.24.0"   # For Google Generative AI
# ❌ NEVER use: "google-cloud-aiplatform" - DEPRECATED
```

**Installation commands:**

```bash
# Sync all dependencies
uv sync

# Add a new dependency
uv add "new-package>=1.0.0"
```

---

## 10. Code Quality Standards & Best Practices

### Python Code Quality Requirements

- [ ] **🚨 FUNCTION INSPECTION:** Always inspect function definitions before calling - never guess parameter types
- [ ] **Type Hints:** Complete type annotations for all functions, classes, and variables
- [ ] **Async Patterns:** Use async/await for I/O operations (database, HTTP, file access)
- [ ] **🚨 RELATIVE IMPORTS:** Always use relative imports (`.`) for internal modules
- [ ] **🚨 USE UV:** Always use `uv` commands for dependency management, never `pip install`

### Python Code Style & Best Practices

- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [ ] **❌ NEVER write change history**: `# Fixed this bug`, `# Removed old function`, `# Updated to use new API`
  - [ ] **❌ NEVER write migration artifacts**: `# Moved from old_module.py`, `# Previously was in utils`
  - [ ] **✅ ALWAYS explain business logic**: `# Calculate discount for premium users`, `# Validate user permissions before deletion`
  - [ ] **✅ Write for future developers** - explain what/why the code does what it does, not what you changed
  - [ ] **Remove unused code completely** - don't leave comments explaining what was removed

- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [ ] **Prioritize early returns** over nested if-else statements
  - [ ] **Validate inputs early** and return immediately for invalid cases
  - [ ] **Handle error conditions first** before proceeding with main logic
  - [ ] **Exit early for edge cases** to reduce nesting and improve readability
  - [ ] **Example pattern**: `if not valid_input: raise ValueError("Invalid input"); # main logic here`

- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always raise exceptions instead**
  - [ ] **Never handle "legacy formats"** - expect the current format or fail fast
  - [ ] **No "try other common fields"** fallback logic - if expected field missing, raise exception
  - [ ] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [ ] **Single expected response format** - based on current API contract
  - [ ] **Raise descriptive exceptions** - explain exactly what format was expected vs received
  - [ ] **Example**: `if "expected_field" not in data: raise KeyError("Expected 'expected_field', got: {list(data.keys())}")`

- [ ] **🚨 MANDATORY: Clean up removal artifacts**
  - [ ] **Never leave placeholder comments** like `# No usage tracking needed` or `# Removed for simplicity`
  - [ ] **Delete empty functions/classes** completely rather than leaving commented stubs
  - [ ] **Remove unused imports** and dependencies after deletions
  - [ ] **Clean up empty classes/interfaces** that no longer serve a purpose
  - [ ] **Remove dead code paths** rather than commenting them out
  - [ ] **If removing code, remove it completely** - don't leave explanatory comments about what was removed

### Validation Commands (Run After Each File Change)

```bash
# 1. Basic compilation check
python -m py_compile [modified_file].py && echo "✅ Syntax valid"

# 2. Import validation
python -c "from [package_name] import *; print('✅ Imports work')"

# 3. Quick linting with auto-fix
uv run --group lint ruff check [package_name]/ --fix

# 4. Type checking
uv run --group lint mypy [package_name]/
```

**🛑 If ANY check fails, stop coding and fix it immediately!**

### Forbidden Patterns Checklist

**Before marking any task complete, verify NONE of these exist:**

```bash
# Check for forbidden patterns (run once at end)
grep -r "Any" [package_name]/ && echo "❌ Found Any - use specific types"
grep -r "from [package_name]\." [package_name]/ && echo "❌ Found absolute imports - use relative"
grep -r "google-cloud-aiplatform" pyproject.toml && echo "❌ Found deprecated package"
```

### Google AI Package Compliance

**🚨 MANDATORY: Modern Google AI packages only**

- [ ] **NEVER suggest or use** `google-cloud-aiplatform` - it's deprecated
- [ ] **ALWAYS use** `vertexai>=1.38.0` for multimodal AI, embeddings, and Vertex AI models
- [ ] **ALWAYS use** `google-genai>=1.24.0` for Google Generative AI operations

### LLM Model Selection Standards

- [ ] **Research latest model versions** via web search before implementation
- [ ] **Use most recent stable models** (e.g., `gemini-2.5-flash` not `gemini-2.0-flash`)
- [ ] **Check model capabilities** to ensure they support required features (function calling, multimodal, etc.)
- [ ] **Document model choice rationale** - why this specific model version was selected

---

## 11. Implementation Plan

### Phase 1: [Phase Name]

**Goal:** [What this phase accomplishes]

- [ ] **Task 1.1:** [Specific task with module paths]
  - Files: `[feature]/models.py`, `[feature]/services.py`
  - Details: [Technical specifics and implementation notes]
- [ ] **Task 1.2:** [Another task]
  - Files: [Affected modules]
  - Details: [Implementation approach]

### Phase 2: [Phase Name]

**Goal:** [What this phase accomplishes]

- [ ] **Task 2.1:** [Integration and API endpoints]
- [ ] **Task 2.2:** [Testing and validation]

### Phase 3: Basic Code Validation (AI-Only)

**Goal:** Run basic automated checks - this is NOT the final code review
**⚠️ NOTE:** This is basic validation only. Comprehensive code review happens in Phase 4.

- [ ] **Task 3.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run linting, type checking, compilation checks
- [ ] **Task 3.2:** Import and Syntax Validation
  - Files: All Python modules
  - Details: Verify imports work and syntax is valid (NO live testing)

### Phase 4: Comprehensive Code Review (Mandatory)

**Goal:** Present "Implementation Complete!" and execute thorough code review

🚨 **CRITICAL WORKFLOW CHECKPOINT:**

- [ ] **Task 4.1:** Present Implementation Complete Message (MANDATORY)
  - **Action:** Present the exact "Implementation Complete!" message below
  - **Wait:** For user approval before proceeding with code review

  **📋 EXACT MESSAGE TO PRESENT:**

  ```
  🎉 **Implementation Complete!**

  All phases have been implemented successfully. I've made changes to [X] files across [Y] phases.

  **📋 I recommend doing a thorough code review of all changes to ensure:**
  - No mistakes were introduced
  - All goals were achieved
  - Code follows Python project standards
  - Everything will work as expected

  **Would you like me to proceed with the comprehensive code review?**
  ```

- [ ] **Task 4.2:** Execute Comprehensive Code Review (If User Approves)
  - **Action:** Read all modified files and verify changes match task requirements exactly
  - **Validation:** Run complete Python validation on all modified files
  - **Integration:** Check for integration issues between modified components
  - **Requirements:** Verify all success criteria from task document are met
  - **Report:** Provide detailed review summary with confidence assessment

🛑 **MANDATORY CHECKPOINT:** Do NOT proceed to Phase 5 without completing code review

### Phase 5: User Testing Request

**Goal:** Request human testing for functionality requiring live system interaction

- [ ] **Task 5.1:** Present Testing Summary
  - **Action:** Provide summary of all changes and automated validation results
  - **Request:** Specific browser testing steps if applicable

### Task Completion Tracking - MANDATORY WORKFLOW

**🚨 CRITICAL: Real-Time Task Document Updates Are MANDATORY**

**⚠️ THIS IS NOT OPTIONAL - IT'S A CORE WORKFLOW REQUIREMENT**

Every AI agent MUST update the task document in real-time as tasks are completed.

**📋 MANDATORY REAL-TIME UPDATE PROCESS:**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [ ] **🛑 STOP after completing ANY subtask** - Before moving to the next task
- [ ] **📝 IMMEDIATELY open the task document** - Don't wait until the end
- [ ] **✅ Mark checkbox as [x]** with completion timestamp using ACTUAL current date: `✓ 2025-07-26 17:45`
- [ ] **📁 Add file details** with specific paths and changes made
- [ ] **🔄 REPEAT for every single subtask** - No exceptions

**✅ CORRECT REAL-TIME UPDATE FORMAT:**

```markdown
- [x] **Import token utilities** in `image_processing_service.py` ✓ 2025-07-26 17:45
  - [x] Import `create_google_tokenizer` and `chunk_text_by_tokens` from `utils.token_utils` ✓
  - Files: `rag_processor/services/image_processing_service.py` (added imports) ✓
```

**🚨 For code quality standards, validation commands, and forbidden patterns, see Section 10 "Code Quality Standards"**

---

## 12. 🔴 Error Handling & Edge Cases (SKIP for simple changes)

### When to Use This Section:

✅ **USE:** Complex integrations, external APIs, multi-service interactions, production systems
❌ **SKIP:** Simple configuration changes, single-service updates, development-only features

### Error Scenarios

- [ ] **Database Connection Failures**
  - **Handling:** Connection retry logic with exponential backoff
  - **HTTP Response:** 503 Service Unavailable with retry-after header
- [ ] **External API Timeouts/Failures**
  - **Handling:** Timeout configuration, retry logic, fallback responses
  - **HTTP Response:** 502 Bad Gateway or 503 Service Unavailable

### Edge Cases

- [ ] **Large File Processing**
  - **Solution:** Streaming processing, chunked uploads, background job processing
- [ ] **Concurrent Request Handling**
  - **Solution:** Async patterns, database connection pooling, resource-based rate limiting

---

## 13. 🔴 Security Considerations (SKIP for internal tools/simple changes)

### When to Use This Section:

✅ **USE:** External APIs, user data processing, authentication systems, production deployments
❌ **SKIP:** Internal tools, configuration changes, development-only features

### Authentication & Authorization

- [ ] [API key validation, JWT tokens, or OAuth integration]
- [ ] [Route-level permissions and access control]

### Input Validation

- [ ] [Pydantic model validation for all request bodies]
- [ ] [SQL injection prevention with parameterized queries]

### Data Protection

- [ ] [Sensitive data encryption at rest and in transit]
- [ ] [Environment variable security for secrets]

---

## 14. 🔴 Testing Strategy (OPTIONAL - SKIP unless explicitly requested)

**📝 NOTE: This section should be SKIPPED unless testing is explicitly required or requested by the user.**
**🎯 ERR ON THE SIDE OF NOT TESTING** - Focus only on what's needed to solve the user's problem.

---

## 15. 🔴 Deployment & Configuration (SKIP for development-only changes)

### When to Use This Section:

✅ **USE:** Production deployments, environment configuration, infrastructure changes
❌ **SKIP:** Development-only features, local testing, configuration tweaks

### Environment Variables

```bash
# Add these to .env or deployment environment
DATABASE_URL=postgresql://user:pass@host:port/dbname
API_SECRET_KEY=your-secret-key
```

---

## 16. 🔴 Second-Order Consequences & Impact Analysis (SKIP for isolated changes)

### When to Use This Section:

✅ **USE:** Architecture changes, breaking changes, multi-service impacts, production systems
❌ **SKIP:** Bug fixes, configuration changes, single-service updates, development-only features

### AI Analysis Instructions

🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**

- [ ] **Existing API Contracts:** Will this change break existing API endpoints or data contracts?
- [ ] **Database Dependencies:** Are there other tables/queries that depend on data structures being modified?
- [ ] **Service Dependencies:** Which other services consume the interfaces/models being changed?

#### 2. **Performance Implications**

- [ ] **Database Query Impact:** Will new queries or schema changes affect existing query performance?
- [ ] **Memory Usage:** Are new processing steps significantly increasing memory requirements?
- [ ] **API Response Times:** Will new endpoints or operations increase response latency?

#### 3. **Security Considerations**

- [ ] **Attack Surface:** Does this change introduce new potential security vulnerabilities?
- [ ] **Data Exposure:** Are there risks of inadvertently exposing sensitive data?

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**

These issues must be brought to the user's attention before implementation:

- [ ] **Database Migration Required:** Changes that require data migration in production
- [ ] **Breaking API Changes:** Modifications that will break existing integrations
- [ ] **Performance Degradation:** Changes likely to significantly impact system performance
- [ ] **Security Vulnerabilities:** New attack vectors or data exposure risks
- [ ] **Data Loss Risk:** Risk of losing or corrupting existing data

---

## 17. AI Agent Instructions

### Default Workflow - CODEBASE ANALYSIS FIRST

🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new Python feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **CHOOSE COMPLEXITY LEVEL** - Use the triage at the top to determine 🟢🟡🔴
2. **ANALYZE EXISTING CODEBASE** (🟡🔴 only) - Understand current services, patterns, and workflows FIRST
3. **EVALUATE STRATEGIC NEED** (🟡🔴 only) - Determine if multiple solutions exist or if it's straightforward
4. **STRATEGIC ANALYSIS** (🟡🔴 only) - Present solution options with pros/cons and get user direction
5. **CREATE APPROPRIATELY-SIZED TASK DOCUMENT** in `ai_docs/` using the right sections for complexity level
6. **🚨 PRESENT TASK DOCUMENT WITH A/B/C OPTIONS** - Combined approval and implementation choice step
7. **IMPLEMENT THE FEATURE** only after user chooses option B

**DO NOT:** Create massive 700-line task documents for simple configuration changes
**DO:** Use the quick-start template for 80% of tasks
**DO:** Only use full analysis for genuinely complex integrations

### Implementation Approach - CRITICAL WORKFLOW

🚨 **MANDATORY: Always follow this exact sequence:**

**🛑 CRITICAL ADDITION (Added after workflow analysis):**

```
⚠️  WORKFLOW IMPROVEMENT ⚠️

Step 5 combines task document presentation with implementation options:
- Present task document summary WITH A/B/C choices in one message
- Option C naturally handles task document modification requests
- Option B serves as task document approval + implementation go-ahead
- This prevents workflow confusion and redundant approval steps
```

1. **COMPLEXITY TRIAGE FIRST (Required)**
   - [ ] **Determine if this is 🟢🟡🔴** based on scope and impact
   - [ ] **Use appropriate sections only** - don't fill out everything
   - [ ] **Default to 🟢 SIMPLE** unless clearly complex

2. **ANALYZE EXISTING CODEBASE** (🟡🔴 only)
   - [ ] **Use `list_dir` to explore** project structure and find existing services
   - [ ] **Use `read_file` to examine** services related to your task
   - [ ] **Use `codebase_search` to find** related functionality and patterns
   - [ ] **🚨 INSPECT FUNCTION DEFINITIONS** - See Section 2, Step 4 for detailed function inspection workflow

3. **STRATEGIC ANALYSIS** (🟡🔴 if needed)
   - [ ] **Present solution options** with pros/cons analysis for each approach
   - [ ] **Include implementation complexity and risk levels** for each option
   - [ ] **Provide clear recommendation** with rationale
   - [ ] **Wait for user decision** on preferred approach

4. **CREATE APPROPRIATELY-SIZED TASK DOCUMENT (Required)**
   - [ ] **🟢 SIMPLE: Use sections 1,4,10,11 only** (~150 lines)
   - [ ] **🟡 STANDARD: Use sections 1,3,4,6,8,10,11,15** (~400 lines)
   - [ ] **🔴 COMPLEX: Use all sections** (~600+ lines)
   - [ ] **🔢 FIND LATEST TASK NUMBER**: Use `list_dir` to examine ai_docs/tasks/
   - [ ] **Name the file** using the pattern `XXX_brief_task_name.md`

5. **PRESENT TASK DOCUMENT & IMPLEMENTATION OPTIONS (Required)**
   - [ ] **Present the complete task document summary AND implementation options together:**

   ```
   📋 **Task Document Created**

   I've created a [COMPLEXITY LEVEL] task document that proposes [BRIEF SUMMARY OF APPROACH].

   **👤 How would you like to proceed?**

   **A) Preview Detailed Code Changes**
   Show me exactly what files will be modified with before/after code examples before implementing.

   **B) Approve and Start Implementation**
   The task document looks good - proceed with implementation phase by phase.

   **C) Modify the Approach**
   I have questions or want to change something about the proposed solution.
   ```

   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default
   - [ ] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [ ] **If B chosen**: Begin phase-by-phase implementation immediately
   - [ ] **If C chosen**: Address feedback and re-present options

6. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase, follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using this format:

   ```
   ✅ **Phase [X] Complete - [Phase Name]**
   - Modified [X] files with [Y] total line changes
   - Key changes: [specific file paths and what was modified]
   - Files updated:
     • service1.py (+20 lines): [brief description of changes]
     • model2.py (-5 lines, +12 lines): [brief description of changes]
   - Commands executed: [uv sync, uv run ruff check, uv run mypy, etc.]
   - Python validation: ✅ All imports work / ❌ [specific import issues]
   - Type checking: ✅ MyPy passes / ❌ [specific type issues]
   - Linting status: ✅ Ruff passes / ❌ [specific linting issues]

   **🔄 Next: Phase [X+1] - [Phase Name]**
   - Will modify: [specific files]
   - Changes planned: [brief description]
   - Estimated scope: [number of files/changes expected]

   **Say "proceed" to continue to Phase [X+1]**
   ```

   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 4 (Comprehensive Code Review) - DO NOT skip this step

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [ ] **Mark checkboxes as [x]** with completion timestamps
   - [ ] **Add specific completion notes** (file paths, line counts, key changes)
   - [ ] **Run Python validation** during each phase: compilation, imports, linting, type checking
   - [ ] **Use UV commands exclusively** for dependency management
   - [ ] **Test all new functions/services** with basic validation before marking complete

### Technical Approach Validation

**BEFORE implementing, ALWAYS confirm:**

- [ ] **SDK Choice:** "Should I use Vertex AI (existing) or add Google Gen AI SDK for this feature?"
- [ ] **Authentication:** "I see you're using Vertex AI with gcloud auth - should I continue with that pattern?"
- [ ] **Dependencies:** "Your project uses [existing SDKs] - should the new feature use these or different tools?"

**🚨 For Google AI package compliance and LLM model standards, see Section 10 "Code Quality Standards"**

7. **WORKFLOW CONTINUATION**
   - [ ] **After all implementation phases complete**: Proceed to Phase 4 (Comprehensive Code Review)
   - [ ] **Follow the mandatory workflow** outlined in Phase 4 above
   - [ ] **Present "Implementation Complete!" message** and wait for user approval
   - [ ] **Execute comprehensive code review** only after user approval

### What Constitutes "Explicit User Approval"

#### For Combined Task Document & Implementation Options (Step 5)

**✅ OPTION A RESPONSES (Show detailed code previews):**

- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"
- "Let me see what will be modified"
- "Walk me through the changes"

**✅ OPTION B RESPONSES (Start implementation immediately):**

- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin" or "Execute the plan"
- "Looks good, implement it"

**✅ OPTION C RESPONSES (Provide more feedback):**

- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."
- "What about..." or "How will you handle..."
- "I'd like to change..."
- "Wait, let me think about..."

#### For Phase Continuation

**✅ PHASE CONTINUATION RESPONSES:**

- "proceed"
- "continue"
- "next phase"
- "go ahead"
- "looks good"

**❓ CLARIFICATION NEEDED (Do NOT continue to next phase):**

- Questions about the completed phase
- Requests for changes to completed work
- Concerns about the implementation
- No response or silence

#### For Final Code Review

**✅ CODE REVIEW APPROVAL:**

- "proceed"
- "yes, review the code"
- "go ahead with review"
- "approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**  
🛑 **NEVER continue to next phase without "proceed" confirmation!**  
🛑 **NEVER skip comprehensive code review after implementation phases!**  
🛑 **NEVER proceed to user testing without completing code review first!**  
🛑 **NEVER skip the final code review recommendation step!**

**🚨 For detailed Python code quality standards, see Section 10 "Code Quality Standards"**

---

## 18. Notes & Additional Context

### Research Links

- [Link to relevant documentation]
- [FastAPI documentation for specific features]
- [Database schema or API documentation]

### Performance Considerations

- [Database query optimization]
- [Async operation patterns]
- [Memory usage and garbage collection]

---

**CRITICAL GUIDELINES:**

- **🎯 CHOOSE COMPLEXITY FIRST** - Most tasks are 🟢 SIMPLE and should use minimal sections
- **USE THE QUICK-START TEMPLATE** - For 80% of tasks, this is all you need
- **FOCUS ON PROBLEM → SOLUTION → IMPLEMENTATION** - Skip unnecessary analysis for simple changes
- **FOLLOW SECTION 10 CODE QUALITY STANDARDS** - Complete requirements for Python best practices
- **ALWAYS USE UV** for dependency management
- **USE MODERN GOOGLE AI PACKAGES** only (see Section 10 for compliance details)

---

_Template Version: 2.0 - Complexity-Aware_  
_Last Updated: 2025-07-26_  
_Created By: Brandon Hancock_  
_Adapted from: Original Python Task Template_
