export const retry = <T>(
  promiseReturningFunc: () => Promise<T>,
  ms = 500,
  maxRetries = 10,
  currentRetry = 0
): Promise<T> => {
  return new Promise((resolve, reject) => {
    promiseReturningFunc()
      .then((success) => resolve(success))
      .catch(() => {
        setTimeout(() => {
          console.log(`retrying failed promise #${currentRetry}`);
          if (currentRetry === maxRetries) {
            return reject("maximum retries exceeded");
          }
          retry(promiseReturningFunc, ms, maxRetries, ++currentRetry).then(
            (success) => resolve(success)
          );
        }, ms);
      });
  });
};