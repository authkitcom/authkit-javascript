import { Optional } from './Lang';

const QueryParamSupplier = (name: string): Optional<string> => {
  console.log('Z5');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(window.location.href);
  if (!results) {
    return undefined;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

export { QueryParamSupplier };
