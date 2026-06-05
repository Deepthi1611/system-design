const express = require('express');
const app = express();

// Set Content Security Policy headers to mitigate XSS attacks
// This policy allows resources to be loaded only from the same origin ('self') and 
// restricts script execution to the same origin as well.
// we can also add domain to the script-src directive if we want to allow scripts from specific trusted sources.
// Note: 'unsafe-inline' is included here for demonstration purposes, 
// but it is generally recommended to avoid using it in production environments as it can weaken the security of your application.
// unsafe-inline allows the execution of inline scripts, which can be a security risk if not used carefully.
// nonce is a random value that can be generated on the server and included in the script tags 
// to allow only those scripts to execute, providing an additional layer of security against XSS attacks
// instead of allowing all inline scripts, we can use a nonce to allow only specific inline scripts to execute.
// nonce key gets added as a csp header in the network call
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'nonce-randomkey'; http://unsafe.com"
  );
  next();
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + './index.html');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});