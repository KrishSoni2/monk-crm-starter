import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  getAuthMode,
  passwordMatches,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { env } from "@/lib/env";

// Only allow redirects back into this app (never to another site).
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = safeNext(form.get("next"));

  if (getAuthMode() !== "protected") {
    return NextResponse.redirect(new URL(next, request.url), 303);
  }

  const password = form.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    // A short pause makes guessing passwords slow.
    await new Promise((resolve) => setTimeout(resolve, 600));
    const back = new URL("/login", request.url);
    back.searchParams.set("error", "1");
    back.searchParams.set("next", next);
    return NextResponse.redirect(back, 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: env.isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
