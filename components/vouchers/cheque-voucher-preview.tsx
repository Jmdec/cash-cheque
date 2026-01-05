"use client"

import type { ChequeVoucherFormData } from "@/types/cheque-voucher"

interface ChequeVoucherPreviewProps {
  formData: ChequeVoucherFormData
}

export default function ChequeVoucherPreview({ formData }: ChequeVoucherPreviewProps) {
  const formatAmount = (amount: string) => {
    const num = Number.parseFloat(amount || "0")
    const formatted = num.toLocaleString("en-US", { minimumFractionDigits: 2 })
    const parts = formatted.split(".")
    return { main: parts[0], cents: parts[1] || "00" }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "___________"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Safely handle particulars - ensure it's always an array
  const particulars = formData.particulars || []

  return (
    <div
      data-voucher-container
      className="voucher-container bg-white text-black"
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontSize: "14px",
        lineHeight: "1.4",
        padding: "24px",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        boxSizing: "border-box",
        transform: "scale(0.85)",
        transformOrigin: "top center",
        overflow: "visible",
      }}
    >
      {/* Header Section - Logo and Title */}
      <div className="flex justify-between items-start mb-4">
        {/* Logo Section */}
        <div className="flex items-center">
          <img
            src="/abiclogo.png"
            alt="ABIC Logo"
            className="w-16 h-12 object-contain"
            crossOrigin="anonymous"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        </div>
        {/* Center Title */}
        <div className="text-center flex-1">
          <h1
            style={{
              fontFamily: "'Times New Roman', serif",
              fontWeight: "300",
              fontSize: "22px",
              color: "#000000",
              display: "inline-block",
              margin: "0",
            }}
          >
            CHEQUE VOUCHER
          </h1>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Basic Info Layout */}
      <div className="flex justify-between mb-4">
        <div className="w-1/2 pr-6">
          <div className="flex items-center mb-4">
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                marginRight: "6px",
                minWidth: "80px",
              }}
            >
              Cheque No.
            </span>
            <span
              style={{
                borderBottom: "1px solid #000000",
                padding: "2px 6px",
                width: "160px",
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                textAlign: "left",
              }}
            >
              {formData.cheque_no || ""}
            </span>
          </div>
          <div className="flex items-center">
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                marginRight: "6px",
                minWidth: "80px",
              }}
            >
              Paid To:
            </span>
            <span
              style={{
                borderBottom: "1px solid #000000",
                padding: "2px 6px",
                width: "160px",
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                textAlign: "left",
              }}
            >
              {formData.paid_to || ""}
            </span>
          </div>
        </div>
        <div className="w-1/2 pl-6">
          <div className="flex items-center mb-4">
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                marginRight: "6px",
                minWidth: "80px",
              }}
            >
              Voucher No.
            </span>
            <span
              style={{
                borderBottom: "1px solid #000000",
                padding: "2px 6px",
                width: "160px",
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                textAlign: "left",
              }}
            >
              {formData.voucher_no || ""}
            </span>
          </div>
          <div className="flex items-center">
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                marginRight: "6px",
                minWidth: "80px",
              }}
            >
              Date:
            </span>
            <span
              style={{
                borderBottom: "1px solid #000000",
                padding: "2px 6px",
                width: "160px",
                fontFamily: "'Arial', sans-serif",
                fontSize: "12px",
                color: "#000000",
                textAlign: "left",
              }}
            >
              {formatDate(formData.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Particulars and Amount Table */}
      <div
        style={{
          border: "2px solid #000000",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #000000",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "10px",
              textAlign: "center",
              fontFamily: "'Times New Roman', serif",
              fontWeight: "300",
              fontSize: "15px",
              letterSpacing: "1px",
              color: "#000000",
              borderRight: "1px solid #000000",
            }}
          >
            PARTICULARS
          </div>
          <div
            style={{
              width: "140px",
              padding: "10px",
              textAlign: "center",
              fontFamily: "'Times New Roman', serif",
              fontWeight: "300",
              fontSize: "15px",
              color: "#000000",
            }}
          >
            AMOUNT
          </div>
        </div>

        {/* Render particulars if they exist, otherwise show empty rows */}
        {particulars.length > 0
          ? particulars.map((particular, index) => (
              <div
                key={particular.id || index}
                style={{
                  display: "flex",
                  minHeight: "40px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRight: "1px solid #000000",
                    fontFamily: "'Arial', sans-serif",
                    fontSize: "12px",
                    color: "#000000",
                    display: "flex",
                    alignItems: "flex-start",
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                  }}
                >
                  {particular.description || ""}
                </div>
                <div
                  style={{
                    width: "140px",
                    display: "flex",
                    fontFamily: "'Arial', sans-serif",
                    fontSize: "12px",
                    color: "#000000",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      borderRight: "1px solid #000000",
                    }}
                  >
                    {particular.amount ? formatAmount(particular.amount).main : ""}
                  </div>
                  <div
                    style={{
                      width: "40px",
                      padding: "6px 3px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      fontSize: "11px",
                    }}
                  >
                    {particular.amount ? `.${formatAmount(particular.amount).cents}` : ".00"}
                  </div>
                </div>
              </div>
            ))
          : // Show empty rows when no particulars
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`empty-${index}`}
                style={{
                  display: "flex",
                  minHeight: "40px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRight: "1px solid #000000",
                    fontFamily: "'Arial', sans-serif",
                    fontSize: "12px",
                    color: "#000000",
                    display: "flex",
                    alignItems: "flex-start",
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                  }}
                >
                  {/* Empty row */}
                </div>
                <div
                  style={{
                    width: "140px",
                    display: "flex",
                    fontFamily: "'Arial', sans-serif",
                    fontSize: "12px",
                    color: "#000000",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      borderRight: "1px solid #000000",
                    }}
                  >
                    {/* Empty amount */}
                  </div>
                  <div
                    style={{
                      width: "40px",
                      padding: "6px 3px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      fontSize: "11px",
                    }}
                  >
                    {/* Empty cents */}
                  </div>
                </div>
              </div>
            ))}

        {/* Total Row */}
        <div
          style={{
            display: "flex",
            minHeight: "40px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRight: "1px solid #000000",
              fontFamily: "'Arial', sans-serif",
              fontSize: "13px",
              fontWeight: "bold",
              color: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            TOTAL:
          </div>
          <div
            style={{
              width: "140px",
              display: "flex",
              fontFamily: "'Arial', sans-serif",
              fontSize: "13px",
              fontWeight: "bold",
              color: "#000000",
            }}
          >
            <div
              style={{
                flex: 1,
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                borderRight: "1px solid #000000",
              }}
            >
              {formData.total_amount ? formatAmount(formData.total_amount).main : ""}
            </div>
            <div
              style={{
                width: "40px",
                padding: "6px 3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
              }}
            >
              {formData.total_amount ? `.${formatAmount(formData.total_amount).cents}` : ".00"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Received By and Approved By */}
      <div className="flex justify-between mt-6">
        {/* Left Side - Received By */}
        <div className="w-1/2 pr-6">
          <div
            style={{
              fontFamily: "'Times New Roman', serif",
              fontWeight: "300",
              fontSize: "13px",
              color: "#000000",
              marginBottom: "10px",
            }}
          >
            Received by:
          </div>
          <div className="mb-2">
            <div
              style={{
                borderBottom: "1px solid #000000",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              {formData.received_signature ? (
                <img
                  src={formData.received_signature || "/placeholder.svg"}
                  alt="Received Signature"
                  style={{
                    maxHeight: "24px",
                    maxWidth: "90px",
                    objectFit: "contain",
                  }}
                  crossOrigin="anonymous"
                />
              ) : null}
            </div>
            <div
              style={{
                borderBottom: "1px solid #000000",
                height: "20px",
                display: "flex",
                alignItems: "center",
                fontFamily: "'Arial', sans-serif",
                fontSize: "11px",
                color: "#000000",
                paddingLeft: "4px",
                marginBottom: "4px",
                textAlign: "left",
              }}
            >
              {formData.received_printed_name || ""}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#000000",
                textAlign: "center",
              }}
            >
              PRINTED NAME
            </div>
          </div>
        </div>

        {/* Right Side - Approved By */}
        <div className="w-1/2 pl-6">
          <div
            style={{
              fontFamily: "'Times New Roman', serif",
              fontWeight: "300",
              fontSize: "13px",
              color: "#000000",
              marginBottom: "10px",
            }}
          >
            Approved by:
          </div>
          <div className="mb-2">
            <div className="flex items-center mb-4">
              <span
                style={{
                  fontSize: "11px",
                  color: "#000000",
                  marginRight: "6px",
                  width: "70px",
                }}
              >
                Signature:
              </span>
              <div
                style={{
                  borderBottom: "1px solid #000000",
                  height: "28px",
                  width: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {formData.approved_signature ? (
                  <img
                    src={formData.approved_signature || "/placeholder.svg"}
                    alt="Approved Signature"
                    style={{
                      maxHeight: "24px",
                      maxWidth: "90px",
                      objectFit: "contain",
                    }}
                    crossOrigin="anonymous"
                  />
                ) : null}
              </div>
            </div>
            <div className="flex items-center mb-4">
              <span
                style={{
                  fontSize: "11px",
                  color: "#000000",
                  marginRight: "6px",
                  width: "70px",
                }}
              >
                Printed Name:
              </span>
              <div
                style={{
                  borderBottom: "1px solid #000000",
                  height: "20px",
                  width: "140px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "'Arial', sans-serif",
                  fontSize: "11px",
                  color: "#000000",
                  paddingLeft: "4px",
                  textAlign: "left",
                }}
              >
                {formData.approved_printed_name || ""}
              </div>
            </div>
            <div className="flex items-center">
              <span
                style={{
                  fontSize: "11px",
                  color: "#000000",
                  marginRight: "6px",
                  width: "70px",
                }}
              >
                Date:
              </span>
              <div
                style={{
                  borderBottom: "1px solid #000000",
                  height: "20px",
                  width: "140px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "'Arial', sans-serif",
                  fontSize: "11px",
                  color: "#000000",
                  paddingLeft: "4px",
                  textAlign: "left",
                }}
              >
                {formatDate(formData.approved_date || "")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
