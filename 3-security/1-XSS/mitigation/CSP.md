# Content Security Policy

Content Security Policy, or CSP, is a browser security mechanism that controls what a page is allowed to load and execute.

It is commonly used as a defense-in-depth layer against XSS.

## Basic Express setup

In Express, you can set CSP using a response header:

```js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self';"
  );
  next();
});
```

This policy means:

```txt
default-src 'self'
```

By default, resources should come only from the same origin.

```txt
script-src 'self'
```

Scripts can run only if they are loaded from the same origin.

Allowed:

```html
<script src="/app.js"></script>
```

Blocked:

```html
<script src="https://cdn.example.com/library.js"></script>
```

Also blocked:

```html
<script>
  console.log('inline script');
</script>
```

## Allowing external script sources

If your application needs scripts from a trusted CDN, add that domain to `script-src`.

```js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net;"
  );
  next();
});
```

Now this is allowed:

```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.2.3/dist/purify.min.js"></script>
```

This is still blocked:

```html
<script src="https://evil.example/script.js"></script>
```

Allow multiple trusted domains like this:

```txt
script-src 'self' https://cdn.jsdelivr.net https://unpkg.com
```

Avoid broad policies like:

```txt
script-src *
```

That allows scripts from anywhere and weakens CSP significantly.

## unsafe-inline

`'unsafe-inline'` allows inline scripts to run.

Example policy:

```txt
script-src 'self' 'unsafe-inline'
```

This allows:

```html
<script>
  console.log('inline script allowed');
</script>
```

It can also allow inline event handlers:

```html
<img src=x onerror="alert(1)">
```

That is dangerous because many XSS payloads depend on inline JavaScript.

Use `'unsafe-inline'` only for learning or legacy migration cases. Avoid it in production when possible.

## Nonces

A nonce is a random value that allows specific inline scripts to run.

Instead of allowing every inline script with `'unsafe-inline'`, you allow only inline scripts that have the correct nonce.

Correct CSP:

```txt
script-src 'self' 'nonce-randomkey'
```

Matching HTML:

```html
<script nonce="randomkey">
  console.log('allowed inline script');
</script>
```

This script is blocked because it does not have the nonce:

```html
<script>
  console.log('blocked inline script');
</script>
```

The nonce must be inside the `script-src` directive.

Wrong:

```txt
default-src 'self'; 'nonce-randomkey'; script-src 'self'
```

Correct:

```txt
default-src 'self'; script-src 'self' 'nonce-randomkey'
```

## Nonces should be random per response

Do not use a fixed nonce like `randomkey` in production.

A real application should generate a new random nonce for each response:

```txt
Request 1:
Content-Security-Policy: script-src 'self' 'nonce-a1b2c3'
<script nonce="a1b2c3">...</script>

Request 2:
Content-Security-Policy: script-src 'self' 'nonce-x9y8z7'
<script nonce="x9y8z7">...</script>
```

If the nonce is fixed, an attacker may learn it and inject a script using the same nonce.

## unsafe-inline vs nonce

If you use this:

```txt
script-src 'self' 'unsafe-inline'
```

all inline scripts are allowed.

If you use this:

```txt
script-src 'self' 'nonce-randomkey'
```

only inline scripts with `nonce="randomkey"` are allowed.

Avoid combining them:

```txt
script-src 'self' 'unsafe-inline' 'nonce-randomkey'
```

The `'unsafe-inline'` part weakens the protection because inline scripts are broadly allowed.

## Avoid unsafe-eval

`'unsafe-eval'` allows JavaScript code to execute strings as code through APIs like:

```js
eval(userInput);
new Function(userInput);
setTimeout(userInput);
setInterval(userInput);
```

Example CSP:

```txt
script-src 'self' 'unsafe-eval'
```

Avoid this in production when possible.

Dangerous example:

```js
const action = new URLSearchParams(window.location.search).get('action');
eval(action);
```

An attacker-controlled URL could provide JavaScript as the `action` value, and `eval()` would execute it.

Safer alternatives:

Use a function map:

```js
const actions = {
  save: () => saveDraft(),
  preview: () => showPreview(),
};

if (actions[action]) {
  actions[action]();
}
```

Use `JSON.parse()` for JSON data:

```js
const data = JSON.parse(jsonString);
```

Use real callbacks instead of string-based timers:

```js
setTimeout(() => {
  runTask();
}, 1000);
```

instead of:

```js
setTimeout("runTask()", 1000);
```

If a library requires `'unsafe-eval'`, check whether it has a production build or configuration that avoids it.

## External scripts with nonces

You can use nonces with external script tags too:

```html
<script nonce="randomkey" src="/app.js"></script>
```

But if `/app.js` is already allowed by:

```txt
script-src 'self'
```

then the nonce is not required for that same-origin external script.

