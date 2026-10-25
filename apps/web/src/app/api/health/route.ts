import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, dataSource: process.env.DATA_SOURCE ?? "mock" });
}
