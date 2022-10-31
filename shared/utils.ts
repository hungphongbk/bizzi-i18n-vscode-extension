export const retry = <T>(
  promiseReturningFunc: () => Promise<T>,
  ms = 700,
  maxRetries = 10,
  currentRetry = 0
): Promise<T> => {
  return new Promise((resolve, reject) => {
    promiseReturningFunc()
      .then((success) => resolve(success))
      .catch((e: any) => {
        setTimeout(() => {
          console.log(`retrying failed promise #${currentRetry}, reason: ${e}`);
          if (currentRetry === maxRetries) {
            throw e;
            return reject("maximum retries exceeded");
          }
          retry(promiseReturningFunc, ms, maxRetries, ++currentRetry).then(
            (success) => resolve(success)
          );
        }, ms);
      });
  });
};

export function delay(ms = 700) {
  return new Promise((resolve) => setTimeout(resolve));
}

export function isTypescript(
  languageId: string
): languageId is
  | "javascript"
  | "javascriptreact"
  | "typescript"
  | "typescriptreact" {
  return /^(javascript|typescript)/.test(languageId);
}
