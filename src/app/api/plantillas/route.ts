import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'plantillas', 'plantillas.json');
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json([]);
    }

    const fileData = fs.readFileSync(jsonPath, 'utf-8');
    const plantillas = JSON.parse(fileData);

    return NextResponse.json(plantillas);
  } catch (error) {
    console.error('Error al leer plantillas.json:', error);
    return NextResponse.json({ error: 'Error al cargar plantillas' }, { status: 500 });
  }
}
