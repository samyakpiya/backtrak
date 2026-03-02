import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	redirectURL: "/",
});

export const signInWithGoogle = async () => {
	return authClient.signIn.social({
		provider: "google",
		callbackURL: "/",
		errorCallbackURL: "/error",
		newUserCallbackURL: "/welcome",
	});
};
