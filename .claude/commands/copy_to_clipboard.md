# Copy to Clipboard

> **Purpose:** Copy text or file contents to the system clipboard with automatic cross-platform support (macOS, Windows, Linux, and WSL).

---

## Overview

This command intelligently detects your operating system and uses the appropriate clipboard tool to copy content. It can copy the last AI output, convert markdown to a format suitable for pasting, or copy file contents directly.

---

## Platform-Specific Commands

### For macOS:

Use the built-in `pbcopy` command:

```bash
echo "text to copy" | pbcopy
```

For file contents:
```bash
cat /path/to/file.txt | pbcopy
```

### For Windows (PowerShell):

Use `Set-Clipboard` cmdlet:

```powershell
"text to copy" | Set-Clipboard
```

For file contents:
```powershell
Get-Content /path/to/file.txt | Set-Clipboard
```

### For Windows (Command Prompt / Batch):

Use the `clip` command:

```cmd
echo text to copy | clip
```

For file contents:
```cmd
type /path/to/file.txt | clip
```

### For WSL (Windows Subsystem for Linux):

Use `clip.exe` from Windows:

```bash
echo "text to copy" | clip.exe
```

For file contents:
```bash
cat /path/to/file.txt | clip.exe
```

### For Linux (X11 / Standard):

Use `xclip` command:

```bash
echo "text to copy" | xclip -selection clipboard
```

For file contents:
```bash
cat /path/to/file.txt | xclip -selection clipboard
```

### For Linux (Wayland):

Use `wl-copy` command:

```bash
echo "text to copy" | wl-copy
```

For file contents:
```bash
cat /path/to/file.txt | wl-copy
```

### For Linux (Fallback / Alternative):

Use `xsel` command:

```bash
echo "text to copy" | xsel --clipboard --input
```

For file contents:
```bash
xsel --clipboard --input < /path/to/file.txt
```

---

## AI Agent Instructions

### Step 1: Detect the Operating System

Examine the environment context to determine the current platform:

- **macOS**: Look for `darwin` in the platform field
- **Windows (native)**: Look for `win32` in the platform field
- **WSL**: Check if running on Linux but look for `/proc/version` containing "microsoft" or "WSL" indicators
- **Linux (Wayland)**: Check if `WAYLAND_DISPLAY` or `XDG_SESSION_TYPE=wayland` is set
- **Linux (X11)**: Default Linux behavior with X11 display server

### Step 2: Choose the Appropriate Clipboard Command

Based on the detected platform, select the correct command:

- **macOS**: Use `pbcopy`
- **Windows (PowerShell)**: Use `Set-Clipboard`
- **Windows (CMD)**: Use `clip`
- **WSL**: Use `clip.exe`
- **Linux (Wayland)**: Try `wl-copy` first
- **Linux (X11)**: Try `xclip` first, fall back to `xsel`
- **Linux (Generic)**: Check what's available and suggest installation if missing

### Step 3: Validate and Execute

1. Check if the required clipboard tool is available
2. If not available, provide clear installation instructions for the user's OS
3. Execute the platform-specific command with the content to copy
4. Capture any error output

### Step 4: Confirm and Report

- **Success**: Report what was copied and how many characters/lines
- **Failure**: Provide helpful error message with installation suggestions
- **Not Found**: Suggest the appropriate tool installation command for the detected OS

---

## Installation Instructions

### macOS

`pbcopy` is built-in, no installation needed.

### Windows

Clipboard tools are built-in:
- PowerShell: `Set-Clipboard` is available in PowerShell 5.0+
- Command Prompt: `clip` is built-in

### WSL

`clip.exe` is built-in and available from WSL when Windows is installed.

### Linux - xclip Installation

**Ubuntu / Debian:**
```bash
sudo apt-get update
sudo apt-get install xclip
```

**Fedora / RHEL / CentOS:**
```bash
sudo dnf install xclip
```

**Arch Linux:**
```bash
sudo pacman -S xclip
```

**Alpine Linux:**
```bash
apk add xclip
```

### Linux - wl-clipboard Installation (Wayland)

