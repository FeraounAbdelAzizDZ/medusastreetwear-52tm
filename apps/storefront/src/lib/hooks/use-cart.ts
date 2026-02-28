import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { queryKeys } from "@/lib/utils/query-keys"
import { sdk } from "@/lib/utils/sdk"
import {
  getStoredCart,
  setStoredCart,
  addItemOptimistically,
  createOptimisticCartItem,
  getCurrentCart,
  rollbackOptimisticCart,
  updateLineItemOptimistically,
  removeLineItemOptimistically,
  createOptimisticCart,
} from "@/lib/utils/cart"
import { getPromotions, getPromotionsForProduct } from "@/lib/data/promotions"

const DEFAULT_CART_FIELDS = "+items.total, shipping_methods.name"

/**
 * Apply all relevant promo codes to a cart based on the items in it.
 * Fetches active promotions, then applies any codes that match items already in the cart.
 */
async function autoApplyPromotions(cartId: string): Promise<void> {
  try {
    const promoData = await getPromotions()
    if (!promoData?.raw_promotions?.length) return

    // Get current cart items to check which promotions apply
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "+items.product_id",
    })
    if (!cart?.items?.length) return

    // Collect unique promo codes for products in the cart
    const codesToApply = new Set<string>()
    for (const item of cart.items) {
      const productId = item.product_id
      if (!productId) continue
      const promos = getPromotionsForProduct(promoData.promotions, productId)
      for (const promo of promos) {
        codesToApply.add(promo.code)
      }
    }

    if (codesToApply.size === 0) return

    // Check which codes are already applied
    const existingCodes = new Set(
      (cart.promotions || []).map((p: any) => p.code?.toUpperCase())
    )
    const newCodes = Array.from(codesToApply).filter(
      (code) => !existingCodes.has(code.toUpperCase())
    )
    if (newCodes.length === 0) return

    await sdk.client.fetch(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      body: { promo_codes: newCodes },
    })
  } catch (error) {
    // Non-blocking: if promo application fails, the cart still works
    console.error("Auto-apply promotions failed:", error)
  }
}

export const useCart = ({ fields }: { fields?: string } = {}) => {
  return useQuery({
    queryKey: queryKeys.cart.current(fields),
    queryFn: async () => {
      const id = getStoredCart()
      if (!id) return null
      const { cart } = await sdk.store.cart.retrieve(id, {
        fields: fields || DEFAULT_CART_FIELDS,
      })
      return cart
    },
    staleTime: 0
  })
}

export const useUpdateCart = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fields = DEFAULT_CART_FIELDS,
      ...updates
    }: HttpTypes.StoreUpdateCart & { fields?: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.store.cart.update(cartId, updates, { fields })
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    }
  })
}

export const useCreateCart = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      region_id,
      fields = DEFAULT_CART_FIELDS,
    }: {
      region_id: string;
      fields?: string;
    }) => {
      const { cart } = await sdk.store.cart.create({ region_id }, { fields })
      setStoredCart(cart.id)
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}

export const useAddToCart = ({ fields }: { fields?: string } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: {
      variant_id: string;
      quantity: number;
      country_code: string;
      fields?: string;
      product?: HttpTypes.StoreProduct;
      variant?: HttpTypes.StoreProductVariant;
      region?: HttpTypes.StoreRegion;
    }) => {
      const { variant_id, quantity, country_code, fields: requestFields } = variables
      if (!variant_id) throw new Error("Missing variant ID when adding to cart")

      let cartId = getStoredCart()

      if (!cartId) {
        const { regions } = await sdk.store.region.list({})
        const region = regions.find(r =>
          r.countries?.some(c => c.iso_2 === country_code.toLowerCase())
        )
        if (!region) throw new Error(`Region not found for country code: ${country_code}`)
        const { cart } = await sdk.store.cart.create({ region_id: region.id }, {
          fields: requestFields || fields || DEFAULT_CART_FIELDS,
        })
        setStoredCart(cart.id)
        cartId = cart.id
      }

      const response = await sdk.store.cart.createLineItem(
        cartId,
        { variant_id, quantity },
        { fields: requestFields || fields || DEFAULT_CART_FIELDS }
      )

      // Auto-apply promotions for products in the cart
      await autoApplyPromotions(cartId)

      // Re-fetch the cart with updated promotion totals
      const { cart: updatedCart } = await sdk.store.cart.retrieve(cartId, {
        fields: requestFields || fields || DEFAULT_CART_FIELDS,
      })
      return updatedCart
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ predicate: queryKeys.cart.predicate })
      let previousCart = getCurrentCart(queryClient, fields)
      let didCartExist = true

      if (!previousCart && variables.region) {
        previousCart = createOptimisticCart(variables.region)
        didCartExist = false
      }

      if (previousCart && variables.product && variables.variant) {
        const optimisticItem = createOptimisticCartItem(
          variables.variant,
          variables.product,
          variables.quantity
        )
        addItemOptimistically(queryClient, optimisticItem, previousCart, fields)
      }

      return { previousCart: didCartExist ? previousCart : undefined }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        rollbackOptimisticCart(queryClient, context.previousCart, fields)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields && data ? [fields] : undefined)
      })
      if (data) {
        queryClient.setQueryData(queryKeys.cart.current(fields), data)
      }
    },
  })
}

export const useUpdateLineItem = ({ fields }: { fields?: string } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { line_id: string; quantity: number }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.store.cart.updateLineItem(
        cartId,
        variables.line_id,
        { quantity: variables.quantity },
        { fields: fields || DEFAULT_CART_FIELDS }
      )
      return cart
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields ? [fields] : undefined)
      })
      const previousCart = getCurrentCart(queryClient, fields)
      if (previousCart) {
        updateLineItemOptimistically(queryClient, variables.line_id, variables.quantity, fields)
      }
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        rollbackOptimisticCart(queryClient, context.previousCart, fields)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields && data ? [fields] : undefined)
      })
      if (data) {
        queryClient.setQueryData(queryKeys.cart.current(fields), data)
      }
    },
  })
}

export const useDeleteLineItem = ({ fields }: { fields?: string } = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { line_id: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      await sdk.store.cart.deleteLineItem(cartId, variables.line_id)
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields ? [fields] : undefined)
      })
      const previousCart = getCurrentCart(queryClient, fields)
      if (previousCart) {
        removeLineItemOptimistically(queryClient, variables.line_id, fields)
      }
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        rollbackOptimisticCart(queryClient, context.previousCart, fields)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => queryKeys.cart.predicate(query, fields && data ? [fields] : undefined)
      })
      if (data) {
        queryClient.setQueryData(queryKeys.cart.current(fields), data)
      }
    },
  })
}

export const useApplyPromoCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
        `/store/carts/${cartId}/promotions`,
        {
          method: "POST",
          body: { promo_codes: [code] },
        }
      )
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}

export const useRemovePromoCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")
      const { cart } = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
        `/store/carts/${cartId}/promotions`,
        {
          method: "DELETE",
          body: { promo_codes: [code] },
        }
      )
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}
