import { Authentication, IAuthentication, IAuthenticationState } from './Authentication';
import { Api } from './Api';
import { Optional } from './Lang';
import { IPkceSource } from './Pkce';
import { ITokens } from './Tokens';
import { IAuthorizeParams, IRedirectHandler, IStorage } from './Types';
import { IFrame } from './IFrame';
export interface ICreateParams {
    issuer: string;
    clientId: string;
    redirectHandler?: (uri: string) => void;
}
export interface IAuthKit {
    authorize(params?: IAuthorizeParams): Promise<Optional<IAuthentication>>;
}
export interface IConversationState {
    nonce: string;
    codeVerifier: string;
    redirectUri?: string;
}
export declare type IQueryParamSupplier = (name: string) => Optional<string>;
export declare class AuthKit implements IAuthKit {
    private readonly api;
    private readonly storage;
    private readonly pkceSource;
    private readonly queryParamSupplier;
    private readonly iFrame;
    private readonly issuer;
    private readonly clientId;
    private readonly redirectHandler?;
    constructor(params: ICreateParams, api: Api, storage: IStorage, pkceSource: IPkceSource, queryParamSupplier: IQueryParamSupplier, iFrame: IFrame);
    randomString(length: number): string;
    authorize(params: IAuthorizeParams): Promise<Optional<IAuthentication>>;
    authorizeAndStoreFromCode(params: IAuthorizeParams): Promise<Optional<IAuthentication>>;
    attemptAuthorizeWithIFrame(params: IAuthorizeParams): Promise<Optional<ITokens>>;
    authorizeRedirect(params: IAuthorizeParams, redirectHandler?: (uri: string) => void): Promise<void>;
    newAuthentication(params: IAuthorizeParams, state: IAuthenticationState): Authentication;
    logout(redirectHandler?: IRedirectHandler): Promise<void>;
    attemptRefresh(refreshToken: string): Promise<Optional<ITokens>>;
    makeStateFromTokens(tokens: ITokens): IAuthenticationState;
    private authorizeFromCodeParams;
    private readStateFromStorage;
    private writeAuthenticationStateToStorage;
    private writeConversationStateToStorage;
    private attemptMakeAuthentication;
    private makeAuthenticationFromTokens;
}
