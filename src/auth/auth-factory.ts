/**
 * Authentication factory
 * Selects the appropriate auth provider based on config
 */

import type { AuthConfig, BearerAuthConfig, OAuthConfig } from "../config/types.js";
import { BearerAuthProvider } from "./bearer-provider.js";
import { OAuthProvider } from "./oauth-provider.js";
import { AuthHeaders } from "./bearer-provider.js";
import { ConfigError } from "../errors/custom-errors.js";

export async function createAuthProvider(config: AuthConfig | undefined): Promise<{ getHeaders: () => Promise<AuthHeaders> } | null> {
    if (!config || config.type === "none") {
        return null;
    }

    if (config.type === "bearer") {
        const bearerConfig = config as BearerAuthConfig;
        const provider = new BearerAuthProvider(bearerConfig);
        return {
            getHeaders: async () => provider.getHeaders(),
        };
    }

    if (config.type === "oauth") {
        const oauthConfig = config as OAuthConfig;
        const provider = new OAuthProvider(oauthConfig);
        return {
            getHeaders: async () => provider.getHeaders(),
        };
    }

    throw new ConfigError(`Unknown auth type: ${config.type}`);
}
