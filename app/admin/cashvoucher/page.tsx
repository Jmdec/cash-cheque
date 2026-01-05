"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createRoot } from "react-dom/client"
import { Eye, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Ban, AlertTriangle, Plus, MoreVertical, Edit, Search, X, Download } from "lucide-react"
import LoadingWrapper from "@/components/loading-wrapper"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { OTPDialog } from "@/components/ui/otp-dialog"
import { Input } from "@/components/ui/input"
import { CashVoucher as VoucherCashPreview, VoucherPreview } from "@/components/voucher-preview"
import domtoimage from "dom-to-image"
import React from "react"

interface CashVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  total_amount: number
  check_no: string
  account_name: string
  account_number: string
  bank_amount: number
  status: string
}

interface PaginatedResponse {
  data: CashVoucher[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  })
}

export default function CashVoucherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vouchers, setVouchers] = useState<CashVoucher[]>([])
  const [pagination, setPagination] = useState<Omit<PaginatedResponse, "data"> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<CashVoucher | null>(null)
  const [selectedExportVoucher, setSelectedExportVoucher] = useState<VoucherCashPreview | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState("") // Renamed for consistency
  const [isExporting, setIsExporting] = useState(false)
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})
  const previewRef = React.createRef<HTMLDivElement>()
  const adminEmail = "decastrojustin321@gmail.com"

  const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

  const fetchVouchers = async (page = 1, search = "") => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cash-vouchers?page=${page}&per_page=10&search=${encodeURIComponent(search)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch cash vouchers")
      }
      const data: PaginatedResponse = await response.json()
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid data format: Expected paginated response with data array")
      }
      setVouchers(data.data)
      setPagination({
        current_page: data.current_page,
        per_page: data.per_page,
        total: data.total,
        last_page: data.last_page,
        from: data.from,
        to: data.to,
      })
      // Do NOT set currentPage from API response here, it's managed by client state
    } catch (error: any) {
      console.error("Error fetching cash vouchers:", error)
      toast({
        title: "Error",
        description: `Failed to load vouchers: ${error.message || "An unexpected error occurred."}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVouchers(currentPage, globalSearchQuery)
    }, 300) // 300ms debounce for search
    return () => {
      clearTimeout(handler)
    }
  }, [currentPage, globalSearchQuery]) // Depend on currentPage and globalSearchQuery

  const handleView = (id: string) => {
    router.push(`/admin/cashvoucher/view/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/cashvoucher/edit/${id}`)
  }

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/cash-vouchers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to cancel cash voucher")
      }
      toast({
        title: "Success",
        description: "Cash voucher has been cancelled successfully.",
        variant: "default",
      })
      fetchVouchers(currentPage, globalSearchQuery) // Re-fetch with current page and search
    } catch (error: any) {
      console.error("Error cancelling cash voucher:", error)
      toast({
        title: "Error",
        description: `Failed to cancel voucher: ${error.message || "An unexpected error occurred."}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = async (voucher: CashVoucher) => {
    setSelectedVoucher(voucher)
    try {
      const response = await fetch("/api/send-delete-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucher_id: voucher.id,
          voucher_type: "cash",
          voucher_no: voucher.voucher_no,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send OTP")
      }
      const result = await response.json()
      setShowOTPDialog(true)
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${result.email}`,
        duration: 5000,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error sending OTP:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      })
    }
  }

  // fetch single voucher for export
  const fetchSelectedVoucher = async (id: string) => {
    try {
      const response = await fetch(`/api/cash-vouchers/${id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch cash voucher")
      }

      const data: VoucherCashPreview = await response.json()
      setSelectedExportVoucher(data) // must match interface
    } catch (err: any) {
      console.error("Error fetching selected voucher:", err)
      toast({
        title: "Error",
        description: `Failed to load cash voucher: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  const getSignatureUrl = (relativePath: string | null) => {
    if (!relativePath) {
      return "/placeholder.svg?height=60&width=120&text=No+Signature"
    }

    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      if (LARAVEL_API_URL) {
        return `/api/proxy-image?url=${encodeURIComponent(relativePath)}`
      } else {
        return "/placeholder.svg?height=60&width=120&text=No+API+URL"
      }
    }

    if (relativePath.startsWith("/signatures/")) {
      if (!LARAVEL_API_URL) {
        return "/placeholder.svg?height=60&width=120&text=No+API+URL"
      }
      let baseUrl = LARAVEL_API_URL.replace(/\/+$/, "")
      if (baseUrl.endsWith("/api")) {
        baseUrl = baseUrl.slice(0, -4)
      }
      const fullLaravelUrl = `${baseUrl}${relativePath}`
      return `/api/proxy-image?url=${encodeURIComponent(fullLaravelUrl)}`
    }

    return "/placeholder.svg?height=60&width=120&text=Invalid+Path"
  }

  // Helper function to format date consistently for preview to avoid hydration issues
  const formatDateForPreview = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "" // Handle invalid date strings
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  // Handle image load errors
  const handleImageError = (imageKey: string) => {
    setImageErrors((prev) => ({ ...prev, [imageKey]: true }))
  }

  // Handle export voucher to png
  const exportVoucher = async (voucher: CashVoucher) => {
    fetchSelectedVoucher(voucher.id)
    try {
      setIsExporting(true)

      const container = document.getElementById("voucher-export-container")!
      container.innerHTML = ""
      const div = document.createElement("div")
      container.appendChild(div)

      const previewRef = React.createRef<HTMLDivElement>()

      // Render voucher preview
      const root = createRoot(div)
      root.render(
        <VoucherPreview
          ref={previewRef}
          voucher={selectedExportVoucher!}
          getSignatureUrl={getSignatureUrl}
          handleImageError={handleImageError}
          formatDate={formatDate}
          formatDateForPreview={formatDateForPreview}
        />,
      )

      // Wait for React to render & images to load
      await new Promise<void>((res) => requestAnimationFrame(() => res()))
      const node = previewRef.current
      if (!node) throw new Error("Voucher preview failed to render")

      const images = Array.from(node.querySelectorAll("img"))
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res
              }),
        ),
      )

      const originalWidth = node.style.width
      const originalMaxWidth = node.style.maxWidth
      node.style.width = "1800px"
      node.style.maxWidth = "1800px"

      // Export as PNG
      const dataUrl = await (domtoimage as any).toPng(node, {
        bgcolor: "#ffffff",
        width: 1800,
        height: node.offsetHeight,
        style: { backgroundColor: "#ffffff", boxSizing: "border-box" },
      })

      node.style.width = originalWidth
      node.style.maxWidth = originalMaxWidth

      const link = document.createElement("a")
      link.download = `cash-voucher-${voucher.voucher_no || "untitled"}.png`
      link.href = dataUrl
      link.click()

      // Clean up
      root.unmount()
      div.remove()
    } catch (error: any) {
      console.error("Error exporting voucher:", error)
      toast({
        title: "Export Failed",
        description: error.message || "Unable to export voucher.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleOTPVerify = async (otp: string) => {
    if (!selectedVoucher) return
    try {
      const response = await fetch("/api/admin/cash/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucher_id: selectedVoucher.id,
          otp,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete cash voucher")
      }
      toast({
        title: "Success",
        description: `Cash voucher ${selectedVoucher.voucher_no} has been deleted permanently.`,
        duration: 5000,
        variant: "default",
      })
      setShowOTPDialog(false)
      setSelectedVoucher(null)
      fetchVouchers(currentPage, globalSearchQuery) // Re-fetch with current page and search
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete voucher")
    }
  }

  const handleResendOTP = async () => {
    if (!selectedVoucher) return
    const response = await fetch("/api/send-delete-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voucher_id: selectedVoucher.id,
        voucher_type: "cash",
        voucher_no: selectedVoucher.voucher_no,
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to resend OTP")
    }
    const result = await response.json()
    toast({
      title: "OTP Resent",
      description: `New verification code sent to ${result.email}`,
      duration: 5000,
      variant: "success",
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // fetchVouchers(page) // Removed direct call, useEffect will handle it
  }

  const handlePreviousPage = () => {
    if (pagination && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.last_page) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Mobile Card Component with improved responsive design
  const MobileVoucherCard = ({ voucher }: { voucher: CashVoucher }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="font-semibold text-gray-900">{voucher.voucher_no}</div>
          <div className="text-sm text-gray-600">{formatDate(voucher.date)}</div>
        </div>
        <Badge
          variant={voucher.status === "active" ? "default" : voucher.status === "cancelled" ? "destructive" : "secondary"}
          className="capitalize"
        >
          {voucher.status}
        </Badge>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Paid To</div>
          <div className="text-sm font-medium text-gray-900">{voucher.paid_to}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Amount</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(Number.parseFloat(voucher.total_amount.toString()))}
            </div>
          </div>
          {voucher.check_no && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Check No</div>
              <div className="text-sm font-mono font-medium text-gray-900">{voucher.check_no}</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <Button variant="outline" size="sm" onClick={() => handleView(voucher.id)} className="flex-1 min-w-[80px]">
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleEdit(voucher.id)} className="flex-1 min-w-[80px]">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-3 bg-transparent">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCancel(voucher.id)}>
              <Ban className="h-4 w-4 mr-2 text-orange-600" />
              Cancel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteClick(voucher)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const columns: ColumnDef<CashVoucher>[] = [
    {
      accessorKey: "voucher_no",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 h-auto font-semibold text-left justify-start"
          >
            Voucher No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("voucher_no")}</div>,
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 h-auto font-semibold text-left justify-start"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="whitespace-nowrap">{formatDate(row.getValue("date"))}</div>
      },
    },
    {
      accessorKey: "paid_to",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 h-auto font-semibold text-left justify-start"
          >
            Paid To
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="min-w-[120px] max-w-[200px]">
          <div className="truncate" title={row.getValue("paid_to")}>
            {row.getValue("paid_to")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 h-auto font-semibold text-right justify-end w-full"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("total_amount"))
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount)
        return <div className="text-right font-medium whitespace-nowrap">{formatted}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            variant={status === "active" ? "default" : status === "cancelled" ? "destructive" : "secondary"}
            className="capitalize whitespace-nowrap"
          >
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <div className="flex justify-start space-x-1">
            <Button variant="outline" size="sm" onClick={() => handleView(voucher.id)} className="relative group h-8 w-8 p-0">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="sr-only">View</span>
              <span className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">View</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(voucher.id)} className="relative group h-8 w-8 p-0 bg-transparent">
              <Edit className="h-4 w-4 text-green-600" />
              <span className="sr-only">Edit</span>
              <span className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="relative group h-8 w-8 p-0 bg-transparent">
                  <Ban className="h-4 w-4 text-orange-600" />
                  <span className="sr-only">Cancel</span>
                  <span className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">
                    Cancel
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span>Cancel Voucher</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Are you sure you want to cancel voucher <span className="font-semibold text-gray-900 break-all">{voucher.voucher_no}</span>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">No, Keep Active</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleCancel(voucher.id)} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                    Yes, Cancel Voucher
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={() => handleDeleteClick(voucher)} className="relative group h-8 w-8 p-0 bg-transparent">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="sr-only">Delete</span>
              <span className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">Delete</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportVoucher(voucher)} disabled={isExporting} className="relative group h-8 w-8 p-0">
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
              <span className="absolute bottom-full mb-2 w-max hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">
                Export as Image
              </span>
            </Button>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <LoadingWrapper>
        <p>Loading cash vouchers...</p>
      </LoadingWrapper>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }}>
        {/* Hidden VoucherPreview for export */}
        <div id="voucher-export-container" />
        {selectedExportVoucher && (
          <VoucherPreview
            ref={previewRef}
            voucher={selectedExportVoucher!}
            getSignatureUrl={getSignatureUrl}
            handleImageError={handleImageError}
            formatDate={formatDate}
            formatDateForPreview={formatDateForPreview}
          />
        )}
      </div>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Cash Vouchers</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track your cash voucher transactions</p>
          </div>
          <Button onClick={() => router.push("/cash-voucher")} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Cash Voucher
          </Button>
        </div>
        {/* Content */}
        {vouchers.length === 0 && globalSearchQuery === "" ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No cash vouchers</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new cash voucher.</p>
                <Button onClick={() => router.push("/cash-voucher")} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Cash Voucher
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <DataTable
                columns={columns}
                data={vouchers}
                globalFilterValue={globalSearchQuery} // Pass global search value
                onGlobalFilterChange={setGlobalSearchQuery} // Pass global search handler
                searchPlaceholder="Search by payee name, voucher no, or check no..."
                currentPage={currentPage}
                pageCount={pagination?.last_page || 1}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                onPageChange={handlePageChange}
                totalRows={pagination?.total || 0}
                fromRow={pagination?.from || 0}
                toRow={pagination?.to || 0}
              />
            </div>
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {/* Search Bar for Mobile */}
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by payee name, voucher no, or check no..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={globalSearchQuery} // Use globalSearchQuery
                    onChange={(e) => setGlobalSearchQuery(e.target.value)} // Use setGlobalSearchQuery
                  />
                  {globalSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGlobalSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Voucher Cards */}
              <div className="space-y-3">
                {vouchers.length > 0 ? ( // Use 'vouchers' directly, as filtering is now API-side
                  vouchers.map((voucher) => <MobileVoucherCard key={voucher.id} voucher={voucher} />)
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <p className="text-gray-500">{globalSearchQuery ? "No vouchers match your search" : "No cash vouchers available."}</p>
                    {globalSearchQuery && (
                      <Button variant="outline" size="sm" onClick={() => setGlobalSearchQuery("")} className="mt-2">
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Pagination - Responsive for all screen sizes */}
            {pagination && pagination.last_page > 1 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-4 sm:mt-6 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage} // Use handlePreviousPage
                      disabled={currentPage <= 1}
                      className="h-8 sm:h-9 px-2 sm:px-3 bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4 mr-0 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    {/* Responsive pagination numbers */}
                    <div className="hidden xs:flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        // Show pages around current page
                        let pageNum
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    {/* Mobile page indicator */}
                    <div className="xs:hidden text-xs sm:text-sm text-gray-600 px-2">
                      Page {currentPage} / {pagination.last_page}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage} // Use handleNextPage
                      disabled={currentPage >= pagination.last_page}
                      className="h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4 ml-0 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* OTP Dialog */}
        <OTPDialog
          isOpen={showOTPDialog}
          onClose={() => {
            setShowOTPDialog(false)
            setSelectedVoucher(null)
          }}
          onVerify={handleOTPVerify}
          onResendOTP={handleResendOTP}
          voucherNo={selectedVoucher?.voucher_no || ""}
          voucherType="cash"
          email={adminEmail}
        />
      </div>
    </div>
  )
}
