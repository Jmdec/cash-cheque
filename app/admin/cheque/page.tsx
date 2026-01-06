"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, Trash2, ArrowUpDown, Ban, AlertTriangle, Plus, Edit, Download, ChevronLeft, ChevronRight } from "lucide-react"
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
import { OTPDialog } from "@/components/ui/otp-dialog"
import React from "react"
import { ChequeVoucher as VoucherChequePreview, ChequeVoucherPreview } from "@/components/cheque-voucher-preview"
import { createRoot } from "react-dom/client"
import domtoimage from "dom-to-image"

interface ChequeVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  amount: number | null // Allow amount to be null
  purpose: string
  check_no: string
  account_name: string
  account_number: string
  bank_amount: number | null // Allow bank_amount to be null
  received_by_name: string
  approved_by_name: string
  status: string
}

interface PaginatedResponse {
  data: ChequeVoucher[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

// Date formatting utility functions
const formatDate = (dateString: string, format: "short" | "long" | "medium" | "full" = "medium") => {
  const date = new Date(dateString)
  let options: Intl.DateTimeFormatOptions
  switch (format) {
    case "short":
      options = { month: "numeric", day: "numeric", year: "numeric" }
      break
    case "medium":
      options = { month: "short", day: "2-digit", year: "numeric" }
      break
    case "long":
      options = { month: "long", day: "2-digit", year: "numeric" }
      break
    case "full":
      options = {
        weekday: "long",
        month: "long",
        day: "2-digit",
        year: "numeric",
      }
      break
    default:
      options = { month: "short", day: "2-digit", year: "numeric" }
  }
  return new Intl.DateTimeFormat("en-US", options).format(date)
}

// Custom date formatter for "June 04, 1998" format
const formatDateLong = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })
}

