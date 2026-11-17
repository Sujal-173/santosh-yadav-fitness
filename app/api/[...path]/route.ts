import crypto from 'node:crypto';
import serverless from 'serverless-http';
import { createApiApp } from '../../../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// One warm API application per Vercel function instance. Failed initialisation is
// not cached so a later invocation can retry after an environment/dependency fix.
type Handler = (event: Record<string, unknown>, context: Record<string, unknown>) => Promise<{
  statusCode?: number;
  headers?: Record<string, string | number | boolean | Array<string | number | boolean>>;
  multiValueHeaders?: Record<string, Array<string | number | boolean>>;
  body?: string;
  isBase64Encoded?: boolean;
}>;
let handlerPromise: Promise<Handler> | null = null;

async function getHandler(): Promise<Handler> {
  if (!handlerPromise) {
    handlerPromise = createApiApp().then((app) => serverless(app, {
      binary: ['application/pdf'],
    }) as unknown as Handler).catch((error) => {
      handlerPromise = null;
      throw error;
    });
  }
  return handlerPromise;
}

async function dispatch(request: Request): Promise<Response> {
  try {
    const handler = await getHandler();
    const url = new URL(request.url);
    const headerObject = Object.fromEntries(request.headers.entries());
    const query: Record<string, string> = {};
    const multiQuery: Record<string, string[]> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (query[key] === undefined) query[key] = value;
      (multiQuery[key] ||= []).push(value);
    }
    const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
    const body = hasBody ? Buffer.from(await request.arrayBuffer()) : Buffer.alloc(0);
    const sourceIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const event = {
      resource: '/{proxy+}',
      path: url.pathname,
      httpMethod: request.method.toUpperCase(),
      headers: headerObject,
      multiValueHeaders: {},
      queryStringParameters: Object.keys(query).length ? query : null,
      multiValueQueryStringParameters: Object.keys(multiQuery).length ? multiQuery : null,
      pathParameters: { proxy: url.pathname.replace(/^\/api\/?/, '') },
      requestContext: {
        accountId: 'vercel',
        apiId: 'vercel',
        domainName: url.host,
        domainPrefix: url.hostname.split('.')[0],
        httpMethod: request.method.toUpperCase(),
        path: url.pathname,
        protocol: 'HTTP/1.1',
        stage: '$default',
        requestId: crypto.randomUUID(),
        requestTimeEpoch: Date.now(),
        identity: { sourceIp, userAgent: request.headers.get('user-agent') || '' },
      },
      body: hasBody ? body.toString('base64') : null,
      isBase64Encoded: hasBody,
    } as unknown as Record<string, unknown>;

    const result = await handler(event, {});
    const responseHeaders = new Headers();
    for (const [key, value] of Object.entries(result.headers || {})) {
      if (value === undefined || value === null) continue;
      if (key.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
        for (const cookie of value) responseHeaders.append(key, String(cookie));
      } else {
        responseHeaders.set(key, Array.isArray(value) ? value.map(String).join(', ') : String(value));
      }
    }
    for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
      if (key.toLowerCase() === 'set-cookie') {
        for (const value of values) responseHeaders.append(key, String(value));
      } else if (values.length) {
        responseHeaders.set(key, values.map(String).join(', '));
      }
    }
    const responseBody = result.body
      ? result.isBase64Encoded
        ? Buffer.from(result.body, 'base64')
        : result.body
      : null;
    return new Response(responseBody as BodyInit | null, {
      status: result.statusCode || 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Vercel API handler initialization failed:', error);
    return Response.json(
      { error: 'Backend is not configured. Check Vercel environment variables and deployment logs.' },
      { status: 503 },
    );
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
export const PUT = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
