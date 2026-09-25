"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  Pencil,
  Power,
  PowerOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Product, Reservation, Guest, Room, SaleItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { productFormSchema } from "@/lib/validations"

type ProductCategory = "desayunos" | "snacks" | "bebidas"
type PaymentMethod = "efectivo" | "tarjeta" | "cargo_habitacion"

const categories: ProductCategory[] = ["desayunos", "snacks", "bebidas"]

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  desayunos: <Coffee className="size-4" />,
  snacks: <Cookie className="size-4" />,
  bebidas: <Wine className="size-4" />,
}

interface CartItem {
  product: Product
  quantity: number
}

export function PosView() {
  const { user } = useAuth()
  const [productsData, setProductsData] = useState<Product[]>([])
  const [reservationsData, setReservationsData] = useState<Reservation[]>([])
  const [guestsData, setGuestsData] = useState<Guest[]>([])
  const [roomsData, setRoomsData] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState("pos")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [charging, setCharging] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, r, g, rm] = await Promise.all([
        api.products.get(),
        api.reservations.get(),
        api.guests.get(),
        api.rooms.get(),
      ])
      setProductsData(p)
      setReservationsData(r)
      setGuestsData(g)
      setRoomsData(rm)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el TPV")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const guestById = useMemo(() => new Map(guestsData.map((g) => [g.id, g])), [guestsData])
  const roomById = useMemo(() => new Map(roomsData.map((r) => [r.id, r])), [roomsData])

  const activeCheckins = useMemo(() => {
    return reservationsData
      .filter((r) => r.status === "checkin")
      .map((r) => ({
        reservation: r,
        guest: guestById.get(r.guestId),
        room: roomById.get(r.roomId),
      }))
  }, [reservationsData, guestById, roomById])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  function addToCart(product: Product) {
    if (product.currentStock <= 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.currentStock) return prev
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

  function handleProductDeleted(id: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }

  async function handleCharge() {
    if (cart.length === 0) return
    setCharging(true)
    setActionError(null)
    try {
      const items: SaleItem[] = cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.price,
      }))
      await api.sales.create({
        items,
        paymentMethod: paymentMethod as PaymentMethod,
        roomId: paymentMethod === "cargo_habitacion" ? selectedRoom : undefined,
      })
      clearCart()
      fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al cobrar")
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">TPV Catering</h1>
        <p className="text-muted-foreground text-sm">Punto de venta e inventario</p>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" />
            Reintentar
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pos">Punto de Venta</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          {loading ? (
            <Card className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </div>
                <Skeleton className="w-[320px] h-96" />
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <ProductGrid products={productsData} cart={cart} onAdd={addToCart} />
              <CartSidebar
                cart={cart}
                cartTotal={cartTotal}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                activeCheckins={activeCheckins}
                charging={charging}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onCharge={handleCharge}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <InventoryTable
            products={productsData}
            isAdmin={user?.role === "admin"}
            onChanged={fetchData}
            onError={setActionError}
            onProductDeleted={handleProductDeleted}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Product Grid ----------

