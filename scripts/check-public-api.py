"""Real public auth boundary checks; synthetic unknown identity only, no account changes."""
import json
import secrets
import urllib.request
import urllib.error
from pathlib import Path
results = []
base = 'http://127.0.0.1:8080'
for name, path, body, expected in [
    ('missing identity rejected', '/api/auth/login', {}, 400),
    ('unknown credentials masked', '/api/auth/login', {'email':f'unknown-{secrets.token_hex(8)}@example.test','password':'synthetic-only'}, 401),
    ('unknown recovery conditionally accepted', '/api/auth/forgot-password', {'email':f'unknown-{secrets.token_hex(8)}@example.test'}, 202),
    ('invalid reset link rejected generically', '/api/auth/reset-password', {'token':'synthetic.invalid','password':'synthetic-password-only'}, 401),
    ('invalid refresh rejected', '/api/auth/refresh', {'refreshToken':'synthetic.invalid'}, 401),
]:
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(), headers={'Content-Type':'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            status, result = response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        status, result = error.code, json.loads(error.read())
    if status != expected:
        raise RuntimeError(f'{name}: expected {expected}, got {status}')
    results.append({'check':name, 'status':status, 'code':result.get('code'), 'conditionalMessage':result.get('message')})
Path('docs/evidence').mkdir(parents=True, exist_ok=True)
Path('docs/evidence/live-public-api.json').write_text(json.dumps({'kind':'real HTTP; not browser integration', 'results':results}, indent=2))
print(json.dumps(results,indent=2))
