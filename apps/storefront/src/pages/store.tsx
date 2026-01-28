import ProductCard from "@/components/product-card"
import { useProducts } from "@/lib/hooks/use-products"
import { usePromotions } from "@/lib/hooks/use-promotions"
import { 
  getPromotionsForProduct, 
  getBestPromotion,
  calculateDiscountedPrice 
} from "@/lib/data/promotions"
import { useLoaderData } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { ChevronDownMini } from "@medusajs/icons"

type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc"

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
]

const Store = () => {
  const { region } = useLoaderData({ from: "/$countryCode/store" })
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useProducts({
    region_id: region.id,
    query_params: { limit: 12 },
  })

  const { data: promotionsData } = usePromotions()

  const products = data?.pages.flatMap((page) => page.products) || []

  // Helper to get effective price (with promotion applied)
  const getEffectivePrice = (product: HttpTypes.StoreProduct): number => {
    const variant = product.variants?.[0] as any
    const calculatedPrice = variant?.calculated_price
    const originalPrice = calculatedPrice?.calculated_amount ?? 0
    const currencyCode = calculatedPrice?.currency_code ?? "usd"

    const productPromos = getPromotionsForProduct(promotionsData?.promotions || {}, product.id)
    const bestPromo = getBestPromotion(productPromos, originalPrice, currencyCode)

    if (bestPromo) {
      return calculateDiscountedPrice(originalPrice, bestPromo, currencyCode)
    }
    return originalPrice
  }

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...products]
    
    switch (sortBy) {
      case "newest":
        // Sort by created_at descending (newest first)
        sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
        break
      case "price-asc":
        sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b))
        break
      case "price-desc":
        sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a))
        break
      case "name-asc":
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        break
      case "name-desc":
        sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""))
        break
    }
    
    return sorted
  }, [products, sortBy, promotionsData])

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || "Sort"

  return (
    <div style={{ backgroundColor: "var(--color-void-black)" }}>
      {/* Header */}
      <div 
        className="py-16 border-b"
        style={{ 
          backgroundColor: "var(--color-void-dark)",
          borderColor: "var(--color-void-mid)"
        }}
      >
        <div className="content-container">
          <span 
            className="text-sm font-bold tracking-[0.4em] uppercase mb-2 block"
            style={{ 
              fontFamily: "var(--font-sans)",
              color: "var(--color-void-muted)"
            }}
          >
            Collection
          </span>
          <h1 
            className="text-5xl md:text-6xl tracking-wider font-bold"
            style={{ 
              fontFamily: "var(--font-display)",
              color: "var(--color-void-white)"
            }}
          >
            ALL PRODUCTS
          </h1>
        </div>
      </div>

      {/* Toolbar */}
      <div 
        className="border-b"
        style={{ borderColor: "var(--color-void-mid)" }}
      >
        <div className="content-container py-4 flex items-center justify-between">
          <span 
            className="text-base font-bold"
            style={{ 
              color: "var(--color-void-muted)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {sortedProducts.length} Product{sortedProducts.length !== 1 ? "s" : ""}
          </span>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border transition-all"
              style={{ 
                borderColor: "var(--color-void-light)",
                color: "var(--color-void-white)",
                fontFamily: "var(--font-sans)",
                backgroundColor: "var(--color-void-dark)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-void-white)"
              }}
              onMouseLeave={(e) => {
                if (!isDropdownOpen) {
                  e.currentTarget.style.borderColor = "var(--color-void-light)"
                }
              }}
            >
              <span className="text-sm font-bold uppercase tracking-wider">
                {currentSortLabel}
              </span>
              <ChevronDownMini 
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} 
              />
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div 
                  className="absolute right-0 top-full mt-2 z-50 border min-w-[200px]"
                  style={{ 
                    backgroundColor: "var(--color-void-dark)",
                    borderColor: "var(--color-void-mid)"
                  }}
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors"
                      style={{ 
                        color: sortBy === option.value ? "var(--color-promo)" : "var(--color-void-white)",
                        fontFamily: "var(--font-sans)",
                        backgroundColor: sortBy === option.value ? "var(--color-void-mid)" : "transparent"
                      }}
                      onMouseEnter={(e) => {
                        if (sortBy !== option.value) {
                          e.currentTarget.style.backgroundColor = "var(--color-void-gray)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (sortBy !== option.value) {
                          e.currentTarget.style.backgroundColor = "transparent"
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="content-container py-12">
        {isFetching && products.length === 0 ? (
          <div 
            className="text-center py-20"
            style={{ color: "var(--color-void-muted)" }}
          >
            <div 
              className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--color-void-mid)", borderTopColor: "transparent" }}
            />
            <p 
              className="mt-4 text-base font-bold tracking-wider"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              LOADING...
            </p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div 
            className="text-center py-20"
            style={{ color: "var(--color-void-muted)" }}
          >
            <p 
              className="text-2xl font-bold tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NO PRODUCTS FOUND
            </p>
            <p 
              className="mt-2 text-base font-bold"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Check back soon for new drops.
            </p>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sortedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  promotions={promotionsData?.promotions}
                />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 text-base font-bold uppercase tracking-wider border transition-all"
                  style={{
                    borderColor: "var(--color-void-light)",
                    color: "var(--color-void-white)",
                    fontFamily: "var(--font-sans)",
                    backgroundColor: "transparent",
                    opacity: isFetchingNextPage ? 0.5 : 1,
                    cursor: isFetchingNextPage ? "wait" : "pointer"
                  }}
                  onMouseEnter={(e) => {
                    if (!isFetchingNextPage) {
                      e.currentTarget.style.borderColor = "var(--color-void-white)"
                      e.currentTarget.style.backgroundColor = "var(--color-void-white)"
                      e.currentTarget.style.color = "var(--color-void-black)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-void-light)"
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "var(--color-void-white)"
                  }}
                >
                  {isFetchingNextPage ? "LOADING..." : "LOAD MORE"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Store
