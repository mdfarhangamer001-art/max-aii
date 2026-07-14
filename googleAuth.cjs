const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');
const path = require('path');
const fs = require('fs');

function generateVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest().toString('base64url');
}

function signInWithGoogleDesktop() {
  return new Promise((resolve, reject) => {
    let server;
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (server) {
        server.close((err) => {
          if (err) {
            console.error('[Google OAuth] Error closing temporary server:', err);
          }
        });
      }
    };

    try {
      const { app } = require('electron');
      const configPath = (app && app.isPackaged && process.resourcesPath)
        ? path.join(process.resourcesPath, 'firebase-applet-config.json')
        : path.join(__dirname, 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        throw new Error('firebase-applet-config.json not found. Looked in: ' + configPath);
      }
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const clientId = firebaseConfig.oAuthClientId;

      if (!clientId) {
        throw new Error('oAuthClientId is missing in firebase-applet-config.json');
      }

      const verifier = generateVerifier();
      const challenge = generateChallenge(verifier);

      server = http.createServer(async (req, res) => {
        const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
        if (reqUrl.pathname === '/callback') {
          const code = reqUrl.searchParams.get('code');
          const error = reqUrl.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication Failed</h1><p>Error: ' + error + '</p>');
            reject(new Error(`Google OAuth error: ${error}`));
            cleanup();
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication Failed</h1><p>No authorization code found.</p>');
            reject(new Error('No authorization code found in callback.'));
            cleanup();
            return;
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <title>Success</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 50px; background-color: #0c0a0f; color: #ffffff; }
                  h1 { color: #22d3ee; }
                  p { color: #a1a1aa; }
                </style>
              </head>
              <body>
                <h1>Authentication Successful</h1>
                <p>You may now close this browser window and return to the Max-AI OS application.</p>
              </body>
            </html>
          `);

          try {
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                code: code,
                client_id: clientId,
                redirect_uri: `http://127.0.0.1:${server.address().port}/callback`,
                grant_type: 'authorization_code',
                code_verifier: verifier,
              }).toString(),
            });

            if (!tokenResponse.ok) {
              const errorText = await tokenResponse.text();
              throw new Error(`Failed to exchange authorization code: ${errorText}`);
            }

            const tokenData = await tokenResponse.json();
            const idToken = tokenData.id_token;

            if (!idToken) {
              throw new Error('No id_token returned from token exchange.');
            }

            resolve({ idToken });
          } catch (err) {
            reject(err);
          } finally {
            cleanup();
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });

      server.on('error', (err) => {
        console.error('[Google OAuth] Server error:', err);
        reject(err);
        cleanup();
      });

      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        const redirectUri = `http://127.0.0.1:${port}/callback`;

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent('openid email profile')}` +
          `&code_challenge=${encodeURIComponent(challenge)}` +
          `&code_challenge_method=S256`;

        console.log('[Google OAuth] Temporary loopback server listening on port:', port);
        console.log('[Google OAuth] Opening Google consent screen:', authUrl);

        shell.openExternal(authUrl).catch((err) => {
          reject(new Error(`Failed to open default system browser: ${err.message}`));
          cleanup();
        });
      });

      // Set timeout of 5 minutes
      timeoutId = setTimeout(() => {
        reject(new Error('Google Sign-In process timed out (5 minutes limit).'));
        cleanup();
      }, 5 * 60 * 1000);

    } catch (err) {
      reject(err);
      cleanup();
    }
  });
}

module.exports = { signInWithGoogleDesktop };
