# Python Codebase Cleanup Analysis Template

> **Purpose:** Comprehensive analysis of Python projects using UV and pyproject.toml to identify unused code, type issues, performance problems, and cleanup opportunities. This template generates a detailed findings report that gets handed off to `task_template.md` for implementation.

> **Scope:** This template is designed for Python projects with `pyproject.toml` and UV package manager only. For Node.js/TypeScript projects, use `cleanup.md` template instead.

---

## 🔍 PHASE 1: Pre-Analysis Setup

### Project Context Analysis

<!-- AI Agent: Analyze the current Python project to understand its structure and existing tooling -->

#### Technology & Architecture

<!--
AI Agent: Analyze the project to fill this out.
- Check `pyproject.toml` for dependencies, tool configurations, and dependency groups.
- Check main package directory structure (e.g., `youtube_workflow_agent/`).
- Check root Python files (`*.py` in project root).
- Check `uv.lock` for locked dependency versions.
- Check for existing tool configurations (ruff, black, mypy).
- Check project root for `pyproject.toml` vs `package.json` to confirm Python project type.
-->

- **Project Type:** [Python project - confirmed by presence of `pyproject.toml`, `uv.lock`, `.py` files]
- **Template Base:** [e.g., adk-agent, fastapi-service, data-processor]
- **Python Version:** [e.g., Python 3.10-3.13 as specified in pyproject.toml]
- **Package Manager:** [UV - confirmed by `uv.lock` presence]
- **Main Package:** [e.g., `youtube_workflow_agent/` directory]
- **Core Dependencies:** [e.g., FastAPI, Pydantic, Google ADK, pandas]
- **Key Architectural Patterns:** [e.g., FastAPI async endpoints, Pydantic models, ADK agent system]
- **Development Tools:** [e.g., ruff for linting, black for formatting, mypy for type checking]

#### Current Directory Structure

```
# AI Agent: Run list_dir or tree command to understand Python project layout
[Project structure overview - focus on main package directory and root files]
```

#### Existing Development Tooling

- **Linting:** [e.g., ruff with specific rules configuration]
- **Type Checking:** [e.g., mypy with strictness settings]
- **Formatting:** [e.g., black with line length settings]
- **Testing:** [e.g., pytest with async support, coverage tools]
- **Package Manager:** [UV - confirmed by uv.lock and pyproject.toml structure]
- **Dependency Groups:** [List groups from pyproject.toml: dev, test, lint, etc.]
- **Scripts Available:** [List any project.scripts from pyproject.toml]
- **Dependencies Count:** [Total project.dependencies vs dependency-groups counts]

---

## 🛠️ PHASE 2: Analysis Tool Setup

### Project Type Detection & Validation

<!--
AI Agent: CRITICAL - Always detect project type first before running any commands!
Follow the project type detection rules from cursor_rules.
-->

#### Step 1: Validate Python Project Type

```bash
# Check for Python project indicators
ls -la | grep -E "(pyproject\.toml|uv\.lock|setup\.py)"

# For this cleanup template: Focus on UV + pyproject.toml projects only
# Confirmed by presence of: pyproject.toml, uv.lock, main package directory
```

**🚨 MANDATORY PYTHON PROJECT VALIDATION:**

- [ ] **UV Python Project Confirmed:** `pyproject.toml` + `uv.lock` + `.py` files present
- [ ] **Use UV Commands:** `uv run ruff check`, `uv run mypy`, `uv run pytest`
- [ ] **Skip if Node.js Project:** If `package.json` + no `pyproject.toml`, use `cleanup.md` template instead

#### Step 2: Tool Availability Check

```bash
# Verify UV is available and project is properly set up
uv --version
uv sync --dry-run  # Check if dependencies resolve correctly

# Verify existing tools are configured (no installation needed - using existing config)
uv run ruff --version
uv run black --version
uv run mypy --version
uv run pytest --version
```

**✅ No Additional Tool Installation Required:**
Since the project already has development tools configured in `pyproject.toml`, we'll use the existing setup rather than installing additional analysis tools.

---

## 🕵️ PHASE 3: Comprehensive Analysis Execution

### Analysis Commands Sequence (Python UV Projects Only)

<!-- AI Agent: Only run these commands after confirming Python UV project type -->

