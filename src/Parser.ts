// https://stackoverflow.com/a/38552302/9500527
const jwtParser = (token: string): string | object => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return {};
  }
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );

  return JSON.parse(jsonPayload);
};

export { jwtParser };
