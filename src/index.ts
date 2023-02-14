import { Api } from './Api';
import { IAuthentication } from './Authentication';
import { AuthKit, IAuthKit, ICreateParams } from './AuthKit';
import { IFrame } from './IFrame';
import { PkceSource } from './Pkce';
import { QueryParamSupplier } from './Query';
import { ITokens } from './Tokens';
import { IAuthorizeParams } from './Types';

const createAuthKitForDOM = (params: ICreateParams): IAuthKit =>
  new AuthKit(params, new Api(params.issuer), sessionStorage, new PkceSource(), QueryParamSupplier, new IFrame());

export { createAuthKitForDOM, IAuthKit, IAuthentication, ITokens, ICreateParams, IAuthorizeParams };
