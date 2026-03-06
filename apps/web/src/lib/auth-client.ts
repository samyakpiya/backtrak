import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	redirectURL: "/",
});

export const signInWithGoogle = async () => {
	const origin = window.location.origin;

	return authClient.signIn.social({
		provider: "google",
		callbackURL: `${origin}/`,
		errorCallbackURL: `${origin}/auth/error`,
		newUserCallbackURL: `${origin}/`,
	});
};
