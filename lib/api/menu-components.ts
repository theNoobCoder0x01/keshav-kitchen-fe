import type { MenuComponentApiItem } from "@/types/menu-components";

import api from "./axios";

export async function fetchMenuComponents(
  premiseId: string,
  params = {},
): Promise<MenuComponentApiItem[]> {
  const response = await api.get(`/premises/${premiseId}/menu-components/`, {
    params,
  });
  return response.data;
}
