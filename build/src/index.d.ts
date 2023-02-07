import { IAuthKit, IAuthorizeParams, ICreateParams, IUserinfo } from './AuthKit';
import { jwtParser } from './Parser';
import { Tokens } from './Tokens';
declare const createAuthKit: (params: ICreateParams) => IAuthKit;
export { createAuthKit, Tokens, IAuthKit, ICreateParams, IAuthorizeParams, IUserinfo, jwtParser };