**🚨 MANDATORY AI AGENT REQUIREMENTS:**

- **NEVER make destructive changes without user approval** - Always show what will be changed first
- **NEVER use `Any` type during cleanup implementation** - This defeats the purpose of Python cleanup
- **ALWAYS find proper types** - Research framework documentation, use codebase search, check imports
- **FAIL the cleanup** if you cannot find proper types - Ask for help rather than use `Any`
- **VALIDATE zero Any usage** after cleanup using grep commands below
- **AUTO-DETECT project patterns** from pyproject.toml rather than assuming command structure

**🔍 PROJECT PATTERN AUTO-DETECTION:**

```bash
# Auto-detect dependency groups and linting commands from pyproject.toml
python -c "
import tomllib
with open('pyproject.toml', 'rb') as f:
    config = tomllib.load(f)

groups = config.get('dependency-groups', {})
print('📋 Available dependency groups:', list(groups.keys()))

# Determine linting command pattern
if 'dev' in groups and any('ruff' in dep or 'mypy' in dep for dep in groups['dev']):
    print('✅ Use: uv run --group dev ruff check')
elif 'lint' in groups:
    print('✅ Use: uv run --group lint ruff check')
else:
    print('✅ Use: uv run ruff check')
"
```

**🔍 MANDATORY TYPE RESEARCH METHODOLOGY (BEFORE making any type changes):**

1. **Identify the framework/library** (e.g., "google.adk", "fastapi", "pydantic")
2. **Search existing codebase** for similar usage patterns: `grep -r "StateType\|CallbackContext" . --include="*.py"`
3. **Try framework imports systematically**: `python -c "from framework.module import SpecificType; print('Found:', SpecificType)"`
4. **Check framework source/docs** for type exports: `python -c "from framework import *; print([x for x in dir() if 'Type' in x])"`
5. **ONLY THEN implement fixes** - never guess or use `Any` as placeholder

**🚨 SPECIFIC TYPE DISCOVERY COMMANDS:**

```bash
# For ADK framework types (example from our mistake)
python -c "from google.adk.sessions import State; print('✅ Found ADK State type')"
python -c "from google.adk.agents.callback_context import CallbackContext; help(CallbackContext.state)"

# For any framework - discover available types
python -c "from your_framework import *; print([x for x in dir() if x[0].isupper()])"
```

**1. Dependency Analysis:**

```bash
# Check dependency tree and relationships
uv tree

# Check for dependency resolution issues
uv sync --dry-run

# Check for unused dependencies (manual analysis needed - see Phase 4)
# Note: UV doesn't have built-in unused dependency detection like npm
```

**2. Unused Code Analysis:**

```bash
# Run ruff with existing configuration (includes unused imports)
uv run ruff check --output-format=full

# Run mypy with existing configuration for type issues
uv run --group dev mypy .

# Check for unused variables and imports specifically
uv run ruff check --select F401,F841 --output-format=full
```

**3. Type Issues Analysis:**

```bash
# Auto-detect linting commands from project configuration
python -c "
import tomllib
with open('pyproject.toml', 'rb') as f:
    config = tomllib.load(f)
    groups = config.get('dependency-groups', {})

    # Determine proper command pattern
    if 'dev' in groups and any('mypy' in str(dep) for dep in groups['dev']):
        print('LINT_CMD=uv run --group dev')
    elif 'lint' in groups:
        print('LINT_CMD=uv run --group lint')
    else:
        print('LINT_CMD=uv run')
"

# Use detected command pattern for type checking
\$LINT_CMD mypy . --no-error-summary

# 🚨 CRITICAL: Check for any types and type: ignore comments
grep -r "Any\|type: ignore" . --include="*.py" --exclude-dir=__pycache__

# 🚨 MANDATORY: Validate no Any types used in function signatures or variable annotations
grep -r ": Any\|-> Any\|Any]" . --include="*.py" --exclude-dir=__pycache__
```

**🚨 TYPE SAFETY ENFORCEMENT RULES:**

- **NEVER use `Any` to resolve type conflicts** - Always find the proper framework/library types
- **NEVER use `Any` as a quick fix** - Spend time to discover correct types from documentation/imports
- **ALWAYS import specific types** - Use `from framework.module import SpecificType` instead of `Any`
- **RESEARCH framework types** - Check documentation, use IDE autocompletion, search codebase for examples
- **PREVIEW changes before implementing** - Show user what types will be changed and why

