import { apiFetch as realApiFetch } from "../api";
import { apiFetchMock } from "../api.mock";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "1";

export const apiFetch = useMock ? apiFetchMock : realApiFetch;

export {
  ProblemError,
  NetworkError,
  UnauthorizedError,
  setAccessToken,
  getAccessToken,
} from "../api";

export type { ProblemPayload, Paths, Operations } from "../api";
