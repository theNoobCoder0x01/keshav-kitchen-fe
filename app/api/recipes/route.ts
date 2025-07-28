import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all recipes or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      console.log(`Fetching recipe with id: ${id}`);
      const recipe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
      if (!recipe) return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 });
      return NextResponse.json(recipe);
    }
    console.log("Fetching all recipes...");
    const recipes = await prisma.recipe.findMany({ include: { ingredients: true } });
    return NextResponse.json(recipes);
  } catch (error: unknown) {
    console.error("Error in recipes endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch recipes.', details: errorMessage }, { status: 500 });
  }
}

// POST create recipe
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { ingredients, ...recipeData } = data;
    console.log("Creating new recipe...");
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
  } catch (error: unknown) {
    console.error("Error in recipes endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to create recipe.', details: errorMessage }, { status: 400 });
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
    console.log(`Updating recipe with id: ${id}`);
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
  } catch (error: unknown) {
    console.error("Error in recipes endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to update recipe.', details: errorMessage }, { status: 400 });
  }
}

// DELETE recipe by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Recipe id required.' }, { status: 400 });
    console.log(`Deleting recipe with id: ${id}`);
    await prisma.recipe.delete({ where: { id } });
    return NextResponse.json({ message: 'Recipe deleted.' });
  } catch (error: unknown) {
    console.error("Error in recipes endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to delete recipe.', details: errorMessage }, { status: 400 });
  }
}
