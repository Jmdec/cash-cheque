"use client"

import React, { forwardRef } from "react"

interface Particular {
  id: string
  description: string
  amount: number
}

export interface CashVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  total_amount: number
  particulars: Particular[]
  purpose?: string
  note?: string
  project_details?: string
  owner_client?: string
  received_by_name: string
  received_by_signature_url: string | null
  received_by_date: string
  approved_by_name: string
  approved_by_signature_url: string | null
  approved_by_date: string
}

interface VoucherPreviewProps {
  voucher: CashVoucher
  getSignatureUrl: (path: string | null) => string
  handleImageError: (key: string) => void
  formatDate: (date: string) => string
  formatDateForPreview: (date: string) => string
}

export const CashVoucherPreview = forwardRef<HTMLDivElement, VoucherPreviewProps>(
  ({ voucher, getSignatureUrl, handleImageError, formatDate, formatDateForPreview }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white p-6 border-2 border-gray-300 text-black w-full text-lg"
        style={{
          fontFamily: "Arial, sans-serif",
          minWidth: "800px",
          fontSize: "14px",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="Company Logo" className="max-h-[180px] max-w-[320px]" crossOrigin="anonymous" />
          </div>
          <div className="text-center flex-grow">
            <h2 className="text-5xl font-bold underline mr-60">CASH VOUCHER</h2>
          </div>
        </div>

        {/* Header Info */}
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

        {/* Table */}
        <div className="border-2 border-black mb-6" style={{ height: "550px", display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div className="grid grid-cols-[8fr_4fr] border-b border-black bg-gray-100 h-[50px]">
            <div className="py-2 px-2 font-semibold text-center border-r border-black flex items-center justify-center text-xl">PARTICULARS</div>
            <div className="py-2 px-2 font-semibold text-center flex items-center justify-center text-xl">AMOUNT</div>
          </div>
          <div className="grid grid-cols-[8fr_4fr]" style={{ overflow: "hidden" }}>
            <div className="border-r border-black p-4">
              <div style={{ height: "200px", marginBottom: "20px", overflow: "hidden" }}>
                <div className="flex items-start">
                  <span className="font-bold text-xl mr-2">PURPOSE</span>
                  <span className="font-bold mr-2 text-xl">:</span>
                  <div className="flex-1 whitespace-pre-wrap break-words text-xl" style={{ overflow: "hidden", maxHeight: "180px" }}>
                    {voucher.purpose || (voucher.particulars?.length ? voucher.particulars.map((p) => p.description).join(", ") : "") || ""}
                  </div>
                </div>
              </div>
              <div style={{ height: "150px", marginBottom: "20px", overflow: "hidden" }}>
                <div className="flex items-start">
                  <span className="font-bold text-xl mr-2">NOTE</span>
                  <span className="font-bold text-xl ml-10 mr-2">:</span>
                  <div className="flex-1 whitespace-pre-wrap break-words text-xl" style={{ overflow: "hidden", maxHeight: "130px" }}>
                    {voucher.note}
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-end w-full">
                <span className="font-bold text-xl mt-14">TOTAL:</span>
              </div>
              <div style={{ flex: 1 }}></div>
            </div>
            <div className="px-2 py-2 flex flex-col">
              <div style={{ flex: 1 }}></div>
              <div className="flex justify-end font-semibold pt-2 text-xl w-full">
                <span>₱{Number(voucher?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="border-2 border-black mb-6 p-4">
          <div className="flex items-center mb-2 whitespace-nowrap overflow-hidden">
            <span className="font-bold text-xl mr-2" style={{ width: "180px", flexShrink: 0 }}>
              PROJECT DETAILS
            </span>
            <span className="font-bold text-xl mr-2">:</span>
            <div className="border-b border-black text-xl truncate" style={{ width: "400px", whiteSpace: "nowrap" }}>
              {voucher.project_details}
            </div>
          </div>
          <div className="flex items-center mb-2">
            <span className="font-bold text-xl" style={{ width: "188px", flexShrink: 0 }}>
              OWNER/CLIENT
            </span>
            <span className="font-semibold mr-2 text-xl">:</span>
            <div className="border-b border-black text-xl" style={{ width: "400px" }}>
              {voucher.owner_client}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8">
          {/* Received From */}
          <div>
            <div className="font-semibold mb-4 text-xl">Received From</div>
            <div className="flex gap-4">
              <div style={{ width: "350px" }}>
                <div className="border-b-2 border-black min-h-[60px] flex items-end justify-center relative mb-2">
                  {voucher.received_by_signature_url && (
                    <img
                      src={getSignatureUrl(voucher.received_by_signature_url)}
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
          {/* Approved By */}
          <div className="flex justify-end">
            <div>
              <div className="font-semibold mb-4 text-xl">Approved By</div>
              <div className="flex gap-4">
                <div style={{ width: "350px" }}>
                  <div className="border-b-2 border-black min-h-[60px] flex items-end justify-center relative mb-2">
                    {voucher.approved_by_signature_url && (
                      <img
                        src={getSignatureUrl(voucher.approved_by_signature_url)}
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
  },
)