function ProductGrid({
  products,
  cart,
  onAdd,
}: {
  products: Product[]
  cart: CartItem[]
  onAdd: (product: Product) => void
}) {
  const activeProducts = products.filter((p) => p.active)
  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => {
        const categoryProducts = activeProducts.filter((p) => p.category === category)
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
                    } ${isLowStock ? "border-destructive/50" : ""} ${
                      product.currentStock <= 0 ? "opacity-50 pointer-events-none" : ""
                    }`}
                    onClick={() => onAdd(product)}
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
  )
}

// ---------- Cart Sidebar ----------

type ActiveCheckin = {
  reservation: Reservation
  guest: Guest | undefined
  room: Room | undefined
}

function CartSidebar({
  cart,
  cartTotal,
  paymentMethod,
  setPaymentMethod,
  selectedRoom,
  setSelectedRoom,
  activeCheckins,
  charging,
  onUpdateQuantity,
  onRemove,
  onCharge,
}: {
  cart: CartItem[]
  cartTotal: number
  paymentMethod: PaymentMethod | ""
  setPaymentMethod: (m: PaymentMethod | "") => void
  selectedRoom: string
  setSelectedRoom: (r: string) => void
  activeCheckins: ActiveCheckin[]
  charging: boolean
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onCharge: () => void
}) {
  const canCharge = !!paymentMethod && (paymentMethod !== "cargo_habitacion" || !!selectedRoom)

  return (
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
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      disabled={item.quantity >= item.product.currentStock}
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => onRemove(item.product.id)}
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
                  disabled={!canCharge || charging}
                  onClick={onCharge}
                >
                  {charging ? "Cobrando..." : `Cobrar ${formatCurrency(cartTotal)}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Inventory Table ----------

type SortKey = "name" | "price" | "currentStock" | "minStock"

function SortableHead({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: "asc" | "desc"
  onSort: (key: SortKey) => void
  className?: string
}) {
  const activeSort = current === sortKey
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground"
      >
        {label}
        {activeSort ? (
          dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  )
}

function InventoryTable({
  products,
  isAdmin,
  onChanged,
  onError,
  onProductDeleted,
}: {
  products: Product[]
  isAdmin: boolean
  onChanged: () => void
  onError: (msg: string | null) => void
  onProductDeleted?: (id: string) => void
}) {
  const [stockMap, setStockMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.currentStock]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; product: Product } | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setStockMap(Object.fromEntries(products.map((p) => [p.id, p.currentStock])))
  }, [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false
      if (!q) return true
      const stock = stockMap[p.id] ?? p.currentStock
      const estado = !p.active
        ? "inactivo"
        : stock < p.minStock
          ? "stock bajo"
          : "ok"
      const haystack = [p.name, p.category, String(p.price), String(stock), String(p.minStock), estado]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })

    const dir = sortDir === "asc" ? 1 : -1
    return rows.slice().sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir
        case "price":
          return (a.price - b.price) * dir
        case "currentStock":
          return ((stockMap[a.id] ?? a.currentStock) - (stockMap[b.id] ?? b.currentStock)) * dir
        case "minStock":
          return (a.minStock - b.minStock) * dir
        default:
          return 0
      }
    })
  }, [products, query, stockMap, sortKey, sortDir, categoryFilter])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  async function handleSave(id: string, value: number) {
    setSaving(id)
    onError(null)
    try {
      await api.products.updateStock(id, value)
      toast.success("Stock actualizado")
      onChanged()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al actualizar stock")
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeletingLoading(true)
    setDeleteError(null)
    try {
      await api.products.remove(deleting.id)
      toast.success("Producto eliminado")
      setDeleting(null)
      onChanged()
      onProductDeleted?.(deleting.id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar el producto")
    } finally {
      setDeletingLoading(false)
    }
  }

  async function handleToggleActive(product: Product) {
    setToggling(product.id)
    onError(null)
    try {
      const updated = await api.products.update(product.id, { active: !product.active })
      toast.success(updated.active ? "Producto activado" : "Producto desactivado")
      onChanged()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al cambiar el estado del producto")
    } finally {
      setToggling(null)
    }
  }

  const colSpan = isAdmin ? 7 : 6

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="size-4" />
            Inventario de Productos
            <Badge variant="secondary" className="text-xs">{visible.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto, categoria, stock..."
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as ProductCategory | "all")}
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
                <Plus className="mr-1 size-4" />
                Nuevo Producto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Producto" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <TableHead>Categoria</TableHead>
                  <SortableHead label="Precio" sortKey="price" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHead label="Stock Actual" sortKey="currentStock" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHead label="Stock Minimo" sortKey="minStock" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                      {products.length === 0
                        ? "No hay productos en el inventario. Crea el primero con el boton Nuevo Producto."
                        : "No hay productos que coincidan con la busqueda o el filtro."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((product) => {
                    const stockVal = stockMap[product.id] ?? product.currentStock
                    const stockInvalid = Number.isNaN(stockVal) || !Number.isInteger(stockVal) || stockVal < 0
                    const stockDirty = stockVal !== product.currentStock
                    const isLow = !stockInvalid && stockVal < product.minStock
                    return (
                      <TableRow key={product.id} className={!product.active ? "opacity-60" : undefined}>
                        <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={Number.isNaN(stockVal) ? "" : stockVal}
                              onChange={(e) => {
                                const raw = e.target.value
                                const n = raw === "" ? Number.NaN : Number(raw)
                                setStockMap((prev) => ({ ...prev, [product.id]: n }))
                              }}
                              className={`w-20 h-8 text-sm ${stockInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                              aria-invalid={stockInvalid}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={saving === product.id || stockInvalid || !stockDirty}
                              onClick={() => handleSave(product.id, stockVal)}
                            >
                              {saving === product.id ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <Check className="size-4" />
                              )}
                              <span className="sr-only">Guardar stock</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{product.minStock}</TableCell>
                        <TableCell>
                          {!product.active ? (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Inactivo</Badge>
                          ) : isLow ? (
                            <Badge variant="destructive" className="text-xs">Stock bajo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">OK</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                disabled={toggling === product.id}
                                onClick={() => handleToggleActive(product)}
                                title={product.active ? "Desactivar producto" : "Activar producto"}
                              >
                                {toggling === product.id ? (
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : product.active ? (
                                  <PowerOff className="size-4" />
                                ) : (
                                  <Power className="size-4 text-primary" />
                                )}
                                <span className="sr-only">{product.active ? "Desactivar" : "Activar"}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setDialog({ mode: "edit", product })}
                              >
                                <Pencil className="size-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteError(null)
                                  setDeleting(product)
                                }}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProductFormDialog
        mode={dialog?.mode === "edit" ? "edit" : "create"}
        product={dialog?.mode === "edit" ? dialog.product : null}
        open={dialog !== null}
        onOpenChange={(open) => { if (!open) setDialog(null) }}
        onSaved={onChanged}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => { if (!open && !deletingLoading) setDeleting(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar "{deleting?.name}" del inventario? Esta accion no se puede deshacer.
              Si el producto tiene historial de ventas, tendras que desactivarlo en su lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingLoading}
            >
              {deletingLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------- Product Form Dialog ----------

function ProductFormDialog({
  mode,
  product,
  open,
  onOpenChange,
  onSaved,
}: {
  mode: "create" | "edit"
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: "",
    category: "desayunos" as ProductCategory,
    price: "",
    currentStock: "0",
    minStock: "0",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (mode === "edit" && product) {
      setForm({
        name: product.name,
        category: product.category,
        price: String(product.price),
        currentStock: String(product.currentStock),
        minStock: String(product.minStock),
      })
    } else {
      setForm({ name: "", category: "desayunos", price: "", currentStock: "0", minStock: "0" })
    }
  }, [open, mode, product])

  const isEdit = mode === "edit"

  async function handleSubmit() {
    const parsed = productFormSchema.safeParse(form)
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message
      setError(first ? first : "Revisa los campos del formulario")
      return
    }
    const data = parsed.data
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: data.name,
        category: data.category,
        price: Number(data.price),
        currentStock: Number(data.currentStock),
        minStock: Number(data.minStock),
      }
      if (isEdit && product) {
        await api.products.update(product.id, body)
        toast.success("Producto actualizado")
      } else {
        await api.products.create(body)
        toast.success("Producto creado")
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Actualiza los datos de ${product?.name}` : "Añade un producto al inventario de catering"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Tostadas con mermelada"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-category">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as ProductCategory })}
              >
                <SelectTrigger id="product-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Precio</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-stock">Stock actual</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-minstock">Stock minimo</Label>
              <Input
                id="product-minstock"
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (isEdit ? "Guardando..." : "Creando...") : isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}