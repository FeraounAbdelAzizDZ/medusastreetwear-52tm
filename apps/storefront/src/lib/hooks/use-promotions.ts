import { useQuery } from "@tanstack/react-query"
import { getPromotions, PromotionsResponse } from "@/lib/data/promotions"
import { queryKeys } from "@/lib/utils/query-keys"

/**
 * Hook to fetch and cache promotions data.
 * Promotions are cached and shared across all product cards/pages.
 */
export function usePromotions() {
  return useQuery<PromotionsResponse>({
    queryKey: queryKeys.promotions.all(),
    queryFn: getPromotions,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  })
}
