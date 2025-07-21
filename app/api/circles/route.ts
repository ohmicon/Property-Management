import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export interface Circle {
  x: number;
  y: number;
  r: number;
  status: 'available' | 'booked' | 'pending';
  id: string;
}

interface CirclesData {
  circles: Circle[];
}

const CIRCLES_FILE_PATH = path.join(process.cwd(), 'data', 'circles.json');

// GET - ดึงข้อมูล circles ทั้งหมด
export async function GET() {
  try {
    const fileData = await fs.readFile(CIRCLES_FILE_PATH, 'utf8');
    const data: CirclesData = JSON.parse(fileData);
    
    return NextResponse.json({
      success: true,
      data: data.circles
    });
  } catch (error) {
    console.error('Error reading circles data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load circles data' 
      },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูล circles ทั้งหมด
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { circles }: { circles: Circle[] } = body;

    if (!Array.isArray(circles)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid circles data format' 
        },
        { status: 400 }
      );
    }

    // Validate each circle
    for (const circle of circles) {
      if (!circle.id || typeof circle.x !== 'number' || typeof circle.y !== 'number' || 
          typeof circle.r !== 'number' || !['available', 'booked', 'pending'].includes(circle.status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid circle data format' 
          },
          { status: 400 }
        );
      }
    }

    const data: CirclesData = { circles };
    await fs.writeFile(CIRCLES_FILE_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Circles updated successfully',
      data: circles
    });
  } catch (error) {
    console.error('Error updating circles data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update circles data' 
      },
      { status: 500 }
    );
  }
}

// PATCH - อัปเดต circle เดียว
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates }: { id: string; updates: Partial<Circle> } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Circle ID is required' 
        },
        { status: 400 }
      );
    }

    // Read current data
    const fileData = await fs.readFile(CIRCLES_FILE_PATH, 'utf8');
    const data: CirclesData = JSON.parse(fileData);
    
    // Find and update the circle
    const circleIndex = data.circles.findIndex(circle => circle.id === id);
    
    if (circleIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Circle not found' 
        },
        { status: 404 }
      );
    }

    // Update the circle
    data.circles[circleIndex] = { ...data.circles[circleIndex], ...updates };
    
    // Save back to file
    await fs.writeFile(CIRCLES_FILE_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Circle updated successfully',
      data: data.circles[circleIndex]
    });
  } catch (error) {
    console.error('Error updating circle:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update circle' 
      },
      { status: 500 }
    );
  }
}
