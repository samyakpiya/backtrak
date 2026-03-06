import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/get-server-session";

export default async function DashboardPage() {
	const session = await getServerSession();

	if (!session) {
		redirect("/auth/login");
	}

	return <div>Dashboard</div>;
}
