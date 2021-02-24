import { AuthKit, IAuthKit, IParams, IUserinfo } from './AuthKit';
import { jwtParser } from './Parser';
import { PkceSource } from './Pkce';
import { Tokens } from './Tokens';

const createAuthKit = (params: IParams): IAuthKit => new AuthKit(params, new PkceSource());

export { createAuthKit, Tokens, IAuthKit, IParams, IUserinfo, jwtParser };
