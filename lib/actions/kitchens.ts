"use server"

import { sql } from "@/lib/db"
import { requireAuth, requireRole } from "@/lib/auth-utils"

export async function getKitchens() {
  try {
    const session = await requireAuth()

    // If user is not admin, only return their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      const kitchen = await sql`
        SELECT k.*, 
               COUNT(DISTINCT u.id) as user_count,
               COUNT(DISTINCT dm.id) as daily_menu_count
        FROM kitchens k
        LEFT JOIN users u ON k.id = u.kitchen_id
        LEFT JOIN daily_menus dm ON k.id = dm.kitchen_id
        WHERE k.id = ${session.user.kitchenId} AND k.is_active = true
        GROUP BY k.id, k.name, k.location, k.is_active, k.created_at, k.updated_at
      `
      return kitchen
    }

    const kitchens = await sql`
      SELECT k.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT dm.id) as daily_menu_count
      FROM kitchens k
      LEFT JOIN users u ON k.id = u.kitchen_id
      LEFT JOIN daily_menus dm ON k.id = dm.kitchen_id
      WHERE k.is_active = true
      GROUP BY k.id, k.name, k.location, k.is_active, k.created_at, k.updated_at
      ORDER BY k.name ASC
    `

    return kitchens
  } catch (error) {
    console.error("Get kitchens error:", error)
    return []
  }
}

export async function createKitchen(formData: FormData) {
  try {
    await requireRole(["ADMIN"])

    const name = formData.get("name") as string
    const location = formData.get("location") as string

    if (!name?.trim()) {
      return { success: false, error: "Kitchen name is required" }
    }

    const kitchenId = `kitchen_${Date.now()}`

    const kitchen = await sql`
      INSERT INTO kitchens (id, name, location, is_active)
      VALUES (${kitchenId}, ${name.trim()}, ${location?.trim() || null}, true)
      RETURNING *
    `

    return { success: true, kitchen: kitchen[0] }
  } catch (error) {
    console.error("Create kitchen error:", error)
    return { success: false, error: "Failed to create kitchen" }
  }
}
