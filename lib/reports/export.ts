import { cookies } from "next/headers";
import puppeteer from "puppeteer";

export async function createReportPDF(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const cookiesRes = await cookies();

  // Auth.js session cookie (JWT-based)
  const authCookie =
    cookiesRes.get("authjs_session")?.value ||
    cookiesRes.get("__Secure-authjs_session")?.value;

  if (authCookie) {
    const parsedUrl = new URL(url);
    await browser.setCookie({
      name: cookiesRes.get("authjs_session")?.value
        ? "authjs_session"
        : "__Secure-authjs_session",
      value: authCookie,
      domain: parsedUrl.hostname, // ✅ dynamic domain
      path: "/",
      httpOnly: true,
      secure: parsedUrl.protocol === "https:",
    });
  }

  await page.goto(url, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
