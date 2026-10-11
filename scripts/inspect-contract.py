import json
from pathlib import Path
schema = json.loads(Path('docs/openapi-local.json').read_text())
for name in ['LoginRequest','EmailRequest','ResetRequest','RefreshRequest','TokenResponse','AccountResponse','ErrorResponse']:
    print(name, json.dumps(schema['components']['schemas'][name], indent=2))