export default function ChequeVoucherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vouchers, setVouchers] = useState<ChequeVoucher[]>([])
  const [pagination, setPagination] = useState<Omit<PaginatedResponse, "data"> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<ChequeVoucher | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [cachedPages, setCachedPages] = useState<Record<string, any[]>>({})
  const adminEmail = "decastrojustin321@gmail.com"

  const fetchVouchers = async (page = 1, search = "") => {
    const trimmedSearch = search.trim()
    const cacheKey = `${trimmedSearch}_${page}`

    if (cachedPages[cacheKey]) {
      setVouchers(cachedPages[cacheKey])
      // Always fetch pagination from backend
      try {
        const url = `/api/cheque-vouchers?page=${page}&per_page=10&search=${encodeURIComponent(trimmedSearch)}`
        const response = await fetch(url)
        const data: PaginatedResponse = await response.json()
        setPagination({
          current_page: data.current_page,
          per_page: data.per_page,
          total: data.total,
          last_page: data.last_page,
          from: data.from,
          to: data.to,
        })
      } catch (error) {
        console.error(error)
      }
      return cachedPages[cacheKey]
    }

    try {
      setIsLoading(true)
      const url = `/api/cheque-vouchers?page=${page}&per_page=10&search=${encodeURIComponent(trimmedSearch)}`
      const response = await fetch(url)
      const data: PaginatedResponse = await response.json()

      setVouchers(data.data)
      setPagination({
        current_page: data.current_page,
        per_page: data.per_page,
        total: data.total,
        last_page: data.last_page,
        from: data.from,
        to: data.to,
      })

      setCachedPages((prev) => ({ ...prev, [cacheKey]: data.data }))

      return data.data
    } catch (error) {
      console.error(error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if sessionStorage has saved state
    const savedState = sessionStorage.getItem("chequeVoucherTableState")
    if (savedState) {
      const { currentPage, globalSearchQuery, selectedVoucherId } = JSON.parse(savedState)
      setCurrentPage(currentPage)
      setGlobalSearchQuery(globalSearchQuery)
      // Fetch vouchers and select the previously clicked row
      fetchVouchers(currentPage, globalSearchQuery).then((fetchedVouchers) => {
        const row = fetchedVouchers?.find((v: any) => v.id === selectedVoucherId)
        if (row) setSelectedVoucher(row)
      })

      // Clear sessionStorage after restoring state, so refresh goes back to page 1
      sessionStorage.removeItem("chequeVoucherTableState")
    } else {
      fetchVouchers(1, "") // first page default
    }
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVouchers(currentPage, globalSearchQuery)
    }, 300) // 300ms debounce
    return () => {
      clearTimeout(handler)
    }
  }, [currentPage, globalSearchQuery])

  const saveTableState = () => {
    sessionStorage.setItem(
      "chequeVoucherTableState",
      JSON.stringify({
        currentPage,
        globalSearchQuery,
        selectedVoucherId: selectedVoucher?.id,
      }),
    )
  }

  const handleClearSearch = () => {
    setGlobalSearchQuery("")
    setCurrentPage(1)
    fetchVouchers(1, "")
  }

  const handleView = (id: string) => {
    saveTableState()
    router.push(`/admin/cheque/view/${id}`)
  }

  const handleEdit = (id: string) => {
    saveTableState()
    router.push(`/admin/cheque/edit/${id}`)
  }

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/cheque-vouchers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to cancel cheque voucher")
      }
      toast({
        title: "Success",
        description: "Cheque voucher has been cancelled successfully.",
        variant: "default",
      })
      fetchVouchers(currentPage, globalSearchQuery)
    } catch (error: any) {
      console.error("Error cancelling cheque voucher:", error)
      toast({
        title: "Error",
        description: `Failed to cancel voucher: ${error.message || "An unexpected error occurred."}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = async (voucher: ChequeVoucher) => {
    setSelectedVoucher(voucher)
    try {
      const response = await fetch("/api/send-delete-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucher_id: voucher.id,
          voucher_type: "cheque",
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

  const handleOTPVerify = async (otp: string) => {
    if (!selectedVoucher) return
    try {
      const response = await fetch("/api/admin/cheque/delete", {
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
        throw new Error(errorData.message || "Failed to delete cheque voucher")
      }
      toast({
        title: "Success",
        description: `Cheque voucher ${selectedVoucher.voucher_no} has been deleted permanently.`,
        duration: 5000,
        variant: "default",
      })
      setShowOTPDialog(false)
      setSelectedVoucher(null)
      fetchVouchers(currentPage, globalSearchQuery)
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
        voucher_type: "cheque",
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

  // Handle export voucher to png
  const exportVoucher = async (voucher: ChequeVoucher) => {
    try {
      setIsExporting(true)

      // Fetch selected voucher
      const response = await fetch(`/api/cheque-vouchers/${voucher.id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch cheque voucher")
      }

      const data: VoucherChequePreview = await response.json()
      const container = document.getElementById("voucher-export-container")!
      container.innerHTML = ""
      const div = document.createElement("div")
      container.appendChild(div)

      const previewRef = React.createRef<HTMLDivElement>()
      const root = createRoot(div)

      root.render(<ChequeVoucherPreview ref={previewRef} voucher={data} />)

      // Give React time to flush
      await new Promise((res) => setTimeout(res, 200))

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

      const dataUrl = await (domtoimage as any).toPng(node, {
        bgcolor: "#ffffff",
        width: 1800,
        height: node.offsetHeight,
        style: { backgroundColor: "#ffffff", boxSizing: "border-box" },
      })

      node.style.width = originalWidth
      node.style.maxWidth = originalMaxWidth

      const link = document.createElement("a")
      link.download = `cheque-voucher-${voucher.voucher_no || "untitled"}.png`
      link.href = dataUrl
      link.click()

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  const columns: ColumnDef<ChequeVoucher>[] = [
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
        return <div className="whitespace-nowrap">{formatDateLong(row.getValue("date"))}</div>
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
      accessorKey: "amount",
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
        const amount = row.getValue("amount") as number | null
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount !== null ? Number.parseFloat(amount.toString()) : 0)
        return <div className="text-right font-medium whitespace-nowrap">{formatted}</div>
      },
    },
    {
      accessorKey: "check_no",
      header: "Check No",
      cell: ({ row }) => <div className="font-mono text-sm whitespace-nowrap">{row.getValue("check_no")}</div>,
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
                    Are you sure you want to cancel voucher <span className="font-semibold text-gray-900 break-all">{voucher.voucher_no}</span> (Check
                    # <span className="font-mono font-semibold text-gray-900">{voucher.check_no}</span>
                    )?
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }}>
          {/* Hidden VoucherPreview for export */}
          <div id="voucher-export-container" />
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Cheque Vouchers</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track your cheque voucher transactions</p>
          </div>
          <Button onClick={() => router.push("/cheque-voucher")} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Cheque Voucher
          </Button>
        </div>
        {/* Content */}
        {vouchers.length === 0 && globalSearchQuery === "" ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No cheque vouchers</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new cheque voucher.</p>
                <Button onClick={() => router.push("/cheque-voucher")} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Cheque Voucher
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={vouchers}
              globalFilterValue={globalSearchQuery}
              onGlobalFilterChange={setGlobalSearchQuery}
              searchPlaceholder="Search by payee name, voucher no, or check no..."
              currentPage={currentPage}
              pageCount={pagination?.last_page || 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              onPageChange={handlePageChange}
              totalRows={pagination?.total || 0}
              fromRow={pagination?.from || 0}
              toRow={pagination?.to || 0}
              onClearSearch={handleClearSearch}
              isLoading={isLoading}
            />
            {/* Pagination - Responsive for all screen sizes */}
            {pagination && pagination.last_page >= 1 && (
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
          voucherType="cheque"
          email={adminEmail}
        />
      </div>
    </div>
  )
}
