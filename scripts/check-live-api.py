"""Explicit local API/SMTP smoke. Creates one synthetic test account; never resets seed.
No credentials, email bodies or links are printed/persisted. Existing stack only.
Run: python3 scripts/check-live-api.py --documented-dev-seed
"""
import json
import re
import secrets
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

if sys.argv[1:] != ['--documented-dev-seed']:
    raise SystemExit('Requires explicit --documented-dev-seed opt-in for local test mutations')
BASE = 'http://127.0.0.1:8080'
MAIL = 'http://127.0.0.1:8025'
results = []

def request(path, payload=None, token=None, method=None, base=BASE):
    headers = {'Accept': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if payload is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, data=json.dumps(payload).encode() if payload is not None else None,
                                 headers=headers, method=method or ('POST' if payload is not None else 'GET'))
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())

def check(name, actual, expected):
    if actual != expected:
        raise RuntimeError(f'{name}: expected {expected}, got {actual}')
    results.append({'check': name, 'status': actual})

# Read only the explicitly documented development fixture; never include it in output.
readme = Path('../README.md').read_text()
seed = re.search(r'development account is \*\*([^*]+)\*\*, password \*\*([^*]+)\*\*', readme)
if not seed:
    raise SystemExit('Documented seed missing; no credential guesses')
status, admin = request('/api/auth/login', {'email':seed[1], 'password':seed[2]})
check('documented development fixture login', status, 200)
status, _ = request('/api/auth/me', token=admin['accessToken'])
check('development fixture current identity', status, 200)
email = f'frontend-auth-{secrets.token_hex(6)}@example.test'
password = secrets.token_urlsafe(24)
status, created = request('/api/accounts', {'email':email, 'roles':['DISPATCHER'], 'status':'ACTIVE', 'firstName':None, 'lastName':None}, token=admin['accessToken'])
check('synthetic test fixture provisioned with invitation', status, 201)

# Only search our newly generated recipient, not other mailbox messages.
def captured_token():
    for _ in range(10):
        status, data = request('/api/v1/search?query=to%3A' + email, base=MAIL)
        if status == 200 and data.get('messages'):
            message = data['messages'][0]
            _, detail = request('/api/v1/message/' + message['ID'], base=MAIL)
            match = re.search(r'http://localhost:3000/reset-password#token=([A-Za-z0-9_.-]+)', detail.get('Text',''))
            if match:
                return match[1]
        time.sleep(0.5)
    raise RuntimeError('No expected frontend reset URL found in synthetic captured email')

token = captured_token()
results.append({'check':'captured invitation uses configured frontend fragment URL','status':'verified'})
status, _ = request('/api/auth/reset-password', {'token':token, 'password':password})
check('invitation set password', status, 204)
status, session = request('/api/auth/login', {'email':email, 'password':password})
check('synthetic user login', status, 200)
status, _ = request('/api/auth/me', token=session['accessToken'])
check('synthetic current identity', status, 200)
status, rotated = request('/api/auth/refresh', {'refreshToken':session['refreshToken']})
check('refresh rotation', status, 200)
status, _ = request('/api/auth/logout', token=rotated['accessToken'], method='POST')
check('logout', status, 204)
status, _ = request('/api/auth/me', token=rotated['accessToken'])
check('logout invalidates bearer', status, 401)
status, accepted = request('/api/auth/forgot-password', {'email':email})
check('recovery accepted', status, 202)
status, masked = request('/api/auth/forgot-password', {'email':f'unknown-{secrets.token_hex(6)}@example.test'})
check('unknown identity recovery masked', status, 202)
if accepted != masked:
    raise RuntimeError('Recovery bodies differ')
new_token = captured_token()
if new_token == token:
    raise RuntimeError('Recovery did not replace invitation token')
new_password = secrets.token_urlsafe(24)
status, _ = request('/api/auth/reset-password', {'token':new_token, 'password':new_password})
check('captured recovery link reset', status, 204)
status, _ = request('/api/auth/reset-password', {'token':new_token, 'password':new_password})
check('used reset link rejected', status, 401)
status, session = request('/api/auth/login', {'email':email, 'password':new_password})
check('new password login', status, 200)
status, _ = request('/api/auth/logout', token=session['accessToken'], method='POST')
check('synthetic user logout after reset', status, 204)
# Leave the fixture disabled rather than delete any data. Read current version if exposed.
status, current = request('/api/accounts/' + created['id'], token=admin['accessToken'])
check('read synthetic fixture for safe disable', status, 200)
payload = {key:current.get(key) for key in ['email','roles','firstName','lastName']}
payload['status'] = 'DISABLED'
if 'revision' in current:
    payload['revision'] = current['revision']
status, _ = request('/api/accounts/' + created['id'], payload, token=admin['accessToken'], method='PUT')
check('synthetic fixture disabled', status, 200)
status, current = request('/api/accounts/' + created['id'], token=admin['accessToken'])
check('disabled fixture readback', current.get('status'), 'DISABLED')
status, _ = request('/api/auth/logout', token=admin['accessToken'], method='POST')
check('development fixture logout', status, 204)
Path('docs/evidence').mkdir(parents=True, exist_ok=True)
Path('docs/evidence/live-api.json').write_text(json.dumps({'kind':'real local HTTP + Mailpit; not frontend browser integration', 'fixture':'new synthetic account left disabled; no seed password changed', 'results':results},indent=2))
print(json.dumps(results,indent=2))
