"""Install a synthetic native test entry point in the disposable CI checkout only."""
from pathlib import Path
import shutil
root=Path('SparkyFitnessMobile')
(root/'ci-cgm-fixture').mkdir(exist_ok=True)
for source in Path('ci/cgm-emulator').glob('*.ts*'):
    text=source.read_text().replace("../../src/","../src/").replace("../../global.css","../global.css")
    (root/'ci-cgm-fixture'/source.name).write_text(text)
(root/'index.js').write_text("import {registerRootComponent} from 'expo';\nimport App from './ci-cgm-fixture/App.fixture';\nregisterRootComponent(App);\n")
with (root/'metro.config.js').open('a') as f:
    f.write("""
// CI checkout only: substitute the API/connection boundary, never native UI.
const path = require('node:path');
const upstreamResolver = module.exports.resolver.resolveRequest;
module.exports.resolver.resolveRequest = (context, name, platform) => {
  const resolved = upstreamResolver ? upstreamResolver(context,name,platform) : context.resolveRequest(context,name,platform);
  if (resolved.type !== 'sourceFile') return resolved;
  const boundary = new Map([
    [path.resolve(__dirname,'src/services/api/apiClient.ts'), 'api.fixture.ts'],
    [path.resolve(__dirname,'src/hooks/useServerConnection.ts'), 'connection.fixture.ts'],
  ]);
  const fixture = boundary.get(resolved.filePath);
  return fixture ? {type:'sourceFile',filePath:path.resolve(__dirname,'ci-cgm-fixture',fixture)} : resolved;
};
""")
