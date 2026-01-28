import ProductCard from "@/components/product-card"
import { useProducts } from "@/lib/hooks/use-products"
import { usePromotions } from "@/lib/hooks/use-promotions"
import { useLoaderData } from "@tanstack/react-router"

const Store = () => {
  const { region } = useLoaderData({ from: "/$countryCode/store" })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useProducts({
    region_id: region.id,
    query_params: { limit: 12 },
  })

  const { data: promotionsData } = usePromotions()

  const products = data?.pages.flatMap((page) => page.products) || []

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
            className="text-xs tracking-[0.4em] uppercase mb-2 block"
            style={{ 
              fontFamily: "var(--font-sans)",
              color: "var(--color-void-muted)"
            }}
          >
            Collection
          </span>
          <h1 
            className="text-5xl md:text-6xl tracking-wider"
            style={{ 
              fontFamily: "var(--font-display)",
              color: "var(--color-void-white)"
            }}
          >
            ALL PRODUCTS
          </h1>
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
              className="mt-4 text-sm tracking-wider"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              LOADING...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div 
            className="text-center py-20"
            style={{ color: "var(--color-void-muted)" }}
          >
            <p 
              className="text-lg tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NO PRODUCTS FOUND
            </p>
            <p 
              className="mt-2 text-sm"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Check back soon for new drops.
            </p>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
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
                  className="btn-secondary"
                  style={{
                    opacity: isFetchingNextPage ? 0.5 : 1,
                    cursor: isFetchingNextPage ? "wait" : "pointer"
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
