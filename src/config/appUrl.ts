/**
 * Public address of the app. All client-facing links (offer confirmations,
 * client portal login) must point here regardless of where the admin is
 * currently browsing (preview, published or custom domain).
 */
export const PUBLIC_APP_URL = "https://www.empriatech.com";

export const CLIENT_PORTAL_LOGIN_URL = `${PUBLIC_APP_URL}/client/login`;

export const getOfferConfirmUrl = (offerId: string) =>
  `${PUBLIC_APP_URL}/confirm-offer/${offerId}`;
