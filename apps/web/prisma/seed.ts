import "dotenv/config";

import { isEqual } from "date-fns";
import { parseSiteAccessGrantSeedEmails } from "@/lib/auth-site-access";
import prisma from "@/lib/prisma";
import { SiteAccessStatus } from "../src/generated/prisma/enums";

async function main() {
	const emails = parseSiteAccessGrantSeedEmails(
		process.env.SITE_ACCESS_GRANT_SEED_EMAILS,
	);

	if (emails.length === 0) {
		console.info(
			"No site access grant emails found in SITE_ACCESS_GRANT_SEED_EMAILS.",
		);
		return;
	}

	for (const normalizedEmail of emails) {
		const [existingGrant, user] = await Promise.all([
			prisma.siteAccessGrant.findUnique({
				where: { normalizedEmail },
			}),
			prisma.user.findUnique({
				where: { email: normalizedEmail },
				select: {
					id: true,
					siteAccessStatus: true,
					siteAccessGrantedAt: true,
					siteAccessRevokedAt: true,
				},
			}),
		]);

		const writes = [];
		let grantedAt = existingGrant?.grantedAt ?? new Date();

		if (!existingGrant) {
			writes.push(
				prisma.siteAccessGrant.create({
					data: {
						normalizedEmail,
						grantedAt,
						userId: user?.id,
					},
				}),
			);
		} else {
			const grantUpdate: {
				grantedAt?: Date;
				revokedAt?: null;
				userId?: string | null;
			} = {};

			if (existingGrant.revokedAt) {
				grantedAt = new Date();
				grantUpdate.grantedAt = grantedAt;
				grantUpdate.revokedAt = null;
			}

			if ((existingGrant.userId ?? null) !== (user?.id ?? null)) {
				grantUpdate.userId = user?.id ?? null;
			}

			if (Object.keys(grantUpdate).length > 0) {
				writes.push(
					prisma.siteAccessGrant.update({
						where: { normalizedEmail },
						data: grantUpdate,
					}),
				);
			}
		}

		if (user) {
			const userUpdate: {
				siteAccessStatus?: typeof SiteAccessStatus.ALLOWED;
				siteAccessGrantedAt?: Date;
				siteAccessRevokedAt?: null;
			} = {};

			if (user.siteAccessStatus !== SiteAccessStatus.ALLOWED) {
				userUpdate.siteAccessStatus = SiteAccessStatus.ALLOWED;
			}

			const grantedAtMatches =
				user.siteAccessGrantedAt == null || grantedAt == null
					? user.siteAccessGrantedAt == null && grantedAt == null
					: isEqual(user.siteAccessGrantedAt, grantedAt);

			if (!grantedAtMatches) {
				userUpdate.siteAccessGrantedAt = grantedAt;
			}

			if (user.siteAccessRevokedAt !== null) {
				userUpdate.siteAccessRevokedAt = null;
			}

			if (Object.keys(userUpdate).length > 0) {
				writes.push(
					prisma.user.update({
						where: { id: user.id },
						data: userUpdate,
					}),
				);
			}
		}

		if (writes.length > 0) {
			await prisma.$transaction(writes);
		}
	}

	console.info(`Seeded ${emails.length} site access grant email(s).`);
}

main()
	.catch((error) => {
		console.error("Failed to seed site access grant emails.", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
