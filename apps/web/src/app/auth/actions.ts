"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const signOutAction = async () => {
	await auth.api.signOut({
		headers: await headers(),
	});
	redirect("/");
};
