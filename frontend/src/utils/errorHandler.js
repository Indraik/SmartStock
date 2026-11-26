/**
 * Extracts a normalized error object from an Axios error response.
 * Supports SmartStock's GlobalExceptionHandler shape:
 * { timestamp, status, error, message, path, errors? }
 */
export function parseApiError(err, fallbackMessage = 'Something went wrong. Please try again.') {
  if (!err) {
    return { status: 0, message: fallbackMessage, fieldErrors: {}, isNetworkError: false };
  }

  if (!err.response) {
    return {
      status: 0,
      message: 'Unable to reach the server. Please verify the backend is running.',
      fieldErrors: {},
      isNetworkError: true,
    };
  }

  const { status, data } = err.response;
  const fieldErrors =
    data?.errors && typeof data.errors === 'object' ? data.errors : {};

  let message = data?.message || fallbackMessage;

  if (status === 403 && !data?.message) {
    message = 'You do not have permission to perform this action.';
  } else if (status === 401 && !data?.message) {
    message = 'Your session has expired. Please sign in again.';
  } else if (status === 404 && !data?.message) {
    message = 'The requested resource was not found.';
  } else if (status >= 500) {
    message = data?.message || 'An unexpected server error occurred. Please try again.';
  }

  return {
    status,
    message,
    fieldErrors,
    isNetworkError: false,
  };
}
