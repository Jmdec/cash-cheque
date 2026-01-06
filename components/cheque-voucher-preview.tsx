"use client"

import { forwardRef, useState } from "react"

export interface ChequeVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  amount: number | null
  purpose: string
  note?: string
  check_date?: string
  check_no: string
  account_name: string
  account_number: string
  project_details?: string
  owner_client?: string
  received_by_name: string
  received_by_signature_url: string | null
  received_by_date: string
  approved_by_name: string
  approved_by_signature_url: string | null
  approved_by_date: string
  status: string
}

interface Props {
  voucher: ChequeVoucher
}

export const ChequeVoucherPreview = forwardRef<HTMLDivElement, Props>(({ voucher }, ref) => {
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

  const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL
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

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })
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

  return (
    <div
      ref={ref}
      className="bg-white p-6 border-2 border-gray-300 text-black w-full"
      style={{
        fontFamily: "Arial, sans-serif",
        minWidth: "800px",
        fontSize: "14px",
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex-shrink-0">
          <img src="/logo.png" alt="Company Logo" className="max-h-[180px] max-w-[320px]" crossOrigin="anonymous" />
        </div>
        <div className="text-center flex-grow">
          <h2 className="text-5xl font-bold underline mr-60">CHEQUE VOUCHER</h2>
        </div>
      </div>

      {/* Header Info - INCREASED FONT SIZES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mb-4">
        <div className="flex items-center mt-8">
          <span className="font-semibold text-xl">Paid to:</span>
          <span className="ml-2 border-b border-black flex-grow min-h-[1.5rem] flex items-end max-w-[400px]">
            <span className="pb-1 text-xl mt-1">{voucher.paid_to}</span>
          </span>
        </div>
        <div className="flex flex-col items-end space-y-1 mt-4 sm:mt-0">
          <div className="flex items-center w-full justify-end">
            <div className="flex items-center">
              <span className="font-semibold text-xl">Voucher No</span>
              <span className="font-semibold ml-1 text-xl">:</span>
            </div>
            <span className="border-b border-black inline-flex items-end min-w-[185px] text-right min-h-[1.5rem] ml-2">
              <span className="pb-1 text-xl mt-2">{voucher.voucher_no}</span>
            </span>
          </div>
          <div className="flex items-center w-full justify-end">
            <div className="flex items-center">
              <span className="font-semibold text-xl " style={{ width: "108px", textAlign: "left" }}>
                Date
              </span>
              <span className="font-semibold ml-1 text-xl">:</span>
            </div>
            <span className="border-b border-black inline-flex items-end min-w-[185px] text-right min-h-[1.5rem] ml-2">
              <span className="pb-1 text-xl">{formatDateForPreview(voucher.date)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Table - INCREASED FONT SIZES */}
      <div
        className="border-2 border-black mb-6"
        style={{
          height: "550px",
          display: "grid",
          gridTemplateRows: "auto 1fr",
        }}
      >
        {/* Table Header - Fixed Height */}
        <div className="grid grid-cols-[8fr_4fr] border-b border-black bg-gray-100 h-[50px]">
          <div className="py-2 px-2 font-semibold text-center border-r border-black flex items-center justify-center text-xl">PARTICULARS</div>
          <div className="py-2 px-2 font-semibold text-center flex items-center justify-center text-xl">AMOUNT</div>
        </div>
        {/* Table Content - Takes remaining space with overflow hidden */}
        <div className="grid grid-cols-[8fr_4fr]" style={{ overflow: "hidden" }}>
          {/* Left Column - Particulars */}
          <div className="border-r border-black p-4" style={{ overflow: "hidden" }}>
            {/* PURPOSE Section */}
            <div
              style={{
                height: "150px",
                marginBottom: "5px",
                overflow: "hidden",
              }}
            >
              <div className="flex items-start mb-2">
                <span className="font-bold text-base mt-1" style={{ width: "100px", flexShrink: 0 }}>
                  PURPOSE
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <div
                  className="pb-1 text-xl"
                  style={{
                    flex: 1,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflow: "hidden",
                    maxHeight: "140px",
                  }}
                >
                  {voucher.purpose}
                </div>
              </div>
            </div>
            {/* NOTE Section */}
            <div
              style={{
                height: "60px",
                marginBottom: "24px",
                overflow: "hidden",
              }}
            >
              <div className="flex items-start mb-2">
                <span className="font-bold text-base mt-1" style={{ width: "100px", flexShrink: 0 }}>
                  NOTE
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <div
                  className="pb-1 text-xl"
                  style={{
                    flex: 1,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflow: "hidden",
                    maxHeight: "60px",
                  }}
                >
                  {voucher.note}
                </div>
              </div>
            </div>
            {/* Other fields - Fixed spacing with aligned colons */}
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-bold text-base" style={{ width: "200px", flexShrink: 0 }}>
                  CHECK DATE
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <span className="border-b border-black pb-1 text-xl" style={{ overflow: "hidden", width: "400px" }}>
                  {formatDateForPreview(voucher.check_date || "")}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-base" style={{ width: "200px", flexShrink: 0 }}>
                  CHECK NO.
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <span className="border-b border-black pb-1 text-xl" style={{ overflow: "hidden", width: "400px" }}>
                  {voucher.check_no}
                </span>
              </div>
              <div className="flex items-center whitespace-nowrap">
                <span className="font-semibold text-base" style={{ width: "200px", flexShrink: 0 }}>
                  ACCOUNT NAME
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <span
                  className="border-b border-black pb-1 text-xl"
                  style={{
                    overflow: "hidden",
                    width: "400px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {voucher.account_name}
                </span>
              </div>
              <div className="flex items-center whitespace-nowrap">
                <span className="font-semibold text-base" style={{ width: "200px", flexShrink: 0 }}>
                  ACCOUNT NUMBER
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <span
                  className="border-b border-black pb-1 text-xl"
                  style={{
                    overflow: "hidden",
                    width: "400px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {voucher.account_number}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-base" style={{ width: "200px", flexShrink: 0 }}>
                  AMOUNT
                </span>
                <span className="font-semibold mr-2 text-xl" style={{ flexShrink: 0 }}>
                  :
                </span>
                <span className="border-b border-black pb-1 text-xl" style={{ overflow: "hidden", width: "400px" }}>
                  {voucher.amount
                    ? `₱${Number(voucher.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : ""}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-end w-full">
              <span className="font-bold text-xl">TOTAL:</span>
            </div>
          </div>
          {/* Right Column - Amount */}
          <div className="p-4 flex items-end justify-end">
            <div className="text-xl font-bold">
              {voucher.amount
                ? `₱${Number(voucher.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Section - INCREASED FONT SIZES */}
      <div className="border-2 border-black mb-6 p-4">
        {/* PROJECT DETAILS */}
        <div className="flex items-start mb-2">
          <span className="font-bold text-base whitespace-nowrap" style={{ width: "200px", flexShrink: 0 }}>
            PROJECT DETAILS
          </span>
          <span className="font-bold mr-2 text-xl" style={{ flexShrink: 0 }}>
            :
          </span>
          <div className="border-b border-black text-xl" style={{ width: "400px" }}>
            {voucher.project_details}
          </div>
        </div>
        {/* OWNER/CLIENT */}
        <div className="flex items-center mb-2">
          <span className="font-bold text-sm" style={{ width: "200px", flexShrink: 0 }}>
            OWNER/CLIENT
          </span>
          <span className="font-semibold mr-2 text-xl">:</span>
          <div className="border-b border-black text-xl" style={{ width: "400px" }}>
            {voucher.owner_client}
          </div>
        </div>
      </div>

      {/* Signatures - INCREASED FONT SIZES */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="font-semibold mb-4 text-base">Received From</div>
          <div className="flex gap-4">
            <div style={{ width: "350px" }}>
              <div className="border-b-2 border-black min-h-[60px] flex items-end justify-center relative mb-2">
                {voucher.received_by_signature_url && (
                  <img
                    src={getSignatureUrl(voucher.received_by_signature_url) || "/placeholder.svg"}
                    alt="Signature"
                    className="max-h-20 max-w-[160px] object-contain absolute bottom-2"
                    crossOrigin="anonymous"
                    onError={() => handleImageError("received_from")}
                  />
                )}
                <span className="pb-1 text-xl">{voucher.received_by_name}</span>
              </div>
              <div className="text-base text-center font-medium">PRINTED NAME AND SIGNATURE</div>
            </div>
            <div style={{ width: "180px" }}>
              <div className="border-b-2 border-black min-h-[60px] flex items-end justify-center mb-2">
                <span className="pb-1 text-xl">{formatDate(voucher.received_by_date)}</span>
              </div>
              <div className="text-base text-center font-medium">DATE</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div>
            <div className="font-semibold mb-4 text-base">Approved By</div>
            <div className="flex gap-4">
              <div style={{ width: "350px" }}>
                <div className="border-b-2 border-black min-h-[60px] flex items-end justify-center relative mb-2">
                  {voucher.approved_by_signature_url && (
                    <img
                      src={getSignatureUrl(voucher.approved_by_signature_url) || "/placeholder.svg"}
                      alt="Signature"
                      className="max-h-20 max-w-[160px] object-contain absolute bottom-2"
                      crossOrigin="anonymous"
                      onError={() => handleImageError("approved_by")}
                    />
                  )}
                  <span className="pb-1 text-xl">{voucher.approved_by_name}</span>
                </div>
                <div className="text-base text-center font-medium">PRINTED NAME AND SIGNATURE</div>
              </div>
              <div style={{ width: "180px" }}>
                <div className="border-b-2 border-black min-h-[60px] flex items-end justify-center mb-2">
                  <span className="pb-1 text-xl">{formatDate(voucher.approved_by_date)}</span>
                </div>
                <div className="text-base text-center font-medium">DATE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ChequeVoucherPreview.displayName = "ChequeVoucherPreview"
