import { ERR } from "@/lib/api/errors";
import { respond, respondError } from "@/lib/api/response";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return respondError("Authentication required", 401, { code: ERR.AUTH });
  }

  return respond({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  });
}
