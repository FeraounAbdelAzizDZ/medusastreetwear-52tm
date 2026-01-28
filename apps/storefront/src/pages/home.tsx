import { Link, useLocation } from "@tanstack/react-router"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { useLatestProducts } from "@/lib/hooks/use-products"
import { usePromotions } from "@/lib/hooks/use-promotions"
import { useLoaderData } from "@tanstack/react-router"
import ProductCard from "@/components/product-card"

const Home = () => {
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const storeHref = countryCode ? `/${countryCode}/store` : "/store"

  // Get region from loader
  const { region } = useLoaderData({ from: "/$countryCode" }) as any

  // Fetch latest products and promotions
  const { data: latestProductsData } = useLatestProducts({ 
    limit: 4, 
    region_id: region?.id 
  })
  const { data: promotionsData } = usePromotions()

  return (
    <div style={{ backgroundColor: "var(--color-void-black)" }}>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(var(--color-void-white) 1px, transparent 1px),
                linear-gradient(90deg, var(--color-void-white) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px"
            }}
          />
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 0%, var(--color-void-black) 70%)`
            }}
          />
        </div>

        {/* Main Content */}
        <div className="content-container relative z-10 text-center">
          {/* Small Tag */}
          <div 
            className="inline-block mb-8 px-4 py-2 border"
            style={{ 
              borderColor: "var(--color-void-mid)",
              color: "var(--color-void-muted)"
            }}
          >
            <span 
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Winter Collection 2025
            </span>
          </div>

          {/* Main Title */}
          <h1 
            className="text-[12vw] md:text-[10vw] lg:text-[8vw] leading-[0.85] tracking-wider mb-6"
            style={{ 
              fontFamily: "var(--font-display)",
              color: "var(--color-void-white)"
            }}
          >
            VOID
            <br />
            <span style={{ color: "var(--color-void-muted)" }}>STATIC</span>
          </h1>

          {/* Subtitle */}
          <p 
            className="text-sm md:text-base max-w-md mx-auto mb-12 leading-relaxed"
            style={{ 
              fontFamily: "var(--font-sans)",
              color: "var(--color-void-text)"
            }}
          >
            Streetwear born from digital noise. Where concrete meets code.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={storeHref as string}
              className="btn-primary inline-block"
            >
              SHOP NOW
            </Link>
            <Link 
              to={storeHref as string}
              className="btn-secondary inline-block"
            >
              EXPLORE
            </Link>
          </div>

          {/* Promo Banner */}
          <div 
            className="mt-16 inline-flex items-center gap-4 px-6 py-3"
            style={{ backgroundColor: "var(--color-void-dark)" }}
          >
            <span 
              className="text-xs tracking-[0.3em] uppercase"
              style={{ 
                fontFamily: "var(--font-sans)",
                color: "var(--color-promo)"
              }}
            >
              WINTER20
            </span>
            <span 
              className="text-xs"
              style={{ 
                fontFamily: "var(--font-sans)",
                color: "var(--color-void-muted)"
              }}
            >
              /
            </span>
            <span 
              className="text-xs tracking-wider"
              style={{ 
                fontFamily: "var(--font-sans)",
                color: "var(--color-void-text)"
              }}
            >
              20% OFF SELECT ITEMS
            </span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span 
            className="text-[0.6rem] tracking-[0.4em] uppercase"
            style={{ 
              fontFamily: "var(--font-sans)",
              color: "var(--color-void-muted)"
            }}
          >
            Scroll
          </span>
          <div 
            className="w-px h-12 animate-pulse"
            style={{ backgroundColor: "var(--color-void-mid)" }}
          />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24" style={{ backgroundColor: "var(--color-void-dark)" }}>
        <div className="content-container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span 
                className="text-xs tracking-[0.4em] uppercase mb-2 block"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-muted)"
                }}
              >
                New Arrivals
              </span>
              <h2 
                className="text-4xl md:text-5xl tracking-wider"
                style={{ 
                  fontFamily: "var(--font-display)",
                  color: "var(--color-void-white)"
                }}
              >
                LATEST DROPS
              </h2>
            </div>
            <Link 
              to={storeHref as string}
              className="text-sm uppercase tracking-[0.2em] transition-colors group flex items-center gap-2"
              style={{ 
                fontFamily: "var(--font-sans)",
                color: "var(--color-void-text)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-text)"}
            >
              View All
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none"
                className="transition-transform group-hover:translate-x-1"
              >
                <path 
                  d="M3 8H13M13 8L8 3M13 8L8 13" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Product Grid */}
          {latestProductsData?.products && latestProductsData.products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {latestProductsData.products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  promotions={promotionsData?.promotions}
                />
              ))}
            </div>
          ) : (
            <div 
              className="text-center py-20"
              style={{ color: "var(--color-void-muted)" }}
            >
              <p 
                className="text-lg tracking-wider"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PRODUCTS COMING SOON
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-24">
        <div className="content-container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span 
                className="text-xs tracking-[0.4em] uppercase mb-4 block"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-muted)"
                }}
              >
                The Brand
              </span>
              <h2 
                className="text-4xl md:text-6xl tracking-wider mb-8"
                style={{ 
                  fontFamily: "var(--font-display)",
                  color: "var(--color-void-white)"
                }}
              >
                BORN FROM
                <br />
                <span style={{ color: "var(--color-accent)" }}>DIGITAL NOISE</span>
              </h2>
              <p 
                className="text-sm leading-relaxed mb-6"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-text)"
                }}
              >
                VOID STATIC exists in the space between signal and noise. 
                We craft garments for those who walk the line between the physical 
                and digital worlds. Every piece is a statement against conformity.
              </p>
              <p 
                className="text-sm leading-relaxed"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-text)"
                }}
              >
                Our aesthetic draws from urban architecture, glitch art, and 
                the raw energy of underground culture. This is streetwear for 
                the next generation.
              </p>
            </div>
            <div 
              className="aspect-square relative"
              style={{ backgroundColor: "var(--color-void-gray)" }}
            >
              {/* Abstract pattern instead of image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="text-[20vw] md:text-[10vw] opacity-5 select-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  VS
                </div>
              </div>
              <div 
                className="absolute inset-4 border"
                style={{ borderColor: "var(--color-void-mid)" }}
              />
              <div 
                className="absolute top-8 left-8 w-16 h-16 border"
                style={{ borderColor: "var(--color-accent)", opacity: 0.5 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-32"
        style={{ 
          backgroundColor: "var(--color-void-dark)",
          borderTop: "1px solid var(--color-void-mid)"
        }}
      >
        <div className="content-container text-center">
          <h2 
            className="text-5xl md:text-7xl tracking-wider mb-8"
            style={{ 
              fontFamily: "var(--font-display)",
              color: "var(--color-void-white)"
            }}
          >
            ENTER THE VOID
          </h2>
          <Link 
            to={storeHref as string}
            className="btn-primary inline-block"
          >
            SHOP COLLECTION
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
