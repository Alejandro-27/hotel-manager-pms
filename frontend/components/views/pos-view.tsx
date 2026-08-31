"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  BedDouble,
  Coffee,
  Cookie,
  Wine,
  Package,
} from "lucide-react"
import {
  products,
  reservations,
  getGuestById,
  getRoomById,
  type Product,
} from "@/lib/store"
import { formatCurrency } from "@/lib/utils"

interface CartItem {
  product: Product
  quantity: number
}

const categoryIcons: Record<string, React.ReactNode> = {
  desayunos: <Coffee className="size-4" />,
  snacks: <Cookie className="size-4" />,
  bebidas: <Wine className="size-4" />,
}

export function PosView() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState("pos")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [selectedRoom, setSelectedRoom] = useState<string>("")

  const activeCheckins = useMemo(() => {
    return reservations
      .filter((r) => r.status === "checkin")
      .map((r) => ({
        reservation: r,
        guest: getGuestById(r.guestId),
        room: getRoomById(r.roomId),
      }))
  }, [])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function clearCart() {
    setCart([])
    setPaymentMethod("")
    setSelectedRoom("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">TPV Catering</h1>
        <p className="text-muted-foreground text-sm">Punto de venta e inventario</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pos">Punto de Venta</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Product Grid */}
            <div className="flex flex-col gap-4">
              {(["desayunos", "snacks", "bebidas"] as const).map((category) => {
                const categoryProducts = products.filter((p) => p.category === category)
                const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      {categoryIcons[category]}
                      <h3 className="text-sm font-semibold text-foreground">{categoryLabel}</h3>
                      <Badge variant="secondary" className="text-xs">{categoryProducts.length}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {categoryProducts.map((product) => {
                        const isLowStock = product.currentStock < product.minStock
                        const inCart = cart.find((i) => i.product.id === product.id)
                        return (
                          <Card
                            key={product.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              inCart ? "ring-2 ring-primary" : ""
                            } ${isLowStock ? "border-destructive/50" : ""}`}
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-medium text-foreground leading-tight">{product.name}</h4>
                                {inCart && (
                                  <Badge className="text-[10px] shrink-0 ml-1">{inCart.quantity}</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary">
                                  {formatCurrency(product.price)}
                                </span>
                                {isLowStock && (
                                  <Badge variant="destructive" className="text-[9px]">
                                    Stock bajo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Stock: {product.currentStock}
                              </p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cart Sidebar */}
            <div className="lg:sticky lg:top-4 h-fit">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <ShoppingCart className="size-4" />
                    Carrito
                    {cart.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{cart.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      Selecciona productos para agregar al carrito
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.product.price)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, -1) }}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, 1) }}
                            >
                              <Plus className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id) }}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Total</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(cartTotal)}
                        </span>
                      </div>

                      <Separator />

                      {/* Payment */}
                      <div className="grid gap-3">
                        <Label className="text-xs text-muted-foreground">Metodo de pago</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={paymentMethod === "efectivo" ? "default" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            onClick={() => { setPaymentMethod("efectivo"); setSelectedRoom("") }}
                          >
                            <Banknote className="size-4" />
                            <span className="text-[10px]">Efectivo</span>
                          </Button>
                          <Button
                            variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            onClick={() => { setPaymentMethod("tarjeta"); setSelectedRoom("") }}
                          >
                            <CreditCard className="size-4" />
                            <span className="text-[10px]">Tarjeta</span>
                          </Button>
                          <Button
                            variant={paymentMethod === "cargo_habitacion" ? "default" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            onClick={() => setPaymentMethod("cargo_habitacion")}
                          >
                            <BedDouble className="size-4" />
                            <span className="text-[10px]">Habitacion</span>
                          </Button>
                        </div>

                        {paymentMethod === "cargo_habitacion" && (
                          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar habitacion" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeCheckins.map((ci) => (
                                <SelectItem key={ci.reservation.id} value={ci.room?.id ?? ""}>
                                  Hab. {ci.room?.number} - {ci.guest?.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <Button
                          className="w-full"
                          disabled={!paymentMethod || (paymentMethod === "cargo_habitacion" && !selectedRoom)}
                          onClick={clearCart}
                        >
                          Cobrar {formatCurrency(cartTotal)}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Package className="size-4" />
                Inventario de Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Minimo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const isLow = product.currentStock < product.minStock
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              defaultValue={product.currentStock}
                              className="w-20 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{product.minStock}</TableCell>
                          <TableCell>
                            {isLow ? (
                              <Badge variant="destructive" className="text-xs">Stock bajo</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
