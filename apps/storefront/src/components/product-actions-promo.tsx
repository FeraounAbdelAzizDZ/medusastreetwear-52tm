import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import ProductOptionSelect from "@/components/product-option-select"
import { useCartDrawer } from "@/lib/context/cart"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { 
  ProductPromotion, 
  getPromotionsForProduct, 
  getBestPromotion,
  calculateDiscountedPrice 
} from "@/lib/data/promotions"
import { formatPrice } from "@/lib/utils/price"
import { getVariantOptionsKeymap, isVariantInStock } from "@/lib/utils/product"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { useLocation } from "@tanstack/react-router"
import { isEqual } from "lodash-es"
import { useEffect, useMemo, useRef, useState, memo } from "react"

type ProductActionsWithPromoProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  promotions: Record<string, ProductPromotion[]>
  disabled?: boolean
}

const ProductActionsWithPromo = memo(function ProductActionsWithPromo({
  product,
  region,
  promotions,
  disabled,
}: ProductActionsWithPromoProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | undefined>
  >({})
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "us"

  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const { openCart } = useCartDrawer()

  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedOptions({})
  }, [product?.handle])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product?.variants?.length === 1) {
      const optionsKeymap = getVariantOptionsKeymap(
        product?.variants?.[0]?.options ?? []
      )
      setSelectedOptions(optionsKeymap ?? {})
    }
  }, [product?.variants])

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product?.variants.length === 0) {
      return
    }

    // If there's only one variant and no options, select it directly
    if (
      product?.variants.length === 1 &&
      (!product?.options || product?.options.length === 0)
    ) {
      return product?.variants[0]
    }

    const variant = product?.variants.find((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      const matches = isEqual(optionsKeymap, selectedOptions)
      return matches
    })

    return variant
  }, [product?.variants, product?.options, selectedOptions])

  // Get pricing info - use selected variant or first variant for display
  const priceVariant = selectedVariant || product?.variants?.[0]
  const calculatedPrice = (priceVariant as any)?.calculated_price
  const originalPrice = calculatedPrice?.calculated_amount ?? 0
  const currencyCode = calculatedPrice?.currency_code ?? region.currency_code ?? "usd"

  // Get promotions for this product
  const productPromos = getPromotionsForProduct(promotions, product.id)
  const bestPromo = getBestPromotion(productPromos, originalPrice, currencyCode)

  // Calculate discounted price if promotion exists
  const discountedPrice = bestPromo 
    ? calculateDiscountedPrice(originalPrice, bestPromo, currencyCode)
    : null

  const hasDiscount = discountedPrice !== null && discountedPrice < originalPrice

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product?.variants?.some((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      return isEqual(optionsKeymap, selectedOptions)
    })
  }, [product?.variants, selectedOptions])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If no variant is selected, we can't add to cart
    if (!selectedVariant) {
      return false
    }
    return isVariantInStock(selectedVariant)
  }, [selectedVariant])

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    addToCartMutation.mutateAsync(
      {
        variant_id: selectedVariant.id,
        quantity: 1,
        country_code: countryCode,
        product,
        variant: selectedVariant,
        region,
      },
      {
        onSuccess: () => {
          console.log("Item added to cart")
          openCart()
        },
        onError: () => {
          console.error("Failed to add item to cart")
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6" ref={actionsRef}>
      {/* Price Display */}
      <div className="flex flex-col gap-2">
        {/* Promo Badge */}
        {hasDiscount && bestPromo && (
          <div className="flex items-center gap-3 mb-2">
            <span 
              className="px-3 py-1 text-xs font-bold tracking-wider"
              style={{ 
                backgroundColor: "var(--color-promo)",
                color: "var(--color-void-black)",
                fontFamily: "var(--font-sans)"
              }}
            >
              -{bestPromo.value}% OFF
            </span>
            <span 
              className="text-xs tracking-wider"
              style={{ 
                color: "var(--color-promo)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {bestPromo.code}
            </span>
          </div>
        )}

        {/* Prices */}
        <div className="flex items-baseline gap-4">
          {hasDiscount ? (
            <>
              <span 
                className="text-2xl line-through"
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: originalPrice, currency_code: currencyCode })}
              </span>
              <span 
                className="text-3xl font-bold"
                style={{ 
                  color: "var(--color-promo)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: discountedPrice!, currency_code: currencyCode })}
              </span>
            </>
          ) : (
            <span 
              className="text-3xl"
              style={{ 
                color: "var(--color-void-white)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {originalPrice > 0 
                ? formatPrice({ amount: originalPrice, currency_code: currencyCode })
                : "Select options"
              }
            </span>
          )}
        </div>
      </div>

      {/* Variant Options */}
      {(product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4">
          {(product.options || []).map((option) => {
            return (
              <div key={option.id}>
                <ProductOptionSelect
                  option={option}
                  current={selectedOptions[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || addToCartMutation.isPending}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!inStock || !selectedVariant || !!disabled || !isValidVariant}
        className="w-full py-4 text-lg uppercase tracking-[0.2em] transition-all duration-200"
        style={{
          fontFamily: "var(--font-display)",
          backgroundColor: (!inStock || !selectedVariant || !isValidVariant) 
            ? "var(--color-void-mid)" 
            : "var(--color-void-white)",
          color: (!inStock || !selectedVariant || !isValidVariant)
            ? "var(--color-void-muted)"
            : "var(--color-void-black)",
          cursor: (!inStock || !selectedVariant || !isValidVariant) 
            ? "not-allowed" 
            : "pointer",
        }}
        onMouseEnter={(e) => {
          if (inStock && selectedVariant && isValidVariant) {
            e.currentTarget.style.backgroundColor = "var(--color-accent)"
            e.currentTarget.style.color = "var(--color-void-white)"
          }
        }}
        onMouseLeave={(e) => {
          if (inStock && selectedVariant && isValidVariant) {
            e.currentTarget.style.backgroundColor = "var(--color-void-white)"
            e.currentTarget.style.color = "var(--color-void-black)"
          }
        }}
        data-testid="add-product-button"
      >
        {!selectedVariant
          ? "SELECT OPTIONS"
          : !inStock || !isValidVariant
            ? "OUT OF STOCK"
            : "ADD TO CART"}
      </button>

      {/* Shipping Info */}
      <div 
        className="flex items-center gap-2 text-xs"
        style={{ 
          fontFamily: "var(--font-sans)",
          color: "var(--color-void-muted)"
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path 
            d="M1 4L8 8L15 4M1 4V12L8 16M1 4L8 0L15 4M15 4V12L8 16M8 8V16" 
            stroke="currentColor" 
            strokeWidth="1"
          />
        </svg>
        <span className="tracking-wider uppercase">Free shipping on orders over $100</span>
      </div>
    </div>
  )
})

export default ProductActionsWithPromo
