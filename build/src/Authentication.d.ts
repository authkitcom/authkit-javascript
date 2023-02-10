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
    getTokens(params?: IAuthorizeParams): Promise<ITokens>;
    isAuthenticated(): boolean;
    getUserinfo(): Promise<IUserinfo>;
}
export interface IAuthenticationState {
    userinfo?: IUserinfo;
    tokens?: ITokens;
    expiresIn: number;
}
export declare class Authentication implements IAuthentication {
    private readonly authkit;
    private readonly params;
    private state;
    constructor(authkit: AuthKit, params: IAuthorizeParams, state: IAuthenticationState);
    getTokens(params?: IAuthorizeParams): Promise<ITokens>;
    getUserinfo(): Promise<IUserinfo>;
    isAuthenticated(): boolean;
    getRefreshToken(): Optional<string>;
    logout(redirectHandler?: IRedirectHandler): Promise<void>;
}
