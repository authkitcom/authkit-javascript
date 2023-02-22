import { Authentication, IAuthentication, IAuthenticationState } from './Authentication';

import { Api } from './Api';
import { IFrame } from './IFrame';
import { Optional } from './Lang';
import { IPkceSource } from './Pkce';
import { ITokens } from './Tokens';
import { IAuthorizeParams, IRedirectHandler, IStorage } from './Types';
import { makeAuthorizeUrl } from './Urls';

export interface ICreateParams {
  issuer: string;
  clientId: string;
  redirectHandler?: (uri: string) => void;
}

export interface IAuthKit {
  authorize(params: IAuthorizeParams): Promise<Optional<IAuthentication>>;
}

const storageConversationKey = '__authkit.storage.conversation';
const storageAuthenticationKey = '__authkit.storage.authentication';

export interface IConversationState {
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
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
    private readonly iFrame: IFrame,
  ) {
    console.log('I');
    this.issuer = params.issuer;
    this.clientId = params.clientId;
    this.redirectHandler = params.redirectHandler;
    console.log('M');
  }

  public randomString(length: number): string {
    console.log('N');
    return makeId(length);
  }

  public async authorize(params: IAuthorizeParams): Promise<Optional<IAuthentication>> {
    console.log('A');
    const authState = this.readStateFromStorage<IAuthenticationState>(storageAuthenticationKey);
    let auth: Optional<IAuthentication>;
    console.log('B');
    if (authState) {
      console.log('C');
      // TODO - wire up redirect handlers
      auth = await this.attemptMakeAuthentication(params, authState);
      console.log('D');
    } else {
      console.log('E');
      auth = await this.authorizeAndStoreFromCode(params);
      console.log('F');
    }
    if (auth) {
      console.log('G');
      return auth;
    }
    // Handle code return
    let redirectHandler = this.redirectHandler;
    if (params.redirectHandler) {
      redirectHandler = params.redirectHandler;
    }
    console.log('H');
    const aParams = {
      redirectUri: params.redirectUri,
      scope: params.scope,
      state: params.state,
    };
    console.log('J');

    switch (params.mode || 'redirect') {
      case 'silent':
        console.log('K');
        return this.makeAuthenticationFromTokens(params, await this.attemptAuthorizeWithIFrame(aParams));
      case 'redirect':
        console.log('L');
        await this.authorizeRedirect(aParams, redirectHandler);
        return undefined;
    }
  }

  public async authorizeAndStoreFromCode(params: IAuthorizeParams): Promise<Optional<IAuthentication>> {
    console.log('B4');
    const code = this.queryParamSupplier('code');
    const state = this.queryParamSupplier('state');
    if (!code) {
      console.log('D4');
      return undefined;
    }
    console.log('C4');
    const tokens = await this.authorizeFromCodeParams(code);
    console.log('E4');
    const auth = await this.makeAuthenticationFromTokens(params, tokens);
    console.log('F4');
    if (auth && state && params.stateReturnHandler) {
      console.log('G4');
      params.stateReturnHandler(state);
    }
    console.log('H4');
    return auth;
  }

  public async attemptAuthorizeWithIFrame(params: IAuthorizeParams): Promise<Optional<ITokens>> {
    console.log('J5');
    return this.iFrame.getTokens({
      clientId: this.clientId,
      issuer: this.issuer,
      scope: params.scope.join(' '),
      prompt: 'no_prompt',
      responseMode: 'web_message',
    });
  }

  public async authorizeRedirect(params: IAuthorizeParams, redirectHandler?: (uri: string) => void) {
    console.log('R2');
    if (!redirectHandler) {
      throw new Error('redirect handler not provided');
    }
    console.log('S2');
    const nonce = this.randomString(32);
    const pkce = this.pkceSource.create();
    console.log('T2');
    const state = {
      codeVerifier: pkce.verifier,
      nonce,
      redirectUri: params.redirectUri,
    };
    console.log('U2');
    this.writeConversationStateToStorage(state);
    console.log('V2');
    redirectHandler(
      makeAuthorizeUrl({
        clientId: this.clientId,
        codeChallenge: pkce.challenge,
        issuer: this.issuer,
      }),
    );
  }

  public newAuthentication(params: IAuthorizeParams, state: IAuthenticationState): Authentication {
    console.log('Q2');
    return new Authentication(this, params, state);
  }

  public async logout(redirectHandler?: IRedirectHandler): Promise<void> {
    if (!redirectHandler) {
      console.log('N2');
      redirectHandler = this.redirectHandler;
    }
    if (!redirectHandler) {
      console.log('O2');
      throw new Error('redirect required and no redirect handler provided');
    }
    console.log('p2');
    redirectHandler(this.issuer + '/logout');
  }

  public async attemptRefresh(refreshToken: string): Promise<Optional<ITokens>> {
    console.log('M2');
    return await this.api.refresh({
      clientId: this.clientId,
      refreshToken,
    });
  }

  public makeStateFromTokens(tokens: ITokens): IAuthenticationState {
    console.log('D1');
    // 60 seconds grace period
    return {
      expiresIn: Date.now() + tokens.expiresIn - 60,
      tokens,
    };
  }
  private async authorizeFromCodeParams(code: string): Promise<Optional<ITokens>> {
    console.log('E1');
    const convState = this.readStateFromStorage<IConversationState>(storageConversationKey);
    if (!convState) {
      throw new Error('no stored conversation state');
    }
    console.log('F1');
    return await this.api.getTokens({
      clientId: this.clientId,
      codeVerifier: convState.codeVerifier,
      code: code,
      redirectUri: convState.redirectUri,
    });
  }

  private readStateFromStorage<T>(key: string): Optional<T> {
    console.log('Y1');
    const state = this.storage.getItem(key);
    if (!state) {
      console.log('Z1');
      return undefined;
    } else {
      console.log('A2');
      return JSON.parse(state);
    }
  }

  private writeAuthenticationStateToStorage(state: IAuthenticationState) {
    console.log('A3');
    this.storage.setItem(storageAuthenticationKey, JSON.stringify(state));
  }

  private writeConversationStateToStorage(state: IConversationState) {
    console.log('A4');
    this.storage.setItem(storageConversationKey, JSON.stringify(state));
  }

  private async attemptMakeAuthentication(
    params: IAuthorizeParams,
    state: IAuthenticationState,
  ): Promise<Optional<IAuthentication>> {
    console.log('O');
    const result = this.newAuthentication(params, state);
    console.log('P');
    if (result.isAuthenticated()) {
      console.log('Q');
      return result;
    }
    const refreshToken = result.getRefreshToken();
    console.log('R');
    if (refreshToken) {
      console.log('O1');
      return await this.makeAuthenticationFromTokens(params, await this.attemptRefresh(refreshToken));
    }
    console.log('P1');
    return undefined;
  }

  private async makeAuthenticationFromTokens(
    params: IAuthorizeParams,
    tokens: Optional<ITokens>,
  ): Promise<Optional<Authentication>> {
    console.log('Q1');
    if (tokens) {
      console.log('R1');
      const state = this.makeStateFromTokens(tokens);
      console.log('S1');
      this.writeAuthenticationStateToStorage(state);
      console.log('T1');
      const auth = this.newAuthentication(params, state);
      console.log('U1');
      return auth;
    } else {
      console.log('V1');
      return undefined;
    }
  }
}

// Visible for testing

// https://stackoverflow.com/a/1349426
function makeId(length: number) {
  console.log('W1');
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  console.log('X1');
  return result;
}
