import { auth, githubAuth } from "@/auth/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
  const authRequest = auth.handleRequest(context);
  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  const storedState = context.cookies.get("oauth_state").value;

  if (storedState !== state || !code || !state)
    throw new Response(null, { status: 401 });
  try {
    const { existingUser, providerUser, createUser } =
      await githubAuth.validateCallback(code);

    console.log({ existingUser, providerUser, createUser });

    const user =
      existingUser ??
      (await createUser({
        username: providerUser.login,
        email: providerUser.email,
        email_verified: true,
      }));
    const session = await auth.createSession(user.userId);
    authRequest.setSession(session);
    return new Response(null, {
      status: 302,
      headers: {
        location: "/",
      },
    });
  } catch (e) {
    return new Response(null, {
      status: 500,
    });
  }
};
