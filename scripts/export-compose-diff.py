from pathlib import Path
import difflib
current = Path('../compose.yaml').read_text()
start = current.index('  backoffice:\n')
end = current.index('  backend:\n', start)
original = current[:start] + current[end:]
Path('docs/root-compose.patch').write_text(''.join(difflib.unified_diff(original.splitlines(keepends=True), current.splitlines(keepends=True), fromfile='a/compose.yaml', tofile='b/compose.yaml', n=3)))
