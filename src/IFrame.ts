import { Optional } from './Lang';
import { ITokens } from './Tokens';
import { IAuthorizeUrlParams } from './Urls';

export class IFrame {
  public async getTokens(params: IAuthorizeUrlParams): Promise<Optional<ITokens>> {
    return undefined;
  }
}
