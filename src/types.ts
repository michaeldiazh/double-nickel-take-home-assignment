export type Result<T> = {status: 'success', value: T} | {status: 'error', message: string};

export const createSuccessResult = <T>(value: T): Result<T> => ({status: 'success', value});
export const createErrorResult = (message: string): Result<unknown> => ({status: 'error', message});

export const resolveResult = <T>(result: Result<T>): T => {
  if (result.status === 'success') {
    return result.value;
  }
  throw new Error(result.message);
};