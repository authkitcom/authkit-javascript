import { AuthKit } from './AuthKit';
import { ITokens } from './Tokens';
import { IAuthorizeParams, IRedirectHandler } from './Types';
import { Optional } from './Lang';

export interface IUserinfo {
  sub: string;
  [x: string]: any;
}

export interface IAuthentication {
  logout(): Promise<void>;
  // params - optional overrides merged with settings from authorize
  getTokens(params?: IAuthorizeParams): Promise<ITokens>;
  // valid non-expired authentication
  isAuthenticated(): boolean;
  getUserinfo(): Promise<IUserinfo>;
}

export interface IAuthenticationState {
  userinfo?: IUserinfo;
  tokens?: ITokens;
  expiresIn: number;
}

export class Authentication implements IAuthentication {
  public constructor(
    private readonly authkit: AuthKit,
    private readonly params: IAuthorizeParams,
    private state: IAuthenticationState,
  ) {}

  public async getTokens(params?: IAuthorizeParams): Promise<ITokens> {
    if (this.isAuthenticated()) {
      return this.state.tokens!;
    }
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      const tokens = await this.authkit.attemptRefresh(refreshToken);
      if (tokens) {
        this.state = this.authkit.makeStateFromTokens(tokens);
        return tokens;
      }
    }

    // TODO - handle iFrame

    // TODO - handle redirect

    throw new Error('unable to retrieve tokens');
  }

  public async getUserinfo(): Promise<IUserinfo> {
    return {
      sub: '',
    };
  }

  public isAuthenticated(): boolean {
    return !!(this.state?.tokens && this.state.expiresIn < Date.now());
  }

  // Has tokens but are expired
  public getRefreshToken(): Optional<string> {
    if (this.state.tokens) {
      return this.state.tokens.refreshToken;
    } else {
      return undefined;
    }
  }

  public async logout(redirectHandler?: IRedirectHandler): Promise<void> {
    return this.authkit.logout(redirectHandler);
  }
}
