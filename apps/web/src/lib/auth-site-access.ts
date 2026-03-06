import { APIError } from "better-auth";

import type { Prisma } from "@/generated/prisma/client";
import { SiteAccessStatus } from "@/generated/prisma/enums";
import { siteAccessGrantSeedEmailsSchema } from "@/lib/schema";
import type { SiteAccessStatusValue } from "@/lib/types";

export const SITE_ACCESS_DENIED_CODE = "SITE_ACCESS_DENIED";
export const SITE_ACCESS_DENIED_ERROR = "site_access_denied";
export const SITE_ACCESS_DENIED_HEADER = "x-auth-denied";
export const SITE_ACCESS_DENIED_HEADER_VALUE = "site-access";
export const SITE_ACCESS_DENIED_STATUS_HEADER = "x-auth-denied-status";
export const SITE_ACCESS_DENIED_MESSAGE =
	"Your email is not approved to access this site.";

export type DerivedSiteAccessStatus = SiteAccessStatusValue;

type SiteAccessGrantForStatus = Prisma.SiteAccessGrantGetPayload<{
	select: { revokedAt: true };
}> | null;

export function deriveSiteAccessStatus(grant: SiteAccessGrantForStatus) {
	if (!grant) return SiteAccessStatus.PENDING;
	return grant.revokedAt ? SiteAccessStatus.REVOKED : SiteAccessStatus.ALLOWED;
}

export function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

export function parseSiteAccessGrantSeedEmails(value?: string) {
	return siteAccessGrantSeedEmailsSchema.parse(value);
}

export function buildSiteAccessDeniedPath(status?: DerivedSiteAccessStatus) {
	const url = new URL("/auth/denied", "https://backtrak.local");
	url.searchParams.set("error", SITE_ACCESS_DENIED_ERROR);

	if (status) {
		url.searchParams.set("status", status);
	}

	return `${url.pathname}${url.search}`;
}

export function buildSiteAccessDeniedUrl(
	baseURL: string,
	status?: DerivedSiteAccessStatus,
) {
	return new URL(buildSiteAccessDeniedPath(status), baseURL).toString();
}

export function getSiteAccessDeniedCopy(status?: DerivedSiteAccessStatus) {
	if (status === SiteAccessStatus.PENDING) {
		return {
			title: "Access request received",
			description: "Your Backtrak access is pending review.",
			body: "Thanks for signing up. Your account exists, but an admin still needs to review and approve access before you can see the backlog.",
			helpText:
				"If you expected immediate access, make sure you signed in with the right email or reach out to the team.",
			apiMessage: "Your Backtrak access request is pending review.",
		};
	}

	if (status === SiteAccessStatus.REVOKED) {
		return {
			title: "Access removed",
			description: "This account no longer has access to Backtrak.",
			body: "If you believe this was a mistake or you need access restored, contact an admin for help.",
			helpText:
				"If you have another approved account, sign out of Google and try again with that email.",
			apiMessage: "Your access to Backtrak has been revoked.",
		};
	}

	return {
		title: "We couldn't finish sign-in",
		description: "We couldn't confirm access for this account yet.",
		body: "Try signing in again with the correct email. If you expected access, ask an admin to review the account you used.",
		helpText: "If the problem keeps happening, contact the team for help.",
		apiMessage: SITE_ACCESS_DENIED_MESSAGE,
	};
}

export function createSiteAccessDeniedError(status?: DerivedSiteAccessStatus) {
	return new APIError("FORBIDDEN", {
		code: SITE_ACCESS_DENIED_CODE,
		message: getSiteAccessDeniedCopy(status).apiMessage,
	});
}
