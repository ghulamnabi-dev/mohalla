export const environment = {
  production: true,
  /** Base URL of the Mohalla API (no trailing slash). */
  // Same-origin: the host (nginx in the Docker image, or any reverse proxy) forwards /api to the API.
  apiUrl: '/api',
};
