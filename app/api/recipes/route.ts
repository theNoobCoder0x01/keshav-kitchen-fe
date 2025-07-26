import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all recipes or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const recipe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
      if (!recipe) return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
      return NextResponse.json(recipe);
    }
    const recipes = await prisma.recipe.findMany({ include: { ingredients: true } });
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes.' }, { status: 500 });
  }
}

// POST create recipe
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { ingredients, ...recipeData } = data;
    const recipe = await prisma.recipe.create({
      data: {
        ...recipeData,
        ingredients: ingredients && Array.isArray(ingredients)
          ? { create: ingredients }
          : undefined,
      },
      include: { ingredients: true },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recipe.' }, { status: 400 });
  }
}

// PUT update recipe by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Recipe id required.' }, { status: 400 });
    const data = await request.json();
    const { ingredients, ...recipeData } = data;
    // Remove all existing ingredients and recreate (simplest approach)
    await prisma.ingredient.deleteMany({ where: { recipeId: id } });
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        ingredients: ingredients && Array.isArray(ingredients)
          ? { create: ingredients }
          : undefined,
      },
      include: { ingredients: true },
    });
    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recipe.' }, { status: 400 });
  }
}

// DELETE recipe by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Recipe id required.' }, { status: 400 });
    await prisma.recipe.delete({ where: { id } });
    return NextResponse.json({ message: 'Recipe deleted.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recipe.' }, { status: 400 });
  }
}

