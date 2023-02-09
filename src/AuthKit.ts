import { Authentication, IAuthentication, IAuthenticationState } from './Authentication';

import { Api } from './Api';
import { Optional } from './Lang';
import { IPkceSource } from './Pkce';
import { ITokens } from './Tokens';
import { IAuthorizeParams, IRedirectHandler, IStorage } from './Types';
import { IAuthorizeUrlParams, makeAuthorizeUrl } from './Urls';

export interface ICreateParams {
  issuer: string;
  clientId: string;
  redirectHandler?: (uri: string) => void;
}

export interface IAuthKit {
  authorize(params?: IAuthorizeParams): Promise<Optional<IAuthentication>>;
}

const storageConversationKey = '__authkit.storage.conversation';
const storageAuthenticationKey = '__authkit.storage.authentication';

export interface IConversationState {
  nonce: string;
  codeVerifier: string;
  redirectUri?: string;
}

export type IQueryParamSupplier = (name: string) => Optional<string>;

export class AuthKit implements IAuthKit {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly redirectHandler?: (url: string) => void;
  public constructor(
    params: ICreateParams,
    private readonly api: Api,
    private readonly storage: IStorage,
    private readonly pkceSource: IPkceSource,
    private readonly queryParamSupplier: IQueryParamSupplier,
  ) {
    this.issuer = params.issuer;
    this.clientId = params.clientId;
    this.redirectHandler = params.redirectHandler;
  }

  public randomString(length: number): string {
    return makeId(length);
  }

  public async authorize(params: IAuthorizeParams): Promise<Optional<IAuthentication>> {
    const authState = this.readStateFromStorage<IAuthenticationState>(storageAuthenticationKey);
    if (authState) {
      // TODO - wire up redirect handlers
      return this.attemptMakeAuthentication(params, authState);
    }

    const auth = await this.authorizeAndStoreFromCode(params);

    if (auth) {
      return auth;
    }

    // See if we have a code
    let aParams: any = {
      clientId: this.clientId,
      issuer: this.issuer,
    };
    // Handle code return
    let redirectHandler = this.redirectHandler;
    if (params.redirectHandler) {
      redirectHandler = params.redirectHandler;
    }
    aParams = {
      ...aParams,
      redirectUri: params.redirectUri,
      scope: params.scope ? params.scope.join(' ') : undefined,
      state: params.state,
    };

    switch (params.mode || 'redirect') {
      case 'silent':
        return this.makeAuthenticationFromTokens(
          params,
          await this.attemptAuthorizeWithIFrame({
            ...aParams,
            prompt: 'none',
            responseMode: 'web_message',
          }),
        );
      case 'redirect':
        await this.authorizeRedirect(aParams, redirectHandler);
        return undefined;
    }
  }

  public async authorizeAndStoreFromCode(params: IAuthorizeParams): Promise<Optional<IAuthentication>> {
    const code = this.queryParamSupplier('code');
    const state = this.queryParamSupplier('state');
    if (!code) {
      return undefined;
    }
    const tokens = await this.authorizeFromCodeParams(code);
    const auth = await this.makeAuthenticationFromTokens(params, tokens);
    if (auth && state && params.stateReturnHandler) {
      params.stateReturnHandler(state);
    }
    return auth;
  }

  public async attemptAuthorizeWithIFrame(params: IAuthorizeUrlParams): Promise<Optional<ITokens>> {
    throw new Error('support this');
  }

  public async authorizeRedirect(params: IAuthorizeUrlParams, redirectHandler?: (uri: string) => void) {
    if (!redirectHandler) {
      throw new Error('redirect handler not provided');
    }

    const nonce = this.randomString(32);
    const pkce = this.pkceSource.create();

    const state = {
      codeVerifier: pkce.verifier,
      nonce,
    };

    this.writeConversationStateToStorage(state);

    redirectHandler(
      makeAuthorizeUrl({
        ...params,
        codeChallenge: pkce.challenge,
      }),
    );
  }

  public newAuthentication(params: IAuthorizeParams, state: IAuthenticationState): Authentication {
    return new Authentication(this, params, state);
  }

  public async logout(redirectHandler?: IRedirectHandler): Promise<void> {
    if (!redirectHandler) {
      redirectHandler = this.redirectHandler;
    }
    if (!redirectHandler) {
      throw new Error('redirect required and no redirect handler provided');
    }
    redirectHandler(this.issuer + '/logout');
  }

  public async attemptRefresh(refreshToken: string): Promise<Optional<ITokens>> {
    return await this.api.refresh({
      clientId: this.clientId,
      refreshToken,
    });
  }

  public makeStateFromTokens(tokens: ITokens): IAuthenticationState {
    // 60 seconds grace period
    return {
      expiresIn: Date.now() + tokens.expiresIn - 60,
      tokens,
    };
  }
  private async authorizeFromCodeParams(code: string): Promise<Optional<ITokens>> {
    const convState = this.readStateFromStorage<IConversationState>(storageConversationKey);
    if (!convState) {
      throw new Error('no stored conversation state');
    }
    return await this.api.getTokens({
      clientId: this.clientId,
      codeVerifier: convState.codeVerifier,
      redirectUri: convState.redirectUri,
    });
  }

  private readStateFromStorage<T>(key: string): Optional<T> {
    const state = this.storage.getItem(key);
    if (!state) {
      return undefined;
    } else {
      return JSON.parse(state);
    }
  }

  private writeAuthenticationStateToStorage(state: IAuthenticationState) {
    this.storage.setItem(storageAuthenticationKey, JSON.stringify(state));
  }

  private writeConversationStateToStorage(state: IConversationState) {
    this.storage.setItem(storageConversationKey, JSON.stringify(state));
  }

  private async attemptMakeAuthentication(
    params: IAuthorizeParams,
    state: IAuthenticationState,
  ): Promise<Optional<IAuthentication>> {
    const result = this.newAuthentication(params, state);
    if (result.isAuthenticated()) {
      return result;
    }
    const refreshToken = result.getRefreshToken();
    if (refreshToken) {
      return await this.makeAuthenticationFromTokens(params, await this.attemptRefresh(refreshToken));
    }

    return undefined;
  }

  private async makeAuthenticationFromTokens(
    params: IAuthorizeParams,
    tokens: Optional<ITokens>,
  ): Promise<Optional<Authentication>> {
    if (tokens) {
      const state = this.makeStateFromTokens(tokens);
      this.writeAuthenticationStateToStorage(state);
      const auth = this.newAuthentication(params, state);
      return auth;
    } else {
      return undefined;
    }
  }
}

// Visible for testing

// https://stackoverflow.com/a/1349426
function makeId(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
