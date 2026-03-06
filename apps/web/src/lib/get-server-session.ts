import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
	buildSiteAccessDeniedPath,
	SITE_ACCESS_DENIED_HEADER,
	SITE_ACCESS_DENIED_HEADER_VALUE,
	SITE_ACCESS_DENIED_STATUS_HEADER,
} from "@/lib/auth-site-access";
import { siteAccessStatusSchema } from "@/lib/schema";

export async function getServerSession() {
	const result = await auth.api.getSession({
		headers: await headers(),
		returnHeaders: true,
	});

	if (
		result.headers.get(SITE_ACCESS_DENIED_HEADER) ===
		SITE_ACCESS_DENIED_HEADER_VALUE
	) {
		const statusHeader = result.headers.get(SITE_ACCESS_DENIED_STATUS_HEADER);
		const parsedStatus = siteAccessStatusSchema.safeParse(statusHeader);

		redirect(
			buildSiteAccessDeniedPath(
				parsedStatus.success ? parsedStatus.data : undefined,
			),
		);
	}

	return result.response;
}
