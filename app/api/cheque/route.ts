import { type NextRequest, NextResponse } from "next/server"

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${LARAVEL_API_URL}${endpoint}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  // Forward authorization header if present
  const authHeader =
    options.headers && "authorization" in options.headers ? (options.headers as any).authorization : null

  if (authHeader) {
    headers.Authorization = authHeader
  }

  try {
    console.log(`Making request to: ${url}`)
    console.log(`Method: ${options.method || "GET"}`)
    if (options.body) {
      console.log(`Request body:`, JSON.parse(options.body as string))
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    const data = await response.json()
    console.log(`Response status: ${response.status}`)
    console.log(`Response data:`, data)

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Laravel API request failed" }, { status: response.status })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Laravel API Error:", error)
    return NextResponse.json({ error: "Failed to connect to Laravel API" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const start_date = searchParams.get("start_date")
  const end_date = searchParams.get("end_date")
  const search = searchParams.get("search")
  const page = searchParams.get("page")
  const per_page = searchParams.get("per_page")

  let endpoint = id ? `/cheque-vouchers/${id}` : "/cheque-vouchers"

  // Add query parameters for filtering
  if (!id) {
    const params = new URLSearchParams()
    if (start_date) params.append("start_date", start_date)
    if (end_date) params.append("end_date", end_date)
    if (search) params.append("search", search)
    if (page) params.append("page", page)
    if (per_page) params.append("per_page", per_page)

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }
  }

  return makeRequest(endpoint, {
    method: "GET",
    headers: {
      authorization: request.headers.get("authorization") || "",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Transform the data to match Laravel expectations
    const transformedBody = {
      ...body,
      // Ensure particulars is properly formatted
      particulars: typeof body.particulars === "string" ? body.particulars : JSON.stringify(body.particulars || []),
      // Ensure amount is a number
      amount: typeof body.amount === "string" ? Number.parseFloat(body.amount) || 0 : body.amount || 0,
      total_amount:
        typeof body.total_amount === "string" ? Number.parseFloat(body.total_amount) || 0 : body.total_amount || 0,
    }

    console.log("Transformed cheque voucher data:", transformedBody)

    return makeRequest("/cheque-vouchers", {
      method: "POST",
      headers: {
        authorization: request.headers.get("authorization") || "",
      },
      body: JSON.stringify(transformedBody),
    })
  } catch (error) {
    console.error("POST cheque voucher error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Cheque voucher ID is required" }, { status: 400 })
    }

    const body = await request.json()

    // Transform the data to match Laravel expectations
    const transformedBody = {
      ...body,
      // Ensure particulars is properly formatted
      particulars: typeof body.particulars === "string" ? body.particulars : JSON.stringify(body.particulars || []),
      // Ensure amount is a number
      amount: typeof body.amount === "string" ? Number.parseFloat(body.amount) || 0 : body.amount || 0,
      total_amount:
        typeof body.total_amount === "string" ? Number.parseFloat(body.total_amount) || 0 : body.total_amount || 0,
    }

    console.log("Updating cheque voucher with data:", transformedBody)

    return makeRequest(`/cheque-vouchers/${id}`, {
      method: "PUT",
      headers: {
        authorization: request.headers.get("authorization") || "",
      },
      body: JSON.stringify(transformedBody),
    })
  } catch (error) {
    console.error("PUT cheque voucher error:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Cheque voucher ID is required" }, { status: 400 })
  }

  return makeRequest(`/cheque-vouchers/${id}`, {
    method: "DELETE",
    headers: {
      authorization: request.headers.get("authorization") || "",
    },
  })
}
