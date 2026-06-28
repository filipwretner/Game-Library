# UserPromptSubmit hook: when the prompt mentions "code review", inject the project's
# code-review guide so the agent reviews against our architecture/quality/perf rules.
# stdin is the hook JSON payload ({ "prompt": "...", ... }); stdout (exit 0) is added to context.

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$raw = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

try { $data = $raw | ConvertFrom-Json } catch { exit 0 }
$prompt = "$($data.prompt)"

# Match "code review", "code-review", "codereview", "review the code", "/code-review".
if ($prompt -notmatch '(?i)(code\s*-?\s*review|review\s+(the\s+)?(code|diff|pr|pull request|changes))') {
  exit 0
}

$root = $env:CLAUDE_PROJECT_DIR
if ([string]::IsNullOrWhiteSpace($root)) { $root = (Get-Location).Path }
$doc = Join-Path $root '.claude/docs/code-review.md'
if (-not (Test-Path $doc)) { exit 0 }

Write-Output 'A code review was requested. Apply the project code review guide below: check architectural boundaries, code-quality rules, and performance (duplicated, inefficient, and N+1 calls).'
Write-Output ''
Get-Content $doc -Raw
exit 0
