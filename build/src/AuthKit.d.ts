import { IAuthentication, IAuthenticationState } from './Authentication';
import { Optional } from './Lang';
import { IPkceSource } from './Pkce';
import { IAuthorizeParams, IStorage } from './Types';
import { IAuthorizeUrlParams } from './Urls';
export interface ICreateParams {
    issuer: string;
    clientId: string;
    redirectHandler?: (uri: string) => void;
}
export interface IAuthKit {
    authorize(params?: IAuthorizeParams): Promise<Optional<IAuthentication>>;
}
export declare class AuthKit implements IAuthKit {
    private readonly storage;
    private readonly pkceSource;
    private readonly queryParamSupplier;
    private readonly issuer;
    private readonly clientId;
    private readonly redirectHandler?;
    constructor(params: ICreateParams, storage: IStorage, pkceSource: IPkceSource, queryParamSupplier: (name: string) => Optional<string>);
    randomString(length: number): string;
    authorize(params?: IAuthorizeParams): Promise<Optional<IAuthentication>>;
    authorizeFromCode(stateReturnHandler?: (state: string) => void): Promise<Optional<IAuthenticationState>>;
    authorizeWithIFrame(params: IAuthorizeUrlParams): Promise<Optional<IAuthentication>>;
    authorizeRedirect(params: IAuthorizeUrlParams, redirectHandler?: (uri: string) => void): Promise<void>;
    private authorizeFromCodeParams;
    private readStateFromStorage;
    private writeAuthenticationStateToStorage;
    private writeConversationStateToStorage;
    private makeAuthentication;
}