**4. Code Quality Analysis:**

```bash
# Format checking (don't auto-format, just check)
uv run --group dev black . --check --diff

# Additional ruff checks for code quality
uv run ruff check --select C,N,UP,B --output-format=full
```

**5. Import and Module Analysis:**

```bash
# Find potential import issues
grep -r "^from \|^import " . --include="*.py" | head -30

# Check for inconsistent import styles
grep -r "from .* import" . --include="*.py" | wc -l
grep -r "^import " . --include="*.py" | wc -l
```

**6. Python-Specific File Organization Analysis:**

```bash
# Find __pycache__ directories that might need gitignore
find . -type d -name "__pycache__" -not -path "./venv/*" -not -path "./.venv/*"

# Check __init__.py files (some might be unnecessary)
find . -name "__init__.py" -exec wc -l {} + | sort -n

# Find misplaced Python files
find . -name "*.py" -not -path "./*package_directory*" -not -path "./tests/*" -not -path "./venv/*" -not -path "./.venv/*" | head -10
```

**7. Performance Pattern Analysis:**

```bash
# Find potential performance issues in Python code
grep -r "\.append\|\.extend" . --include="*.py" | wc -l  # List comprehension opportunities
grep -r "for.*in.*range" . --include="*.py" | wc -l    # Potential optimization opportunities

# Check for console/print statements
grep -r "print(\|console\." . --include="*.py" --exclude-dir=tests
```

**8. Security and Best Practices:**

```bash
# Check for potential security issues (basic patterns)
grep -r "eval\|exec\|subprocess\.call" . --include="*.py"

# Check for hardcoded credentials patterns
grep -r "password\s*=\|api_key\s*=\|secret\s*=" . --include="*.py"
```

---

## 📊 PHASE 4: Findings Report Generation

### 🚨 Critical Issues (Fix Immediately)

<!-- AI Agent: Categorize findings by severity -->

**Type Errors:**

- [ ] **File:** [path] - **Issue:** [mypy error description] - **Impact:** [breaks type checking/runtime]
- [ ] **File:** [path] - **Issue:** [specific type problem] - **Suggested Fix:** [solution]

**Import/Module Errors:**

- [ ] **Import Errors:** [list files with broken imports]
- [ ] **Missing Dependencies:** [packages referenced but not in pyproject.toml]
- [ ] **Configuration Issues:** [pyproject.toml, ruff.toml, mypy.ini problems]

### ⚠️ High Priority Issues (Fix Soon)

**Unused Code (High Confidence):**

- [ ] **Unused Imports:** [file] imports [module] but never uses it
- [ ] **Unused Variables:** [file] declares [variable] but never references it
- [ ] **Dead Functions:** [file] defines [function] but no modules call it
- [ ] **Unused Dependencies:** [package] in pyproject.toml but not imported anywhere

**Type Quality Issues:**

- [ ] **🚨 CRITICAL - Any Types:** [file] uses `Any` at [line] - **MUST** be replaced with [specific type] - **NEVER acceptable as quick fix**
- [ ] **Missing Annotations:** [file] function [name] missing return type annotation
- [ ] **Type Ignore Comments:** [file] uses `# type: ignore` at [line] - review if still needed

**🚨 ANTI-PATTERN PREVENTION:**

- [ ] **NEVER use `Any` to resolve type conflicts** - Always find proper types from framework/libraries
- [ ] **NEVER use `Any` for function parameters** - Use specific types or protocols
- [ ] **NEVER use `Any` as return type** - Use specific return types or unions

### 🔧 Medium Priority Issues (Improvement Opportunities)

**Performance Patterns:**

- [ ] **List Comprehension Opportunities:** [file] uses loop that could be comprehension
- [ ] **Generator Opportunities:** [file] creates large list that could be generator
- [ ] **String Concatenation:** [file] uses + concatenation instead of join() or f-strings
- [ ] **Missing Caching:** [file] expensive operation could benefit from functools.lru_cache

**Code Organization:**

