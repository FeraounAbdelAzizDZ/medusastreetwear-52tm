import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/promotions
 * 
 * Returns active promotions with their product mappings.
 * This endpoint resolves which promotions apply to which products
 * based on target_rules, without requiring a cart.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Fetch active promotions with their application methods and rules
  const { data: promotions } = await query.graph({
    entity: "promotion",
    fields: [
      "id",
      "code",
      "type",
      "status",
      "application_method.id",
      "application_method.type",
      "application_method.target_type",
      "application_method.allocation",
      "application_method.value",
      "application_method.currency_code",
      "application_method.target_rules.*",
      "application_method.target_rules.values.*",
    ],
    filters: {
      status: "active",
    },
  })

  // Process promotions to create a product -> promotion mapping
  const productPromotions: Record<string, {
    promotion_id: string
    code: string
    type: "percentage" | "fixed"
    value: number
    currency_code?: string
  }[]> = {}

  for (const promotion of promotions) {
    const appMethod = promotion.application_method

    // Only process item-level promotions
    if (!appMethod || appMethod.target_type !== "items") {
      continue
    }

    const promoInfo = {
      promotion_id: promotion.id,
      code: promotion.code || "",
      type: appMethod.type as "percentage" | "fixed",
      value: appMethod.value || 0,
      currency_code: appMethod.currency_code,
    }

    // Check target_rules to find which products this applies to
    const targetRules = appMethod.target_rules || []

    // If no target rules, this promotion applies to ALL products
    if (targetRules.length === 0) {
      // Store under a special key for "all products"
      if (!productPromotions["__all__"]) {
        productPromotions["__all__"] = []
      }
      productPromotions["__all__"].push(promoInfo)
      continue
    }

    // Process each target rule
    for (const rule of targetRules) {
      const attribute = rule.attribute
      const ruleValues = rule.values || []

      // Extract actual values from the values objects
      const extractedValues: string[] = ruleValues.map((v: any) => 
        typeof v === "string" ? v : v.value
      ).filter(Boolean)

      // Handle product_id rules (various attribute formats)
      if (
        attribute === "product_id" || 
        attribute === "product.id" ||
        attribute === "items.product.id" ||
        attribute === "items.product_id"
      ) {
        for (const productId of extractedValues) {
          if (!productPromotions[productId]) {
            productPromotions[productId] = []
          }
          // Avoid duplicates
          if (!productPromotions[productId].some(p => p.promotion_id === promoInfo.promotion_id)) {
            productPromotions[productId].push(promoInfo)
          }
        }
      }

      // Handle variant_id rules
      if (
        attribute === "variant_id" || 
        attribute === "product_variant.id" ||
        attribute === "items.variant.id" ||
        attribute === "items.variant_id"
      ) {
        for (const variantId of extractedValues) {
          const key = `variant:${variantId}`
          if (!productPromotions[key]) {
            productPromotions[key] = []
          }
          if (!productPromotions[key].some(p => p.promotion_id === promoInfo.promotion_id)) {
            productPromotions[key].push(promoInfo)
          }
        }
      }

      // Handle SKU rules
      if (
        attribute === "sku" || 
        attribute === "product_variant.sku" ||
        attribute === "items.variant.sku"
      ) {
        for (const sku of extractedValues) {
          const key = `sku:${sku}`
          if (!productPromotions[key]) {
            productPromotions[key] = []
          }
          if (!productPromotions[key].some(p => p.promotion_id === promoInfo.promotion_id)) {
            productPromotions[key].push(promoInfo)
          }
        }
      }
    }
  }

  return res.json({
    promotions: productPromotions,
    raw_promotions: promotions.map((p: any) => ({
      id: p.id,
      code: p.code,
      type: p.application_method?.type,
      value: p.application_method?.value,
      target_type: p.application_method?.target_type,
      target_rules: p.application_method?.target_rules?.map((r: any) => ({
        attribute: r.attribute,
        operator: r.operator,
        values: r.values?.map((v: any) => typeof v === "string" ? v : v.value),
      })),
    })),
  })
}
