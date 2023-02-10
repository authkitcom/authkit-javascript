import { ITokens } from './Tokens';
import { Optional } from './Lang';
export interface IRefreshRequest {
    clientId: string;
    refreshToken: string;
}
export interface IGetTokensRequest {
    clientId: string;
    codeVerifier: string;
    redirectUri?: string;
}
export declare class Api {
    private readonly issuer;
    constructor(issuer: string);
    refresh(req: IRefreshRequest): Promise<Optional<ITokens>>;
    getTokens(req: IGetTokensRequest): Promise<Optional<ITokens>>;
}
