import { AuthKit, IAuthKit, IParams, IUserinfo } from './AuthKit';
import { parser } from './Parser';
import { PkceSource } from './Pkce';
import { Tokens } from './Tokens';

const create = (params: IParams): IAuthKit => new AuthKit(params, new PkceSource());

export { create, Tokens, IAuthKit, IParams, IUserinfo, parser };
