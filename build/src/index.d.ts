import { IAuthentication } from './Authentication';
import { IAuthKit, ICreateParams } from './AuthKit';
import { ITokens } from './Tokens';
declare const createAuthKitForDOM: (params: ICreateParams) => IAuthKit;
export { createAuthKitForDOM, IAuthKit, IAuthentication, ITokens, ICreateParams };
