import type { DiffLine } from '../types';

interface DiffResult {
  left: DiffLine[];
  right: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
}

export function computeDiff(original: string, modified: string): DiffResult {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  // Build LCS table
  const m = origLines.length;
  const n = modLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let i = m, j = n;
  let stats = { added: 0, removed: 0, unchanged: 0 };

  // Collect in reverse, then reverse at the end
  const tempLeft: DiffLine[] = [];
  const tempRight: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      tempLeft.push({ type: 'unchanged', content: origLines[i - 1], lineNumber: i });
      tempRight.push({ type: 'unchanged', content: modLines[j - 1], lineNumber: j });
      stats.unchanged++;
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempLeft.push({ type: 'unchanged', content: '', lineNumber: 0 }); // spacer
      tempRight.push({ type: 'added', content: modLines[j - 1], lineNumber: j });
      stats.added++;
      j--;
    } else if (i > 0) {
      tempLeft.push({ type: 'removed', content: origLines[i - 1], lineNumber: i });
      tempRight.push({ type: 'unchanged', content: '', lineNumber: 0 }); // spacer
      stats.removed++;
      i--;
    }
  }

  left.push(...tempLeft.reverse());
  right.push(...tempRight.reverse());

  return { left, right, stats };
}
