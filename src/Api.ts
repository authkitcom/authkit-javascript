import { ITokens } from './Tokens';
import { Optional } from './Lang';

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

export class Api {
  public constructor(private readonly issuer: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async refresh(req: IRefreshRequest): Promise<Optional<ITokens>> {
    console.log('N1');
    return undefined;
  }

  public async getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>> {
    let tokens;
    console.log('G1');
    try {
      console.log('H1');
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
      console.log('I1');
      tokens = await response.json();
      console.log('J1');
    } catch (e) {
      throw new Error('unable to fetch tokens');
    }
    console.log('K1');
    if (tokens) {
      console.log('L1');
      return {
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in,
      };
    } else {
      console.log('M1');
      throw new Error('unable to parse tokens');
    }
  }
}