**Ubuntu / Debian:**
```bash
sudo apt-get update
sudo apt-get install wl-clipboard
```

**Fedora / RHEL:**
```bash
sudo dnf install wl-clipboard
```

**Arch Linux:**
```bash
sudo pacman -S wl-clipboard
```

### Linux - xsel Installation (Fallback)

**Ubuntu / Debian:**
```bash
sudo apt-get install xsel
```

**Fedora / RHEL:**
```bash
sudo dnf install xsel
```

**Arch Linux:**
```bash
sudo pacman -S xsel
```

---

## Error Handling Guide

### Error: Command not found (e.g., `pbcopy: command not found`)

- **Cause**: The clipboard tool is not installed or not in PATH
- **Solution**: Provide the OS-specific installation command from the "Installation Instructions" section
- **Action**: Suggest user install the tool, then retry

### Error: Permission denied

- **Cause**: User doesn't have permission to execute the clipboard command
- **Solution**: Suggest running with `sudo` if appropriate, or check file permissions
- **Action**: Ask user to check permissions or try with elevated access

### Error: Empty input / Nothing to copy

- **Cause**: The content to copy is empty or undefined
- **Solution**: Validate that content exists before attempting to copy
- **Action**: Ask user to provide content or confirm the last output

### Error: Display server not available (Linux X11)

- **Cause**: No X11 display server detected, but trying to use xclip
- **Solution**: Detect Wayland and use `wl-copy` instead
- **Action**: Switch to Wayland-compatible tool or ask user to set `DISPLAY` variable

---

## Usage Examples

### Example 1: Copy Simple Text to Clipboard

**User Goal**: Copy a single line of text

**macOS/Windows (PowerShell)/Linux**:
- Detect OS
- Execute: `echo "Hello, World!" | [platform-specific-command]`
- Report: "✓ Copied 13 characters to clipboard"

### Example 2: Copy Markdown Code Block

**User Goal**: Copy markdown formatted content (like the SOAP guidelines earlier)

**Process**:
1. Detect OS
2. Take the markdown content
3. Execute: `echo "[markdown content]" | [platform-specific-command]`
4. Report: "✓ Copied markdown (lines: X, chars: Y) to clipboard"

### Example 3: Copy File Contents

**User Goal**: Copy an entire file to clipboard

**Process**:
1. Detect OS
2. Execute: `cat /path/to/file | [platform-specific-command]`
3. Report: "✓ Copied file contents (lines: X, chars: Y) to clipboard"

### Example 4: Linux with Multiple Clipboard Tools

**User Goal**: Copy on Linux but tool availability is uncertain

**Process**:
1. Detect OS as Linux
2. Check if `wl-copy` available (Wayland)
3. If not, check if `xclip` available (X11)
4. If not, check if `xsel` available (Fallback)
5. If none available, provide installation instructions
6. Execute the first available command
7. Report success with tool used or failure with solution

---

## Integration with Markdown Conversion

When copying markdown content (like converted SOAP guidelines):

1. Accept the markdown source
2. Keep formatting intact (don't convert to HTML)
3. Copy exactly as-is for pasting into markdown editors/fields
4. Report the markdown structure (headings, lists, dividers)

---

## Safety Checklist

- [ ] **Validate input** before copying (non-empty, reasonable size)
- [ ] **Detect platform** correctly before choosing tool
- [ ] **Check tool availability** and provide installation help if missing
- [ ] **Preserve formatting** when copying (don't modify content)
- [ ] **Report clearly** what was copied (character count, lines, etc.)
- [ ] **Handle errors gracefully** with helpful suggestions
- [ ] **Test on target platform** if possible before running command

---

## Tips & Tricks

- **Last Output Mode**: When copying the most recent AI output, confirm what's being copied
- **File Paths**: Always validate file paths exist before attempting to copy
- **Large Content**: For very large files (>10MB), consider warning user about clipboard size limits
- **Formatting**: Preserve original formatting (spaces, indentation, line breaks) exactly as-is
- **Multiple Attempts**: If one platform-specific tool fails, try alternatives before giving up