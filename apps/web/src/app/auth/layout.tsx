import { FieldDescription } from "@/components/ui/field";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a href="/" className="flex items-center gap-2 self-center font-medium">
					Backtrak
				</a>
				{children}
				<FieldDescription className="px-6 text-center">
					By clicking continue, you agree to our{" "}
					<a href="/terms">Terms of Service</a> and{" "}
					<a href="/privacy">Privacy Policy</a>.
				</FieldDescription>
			</div>
		</div>
	);
}
