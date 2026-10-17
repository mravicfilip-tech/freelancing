// Basic auth in front of the whole site. The user name and password live in the Vercel project's
// environment as AUTH_USER and AUTH_PASSWORD, never in this repo. Vercel serves the site over HTTPS,
// so the credentials never travel in plain text.
import { next } from '@vercel/edge';

export const config = { matcher: '/:path*' };

export default function middleware(request) {
  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const [user, ...rest] = atob(header.slice(6)).split(':');
      if (user === process.env.AUTH_USER && rest.join(':') === process.env.AUTH_PASSWORD) return next();
    } catch (e) {
      // A malformed header falls through to the challenge below.
    }
  }
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Ahai Studio", charset="UTF-8"' },
  });
}