- [ ] **Misplaced Files:** [file] should be in [suggested directory] not [current location]
- [ ] **Large Files:** [file] is [lines] lines, consider splitting into smaller modules
- [ ] **Import Style Inconsistency:** Mix of absolute/relative imports across project
- [ ] **Unnecessary `__init__.py`:** [file] empty init file in Python 3.3+ namespace package

**Python-Specific Issues:**

- [ ] **`__pycache__` in VCS:** Bytecode cache directories should be in .gitignore
- [ ] **Version Compatibility:** [file] uses Python feature not supported in required version range
- [ ] **Import Order:** [file] imports don't follow PEP 8 order (stdlib, third-party, local)

**Dependency Management:**

- [ ] **Dependency Group Misplacement:** [package] should be in [group] not [current-group]
- [ ] **Version Pinning:** [package] should specify minimum version for stability
- [ ] **Unused Dev Dependencies:** [package] in dev group but not used in development tools

### 📈 Low Priority Issues (Nice to Have)

**Code Style & Consistency:**

- [ ] **Print Statements:** [count] print() statements found (should use logging)
- [ ] **Inconsistent String Quotes:** Mix of single/double quotes across files
- [ ] **Missing Docstrings:** Functions/classes missing docstring documentation
- [ ] **Comment Quality:** TODO/FIXME comments that could be addressed

**Modern Python Patterns:**

- [ ] **F-String Opportunities:** [file] uses .format() or % formatting instead of f-strings
- [ ] **Pathlib Usage:** [file] uses os.path instead of pathlib.Path
- [ ] **Dataclass Opportunities:** [file] has classes that could be @dataclass

### 🔍 Review Recommended (Business Logic)

<!-- AI Agent: Identify complex business logic that needs human review but don't suggest automatic changes -->

**Complex Logic Patterns:**

- [ ] **File:** [path] - **Pattern:** [complex algorithm/business rule] - **Note:** Review for optimization opportunities
- [ ] **File:** [path] - **Pattern:** [error handling strategy] - **Note:** Consider if error handling is comprehensive enough
- [ ] **File:** [path] - **Pattern:** [data processing logic] - **Note:** Verify correctness, consider adding tests

---

## 📋 PHASE 5: Action Plan Summary

### Files Requiring Attention

<!-- AI Agent: Create actionable summary organized by file -->

**High Impact Files (Fix First):**

1. **[file-path]** - [count] critical issues: [brief summary]
2. **[file-path]** - [count] critical issues: [brief summary]
3. **[file-path]** - [count] critical issues: [brief summary]

**Medium Impact Files:**

1. **[file-path]** - [count] medium issues: [brief summary]
2. **[file-path]** - [count] medium issues: [brief summary]

**Low Impact Files:**

1. **[file-path]** - [count] minor issues: [brief summary]

### Estimated Cleanup Impact

- **Lines of Code Reducible:** ~[number] lines
- **Files Cleanable:** ~[number] files with unused code
- **Dependencies Removable:** ~[number] packages from pyproject.toml
- **Type Safety Improvement:** [percentage] of Any types can be replaced
- **Performance Gains:** [estimate] functions can be optimized

### Recommended Cleanup Order

1. **Fix Critical Issues** (Import/Type errors) - Est: [time]
2. **Remove Dead Code** (Unused imports/functions/variables) - Est: [time]
3. **Improve Type Safety** (Replace Any types, add annotations) - Est: [time]
4. **Optimize Performance** (List comprehensions, caching, generators) - Est: [time]
5. **Clean Dependencies** (Remove unused from pyproject.toml) - Est: [time]
6. **Reorganize Files** (Move misplaced files, fix imports) - Est: [time]

---

## 🚀 PHASE 6: Handoff to Implementation

### Task Template Data Package

<!-- AI Agent: Format this data to pass to task_template.md -->

**Task Title:** "Comprehensive Python Codebase Cleanup - [Project Name]"

**Goal Statement:**
Clean up [project-name] Python codebase by removing [X] unused imports, fixing [Y] type issues, optimizing [Z] performance patterns, and removing [N] unnecessary dependencies from pyproject.toml to improve maintainability, type safety, and code quality.

**🚨 CRITICAL TYPE SAFETY REQUIREMENT:**
**ZERO `Any` types permitted in cleanup** - All type conflicts MUST be resolved with proper framework/library types, never with `Any` as a workaround.

