import { ITokens } from './Tokens';
import { Optional } from './Lang';
import { IUserinfo } from "./Authentication";

export interface IRefreshRequest {
  clientId: string;
  refreshToken: string;
}

export interface IGetTokensRequest {
  clientId: string;
  codeVerifier: string;
  code: string;
  redirectUri: string;
}

export interface IGetUserinfoRequest {
  token: string;
}

export class Api {
  public constructor(private readonly issuer: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async refresh(req: IRefreshRequest): Promise<Optional<ITokens>> {
    return undefined;
  }

  public async getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>> {
    let tokens;
    try {
      const response = await fetch(`${this.issuer}/oauth/token`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: req.clientId,
          grant_type: 'authorization_code',
          code: req.code,
          code_verifier: req.codeVerifier,
          redirect_uri: req.redirectUri,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      tokens = await response.json();
    } catch (e) {
      throw new Error('unable to fetch tokens');
    }
    if (tokens) {
      return {
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in,
      };
    } else {
      throw new Error('unable to parse tokens');
    }
  }
  public async getUserinfo(req: IGetUserinfoRequest): Promise<Optional<IUserinfo>> {
    try {
      const response = await fetch(`${this.issuer}/userinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${req.token}`,
        },
      });
      return await response.json();
    } catch (e) {
      throw new Error('unable to fetch userinfo');
    }
  }
}
