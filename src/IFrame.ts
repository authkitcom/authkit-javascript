import { Optional } from './Lang';
import { ITokens } from './Tokens';
import { IAuthorizeParams } from './Types';

export class IFrame {
  public async getTokens(params: IAuthorizeParams): Promise<Optional<ITokens>> {
    return undefined;
  }
}
