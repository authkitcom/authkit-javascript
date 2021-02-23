import { Tokens } from './Tokens';
import { parser } from './Parser';
import { PkceSource } from './Pkce';
import { IParams, IAuthKit, IUserinfo, AuthKit } from './AuthKit';

const create = (params: IParams): IAuthKit => new AuthKit(params, new PkceSource());

export { create, Tokens, IAuthKit, IParams, IUserinfo, parser };
