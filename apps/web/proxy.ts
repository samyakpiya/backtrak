import { getCookieCache } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const session = await getCookieCache(request);

	// THIS IS NOT SECURE!
	// This is the recommended approach to optimistically redirect users
	// better-auth recommends handling auth checks in each page/route
	if (!session) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
