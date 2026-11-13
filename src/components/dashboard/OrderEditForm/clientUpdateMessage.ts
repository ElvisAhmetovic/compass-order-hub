import { Order } from "@/types";

export const DEFAULT_CLIENT_UPDATE_MESSAGE = "Your order was updated. You can see the latest details in your client portal.";

// Only the client-visible update may reach the client — never internal notes or price.
export const buildClientUpdateMessage = (order: Pick<Order, "client_visible_update">): string =>
  (order.client_visible_update || "").trim() || DEFAULT_CLIENT_UPDATE_MESSAGE;
