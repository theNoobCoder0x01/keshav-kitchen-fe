import api from "./axios";

export async function fetchMenuComponents(params = {}) {
  const response = await api.get("/menu-components", { params });
  return response.data;
}
