import { APIError, type BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { deleteSessionCookie } from "better-auth/cookies";
import { isEqual } from "date-fns";

import { SiteAccessStatus } from "@/generated/prisma/enums";
import {
	buildSiteAccessDeniedUrl,
	createSiteAccessDeniedError,
	deriveSiteAccessStatus,
	normalizeEmail,
	SITE_ACCESS_DENIED_HEADER,
	SITE_ACCESS_DENIED_HEADER_VALUE,
	SITE_ACCESS_DENIED_STATUS_HEADER,
} from "@/lib/auth-site-access";
import prisma from "@/lib/prisma";
import { sessionPayloadSchema } from "@/lib/schema";
import type { SessionPayload } from "@/lib/types";

function isOAuthCallbackPath(path?: string) {
	return Boolean(
		path?.startsWith("/callback/") || path?.startsWith("/oauth2/callback"),
	);
}

async function getSessionPayload(returned: unknown): Promise<SessionPayload> {
	if (!returned || returned instanceof APIError) {
		return null;
	}

	if (returned instanceof Response) {
		if (!returned.ok) {
			return null;
		}

		try {
			const parsed = sessionPayloadSchema.safeParse(
				await returned.clone().json(),
			);

			return parsed.success ? parsed.data : null;
		} catch {
			return null;
		}
	}

	if (typeof returned !== "object") {
		return null;
	}

	const parsed = sessionPayloadSchema.safeParse(returned);
	return parsed.success ? parsed.data : null;
}

async function syncUserSiteAccess(userId: string, email: string) {
	const normalizedEmail = normalizeEmail(email);
	const [grant, user] = await Promise.all([
		prisma.siteAccessGrant.findUnique({
			where: { normalizedEmail },
		}),
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				siteAccessStatus: true,
				siteAccessGrantedAt: true,
				siteAccessRevokedAt: true,
			},
		}),
	]);

	const nextStatus = deriveSiteAccessStatus(grant);
	const nextGrantedAt =
		nextStatus === SiteAccessStatus.ALLOWED ? (grant?.grantedAt ?? null) : null;
	const nextRevokedAt =
		nextStatus === SiteAccessStatus.REVOKED ? (grant?.revokedAt ?? null) : null;
	const writes = [];

	if (grant && grant.userId !== userId) {
		writes.push(
			prisma.siteAccessGrant.update({
				where: { normalizedEmail },
				data: { userId },
			}),
		);
	}

	if (user) {
		const userUpdate: {
			siteAccessStatus?: ReturnType<typeof deriveSiteAccessStatus>;
			siteAccessGrantedAt?: Date | null;
			siteAccessRevokedAt?: Date | null;
		} = {};

		if (user.siteAccessStatus !== nextStatus) {
			userUpdate.siteAccessStatus = nextStatus;
		}

		const grantedAtMatches =
			user.siteAccessGrantedAt == null || nextGrantedAt == null
				? user.siteAccessGrantedAt == null && nextGrantedAt == null
				: isEqual(user.siteAccessGrantedAt, nextGrantedAt);

		if (!grantedAtMatches) {
			userUpdate.siteAccessGrantedAt = nextGrantedAt;
		}

		const revokedAtMatches =
			user.siteAccessRevokedAt == null || nextRevokedAt == null
				? user.siteAccessRevokedAt == null && nextRevokedAt == null
				: isEqual(user.siteAccessRevokedAt, nextRevokedAt);

		if (!revokedAtMatches) {
			userUpdate.siteAccessRevokedAt = nextRevokedAt;
		}

		if (Object.keys(userUpdate).length > 0) {
			writes.push(
				prisma.user.update({
					where: { id: userId },
					data: userUpdate,
				}),
			);
		}
	}

	if (writes.length > 0) {
		await prisma.$transaction(writes);
	}

	return {
		grant,
		status: nextStatus,
	};
}

export function siteAccessPlugin(): BetterAuthPlugin {
	return {
		id: "site-access",
		init() {
			return {
				options: {
					databaseHooks: {
						session: {
							create: {
								before: async (session, ctx) => {
									if (!ctx) {
										return;
									}

									const user = await ctx.context.internalAdapter.findUserById(
										session.userId,
									);

									if (!user?.email) {
										throw new APIError("UNAUTHORIZED", {
											message: "User not found.",
										});
									}

									const { status } = await syncUserSiteAccess(
										user.id,
										user.email,
									);

									if (status === SiteAccessStatus.ALLOWED) {
										return;
									}

									ctx.context.logger.warn(
										"Blocked session creation for user without active site access.",
										{
											email: normalizeEmail(user.email),
											path: ctx.path,
											status,
										},
									);

									if (isOAuthCallbackPath(ctx.path)) {
										throw ctx.redirect(
											buildSiteAccessDeniedUrl(ctx.context.baseURL, status),
										);
									}

									throw createSiteAccessDeniedError(status);
								},
							},
						},
					},
				},
			};
		},
		hooks: {
			after: [
				{
					matcher(ctx) {
						return ctx.path === "/get-session";
					},
					handler: createAuthMiddleware(async (ctx) => {
						const session = await getSessionPayload(ctx.context.returned);

						if (!session?.user?.email || !session.user.id) {
							return;
						}

						const { status } = await syncUserSiteAccess(
							session.user.id,
							session.user.email,
						);

						if (status === SiteAccessStatus.ALLOWED) {
							return;
						}

						ctx.context.logger.warn(
							"Revoked session for user without active site access.",
							{
								email: normalizeEmail(session.user.email),
								status,
							},
						);

						await ctx.context.internalAdapter.deleteSessions(session.user.id);
						deleteSessionCookie(ctx);
						ctx.setHeader(
							SITE_ACCESS_DENIED_HEADER,
							SITE_ACCESS_DENIED_HEADER_VALUE,
						);
						ctx.setHeader(SITE_ACCESS_DENIED_STATUS_HEADER, status);

						return ctx.json(null);
					}),
				},
			],
		},
	};
}
