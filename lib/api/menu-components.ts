import api from "./axios";

export async function fetchMenuComponents(kitchenId: string, params = {}) {
  const response = await api.get(`/kitchens/${kitchenId}/menu-components`, {
    params,
  });
  return response.data;
}
