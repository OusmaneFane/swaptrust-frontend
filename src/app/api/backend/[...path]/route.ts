import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiBaseUrl(): string {
  const base = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (!base) {
    // Safe fallback for dev only; in prod this should be set.
    return "http://localhost:3001/api/v1";
  }
  return base.replace(/\/+$/, "");
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const base = apiBaseUrl();
  const upstreamUrl = new URL(`${base}/${pathParts.map(encodeURIComponent).join("/")}`);
  const qs = req.nextUrl.searchParams.toString();
  if (qs) upstreamUrl.search = qs;

  // Forward most headers (but let fetch set host/length).
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Streaming request body for non-GET/HEAD
  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstreamRes = await fetch(upstreamUrl.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  // Copy response headers but avoid encoding issues.
  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
