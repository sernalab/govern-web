/**
 * Site configuration
 *
 * GA_MEASUREMENT_ID: Google Analytics 4 measurement ID (e.g. 'G-XXXXXXXXXX').
 * Leave empty to disable analytics.
 * Can also be set via the PUBLIC_GA_MEASUREMENT_ID environment variable.
 */
export const GA_MEASUREMENT_ID: string =
  import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? '';
