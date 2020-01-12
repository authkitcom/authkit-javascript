import { Authentication } from './Authentication';
import { PkceSource } from './Pkce';
import { IParams, ISecure, SecureImpl } from './Secure';

const create = (params: IParams): ISecure => new SecureImpl(params, new PkceSource());

export { Authentication, ISecure, IParams, create };
