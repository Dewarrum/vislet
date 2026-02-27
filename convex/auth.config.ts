import { AuthConfig } from "convex/server";

export default {
  providers: [
    // Uncomment this once you have set up a Clerk app
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
