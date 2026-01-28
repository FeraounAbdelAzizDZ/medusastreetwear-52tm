import { Thumbnail } from "@/components/ui/thumbnail"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { formatPrice } from "@/lib/utils/price"
import { 
  ProductPromotion, 
  getPromotionsForProduct, 
  getBestPromotion,
  calculateDiscountedPrice 
} from "@/lib/data/promotions"
import { HttpTypes } from "@medusajs/types"
import { Link, useLocation } from "@tanstack/react-router"

interface ProductCardProps {
  product: HttpTypes.StoreProduct
  promotions?: Record<string, ProductPromotion[]>
}

const ProductCard = ({ product, promotions = {} }: ProductCardProps) => {
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const baseHref = countryCode ? `/${countryCode}` : ""

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

  return (
    <Link
      to={`${baseHref}/products/${product.handle}` as any}
      className="group flex flex-col w-full relative"
    >
      {/* Image Container */}
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
              className="promo-badge"
              style={{ 
                backgroundColor: "var(--color-promo)",
                color: "var(--color-void-black)"
              }}
            >
              -{bestPromo.value}%
            </span>
            <span 
              className="text-[0.6rem] font-bold tracking-wider px-2 py-1"
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

        {/* Hover Overlay */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <span 
            className="text-sm uppercase tracking-[0.3em] px-4 py-2 border"
            style={{ 
              color: "var(--color-void-white)",
              borderColor: "var(--color-void-white)",
              fontFamily: "var(--font-display)"
            }}
          >
            View
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-4 flex flex-col gap-1">
        <span 
          className="text-sm uppercase tracking-wider"
          style={{ 
            color: "var(--color-void-white)",
            fontFamily: "var(--font-display)"
          }}
        >
          {product.title}
        </span>
        
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span 
                className="text-sm line-through"
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: originalPrice, currency_code: currencyCode })}
              </span>
              <span 
                className="text-sm font-bold"
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
              className="text-sm"
              style={{ 
                color: "var(--color-void-text)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {formatPrice({ amount: originalPrice, currency_code: currencyCode })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
