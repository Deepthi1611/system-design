# XSS Mitigation

Cross-site scripting, or XSS, happens when untrusted input is treated as executable HTML or JavaScript inside a page.

In the vulnerable examples, the main issue is this pattern:

```js
greetingElement.innerHTML = `Hello, ${name}!`;
```

Here, `name` comes from the URL query parameter. If the value contains HTML, the browser parses and runs it as part of the page.

## Common places user input can come from

User-controlled input is not only form input. Treat all external data as untrusted until it is validated and safely rendered.

Common input sources include:

- URL query parameters: `?name=Deepthi`
- URL path parameters: `/users/:id`
- URL hash fragments: `#section`
- Form fields: text inputs, textareas, selects, checkboxes
- Request body data: JSON, form data, multipart uploads
- Request headers: `User-Agent`, `Referer`, custom headers
- Cookies
- Local storage and session storage
- Data from databases if it originally came from users
- Data from third-party APIs
- Uploaded files and file metadata
- WebSocket, SSE, and webhook payloads

Important rule:

```txt
Stored data can still be unsafe if it came from a user earlier.
```

For example, a comment saved in the database can become stored XSS if it is later rendered using `innerHTML`.

## Prefer textContent or innerText for plain text

If you want to display user input as text, do not use `innerHTML`.

Vulnerable:

```js
greetingElement.innerHTML = `Hello, ${name}!`;
```

Safer:

```js
greetingElement.textContent = `Hello, ${name}!`;
```

Also acceptable:

```js
greetingElement.innerText = `Hello, ${name}!`;
```

`textContent` and `innerText` treat the value as text. They do not ask the browser to parse it as HTML.

Example:

```js
const name = '<img src=x onerror=alert(1)>';
greetingElement.textContent = `Hello, ${name}!`;
```

The browser displays the text literally instead of creating an image element.

## innerHTML vs textContent vs innerText

| API | Parses HTML? | Typical use |
|---|---:|---|
| `innerHTML` | Yes | Rendering trusted HTML |
| `textContent` | No | Rendering plain text safely |
| `innerText` | No | Rendering visible plain text |

Use `innerHTML` only when you intentionally need HTML and the content has been sanitized or is fully trusted.

## Escape output based on context

Escaping means converting dangerous characters into harmless text representations.

For HTML text content:

```txt
< becomes &lt;
> becomes &gt;
& becomes &amp;
" becomes &quot;
' becomes &#39;
```

Example:

```html
&lt;script&gt;alert(1)&lt;/script&gt;
```

The browser displays it as text instead of executing it.

Different contexts need different escaping:

| Context | Example | Required defense |
|---|---|---|
| HTML body | `<p>${input}</p>` | HTML escape or `textContent` |
| HTML attribute | `<div title="${input}">` | Attribute escaping |
| URL | `<a href="${input}">` | URL validation and encoding |
| JavaScript string | `<script>let x = "${input}"</script>` | JavaScript string escaping |
| CSS | `style="${input}"` | Avoid user-controlled CSS |

The safest approach is to avoid manually building HTML strings with user input.

## Validate input, but do not rely only on validation

Validation checks whether input has the shape you expect.

For example:

```js
if (!/^[a-zA-Z ]{1,50}$/.test(name)) {
  throw new Error('Invalid name');
}
```

Validation is useful, but it is not enough by itself.

You should still render safely using `textContent`, escaping, or sanitization because validation rules can be incomplete or bypassed.

## Sanitize HTML when HTML is required

Sometimes applications intentionally allow limited HTML.

Examples:

- Blog comments with basic formatting
- Rich text editor content
- Markdown preview output
- CMS content

In those cases, do not simply use `innerHTML` with raw user input.

Use an HTML sanitizer.

Sanitization removes dangerous elements and attributes while keeping safe markup.

Dangerous input:

```html
<p>Hello</p>
<img src=x onerror=alert(1)>
<script>alert(1)</script>
```

Sanitized output might become:

```html
<p>Hello</p>
<img src="x">
```

## DOMPurify

DOMPurify is a popular JavaScript library for sanitizing HTML.

Example:

```js
const cleanHtml = DOMPurify.sanitize(userProvidedHtml);
contentElement.innerHTML = cleanHtml;
```

Why this is safer:

```txt
Raw user HTML -> DOMPurify -> sanitized HTML -> innerHTML
```

DOMPurify removes dangerous tags and attributes such as:

- `<script>`
- Inline event handlers like `onerror`, `onclick`, `onload`
- Dangerous URLs like `javascript:...`
- Unsafe SVG or MathML payloads

Use DOMPurify when you must render HTML from users. If you only need text, prefer `textContent` instead.

## Why libraries like React help

Libraries like React make XSS harder by escaping values rendered in JSX by default.

Example:

```jsx
function Greeting({ name }) {
  return <p>Hello, {name}!</p>;
}
```

If `name` is:

```txt
<img src=x onerror=alert(1)>
```

React renders it as text, not as HTML.

That means this is generally safe:

```jsx
<p>{userInput}</p>
```

React escapes the value before putting it into the DOM.

However, React can still be unsafe if you bypass its escaping:

```jsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

If you must use `dangerouslySetInnerHTML`, sanitize first:

```jsx
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

Frameworks help because they:

- Escape text values by default.
- Encourage component-based rendering instead of manual string concatenation.
- Reduce direct DOM manipulation.
- Make unsafe HTML insertion more explicit.

