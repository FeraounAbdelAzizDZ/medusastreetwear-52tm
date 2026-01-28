import { sdk } from "@/lib/utils/sdk"

export type ProductPromotion = {
  promotion_id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  currency_code?: string
}

export type PromotionsResponse = {
  promotions: Record<string, ProductPromotion[]>
  raw_promotions: Array<{
    id: string
    code: string
    type: string
    value: number
    target_type: string
    target_rules: any[]
  }>
}

/**
 * Fetch active promotions and their product mappings from the custom endpoint.
 * This allows displaying promotional prices without using a cart.
 */
export async function getPromotions(): Promise<PromotionsResponse> {
  try {
    const response = await sdk.client.fetch<PromotionsResponse>("/store/promotions", {
      method: "GET",
    })
    return response
  } catch (error) {
    console.error("Failed to fetch promotions:", error)
    return { promotions: {}, raw_promotions: [] }
  }
}

/**
 * Get promotions that apply to a specific product
 */
export function getPromotionsForProduct(
  promotions: Record<string, ProductPromotion[]>,
  productId: string
): ProductPromotion[] {
  const result: ProductPromotion[] = []

  // Check for promotions targeting this specific product
  if (promotions[productId]) {
    result.push(...promotions[productId])
  }

  // Check for promotions that apply to all products
  if (promotions["__all__"]) {
    result.push(...promotions["__all__"])
  }

  return result
}

/**
 * Get promotions that apply to a specific variant
 */
export function getPromotionsForVariant(
  promotions: Record<string, ProductPromotion[]>,
  productId: string,
  variantId?: string,
  sku?: string
): ProductPromotion[] {
  const result: ProductPromotion[] = []

  // Add product-level promotions
  result.push(...getPromotionsForProduct(promotions, productId))

  // Check for variant-specific promotions
  if (variantId && promotions[`variant:${variantId}`]) {
    result.push(...promotions[`variant:${variantId}`])
  }

  // Check for SKU-specific promotions
  if (sku && promotions[`sku:${sku}`]) {
    result.push(...promotions[`sku:${sku}`])
  }

  // Deduplicate by promotion_id
  const seen = new Set<string>()
  return result.filter((p) => {
    if (seen.has(p.promotion_id)) return false
    seen.add(p.promotion_id)
    return true
  })
}

/**
 * Calculate discounted price based on promotion
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  promotion: ProductPromotion,
  currencyCode: string
): number {
  if (promotion.type === "percentage") {
    return originalPrice * (1 - promotion.value / 100)
  }

  if (promotion.type === "fixed") {
    // Fixed discounts should match currency
    if (promotion.currency_code?.toLowerCase() === currencyCode.toLowerCase()) {
      return Math.max(0, originalPrice - promotion.value)
    }
  }

  return originalPrice
}

/**
 * Get the best promotion for a product (highest discount)
 */
export function getBestPromotion(
  promotions: ProductPromotion[],
  originalPrice: number,
  currencyCode: string
): ProductPromotion | null {
  if (promotions.length === 0) return null

  let bestPromo: ProductPromotion | null = null
  let bestDiscount = 0

  for (const promo of promotions) {
    const discountedPrice = calculateDiscountedPrice(originalPrice, promo, currencyCode)
    const discount = originalPrice - discountedPrice

    if (discount > bestDiscount) {
      bestDiscount = discount
      bestPromo = promo
    }
  }

  return bestPromo
}
