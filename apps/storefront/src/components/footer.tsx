import CountrySelect from "@/components/country-select"
import { useCategories } from "@/lib/hooks/use-categories"
import { useRegions } from "@/lib/hooks/use-regions"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { Link, useLocation } from "@tanstack/react-router"

const Footer = () => {
  const location = useLocation();
  const countryCode = getCountryCodeFromPath(location.pathname);
  const baseHref = countryCode ? `/${countryCode}` : "";

  const { data: categories } = useCategories({
    fields: "name,handle",
    queryParams: {
      parent_category_id: "null",
      limit: 3,
    },
  });

  const { data: regions } = useRegions({
    fields: "id, currency_code, *countries",
  });

  return (
    <footer
      className="w-full border-t"
      style={{ 
        backgroundColor: "var(--color-void-dark)", 
        borderColor: "var(--color-void-mid)" 
      }}
      data-testid="footer"
    >
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-12 lg:flex-row items-start justify-between py-16">
          <div className="lg:w-1/3 flex flex-col gap-y-6">
            <Link
              to={baseHref || "/"}
              className="flex flex-col items-start group w-fit"
            >
              <span 
                className="text-2xl tracking-[0.3em] transition-all group-hover:tracking-[0.4em]"
                style={{ 
                  fontFamily: "var(--font-display)",
                  color: "var(--color-void-white)"
                }}
              >
                VOID
              </span>
              <span 
                className="text-[0.5rem] tracking-[0.5em] -mt-1"
                style={{ 
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-void-muted)"
                }}
              >
                STATIC
              </span>
            </Link>
            <p 
              className="max-w-md text-sm leading-relaxed"
              style={{ 
                color: "var(--color-void-text)",
                fontFamily: "var(--font-sans)"
              }}
            >
              Streetwear for the digital age. Born from concrete and code.
            </p>
            <CountrySelect regions={regions ?? []} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-16">
            {categories && categories.length > 0 ? (
              <FooterColumn
                title="Shop"
                links={[
                  { name: "All Products", url: `${baseHref}/store`, isExternal: false },
                  ...categories.map((category) => ({
                    name: category.name,
                    url: `${baseHref}/categories/${category.handle}`,
                    isExternal: false,
                  })),
                ]}
              />
            ) : (
              <FooterColumn
                title="Shop"
                links={[
                  { name: "All Products", url: `${baseHref}/store`, isExternal: false },
                ]}
              />
            )}
            <FooterColumn
              title="Info"
              links={[
                { name: "About", url: "#", isExternal: false },
                { name: "Contact", url: "#", isExternal: false },
                { name: "Shipping", url: "#", isExternal: false },
              ]}
            />
          </div>
        </div>
        <div 
          className="border-t py-6"
          style={{ borderColor: "var(--color-void-mid)" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span 
              className="text-xs tracking-wider"
              style={{ 
                color: "var(--color-void-muted)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {new Date().getFullYear()} VOID STATIC. ALL RIGHTS RESERVED.
            </span>
            <div className="flex gap-6">
              <Link
                className="text-xs tracking-wider transition-colors"
                to={"/"}
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-muted)"}
              >
                PRIVACY
              </Link>
              <Link
                className="text-xs tracking-wider transition-colors"
                to={"/"}
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-muted)"}
              >
                TERMS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: {
    name: string;
    url: string;
    isExternal: boolean;
  }[];
}) => {
  return (
    <div className="flex flex-col gap-y-4">
      <h3 
        className="text-xs uppercase tracking-[0.3em]"
        style={{ 
          color: "var(--color-void-muted)",
          fontFamily: "var(--font-sans)"
        }}
      >
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.url}>
            {link.isExternal ? (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm uppercase tracking-wider transition-colors"
                style={{ 
                  color: "var(--color-void-text)",
                  fontFamily: "var(--font-display)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-text)"}
              >
                {link.name}
              </a>
            ) : (
              <Link
                to={link.url}
                className="text-sm uppercase tracking-wider transition-colors"
                style={{ 
                  color: "var(--color-void-text)",
                  fontFamily: "var(--font-display)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-void-white)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-void-text)"}
              >
                {link.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Footer;
