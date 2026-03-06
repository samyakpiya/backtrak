import { describe, expect, it } from "vitest";

import { SiteAccessStatus } from "@/generated/prisma/enums";
import {
	buildSiteAccessDeniedPath,
	buildSiteAccessDeniedUrl,
	deriveSiteAccessStatus,
	getSiteAccessDeniedCopy,
	normalizeEmail,
	parseSiteAccessGrantSeedEmails,
	SITE_ACCESS_DENIED_ERROR,
	SITE_ACCESS_DENIED_MESSAGE,
} from "@/lib/auth-site-access";
import { sessionPayloadSchema } from "@/lib/schema";

describe("auth site access helpers", () => {
	it("normalizes emails consistently", () => {
		expect(normalizeEmail("  TeSt@Example.com ")).toBe("test@example.com");
	});

	it("parses site access grant seed emails with deduplication", () => {
		expect(
			parseSiteAccessGrantSeedEmails(
				" TeSt@example.com,team@example.com,test@example.com,  ",
			),
		).toEqual(["test@example.com", "team@example.com"]);
	});

	it("rejects invalid site access grant seed emails", () => {
		expect(() => parseSiteAccessGrantSeedEmails("not-an-email")).toThrow();
	});

	it("builds the denied redirect URL", () => {
		expect(buildSiteAccessDeniedUrl("https://backtrak.test")).toBe(
			`https://backtrak.test/auth/denied?error=${SITE_ACCESS_DENIED_ERROR}`,
		);
		expect(
			buildSiteAccessDeniedUrl(
				"https://backtrak.test",
				SiteAccessStatus.REVOKED,
			),
		).toBe(
			`https://backtrak.test/auth/denied?error=${SITE_ACCESS_DENIED_ERROR}&status=${SiteAccessStatus.REVOKED}`,
		);
	});

	it("builds a denied path with the access status when present", () => {
		expect(buildSiteAccessDeniedPath(SiteAccessStatus.PENDING)).toBe(
			`/auth/denied?error=${SITE_ACCESS_DENIED_ERROR}&status=${SiteAccessStatus.PENDING}`,
		);
	});

	it("derives site access state from the grant record", () => {
		expect(deriveSiteAccessStatus(null)).toBe(SiteAccessStatus.PENDING);
		expect(deriveSiteAccessStatus({ revokedAt: null })).toBe(
			SiteAccessStatus.ALLOWED,
		);
		expect(deriveSiteAccessStatus({ revokedAt: new Date() })).toBe(
			SiteAccessStatus.REVOKED,
		);
	});

	it("parses and normalizes session payload emails", () => {
		expect(
			sessionPayloadSchema.parse({
				user: {
					email: "  TeSt@Example.com ",
					id: "user_123",
				},
			}),
		).toEqual({
			user: {
				email: "test@example.com",
				id: "user_123",
			},
		});
	});

	it("rejects session payloads with invalid emails", () => {
		expect(
			sessionPayloadSchema.safeParse({
				user: {
					email: "not-an-email",
					id: "user_123",
				},
			}).success,
		).toBe(false);
	});

	it("returns pending review copy for users awaiting approval", () => {
		expect(getSiteAccessDeniedCopy(SiteAccessStatus.PENDING)).toMatchObject({
			title: "Access request received",
			apiMessage: "Your Backtrak access request is pending review.",
		});
	});

	it("returns revoked copy for users who have lost access", () => {
		expect(getSiteAccessDeniedCopy(SiteAccessStatus.REVOKED)).toMatchObject({
			title: "Access removed",
			apiMessage: "Your access to Backtrak has been revoked.",
		});
	});

	it("returns a generic fallback when no status is available", () => {
		expect(getSiteAccessDeniedCopy()).toMatchObject({
			title: "We couldn't finish sign-in",
			apiMessage: SITE_ACCESS_DENIED_MESSAGE,
		});
	});
});
