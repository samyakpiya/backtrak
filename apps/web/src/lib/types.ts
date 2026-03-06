import type z from "zod";
import type {
	deniedPageSearchParamsSchema,
	sessionPayloadSchema,
	siteAccessStatusSchema,
} from "./schema";

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type SiteAccessStatusValue = z.infer<typeof siteAccessStatusSchema>;
export type DeniedPageSearchParams = z.infer<typeof deniedPageSearchParamsSchema>;
