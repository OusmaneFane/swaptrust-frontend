import { ReceiptVerifyClient } from "./receipt-verify-client";

function toToken(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return String(v[0] ?? "").trim();
  return "";
}

export default function ReceiptVerifyPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const token = toToken(searchParams?.token);
  return <ReceiptVerifyClient token={token} />;
}

