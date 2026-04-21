/**
 * OAuth 2.0 authentication provider
 * Supports client credentials flow
 */

import type { OAuthConfig } from "../config/types.js";
import { log, logInfo, logWarn } from "../output/formatters.js";

export interface AuthHeaders {
    Authorization: string;
}

export class OAuthProvider {
    private token: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(private config: OAuthConfig) { }

    /**
     * Get authentication headers
     * Exchanges token if needed before returning
     */
    async getHeaders(): Promise<AuthHeaders> {
        // Check if we need to refresh token
        if (!this.token || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
            log("Requesting new OAuth token");
            await this.exchangeToken();
        }

        if (!this.token) {
            throw new Error("Failed to obtain OAuth token");
        }

        return {
            Authorization: `Bearer ${this.token}`,
        };
    }

    /**
     * Exchange credentials for access token
     */
    private async exchangeToken(): Promise<void> {
        try {
            const params = new URLSearchParams();
            params.append("grant_type", "client_credentials");
            params.append("client_id", this.config.client_id);
            params.append("client_secret", this.config.client_secret);

            if (this.config.scopes && this.config.scopes.length > 0) {
                params.append("scope", this.config.scopes.join(" "));
            }

            log(`Exchanging OAuth credentials with ${this.config.token_url}`);

            const response = await fetch(this.config.token_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(
                    `OAuth token exchange failed (${response.status}): ${error}`
                );
            }

            const responseJson = await response.json();

            // Handle both typed and unknown responses
            const data: any = {
                access_token: '',
                token_type: 'bearer',
                expires_in: undefined,
            };
            
            if (typeof responseJson === 'object' && responseJson !== null) {
                data.access_token = responseJson.access_token || '';
                data.token_type = responseJson.token_type || 'bearer';
                data.expires_in = responseJson.expires_in;
            }

            this.token = data.access_token;

            // Calculate expiry time (use 90% of expires_in to refresh early)
            if (data.expires_in) {
                this.tokenExpiry = Date.now() + data.expires_in * 1000 * 0.9;
                logInfo(`OAuth token expires in ${data.expires_in} seconds`);
            }

            logInfo("Successfully obtained OAuth token");
        } catch (error) {
            logWarn(
                `Failed to exchange OAuth token: ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }
}
