declare module '@sdkwork/react-auth' {
  export interface TradeAuthUser {
    avatar?: string;
    name: string;
    email?: string;
  }

  export interface TradeAuthStore {
    user?: TradeAuthUser | null;
    logout: () => void;
  }

  export function useAuthStore(): TradeAuthStore;
}
