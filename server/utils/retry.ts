
/**
 * Retries an asynchronous function based on the provided retry count and delay.
 * @param fn - The asynchronous function to retry.
 * @param retries - Number of retry attempts.
 * @param delay - Delay between retries in milliseconds.
 * @returns The result of the asynchronous function.
 */
export async function retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (error) {
        attempt++;
        if (attempt >= retries) {
          throw error;
        }
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw new Error('Retry attempts exhausted');
}