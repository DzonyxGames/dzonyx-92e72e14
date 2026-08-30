export async function authenticatedFetch(
  getToken: () => Promise<string | null>,
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const token = await getToken();
  if (!token) throw new Error("Sign in is required.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + token);
  return fetch(input, { ...init, headers });
}

export async function responseMessage(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  return payload.error ?? "Something went wrong. Please try again.";
}
