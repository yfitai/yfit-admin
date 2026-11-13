import assert from 'node:assert/strict';
import vm from 'node:vm';
import crypto from 'node:crypto';

// Public GET only. No browser, environment, auth, app execution, or writes.
const origin = 'https://admin.yfitai.com';
const htmlResponse = await fetch(`${origin}/accounting`);
const html = await htmlResponse.text();
const path = html.match(/<script[^>]+src=["'](\/assets\/[^"']+\.js)["']/)?.[1];
assert(path, 'Public page did not name a script asset');
const response = await fetch(`${origin}${path}`);
const asset = await response.text();
const start = asset.indexOf('nh=()=>{');
const end = asset.indexOf('};function', start);
assert(start >= 0 && end > start && end - start < 1500, 'Known isolated helper was not found; stop rather than execute the bundle');
const helper = `const ${asset.slice(start, end + 1)}`;
assert(!/\b(fetch|XMLHttpRequest|document|localStorage|sessionStorage|process|import)\b/.test(helper), 'Helper is outside approved offline scope');
let urlArgumentClass;
class URLShim extends URL {
  constructor(input, base) {
    urlArgumentClass = input === 'undefined/app-auth' ? 'undefined-build-input/app-auth' : 'other';
    super(input, base);
  }
}
let reproduced = false;
let errorName;
let errorMessage;
try {
  vm.runInNewContext(`${helper}; nh()`, {
    URL: URLShim,
    window: { location: { origin: 'https://synthetic.example' } },
    btoa: input => Buffer.from(input).toString('base64'),
  }, { timeout: 1000 });
} catch (error) {
  errorName = error.name;
  errorMessage = error.message === 'Invalid URL' ? error.message : 'Other error (detail omitted)';
  reproduced = errorName === 'TypeError' && errorMessage === 'Invalid URL';
}
assert(reproduced, 'Expected production helper failure was not reproduced');
const offset = start;
const line = asset.slice(0, offset).split('\n').length;
const column = offset - asset.lastIndexOf('\n', offset - 1);
console.log(JSON.stringify({
  fetchedAt: new Date().toISOString(),
  documentStatus: htmlResponse.status,
  assetPath: path,
  assetStatus: response.status,
  assetBytes: Buffer.byteLength(asset),
  sha256: crypto.createHash('sha256').update(asset).digest('hex'),
  helperLocation: { line, column },
  urlArgumentClass,
  appIdCompiledUndefined: /\.set\(["']appId["'],void 0\)/.test(helper),
  eagerDefaultCompiled: /redirectPath:\w+=nh\(\)/.test(asset),
  offlineResult: { reproduced, errorName, errorMessage },
  embeddedConfigurationSaved: false,
}, null, 2));
