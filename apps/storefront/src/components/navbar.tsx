import { CartDropdown } from "@/components/cart"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useCategories } from "@/lib/hooks/use-categories"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { Link, useLocation } from "@tanstack/react-router"

export const Navbar = () => {
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const baseHref = countryCode ? `/${countryCode}` : ""

  const { data: topLevelCategories } = useCategories({
    fields: "id,name,handle,parent_category_id",
    queryParams: { parent_category_id: "null" },
  })

  const categoryLinks = [
    { id: "shop-all", name: "Shop All", to: `${baseHref}/store` },
    ...(topLevelCategories?.map((cat) => ({
      id: cat.id,
      name: cat.name,
      to: `${baseHref}/categories/${cat.handle}`,
    })) ?? []),
  ]

  return (
    <div className="sticky top-0 inset-x-0 z-40">
      <header 
        className="relative h-20 mx-auto border-b"
        style={{ 
          backgroundColor: "var(--color-void-black)", 
          borderColor: "var(--color-void-mid)" 
        }}
      >
        <nav className="content-container flex items-center justify-between w-full h-full">
          {/* Desktop Navigation */}
          <NavigationMenu.Root className="hidden lg:flex items-center h-full">
            <NavigationMenu.List className="flex items-center gap-x-8 h-full">
              {/* Shop dropdown */}
              <NavigationMenu.Item className="h-full flex items-center">
                <NavigationMenu.Trigger 
                  className="h-full flex items-center gap-1 select-none uppercase tracking-[0.2em] text-sm transition-colors"
                  style={{ 
                    color: "var(--color-void-text)",
                    fontFamily: "var(--font-sans)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-text)"}
                >
                  Shop
                  <svg 
                    width="10" 
                    height="6" 
                    viewBox="0 0 10 6" 
                    fill="none" 
                    className="ml-1"
                  >
                    <path 
                      d="M1 1L5 5L9 1" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content 
                  className="content-container py-12"
                  style={{ backgroundColor: "var(--color-void-dark)" }}
                >
                  <div className="grid grid-cols-2 gap-12">
                    <div className="flex flex-col gap-6">
                      <h3 
                        className="text-xs uppercase tracking-[0.3em]"
                        style={{ color: "var(--color-void-muted)" }}
                      >
                        Categories
                      </h3>
                      <div className="flex flex-col gap-4">
                        {categoryLinks.map((link) => (
                          <NavigationMenu.Link key={link.id} asChild>
                            <Link
                              to={link.to}
                              className="text-2xl uppercase tracking-wider transition-all duration-200"
                              style={{ 
                                fontFamily: "var(--font-display)",
                                color: "var(--color-void-white)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "var(--color-accent)"
                                e.currentTarget.style.transform = "translateX(8px)"
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "var(--color-void-white)"
                                e.currentTarget.style.transform = "translateX(0)"
                              }}
                            >
                              {link.name}
                            </Link>
                          </NavigationMenu.Link>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div 
                        className="text-6xl uppercase tracking-widest opacity-10"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        VOID
                      </div>
                    </div>
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>

            <NavigationMenu.Viewport
              className="absolute top-full overflow-hidden border-b shadow-2xl
                data-[state=open]:animate-[dropdown-open_300ms_ease-out]
                data-[state=closed]:animate-[dropdown-close_300ms_ease-out]"
              style={{ 
                left: "50%", 
                transform: "translateX(-50%)", 
                width: "100vw",
                backgroundColor: "var(--color-void-dark)",
                borderColor: "var(--color-void-mid)"
              }}
            />
          </NavigationMenu.Root>

          {/* Mobile Menu */}
          <Drawer>
            <DrawerTrigger 
              className="lg:hidden transition-colors"
              style={{ color: "var(--color-void-text)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-text)"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </DrawerTrigger>
            <DrawerContent 
              side="left"
              style={{ backgroundColor: "var(--color-void-black)" }}
            >
              <DrawerHeader>
                <DrawerTitle 
                  className="uppercase tracking-[0.3em] text-xs"
                  style={{ color: "var(--color-void-muted)" }}
                >
                  Menu
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col py-4">
                <div 
                  className="px-6 py-4 text-lg uppercase tracking-[0.2em]"
                  style={{ 
                    color: "var(--color-void-white)",
                    fontFamily: "var(--font-display)"
                  }}
                >
                  Shop
                </div>
                <div className="flex flex-col">
                  {categoryLinks.map((link) => (
                    <DrawerClose key={link.id} asChild>
                      <Link
                        to={link.to}
                        className="px-10 py-4 uppercase tracking-wider transition-all"
                        style={{ 
                          color: "var(--color-void-text)",
                          fontFamily: "var(--font-display)",
                          fontSize: "1.25rem"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--color-void-dark)"
                          e.currentTarget.style.color = "var(--color-void-white)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.color = "var(--color-void-text)"
                        }}
                      >
                        {link.name}
                      </Link>
                    </DrawerClose>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Logo */}
          <div className="flex items-center h-full absolute left-1/2 transform -translate-x-1/2">
            <Link
              to={baseHref || "/"}
              className="flex flex-col items-center group"
            >
              <span 
                className="text-3xl tracking-[0.3em] transition-all group-hover:tracking-[0.4em]"
                style={{ 
                  fontFamily: "var(--font-display)",
                  color: "var(--color-void-white)"
                }}
              >
                VOID
              </span>
              <span 
                className="text-[0.6rem] tracking-[0.5em] -mt-1 transition-colors"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-muted)"
                }}
              >
                STATIC
              </span>
            </Link>
          </div>

          {/* Cart */}
          <div className="flex items-center gap-x-6 h-full justify-end">
            <CartDropdown />
          </div>
        </nav>
      </header>
    </div>
  )
}
