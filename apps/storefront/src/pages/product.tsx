import ProductActionsWithPromo from "@/components/product-actions-promo"
import { ImageGallery } from "@/components/ui/image-gallery"
import { usePromotions } from "@/lib/hooks/use-promotions"
import { useLoaderData } from "@tanstack/react-router"

const ProductDetails = () => {
  const { product, region } = useLoaderData({
    from: "/$countryCode/products/$handle",
  })

  const { data: promotionsData } = usePromotions()

  return (
    <div style={{ backgroundColor: "var(--color-void-black)" }}>
      <div className="content-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image gallery */}
          <div>
            <ImageGallery images={product.images || []} />
          </div>

          {/* Right: Product info + variant selection */}
          <div className="flex flex-col">
            {/* Category/Tag */}
            <span 
              className="text-xs tracking-[0.4em] uppercase mb-4"
              style={{ 
                fontFamily: "var(--font-sans)",
                color: "var(--color-void-muted)"
              }}
            >
              {product.collection?.title || "VOID STATIC"}
            </span>

            {/* Title */}
            <h1 
              className="text-4xl md:text-5xl tracking-wider mb-6"
              style={{ 
                fontFamily: "var(--font-display)",
                color: "var(--color-void-white)"
              }}
            >
              {product.title}
            </h1>

            {/* Description */}
            {product.description && (
              <p 
                className="text-sm leading-relaxed mb-8"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-text)"
                }}
              >
                {product.description}
              </p>
            )}

            {/* Product Actions with Promotion */}
            <ProductActionsWithPromo 
              product={product} 
              region={region}
              promotions={promotionsData?.promotions || {}}
            />

            {/* Additional Info */}
            <div 
              className="mt-12 pt-8 border-t"
              style={{ borderColor: "var(--color-void-mid)" }}
            >
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span 
                    className="text-xs tracking-[0.3em] uppercase block mb-2"
                    style={{ 
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-void-muted)"
                    }}
                  >
                    Material
                  </span>
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-void-text)"
                    }}
                  >
                    {product.material || "100% Premium Cotton"}
                  </span>
                </div>
                <div>
                  <span 
                    className="text-xs tracking-[0.3em] uppercase block mb-2"
                    style={{ 
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-void-muted)"
                    }}
                  >
                    Care
                  </span>
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-void-text)"
                    }}
                  >
                    Machine wash cold
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
