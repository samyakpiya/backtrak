import { z } from "zod";

import { SiteAccessStatus } from "@/generated/prisma/enums";

export const normalizedEmailSchema = z.string().trim().toLowerCase().email();

export const siteAccessGrantSeedEmailsSchema = z
	.string()
	.optional()
	.transform((value) => {
		if (!value) {
			return [];
		}

		return value
			.split(",")
			.map((email) => email.trim())
			.filter(Boolean);
	})
	.pipe(z.array(normalizedEmailSchema))
	.transform((emails) => [...new Set(emails)]);

export const siteAccessStatusSchema = z.enum(SiteAccessStatus);

export const deniedPageSearchParamsSchema = z.object({
	error: z.string().optional(),
	status: siteAccessStatusSchema.optional(),
});

export const sessionPayloadSchema = z
	.object({
		session: z
			.object({
				token: z.string().optional(),
			})
			.optional(),
		user: z
			.object({
				email: normalizedEmailSchema.optional(),
				id: z.string().optional(),
			})
			.optional(),
	})
	.nullable();
