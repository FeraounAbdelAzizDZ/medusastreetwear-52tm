import { Thumbnail } from "@/components/ui/thumbnail"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { formatPrice } from "@/lib/utils/price"
import { 
  ProductPromotion, 
  getPromotionsForProduct, 
  getBestPromotion,
  calculateDiscountedPrice 
} from "@/lib/data/promotions"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { useCartDrawer } from "@/lib/context/cart"
import { HttpTypes } from "@medusajs/types"
import { Link, useLocation } from "@tanstack/react-router"
import { ShoppingBag } from "@medusajs/icons"
import { useState } from "react"

interface ProductCardProps {
  product: HttpTypes.StoreProduct
  promotions?: Record<string, ProductPromotion[]>
  showAddToCart?: boolean
}

const ProductCard = ({ product, promotions = {}, showAddToCart = true }: ProductCardProps) => {
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const baseHref = countryCode ? `/${countryCode}` : ""
  const [isAdding, setIsAdding] = useState(false)
  const addToCart = useAddToCart()
  const { openCart } = useCartDrawer()

  // Get price from first variant
  const variant = product.variants?.[0] as any
  const calculatedPrice = variant?.calculated_price
  const originalPrice = calculatedPrice?.calculated_amount ?? 0
  const currencyCode = calculatedPrice?.currency_code ?? "usd"

  // Get promotions for this product
  const productPromos = getPromotionsForProduct(promotions, product.id)
  const bestPromo = getBestPromotion(productPromos, originalPrice, currencyCode)

  // Calculate discounted price if promotion exists
  const discountedPrice = bestPromo 
    ? calculateDiscountedPrice(originalPrice, bestPromo, currencyCode)
    : null

  const hasDiscount = discountedPrice !== null && discountedPrice < originalPrice

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!variant?.id) return
    
    setIsAdding(true)
    try {
      await addToCart.mutateAsync({
        variant_id: variant.id,
        quantity: 1,
        country_code: countryCode || "us",
        product,
        variant,
      })
      openCart()
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="group flex flex-col w-full relative">
      {/* Image Container */}
      <Link
        to={`${baseHref}/products/${product.handle}` as any}
        className="block"
      >
        <div 
          className="aspect-[3/4] w-full overflow-hidden relative"
          style={{ backgroundColor: "var(--color-void-gray)" }}
        >
          <Thumbnail
            thumbnail={product.thumbnail}
            alt={product.title}
            className="absolute inset-0 object-cover object-center w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Promo Badge */}
          {hasDiscount && bestPromo && (
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <span 
                className="text-sm font-bold px-3 py-1"
                style={{ 
                  backgroundColor: "var(--color-promo)",
                  color: "var(--color-void-black)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                -{bestPromo.value}%
              </span>
              <span 
                className="text-xs font-bold tracking-wider px-2 py-1"
                style={{ 
                  backgroundColor: "var(--color-void-black)",
                  color: "var(--color-promo)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {bestPromo.code}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-4 flex flex-col gap-2">
        <Link to={`${baseHref}/products/${product.handle}` as any}>
          <h3 
            className="text-lg font-bold uppercase tracking-wide leading-tight"
            style={{ 
              color: "var(--color-void-white)",
              fontFamily: "var(--font-display)"
            }}
          >
            {product.title}
          </h3>
        </Link>
        
        <div className="flex items-center gap-3">
          {hasDiscount ? (
            <>
              <span 
                className="text-base font-bold line-through"
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: originalPrice, currency_code: currencyCode })}
              </span>
              <span 
                className="text-lg font-bold"
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
              className="text-lg font-bold"
              style={{ 
                color: "var(--color-void-white)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {formatPrice({ amount: originalPrice, currency_code: currencyCode })}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {showAddToCart && (
          <div className="flex gap-2 mt-2">
            <Link 
              to={`${baseHref}/products/${product.handle}` as any}
              className="flex-1"
            >
              <button
                className="w-full py-2.5 px-4 text-sm font-bold uppercase tracking-wider border transition-all duration-200"
                style={{ 
                  backgroundColor: "transparent",
                  borderColor: "var(--color-void-light)",
                  color: "var(--color-void-white)",
                  fontFamily: "var(--font-sans)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-void-white)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-void-light)"
                }}
              >
                View
              </button>
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !variant?.id}
              className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold uppercase tracking-wider transition-all duration-200"
              style={{ 
                backgroundColor: "var(--color-void-white)",
                color: "var(--color-void-black)",
                fontFamily: "var(--font-sans)",
                opacity: isAdding ? 0.7 : 1,
                cursor: isAdding ? "wait" : "pointer"
              }}
              onMouseEnter={(e) => {
                if (!isAdding) {
                  e.currentTarget.style.backgroundColor = "var(--color-promo)"
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-void-white)"
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              {isAdding ? "..." : "Add"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard
