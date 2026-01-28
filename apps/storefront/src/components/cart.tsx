import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { Thumbnail } from "@/components/ui/thumbnail"
import {
  useCart,
  useDeleteLineItem,
  useUpdateLineItem,
  useApplyPromoCode,
  useRemovePromoCode,
} from "@/lib/hooks/use-cart"
import { usePromotions } from "@/lib/hooks/use-promotions"
import { 
  getPromotionsForProduct, 
  getBestPromotion,
  calculateDiscountedPrice 
} from "@/lib/data/promotions"
import { sortCartItems } from "@/lib/utils/cart"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { formatPrice } from "@/lib/utils/price"
import { useCartDrawer } from "@/lib/context/cart"
import { Minus, Plus, Trash, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Link, useLocation } from "@tanstack/react-router"
import { clsx } from "clsx"
import { useState } from "react"


type CartDeleteItemProps = {
  item: HttpTypes.StoreCartLineItem
  fields?: string
}

export const CartDeleteItem = ({ item, fields }: CartDeleteItemProps) => {
  const deleteLineItemMutation = useDeleteLineItem({ fields })
  return (
    <Button
      onClick={() => deleteLineItemMutation.mutate({ line_id: item.id })}
      disabled={deleteLineItemMutation.isPending}
      className="hover:opacity-70 transition-opacity ml-2"
      style={{ color: "var(--color-void-muted)" }}
      variant="transparent"
      size="fit"
    >
      <Trash />
    </Button>
  )
}


type CartItemQuantitySelectorProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "default" | "compact"
  fields?: string
}

export const CartItemQuantitySelector = ({
  item,
  type = "default",
  fields,
}: CartItemQuantitySelectorProps) => {
  const updateLineItemMutation = useUpdateLineItem({ fields })
  const deleteLineItemMutation = useDeleteLineItem({ fields })

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      deleteLineItemMutation.mutate({ line_id: item.id })
    } else {
      updateLineItemMutation.mutate({
        line_id: item.id,
        quantity: newQuantity,
      })
    }
  }

  return (
    <div 
      className="flex items-center border"
      style={{ borderColor: "var(--color-void-mid)" }}
    >
      <Button
        onClick={() => handleQuantityChange(item.quantity - 1)}
        className="p-2"
        style={{ color: "var(--color-void-white)" }}
        variant="transparent"
        size="fit"
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span
        className="text-sm font-bold text-center px-3"
        style={{ 
          color: "var(--color-void-white)",
          fontFamily: "var(--font-sans)"
        }}
      >
        {item.quantity}
      </span>
      <Button
        onClick={() => handleQuantityChange(item.quantity + 1)}
        className="p-2"
        style={{ color: "var(--color-void-white)" }}
        variant="transparent"
        size="fit"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  )
}


interface CartLineItemWithPromoProps {
  item: HttpTypes.StoreCartLineItem
  cart: HttpTypes.StoreCart
  type?: "default" | "compact" | "display"
  fields?: string
  className?: string
}

export const CartLineItemWithPromo = ({
  item,
  cart,
  type = "default",
  fields,
  className,
}: CartLineItemWithPromoProps) => {
  const { data: promotionsData } = usePromotions()
  
  // Get product ID from the line item
  const productId = item.product_id
  
  // Get the original unit price
  const unitPrice = item.unit_price || 0
  const currencyCode = cart.currency_code
  
  // Check for promotions
  const productPromos = productId ? getPromotionsForProduct(promotionsData?.promotions || {}, productId) : []
  const bestPromo = getBestPromotion(productPromos, unitPrice, currencyCode)
  
  // Calculate discounted price
  const discountedUnitPrice = bestPromo 
    ? calculateDiscountedPrice(unitPrice, bestPromo, currencyCode)
    : null
  
  const hasPromo = discountedUnitPrice !== null && discountedUnitPrice < unitPrice
  
  // Calculate totals
  const originalTotal = unitPrice * item.quantity
  const discountedTotal = hasPromo ? discountedUnitPrice * item.quantity : originalTotal

  if (type === "compact") {
    return (
      <div 
        className={clsx("flex items-start gap-x-4 py-4 border-b", className)} 
        style={{ borderColor: "var(--color-void-mid)" }}
        data-testid="cart-item"
      >
        <div 
          className="flex-shrink-0 w-20 h-20 overflow-hidden"
          style={{ backgroundColor: "var(--color-void-gray)" }}
        >
          <Thumbnail 
            thumbnail={item.thumbnail} 
            alt={item.product_title || item.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 
                className="text-base font-bold line-clamp-1"
                style={{ 
                  color: "var(--color-void-white)",
                  fontFamily: "var(--font-display)"
                }}
              >
                {item.product_title}
              </h4>
              {item.variant_title && item.variant_title !== "Default Variant" && (
                <p 
                  className="text-sm mt-1"
                  style={{ 
                    color: "var(--color-void-muted)",
                    fontFamily: "var(--font-sans)"
                  }}
                >
                  {item.variant_title}
                </p>
              )}
              
              {/* Promo Badge */}
              {hasPromo && bestPromo && (
                <div className="flex items-center gap-2 mt-2">
                  <span 
                    className="text-xs font-bold px-2 py-0.5"
                    style={{ 
                      backgroundColor: "var(--color-promo)",
                      color: "var(--color-void-black)",
                      fontFamily: "var(--font-sans)"
                    }}
                  >
                    {bestPromo.code} -{bestPromo.value}%
                  </span>
                </div>
              )}
            </div>
            <CartDeleteItem item={item} fields={fields} />
          </div>

          <div className="flex items-center justify-between mt-3">
            <CartItemQuantitySelector item={item} type="compact" fields={fields} />
            
            <div className="text-right">
              {hasPromo ? (
                <div className="flex flex-col items-end">
                  <span 
                    className="text-sm font-bold line-through"
                    style={{ 
                      color: "var(--color-void-muted)",
                      fontFamily: "var(--font-sans)"
                    }}
                  >
                    {formatPrice({ amount: originalTotal, currency_code: currencyCode })}
                  </span>
                  <span 
                    className="text-base font-bold"
                    style={{ 
                      color: "var(--color-promo)",
                      fontFamily: "var(--font-sans)"
                    }}
                  >
                    {formatPrice({ amount: discountedTotal, currency_code: currencyCode })}
                  </span>
                </div>
              ) : (
                <span 
                  className="text-base font-bold"
                  style={{ 
                    color: "var(--color-void-white)",
                    fontFamily: "var(--font-sans)"
                  }}
                >
                  {formatPrice({ amount: originalTotal, currency_code: currencyCode })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === "display") {
    return (
      <div
        className={clsx(
          "flex items-center gap-4 py-4 border-b",
          className
        )}
        style={{ borderColor: "var(--color-void-mid)" }}
      >
        <div 
          className="flex-shrink-0 w-16 h-16 overflow-hidden"
          style={{ backgroundColor: "var(--color-void-gray)" }}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            alt={item.product_title || item.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p 
            className="text-base font-bold"
            style={{ 
              color: "var(--color-void-white)",
              fontFamily: "var(--font-display)"
            }}
          >
            {item.product_title}
          </p>
          {item.variant_title && item.variant_title !== "Default Variant" && (
            <p 
              className="text-sm"
              style={{ 
                color: "var(--color-void-muted)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {item.variant_title}
            </p>
          )}
          <p 
            className="text-sm"
            style={{ 
              color: "var(--color-void-muted)",
              fontFamily: "var(--font-sans)"
            }}
          >
            Qty: {item.quantity}
          </p>
          {hasPromo && bestPromo && (
            <span 
              className="inline-block text-xs font-bold px-2 py-0.5 mt-1"
              style={{ 
                backgroundColor: "var(--color-promo)",
                color: "var(--color-void-black)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {bestPromo.code} -{bestPromo.value}%
            </span>
          )}
        </div>
        <div className="text-right">
          {hasPromo ? (
            <div className="flex flex-col items-end">
              <span 
                className="text-sm font-bold line-through"
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: originalTotal, currency_code: currencyCode })}
              </span>
              <span 
                className="text-base font-bold"
                style={{ 
                  color: "var(--color-promo)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: discountedTotal, currency_code: currencyCode })}
              </span>
            </div>
          ) : (
            <span 
              className="text-base font-bold"
              style={{ 
                color: "var(--color-void-white)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {formatPrice({ amount: originalTotal, currency_code: currencyCode })}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Default type
  return (
    <div 
      className="flex items-center gap-6 py-4 border-b"
      style={{ borderColor: "var(--color-void-mid)" }}
    >
      <div 
        className="flex-shrink-0 w-24 h-24 overflow-hidden"
        style={{ backgroundColor: "var(--color-void-gray)" }}
      >
        <Thumbnail 
          thumbnail={item.thumbnail} 
          alt={item.product_title || item.title}
          className="w-full h-full object-cover" 
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-y-1">
        <span 
          className="text-lg font-bold"
          style={{ 
            color: "var(--color-void-white)",
            fontFamily: "var(--font-display)"
          }}
        >
          {item.product_title}
        </span>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <span 
            className="text-sm"
            style={{ 
              color: "var(--color-void-muted)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {item.variant_title}
          </span>
        )}
        {hasPromo && bestPromo && (
          <span 
            className="inline-block text-xs font-bold px-2 py-0.5 mt-1 w-fit"
            style={{ 
              backgroundColor: "var(--color-promo)",
              color: "var(--color-void-black)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {bestPromo.code} -{bestPromo.value}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <CartItemQuantitySelector item={item} fields={fields} />

        <div className="text-right min-w-[100px]">
          {hasPromo ? (
            <div className="flex flex-col items-end">
              <span 
                className="text-sm font-bold line-through"
                style={{ 
                  color: "var(--color-void-muted)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: originalTotal, currency_code: currencyCode })}
              </span>
              <span 
                className="text-lg font-bold"
                style={{ 
                  color: "var(--color-promo)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                {formatPrice({ amount: discountedTotal, currency_code: currencyCode })}
              </span>
            </div>
          ) : (
            <span 
              className="text-lg font-bold"
              style={{ 
                color: "var(--color-void-white)",
                fontFamily: "var(--font-sans)"
              }}
            >
              {formatPrice({ amount: originalTotal, currency_code: currencyCode })}
            </span>
          )}
        </div>

        <CartDeleteItem item={item} fields={fields} />
      </div>
    </div>
  )
}

// Keep original CartLineItem for backward compatibility
interface CartLineItemProps {
  item: HttpTypes.StoreCartLineItem
  cart: HttpTypes.StoreCart
  type?: "default" | "compact" | "display"
  fields?: string
  className?: string
}

export const CartLineItem = (props: CartLineItemProps) => {
  return <CartLineItemWithPromo {...props} />
}


interface CartSummaryProps {
  cart: HttpTypes.StoreCart
}

export const CartSummary = ({ cart }: CartSummaryProps) => {
  if ("isOptimistic" in cart && cart.isOptimistic) {
    return <Loading />
  }
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between text-base">
          <span 
            className="font-bold"
            style={{ 
              color: "var(--color-void-muted)",
              fontFamily: "var(--font-sans)"
            }}
          >
            Subtotal
          </span>
          <span 
            className="font-bold"
            style={{ 
              color: "var(--color-void-white)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {formatPrice({ amount: cart.subtotal || 0, currency_code: cart.currency_code })}
          </span>
        </div>

        <div className="flex justify-between text-base">
          <span 
            className="font-bold"
            style={{ 
              color: "var(--color-void-muted)",
              fontFamily: "var(--font-sans)"
            }}
          >
            Shipping
          </span>
          <span 
            className="font-bold"
            style={{ 
              color: "var(--color-void-white)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {formatPrice({ amount: cart.shipping_total || 0, currency_code: cart.currency_code })}
          </span>
        </div>

        {(cart.discount_total || 0) > 0 && (
          <div className="flex justify-between text-base">
            <span 
              className="font-bold"
              style={{ 
                color: "var(--color-void-muted)",
                fontFamily: "var(--font-sans)"
              }}
            >
              Discount
            </span>
            <span 
              className="font-bold"
              style={{ 
                color: "var(--color-promo)",
                fontFamily: "var(--font-sans)"
              }}
            >
              -{formatPrice({ amount: cart.discount_total || 0, currency_code: cart.currency_code })}
            </span>
          </div>
        )}

        <div className="flex justify-between text-base">
          <span 
            className="font-bold"
            style={{ 
              color: "var(--color-void-muted)",
              fontFamily: "var(--font-sans)"
            }}
          >
            Tax
          </span>
          <span 
            className="font-bold"
            style={{ 
              color: "var(--color-void-white)",
              fontFamily: "var(--font-sans)"
            }}
          >
            {formatPrice({ amount: cart.tax_total || 0, currency_code: cart.currency_code })}
          </span>
        </div>
      </div>

      <hr style={{ borderColor: "var(--color-void-mid)" }} />

      <div className="flex justify-between text-lg">
        <span 
          className="font-bold"
          style={{ 
            color: "var(--color-void-white)",
            fontFamily: "var(--font-display)"
          }}
        >
          TOTAL
        </span>
        <span 
          className="font-bold"
          style={{ 
            color: "var(--color-void-white)",
            fontFamily: "var(--font-sans)"
          }}
        >
          {formatPrice({ amount: cart.total || 0, currency_code: cart.currency_code })}
        </span>
      </div>
    </div>
  )
}


type CartPromoProps = {
  cart: HttpTypes.StoreCart
}

export const CartPromo = ({ cart }: CartPromoProps) => {
  const [showInput, setShowInput] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const applyPromoCodeMutation = useApplyPromoCode()
  const removePromoCodeMutation = useRemovePromoCode()

  const handleRemove = (code: string) => {
    removePromoCodeMutation.mutate(
      { code },
      {
        onSuccess: () => {
          console.log("Promo code removed successfully")
        },
        onError: (error) => {
          console.error("Failed to remove promo code:", error)
        },
      }
    )
  }

  const handleApply = () => {
    applyPromoCodeMutation.mutate(
      { code: promoCode },
      {
        onSuccess: () => {
          setShowInput(false)
          setPromoCode("")
        },
        onError: () => {
          console.error("Failed to apply promo code")
        },
      }
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cart.promotions && cart.promotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cart.promotions.map((promotion, index) => (
            <Button 
              key={promotion.code || `promo-${index}`} 
              variant="secondary" 
              size="fit"
              style={{
                backgroundColor: "var(--color-void-mid)",
                color: "var(--color-promo)",
                borderColor: "var(--color-promo)"
              }}
            >
              {promotion.code}
              <XMark
                onClick={() => handleRemove(promotion.code || "")}
                className="ml-2 cursor-pointer hover:opacity-70"
              />
            </Button>
          ))}
        </div>
      )}

      {!showInput && (
        <Button
          onClick={() => setShowInput(true)}
          variant="transparent"
          className="underline hover:opacity-70 p-0"
          style={{ color: "var(--color-void-muted)" }}
          size="fit"
        >
          Add promo code
        </Button>
      )}

      {showInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter promo code"
            name="promoCode"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            style={{
              backgroundColor: "var(--color-void-dark)",
              borderColor: "var(--color-void-mid)",
              color: "var(--color-void-white)"
            }}
          />
          <Button 
            onClick={handleApply} 
            variant="primary" 
            size="fit"
            style={{
              backgroundColor: "var(--color-void-white)",
              color: "var(--color-void-black)"
            }}
          >
            Apply
          </Button>
          <Button 
            onClick={() => setShowInput(false)} 
            variant="secondary" 
            size="fit"
            style={{
              backgroundColor: "var(--color-void-mid)",
              color: "var(--color-void-white)"
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}


export const CartEmpty = () => {
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)

  return (
    <div 
      className="text-center py-16 flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--color-void-black)" }}
    >
      <h2 
        className="text-2xl font-bold"
        style={{ 
          color: "var(--color-void-white)",
          fontFamily: "var(--font-display)"
        }}
      >
        YOUR CART IS EMPTY
      </h2>
      <p 
        className="text-base font-bold"
        style={{ 
          color: "var(--color-void-muted)",
          fontFamily: "var(--font-sans)"
        }}
      >
        Start by adding some products
      </p>
      <Link to={`/${countryCode}/store` as any}>
        <Button 
          variant="primary" 
          size="fit"
          style={{
            backgroundColor: "var(--color-void-white)",
            color: "var(--color-void-black)"
          }}
        >
          Continue shopping
        </Button>
      </Link>
    </div>
  )
}


export const DEFAULT_CART_DROPDOWN_FIELDS = "id, *items, total, currency_code, item_subtotal"

export const CartDropdown = () => {
  const { isOpen, openCart, closeCart } = useCartDrawer()
  const { data: cart } = useCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const baseHref = countryCode ? `/${countryCode}` : ""

  const sortedItems = sortCartItems(cart?.items || [])
  const itemCount = sortedItems?.reduce((total, item) => total + item.quantity, 0) || 0

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <DrawerTrigger asChild>
        <button 
          className="font-bold hover:opacity-70 transition-opacity h-full"
          style={{ 
            color: "var(--color-void-white)",
            fontFamily: "var(--font-sans)"
          }}
        >
          CART ({itemCount})
        </button>
      </DrawerTrigger>

      <DrawerContent 
        className="flex flex-col"
        style={{ 
          backgroundColor: "var(--color-void-dark)",
          borderColor: "var(--color-void-mid)"
        }}
      >
        <DrawerHeader>
          <DrawerTitle 
            className="text-xl font-bold"
            style={{ 
              color: "var(--color-void-white)",
              fontFamily: "var(--font-display)"
            }}
          >
            SHOPPING CART
          </DrawerTitle>
        </DrawerHeader>

        {/* Empty Cart */}
        {(!cart || itemCount === 0) && (
          <div className="flex flex-col items-center justify-center flex-1 p-6">
            <span 
              className="text-base font-bold mb-4"
              style={{ 
                color: "var(--color-void-muted)",
                fontFamily: "var(--font-sans)"
              }}
            >
              Your cart is empty
            </span>
            <Link to={`${baseHref}/store` as any} onClick={closeCart}>
              <Button 
                variant="secondary" 
                size="fit"
                style={{
                  backgroundColor: "var(--color-void-mid)",
                  color: "var(--color-void-white)"
                }}
              >
                Explore products
              </Button>
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {cart && itemCount > 0 && (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {sortedItems?.map((item) => (
                <CartLineItemWithPromo
                  key={item.id}
                  item={item}
                  cart={cart}
                  type="compact"
                  fields={DEFAULT_CART_DROPDOWN_FIELDS}
                />
              ))}
            </div>

            <DrawerFooter style={{ borderTopColor: "var(--color-void-mid)" }}>
              <div className="flex items-center justify-between mb-4">
                <span 
                  className="text-base font-bold"
                  style={{ 
                    color: "var(--color-void-muted)",
                    fontFamily: "var(--font-sans)"
                  }}
                >
                  Subtotal
                </span>
                <span 
                  className="text-lg font-bold"
                  style={{ 
                    color: "var(--color-void-white)",
                    fontFamily: "var(--font-sans)"
                  }}
                >
                  {formatPrice({ amount: cart.item_subtotal || 0, currency_code: cart.currency_code })}
                </span>
              </div>

              <Link to={`${baseHref}/cart` as any} onClick={closeCart}>
                <Button 
                  className="w-full py-3 text-base font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--color-void-white)",
                    color: "var(--color-void-black)",
                    fontFamily: "var(--font-sans)"
                  }}
                >
                  Go to cart
                </Button>
              </Link>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// Default export for backwards compatibility
export default CartLineItem
