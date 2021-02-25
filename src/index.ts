import { AuthKit, IAuthKit, IAuthorizeParams,  ICreateParams,  IUserinfo } from './AuthKit';
import { jwtParser } from './Parser';
import { PkceSource } from './Pkce';
import { Tokens } from './Tokens';

const createAuthKit = (params: ICreateParams): IAuthKit => new AuthKit(params, new PkceSource());

export { createAuthKit, Tokens, IAuthKit, ICreateParams, IAuthorizeParams, IUserinfo, jwtParser };