**High-Level Changes Required:**

- Remove unused code ([specific count] imports, [count] functions, [count] variables)
- Fix type issues ([count] Any types, [count] missing annotations) **WITHOUT introducing new Any types**
- Optimize performance ([count] comprehension opportunities, [count] caching opportunities)
- Clean dependencies ([count] unused packages from pyproject.toml)
- Reorganize files ([count] misplaced files, [count] import style fixes)

**TYPE CONFLICT RESOLUTION METHODOLOGY:**

1. **Research framework documentation** - Find proper types for third-party libraries
2. **Use codebase search** - Look for existing examples of proper type usage
3. **Import specific types** - `from framework.module import SpecificType`
4. **Create protocols if needed** - Use `typing.Protocol` for duck-typed interfaces
5. **Use union types** - `str | int` instead of `Any` for multiple valid types

**🎯 COMMON FRAMEWORK TYPE DISCOVERY EXAMPLES:**

```bash
# Google ADK Framework Types
python -c "from google.adk.sessions import State; print('✅ State for session_state parameters')"
python -c "from google.adk.agents.callback_context import CallbackContext; print('✅ CallbackContext for callback functions')"
python -c "from google.adk.tools import ToolContext; print('✅ ToolContext for tool functions')"

# FastAPI Framework Types
python -c "from fastapi import Request, Response; print('✅ Request/Response types')"
python -c "from fastapi.security import HTTPBearer; print('✅ Security types')"

# Pydantic Framework Types
python -c "from pydantic import BaseModel, Field; print('✅ BaseModel for data classes')"

# SQLAlchemy Framework Types
python -c "from sqlalchemy.engine import Engine; print('✅ Engine for database connections')"

# NEVER DO: session_state: Any
# ALWAYS DO: session_state: State (after importing from google.adk.sessions)
```

**🚨 FRAMEWORK TYPE RESEARCH CHECKLIST:**

- [ ] **Identify framework first** - What library/package is being used?
- [ ] **Search codebase for examples** - How do other files use this type?
- [ ] **Try systematic imports** - Test `from framework.module import Type`
- [ ] **Use Python REPL** - Test imports before implementing
- [ ] **Document the discovery** - Record proper import for future reference
- [ ] **NEVER use `Any` as placeholder** - Always complete type research first

**🛡️ INTEGRATION WITH PROJECT .cursor/rules (When Present):**

```bash
# Check if project has specific Python rules to follow
if [ -d ".cursor/rules" ]; then
    echo "📋 Found project-specific Python rules - validating against:"
    ls .cursor/rules/python-*.mdc | head -5
    echo "✅ Will validate cleanup follows project standards"
else
    echo "📋 No .cursor/rules found - using standard Python best practices"
fi

# Extract lessons from project rules (AI analysis)
python -c "
import os
if os.path.exists('.cursor/rules'):
    print('🎯 Project enforces specific Python patterns - analyze these before cleanup')
    print('- avoid-any-type.mdc: Never use Any type')
    print('- python-modern-type-annotations.mdc: Use Python 3.10+ syntax')
    print('- python-timezone-aware-datetime.mdc: Use datetime.now(timezone.utc)')
    print('- python-automatic-linting-checks.mdc: Immediate verification required')
"
```

**Files to Modify:** [List of all Python files needing changes]

**Dependencies to Add/Remove:** [Specific pyproject.toml changes]

**Validation Checklist:**

- [ ] `uv run ruff check` passes with 0 errors
- [ ] `uv run --group dev mypy .` passes with 0 errors
- [ ] All imports resolve correctly (verified through mypy)
- [ ] No unused dependencies remain in pyproject.toml (verified through manual analysis)
- [ ] All files follow consistent import patterns
- [ ] Performance patterns implemented where safe
- [ ] No print() statements remain in production code (logging used instead)
- [ ] **🚨 CRITICAL: Zero `Any` types remain** - `grep -r ": Any\|-> Any\|Any]" . --include="*.py" --exclude-dir=__pycache__` returns ZERO results
- [ ] **All type errors resolved with proper types** - No `Any` used as workaround for type conflicts
- [ ] **Framework types properly imported** - All third-party framework types discovered and imported correctly
- [ ] **Specific framework type examples documented** - Record proper imports used (e.g., `from google.adk.sessions import State`)
- [ ] **Type research methodology followed** - Confirmed proper types were researched, not guessed
- [ ] `uv run --group test pytest` passes all existing tests

