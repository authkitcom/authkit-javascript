import { Optional } from './Lang';
import { PkceSource } from './Pkce';
import { Tokens } from './Tokens';
interface ICreateParams {
    issuer: string;
    clientId: string;
    scope: string[];
}
interface IAuthorizeParams {
    state?: string;
    stateReturn?: (state: string) => void;
    binding?: string;
    extensions?: any;
    redirectUri?: string;
}
interface IUserinfo {
    sub: string;
    [x: string]: any;
}
interface IAuthKit {
    authorize(params?: IAuthorizeParams): Promise<IAuthKit>;
    logout(returnTo: string): void;
    isAuthenticated(): boolean;
    setTokens(tokens: Tokens): Promise<void>;
    getTokens(): Optional<Tokens>;
    removeTokens(): void;
    getUserinfo(): Optional<IUserinfo>;
}
declare const randomStringDefault: (length: number) => string;
declare class AuthKit implements IAuthKit {
    randomString: (length: number) => string;
    getQuery: () => string;
    refreshLimit: number;
    redirect: (url: string) => void;
    submitForm: (form: HTMLFormElement) => void;
    private refreshCount;
    private params;
    private pkceSource;
    private tokens?;
    private userinfo?;
    private bindings;
    private mutex;
    constructor(params: ICreateParams, pkceSource: PkceSource);
    isAuthenticated(): boolean;
    getTokens(): Optional<Tokens>;
    removeTokens(): void;
    getUserinfo(): Optional<IUserinfo>;
    authorize(params?: IAuthorizeParams): Promise<IAuthKit>;
    setTokens(tokens: Tokens): Promise<void>;
    logout(returnTo: string): void;
    private stringFromQuery;
    private loadFromCode;
    private processTokenResponse;
    private refreshLoop;
    private refresh;
    private loadUserinfo;
    private getStorage;
    private createAndStoreStorage;
    private finalStorage;
    private loadFromStorage;
}
export { IAuthKit, IAuthorizeParams, ICreateParams, IUserinfo, AuthKit, randomStringDefault };
