import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export const SignoutButton = () => {
	return (
		<form action={signOutAction}>
			<Button type="submit">Sign Out</Button>
		</form>
	);
};