**🚨 POST-CLEANUP ANY TYPE AUDIT:**

```bash
# This command MUST return zero results after cleanup
grep -r ": Any\|-> Any\|Any]" . --include="*.py" --exclude-dir=__pycache__ --exclude-dir=.venv

# Only these legitimate Any imports should remain (if needed)
grep -r "from typing import.*Any\|import.*Any" . --include="*.py"
```

### User Review & Feedback Section

<!-- User fills this out after reviewing the findings -->

**Approved Changes:**

- [ ] Fix all critical issues automatically
- [ ] Remove all detected unused code
- [ ] Fix all type issues
- [ ] Apply all safe performance optimizations
- [ ] Clean all unused dependencies
- [ ] Reorganize all files with consistent imports

**Modifications Requested:**

- [ ] Skip certain files: [list files to exclude]
- [ ] Keep certain "unused" code: [list code to preserve]
- [ ] Don't remove certain dependencies: [list packages to exclude]
- [ ] Different organization approach: [specify preferences]

**Business Logic Review Items:**

- [ ] Review complex algorithms in: [list files]
- [ ] Verify error handling patterns in: [list files]
- [ ] Test data processing logic in: [list files]

**Additional Instructions:**
[Any specific guidance or preferences for the Python cleanup implementation]

---

## 📁 Generated Files & Reports

### Analysis Output Files

- `python-cleanup-analysis-report.md` - Full detailed findings
- `unused-code-report.txt` - Ruff and unused import/variable output
- `type-issues-report.txt` - MyPy strict mode violations and Any usage
- `dependency-analysis.txt` - UV tree output and unused dependency analysis
- `performance-opportunities.txt` - List comprehension and optimization opportunities
- `framework-types-discovered.txt` - Record of proper framework types found and imported

### 🚨 IMPLEMENTATION FAILURE CONDITIONS

**STOP CLEANUP IMMEDIATELY if:**

- [ ] **Cannot find proper framework types** - Don't guess, don't use `Any`, STOP and ask for help
- [ ] **Type conflicts cannot be resolved** - Don't use `Any` as workaround, PAUSE and research more
- [ ] **Framework documentation is unclear** - Request user guidance rather than implement with `Any`
- [ ] **Would make destructive changes** - ALWAYS show user what will be changed before implementing

**🛡️ USER APPROVAL REQUIRED BEFORE:**

- [ ] **Removing any functions/classes** - Show what will be deleted and why
- [ ] **Changing type annotations** - Show before/after comparison
- [ ] **Removing imports** - Explain what's unused and impact
- [ ] **Modifying complex business logic** - Never assume it's safe to change

**Example Failure Messages:**

- ❌ "Cannot determine proper ADK State type - stopping cleanup to avoid Any usage"
- ❌ "Framework types unclear for X - please provide guidance on proper imports"
- ❌ "Type conflict in Y cannot be resolved without framework documentation"
- ❌ "About to remove [X] functions - please confirm this is safe before proceeding"

**💬 REQUIRED USER CONFIRMATION FORMAT:**

```
📋 PROPOSED CHANGES PREVIEW:
🗑️  WILL DELETE:
   - file1.py (unused competitor analysis code)
   - function_x() in file2.py (no callers found)

🔧 WILL MODIFY:
   - session_state: Any → session_state: State (found proper ADK type)
   - 4 print() statements → logger.warning() (production code)

✅ Please confirm these changes are acceptable before proceeding.
```

### Next Steps

1. **Review this analysis** and provide feedback in the "User Review & Feedback Section"
2. **Analysis will be fed to task_template.md** to create implementation task
3. **Implementation task will execute** the approved cleanup changes **ONLY with proper framework types**
4. **Validation will confirm** all changes work correctly using existing test suite **AND zero Any types remain**

---

_This Python cleanup analysis template ensures comprehensive codebase health assessment for UV-based Python projects and provides structured data for automated cleanup implementation via task_template.md._
