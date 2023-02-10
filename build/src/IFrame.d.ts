import { Optional } from './Lang';
import { ITokens } from './Tokens';
import { IAuthorizeParams } from './Types';
export declare class IFrame {
    getTokens(params: IAuthorizeParams): Promise<Optional<ITokens>>;
}
