import type { MenuComponentApiItem } from "@/types/menu-components";

import api from "./axios";

export async function fetchMenuComponents(
  kitchenId: string,
  params = {},
): Promise<MenuComponentApiItem[]> {
  const response = await api.get(`/kitchens/${kitchenId}/menu-components/`, {
    params,
  });
  return response.data;
}
