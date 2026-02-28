import {
  CartLineItem,
  CartSummary,
  CartEmpty,
  CartPromo,
} from "@/components/cart"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { useCart, useCreateCart } from "@/lib/hooks/use-cart"
import { sortCartItems } from "@/lib/utils/cart"
import { Link, useLoaderData } from "@tanstack/react-router"

const DEFAULT_CART_FIELDS =
  "id, *items, total, currency_code, subtotal, shipping_total, discount_total, tax_total, *promotions";

const Cart = () => {
  const { region, countryCode } = useLoaderData({
    from: "/$countryCode/cart",
  }) as any;
  const { data: cart, isLoading: cartLoading } = useCart({
    fields: DEFAULT_CART_FIELDS,
  });
  const createCartMutation = useCreateCart();

  if (!cart && !cartLoading && !createCartMutation.isPending) {
    createCartMutation.mutate({ region_id: region.id });
  }

  const cartItems = sortCartItems(cart?.items || []);

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-void-black)" }}
    >
      {/* Header */}
      <div 
        className="py-12 border-b"
        style={{ 
          backgroundColor: "var(--color-void-dark)",
          borderColor: "var(--color-void-mid)"
        }}
      >
        <div className="content-container flex items-center justify-between">
          <h1 
            className="text-4xl md:text-5xl tracking-wider font-bold"
            style={{ 
              fontFamily: "var(--font-display)",
              color: "var(--color-void-white)"
            }}
          >
            YOUR CART
          </h1>
          {cartItems.length > 0 && (
            <Link
              to={`/${countryCode}/store` as any}
              className="text-base font-bold uppercase tracking-wider transition-colors"
              style={{ 
                fontFamily: "var(--font-sans)",
                color: "var(--color-void-muted)"
              }}
              onMouseEnter={(e: any) => e.currentTarget.style.color = "var(--color-void-white)"}
              onMouseLeave={(e: any) => e.currentTarget.style.color = "var(--color-void-muted)"}
            >
              Continue Shopping
            </Link>
          )}
        </div>
      </div>

      <div className="content-container py-12">
        {cartLoading ? (
          <Loading />
        ) : cartItems.length === 0 ? (
          <CartEmpty />
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Cart Items */}
            <div className="w-full lg:w-2/3">
              {cartItems.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  cart={cart!}
                  fields={DEFAULT_CART_FIELDS}
                />
              ))}
            </div>

            {/* Cart Summary Sidebar */}
            {cart && (
              <div 
                className="w-full lg:w-1/3 p-6 h-fit"
                style={{ 
                  backgroundColor: "var(--color-void-dark)",
                  border: "1px solid var(--color-void-mid)"
                }}
              >
                <h2 
                  className="text-2xl font-bold mb-6"
                  style={{ 
                    fontFamily: "var(--font-display)",
                    color: "var(--color-void-white)"
                  }}
                >
                  ORDER SUMMARY
                </h2>

                <CartSummary cart={cart} />

                <div className="mt-6">
                  <CartPromo cart={cart} />
                </div>

                <Link to={`/${countryCode}/checkout` as any} className="block mt-6">
                  <button
                    className="w-full py-3 text-base font-bold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: "var(--color-void-white)",
                      color: "var(--color-void-black)",
                      fontFamily: "var(--font-sans)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-promo)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-void-white)"
                    }}
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
