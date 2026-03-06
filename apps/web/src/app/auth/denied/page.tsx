import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { getSiteAccessDeniedCopy } from "@/lib/auth-site-access";
import { deniedPageSearchParamsSchema } from "@/lib/schema";

type AccessDeniedPageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstQueryValue(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

export default async function AccessDeniedPage({
	searchParams,
}: AccessDeniedPageProps) {
	const rawSearchParams = await searchParams;
	const parsedSearchParams = deniedPageSearchParamsSchema.safeParse({
		error: getFirstQueryValue(rawSearchParams.error),
		status: getFirstQueryValue(rawSearchParams.status),
	});

	const copy = getSiteAccessDeniedCopy(
		parsedSearchParams.success ? parsedSearchParams.data.status : undefined,
	);

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-xl">{copy.title}</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<FieldGroup className="items-center gap-4 p-2 text-center md:p-4">
					<FieldDescription>{copy.body}</FieldDescription>
					<FieldDescription>{copy.helpText}</FieldDescription>
					<Button asChild>
						<a href="/auth/login">Back to login</a>
					</Button>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}
