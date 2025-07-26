import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Adjust the query as per your schema
    // Example: aggregate stats from multiple tables
    const mealsServed = await prisma.meal.count();
    const activeKitchens = await prisma.kitchen.count();
    const recipes = await prisma.recipe.count();
    const volunteers = await prisma.user.count({ where: { role: 'volunteer' } });
    const stats = [
      { label: 'Meals Served', value: mealsServed },
      { label: 'Active Kitchens', value: activeKitchens },
      { label: 'Recipes', value: recipes },
      { label: 'Volunteers', value: volunteers }
    ];
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats.' }, { status: 500 });
  }
}