Nonces are most useful for allowing selected inline scripts without allowing all inline scripts.

## Other useful CSP directives

Images:

```txt
img-src 'self' data:
```

Allows images from the same origin and `data:` images.

Styles:

```txt
style-src 'self'
```

Allows styles from the same origin.

Connections:

```txt
connect-src 'self' https://api.example.com
```

Controls where `fetch`, WebSocket, EventSource, and similar browser connections can go.

Forms:

```txt
form-action 'self'
```

Controls where forms can submit. This helps reduce phishing and data exfiltration risk from injected forms.

Frames:

```txt
frame-ancestors 'none'
```

Prevents the page from being embedded in iframes, which helps against clickjacking.

Objects:

```txt
object-src 'none'
```

Blocks plugins like Flash-style object embeds.

Base URL:

```txt
base-uri 'self'
```

Prevents attackers from injecting a `<base>` tag that changes how relative URLs resolve.

## Example stronger CSP

```js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'nonce-randomkey'",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  );
  next();
});
```

For production, replace `randomkey` with a real per-response random nonce.

## Report-only mode

Report-only mode lets you test a CSP without enforcing it.

Use this header:

```txt
Content-Security-Policy-Report-Only
```

Instead of:

```txt
Content-Security-Policy
```

Example:

```js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    "default-src 'self'; script-src 'self'; report-uri /csp-report;"
  );
  next();
});
```

In report-only mode:

- The browser does not block the violation.
- The browser sends a report about what would have been blocked.
- This helps you tune the policy before enforcing it.

## report-uri

`report-uri` tells the browser where to send CSP violation reports.

Example CSP:

```txt
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; report-uri /csp-report
```

Example Express endpoint:

```js
app.use(express.json({ type: ['application/json', 'application/csp-report'] }));

app.post('/csp-report', (req, res) => {
  console.log('CSP violation report:', req.body);
  res.sendStatus(204);
});
```

The browser sends a report when something violates the policy.

## report-to

`report-to` is a newer reporting mechanism. It works with the `Reporting-Endpoints` header.

Example:

```js
app.use((req, res, next) => {
  res.setHeader('Reporting-Endpoints', 'csp-endpoint="/csp-report"');
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    "default-src 'self'; script-src 'self'; report-to csp-endpoint;"
  );
  next();
});
```

Example endpoint:

```js
app.use(express.json({ type: ['application/reports+json', 'application/json'] }));

app.post('/csp-report', (req, res) => {
  console.log('CSP report-to payload:', req.body);
  res.sendStatus(204);
});
```

`report-uri` is older and widely understood. `report-to` is newer and more flexible, but browser support and behavior can vary.

Many applications use `report-uri` for compatibility, or use both while migrating.

## Enforce mode vs report-only mode

Enforce mode:

```txt
Content-Security-Policy: script-src 'self'
```

The browser blocks violations.

Report-only mode:

```txt
Content-Security-Policy-Report-Only: script-src 'self'
```

The browser reports violations but does not block them.

Use report-only mode when introducing CSP to an existing app. Once the reports look clean, move to enforce mode.

## CORS vs CSP

CORS and CSP are different browser security features.

CORS stands for Cross-Origin Resource Sharing.

CSP stands for Content Security Policy.

## What CORS controls

CORS controls whether JavaScript from another origin can read a server response.

Example:

```txt
https://app.example.com -> fetches -> https://api.example.com/users
```

The API server decides whether the frontend can read the response by sending:

```txt
Access-Control-Allow-Origin: https://app.example.com
```

CORS answers:

```txt
Can this other website read my response?
```

## What CSP controls

CSP controls what a page is allowed to load or execute.

Example:

```txt
Content-Security-Policy: script-src 'self'
```

CSP answers:

```txt
Can this page run this script or load this resource?
```

## CORS vs CSP comparison

| Feature | CORS | CSP |
|---|---|---|
| Full name | Cross-Origin Resource Sharing | Content Security Policy |
| Main purpose | Controls who can read server responses | Controls what a page can load or execute |
| Configured by | The server being requested | The server serving the page |
| Common header | `Access-Control-Allow-Origin` | `Content-Security-Policy` |
| Protects | API/server data from unauthorized cross-origin reads | Browser page from unsafe scripts/resources |
| Helps with | Cross-origin API access control | XSS mitigation and resource restrictions |
| Example question | Can `evil.com` read my API response? | Can this page run a script from `evil.com`? |

Example CORS scenario:

```txt
evil.com JavaScript calls api.bank.com/account
```

CORS decides whether `evil.com` can read the API response.

Example CSP scenario:

```txt
bank.com page tries to load https://evil.com/x.js
```

CSP decides whether the bank page can load or execute that script.

Short version:

```txt
CORS protects responses from being read by the wrong origin.
CSP protects pages from loading or executing the wrong resources.
```
