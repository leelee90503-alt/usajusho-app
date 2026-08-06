import { SquareClient, SquareEnvironment } from "square"

// Lazily-constructed singleton Square server SDK client.
//
// SQUARE_ACCESS_TOKEN does not exist in this environment yet (real Square
// API credentials will be supplied later, from a Sandbox or Production
// application in the Square Developer Dashboard). We intentionally do not
// read the env var at module load time so that importing this file never
// crashes local dev or the build - the token is only required once a
// caller actually needs to talk to Square (creating a Payment Link,
// issuing a refund, etc.).
let squareClient: SquareClient | null = null

export function getSquare(): SquareClient {
  if (squareClient) {
    return squareClient
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error(
      "SQUARE_ACCESS_TOKEN is not set. Add it to .env.local (and to the " +
        "Vercel project's environment variables) once real Square API " +
        "credentials are available.",
    )
  }

  const environment =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox

  squareClient = new SquareClient({
    token: accessToken,
    environment,
  })
  return squareClient
}

export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID
  if (!locationId) {
    throw new Error(
      "SQUARE_LOCATION_ID is not set. Add it to .env.local (and to the " +
        "Vercel project's environment variables) once a Square Location " +
        "has been created.",
    )
  }
  return locationId
}