But frameworks do not remove the need to understand XSS. Unsafe APIs still exist.

## Content Security Policy

Content Security Policy, or CSP, is a browser security feature that limits what scripts, styles, images, and other resources a page is allowed to load or execute.

CSP is sent as an HTTP response header.

Example:

```txt
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'
```

This tells the browser:

- Load resources from the same origin by default.
- Only run scripts from the same origin.
- Do not allow plugins through `<object>`.
- Do not allow attackers to change the page base URL.

## How CSP helps against XSS

Many XSS payloads rely on inline JavaScript:

```html
<img src=x onerror=alert(1)>
```

or:

```html
<script>alert(1)</script>
```

A strong CSP can block inline JavaScript from running.

For example:

```txt
Content-Security-Policy: script-src 'self'
```

Without `'unsafe-inline'`, inline event handlers and inline scripts are blocked.

So even if an attacker injects:

```html
<img src=x onerror=alert(1)>
```

the browser can refuse to execute the `onerror` JavaScript.

## CSP with nonces

Some pages need inline scripts. A safer CSP pattern is to use nonces.

Header:

```txt
Content-Security-Policy: script-src 'self' 'nonce-randomValue123'
```

Allowed script:

```html
<script nonce="randomValue123">
  console.log('Allowed script');
</script>
```

Injected attacker scripts will not know the nonce, so the browser blocks them.

In production, the nonce should be random and unique per response.

## CSP is defense in depth

CSP is not a replacement for safe rendering.

You should still:

- Avoid `innerHTML` for user input.
- Escape output.
- Sanitize user-generated HTML.
- Validate input.

CSP helps reduce damage if a mistake slips through.

## HttpOnly cookies

Some XSS examples show attackers reading cookies:

```js
document.cookie
```

Sensitive session cookies should be marked `HttpOnly`.

Example header:

```txt
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax
```

`HttpOnly` means JavaScript cannot read the cookie through `document.cookie`.

This helps reduce the impact of XSS, but it does not fully solve XSS. An injected script may still perform actions as the logged-in user by making requests from the page.

## Additional cookie flags

Use:

```txt
Secure
```

Only sends the cookie over HTTPS.

Use:

```txt
SameSite=Lax
```

or:

```txt
SameSite=Strict
```

Helps reduce cross-site request risks.

## Avoid dangerous sinks

Dangerous DOM APIs are called sinks because they can turn strings into executable code or parsed HTML.

Be careful with:

```js
element.innerHTML = userInput;
element.outerHTML = userInput;
document.write(userInput);
element.insertAdjacentHTML('beforeend', userInput);
eval(userInput);
new Function(userInput);
setTimeout(userInput);
setInterval(userInput);
```

Safer alternatives:

```js
element.textContent = userInput;
element.setAttribute('title', userInput);
document.createElement('p');
```

When creating DOM nodes, prefer:

```js
const p = document.createElement('p');
p.textContent = userInput;
container.appendChild(p);
```

## URL safety

Do not blindly put user input into URLs.

Dangerous:

```js
link.href = userInput;
```

An attacker may try:

```txt
javascript:alert(1)
```

Safer approach:

```js
const url = new URL(userInput, window.location.origin);

if (url.protocol !== 'https:' && url.protocol !== 'http:') {
  throw new Error('Invalid URL protocol');
}

link.href = url.toString();
```

Validate allowed protocols and, when needed, allowed domains.

## Mapping to the vulnerable examples

User session hijacking:

- Do not render query params using `innerHTML`.
- Use `textContent`.
- Mark session cookies as `HttpOnly`, `Secure`, and `SameSite`.
- Add CSP to reduce inline script execution.

Unauthorized activities:

- Avoid XSS so attacker code cannot call page functions.
- Require server-side authorization for every state-changing action.
- Use CSRF protections where appropriate.
- Do not rely only on frontend checks.

Capturing keystrokes:

- Prevent script injection in the first place.
- Use safe rendering.
- Use CSP to block inline handlers.
- Avoid placing sensitive inputs on pages that render unsafe content.

Stealing critical information:

- Do not expose secrets in the DOM.
- Avoid rendering sensitive data unless needed.
- Use safe rendering and CSP.
- Remember that any JavaScript running on the page can read DOM content.

Phishing:

- Do not allow attacker-controlled HTML in trusted UI.
- Sanitize user-generated HTML.
- Use consistent trusted login flows.
- Consider CSP restrictions on form actions:

```txt
Content-Security-Policy: form-action 'self'
```

This restricts where forms can submit.

## Practical checklist

Use this checklist when rendering user input:

- Is this value controlled by a user or external system?
- Am I rendering it as text or HTML?
- If text, am I using `textContent` or framework escaping?
- If HTML, am I sanitizing it with a trusted sanitizer like DOMPurify?
- Am I avoiding dangerous sinks like `innerHTML`?
- Are URLs validated before being used in `href` or `src`?
- Are session cookies `HttpOnly`, `Secure`, and `SameSite`?
- Is a CSP header configured?
- Are server-side authorization checks in place?

## Recommended default approach

For plain text:

```js
element.textContent = userInput;
```

For React:

```jsx
<p>{userInput}</p>
```

For user-provided HTML:

```js
element.innerHTML = DOMPurify.sanitize(userInput);
```

For CSP:

```txt
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

The safest mental model:

```txt
User input should be treated as data, not code.
```
