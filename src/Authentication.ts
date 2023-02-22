import { AuthKit } from './AuthKit';
import { Optional } from './Lang';
import { ITokens } from './Tokens';
import { IAuthorizeParams, IRedirectHandler } from './Types';

export interface IUserinfo {
  sub: string;
  [x: string]: unknown;
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

  //TODO use params
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getTokens(params?: IAuthorizeParams): Promise<ITokens> {
    if (this.isAuthenticated()) {
      console.log('W');
      return this.state.tokens!;
    }
    console.log('X');
    const refreshToken = this.getRefreshToken();
    console.log('Y');
    if (refreshToken) {
      console.log('Z');
      const tokens = await this.authkit.attemptRefresh(refreshToken);
      console.log('A1');
      if (tokens) {
        console.log('B1');
        this.state = this.authkit.makeStateFromTokens(tokens);
        console.log('C1');
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
    console.log('S');
    if (this.state.tokens) {
      console.log('T');
      return this.state.tokens.refreshToken;
    } else {
      console.log('U');
      return undefined;
    }
  }

  public async logout(redirectHandler?: IRedirectHandler): Promise<void> {
    console.log('V');
    return this.authkit.logout(redirectHandler);
  }
}
