import { type NextRequest, NextResponse } from "next/server"

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "voucher" // voucher or cheque
    const account_id = searchParams.get("account_id")
    const account_number = searchParams.get("account_number")

    let endpoint = ""

    if (type === "cheque" && (account_id || account_number)) {
      // Generate cheque number for specific account
      endpoint = `/cheque-vouchers/next-number?${account_number ? `account_number=${account_number}` : `account_id=${account_id}`}`
    } else if (type === "voucher") {
      // Generate voucher number (auto-increment)
      endpoint = "/vouchers/next-number"
    } else {
      // Default to cash voucher number generation
      endpoint = `/cash-vouchers/next-number${account_id ? `?account_id=${account_id}` : ""}`
    }

    console.log(`Generating ${type} number with endpoint: ${endpoint}`)

    const response = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
    })

    const data = await response.json()
    console.log(`Generate ${type} number response:`, data)

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || `Failed to generate ${type} number` },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Generate number error:", error)
    return NextResponse.json({ error: "Failed to connect to Laravel API" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = "voucher", account_id, account_number } = body

    let endpoint = ""
    let requestBody = {}

    if (type === "cheque" && (account_id || account_number)) {
      // Generate cheque number for specific account
      endpoint = "/cheque-vouchers/generate-number"
      requestBody = { account_id, account_number }
    } else if (type === "voucher") {
      // Generate voucher number (auto-increment)
      endpoint = "/vouchers/generate-number"
    } else {
      // Default to cash voucher number generation
      endpoint = "/cash-vouchers/generate-number"
      if (account_id) requestBody = { account_id }
    }

    console.log(`Generating ${type} number with endpoint: ${endpoint}`)
    console.log(`Request body:`, requestBody)

    const response = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    })

    const data = await response.json()
    console.log(`Generate ${type} number response:`, data)

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || `Failed to generate ${type} number` },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Generate number error:", error)
    return NextResponse.json({ error: "Failed to connect to Laravel API" }, { status: 500 })
  }
}
