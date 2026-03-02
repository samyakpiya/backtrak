import { redirect } from "next/navigation";

import { SignoutButton } from "@/components/auth/signout-btn";
import { getServerSession } from "@/lib/get-server-session";

export default async function Page() {
	const session = await getServerSession();

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<div className="flex flex-col items-center justify-center h-svh">
			<p>Welcome, {session.user?.name?.split(" ")[0]}!</p>
			<SignoutButton />
		</div>
	);
}
