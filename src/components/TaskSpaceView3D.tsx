import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Html } from '@react-three/drei';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { RotateCcw, Grid3X3, Columns, Table } from 'lucide-react';
import * as THREE from 'three';

interface TaskSpaceView3DProps {
  tasks: Record<string, Task[]>;
  columns: Column[];
}

interface Task3DProps {
  task: Task;
  kanbanPos: [number, number, number];
  matrixPos: [number, number, number];
  tablePos: [number, number, number];
  column?: Column;
  viewMode: 'kanban' | 'matrix' | 'table' | 'free';
}

const Task3D: React.FC<Task3DProps> = ({ task, kanbanPos, matrixPos, tablePos, column, viewMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Safety check for positions
  const isValidVec3 = (arr: any): arr is [number, number, number] =>
    Array.isArray(arr) && 
    arr.length === 3 && 
    arr.every((n) => typeof n === 'number' && isFinite(n) && !isNaN(n));

  const safeKanbanPos = isValidVec3(kanbanPos) ? kanbanPos : [0, 0, 0];
  const safeMatrixPos = isValidVec3(matrixPos) ? matrixPos : [0, 0, 0];
  const safeTablePos = isValidVec3(tablePos) ? tablePos : [0, 0, 0];

  useFrame((state) => {
    if (!groupRef.current) return;

    const targetPos = 
      viewMode === 'matrix' ? safeMatrixPos :
      viewMode === 'table' ? safeTablePos :
      safeKanbanPos;

    groupRef.current.position.lerp(new THREE.Vector3(...targetPos), 0.05);

    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getTaskColor = () => {
    if (task.urgency && task.importance) return '#ef4444';
    if (!task.urgency && task.importance) return '#eab308';
    if (task.urgency && !task.importance) return '#f97316';
    return '#6b7280';
  };

  return (
    <group ref={groupRef} position={safeKanbanPos}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.5, 0.2, 1]} />
        <meshStandardMaterial
          color={getTaskColor()}
          transparent
          opacity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <Text
        position={[0, 0.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
      >
        {task.title}
      </Text>
      {column && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.08}
          color="#aaa"
          anchorX="center"
          anchorY="middle"
        >
          {column.title}
        </Text>
      )}
    </group>
  );
};

const CameraController: React.FC<{ 
  viewMode: 'kanban' | 'matrix' | 'table' | 'free';
  onViewChange: () => void;
}> = ({ viewMode, onViewChange }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  React.useEffect(() => {
    if (!controlsRef.current) return;

    const duration = 1000;
    const startTime = Date.now();
    const startPosition = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();

    let targetPosition: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    switch (viewMode) {
      case 'kanban':
        targetPosition = new THREE.Vector3(-8, 2, 0);
        targetLookAt = new THREE.Vector3(0, 0, 0);
        break;
      case 'matrix':
        targetPosition = new THREE.Vector3(0, 10, 0);
        targetLookAt = new THREE.Vector3(0, 0, 0);
        break;
      case 'table':
        targetPosition = new THREE.Vector3(0, 8, 8);
        targetLookAt = new THREE.Vector3(0, 0, 0);
        break;
      default:
        targetPosition = new THREE.Vector3(5, 5, 5);
        targetLookAt = new THREE.Vector3(0, 0, 0);
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, eased);
      controlsRef.current.target.lerpVectors(startTarget, targetLookAt, eased);
      controlsRef.current.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onViewChange();
      }
    };

    animate();
  }, [viewMode, camera, onViewChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI}
      minDistance={3}
      maxDistance={20}
    />
  );
};

const TaskSpace3D: React.FC<TaskSpaceView3DProps & { viewMode: 'kanban' | 'matrix' | 'table' | 'free' }> = ({ tasks, columns, viewMode }) => {
  const allTasks = Object.values(tasks).flat();
  
  const taskToColumnMap = useMemo(() => {
    const map = new Map<string, Column>();
    Object.entries(tasks).forEach(([columnId, columnTasks]) => {
      const column = columns.find(col => col.id === columnId);
      if (column) {
        columnTasks.forEach(task => {
          map.set(task.id, column);
        });
      }
    });
    return map;
  }, [tasks, columns]);

  const taskPositions = useMemo(() => {
    const positions: Array<{ task: Task; kanbanPos: [number, number, number]; matrixPos: [number, number, number]; tablePos: [number, number, number]; column?: Column }> = [];
    
    // Organize tasks by quadrant for matrix positioning
    const tasksByQuadrant = {
      'urgent-important': allTasks.filter(task => task.urgency && task.importance),
      'important-not-urgent': allTasks.filter(task => !task.urgency && task.importance),
      'urgent-not-important': allTasks.filter(task => task.urgency && !task.importance),
      'neither': allTasks.filter(task => !task.urgency && !task.importance)
    };
    
    allTasks.forEach((task, index) => {
      const column = taskToColumnMap.get(task.id);
      const columnIndex = column ? columns.findIndex(col => col.id === column.id) : 0;
      const tasksInColumn = tasks[column?.id || ''] || [];
      const taskIndexInColumn = tasksInColumn.findIndex(t => t.id === task.id);
      
      // Kanban positioning (X = columns, Y = tasks in column, Z = 0)
      const kanbanX = (columnIndex - columns.length / 2) * 3;
      const kanbanY = (taskIndexInColumn - tasksInColumn.length / 2) * 1.5;
      const kanbanZ = 0;
      
      // Matrix positioning - determine quadrant and position within quadrant
      let matrixBaseX = task.urgency ? 2 : -2;
      let matrixBaseZ = task.importance ? 2 : -2;
      
      // Get position within quadrant
      const quadrantKey = `${task.urgency ? 'urgent' : 'not-urgent'}-${task.importance ? 'important' : 'not-important'}`;
      const quadrantTasks = tasksByQuadrant[
        task.urgency && task.importance ? 'urgent-important' :
        !task.urgency && task.importance ? 'important-not-urgent' :
        task.urgency && !task.importance ? 'urgent-not-important' :
        'neither'
      ];
      
      const taskIndexInQuadrant = quadrantTasks.findIndex(t => t.id === task.id);
      const tasksPerRow = Math.ceil(Math.sqrt(quadrantTasks.length));
      const row = Math.floor(taskIndexInQuadrant / tasksPerRow);
      const col = taskIndexInQuadrant % tasksPerRow;
      
      const matrixX = matrixBaseX + (col - tasksPerRow / 2) * 0.5;
      const matrixY = 0;
      const matrixZ = matrixBaseZ + (row - tasksPerRow / 2) * 0.5;

      // Table positioning - arranged in a grid like a spreadsheet
      const tasksPerTableRow = 5; // 5 tasks per row in table view
      const tableRow = Math.floor(index / tasksPerTableRow);
      const tableCol = index % tasksPerTableRow;
      
      const tableX = (tableCol - tasksPerTableRow / 2) * 2;
      const tableY = 0;
      const tableZ = (tableRow - Math.ceil(allTasks.length / tasksPerTableRow) / 2) * 1.5;
      
      positions.push({
        task,
        kanbanPos: [kanbanX, kanbanY, kanbanZ],
        matrixPos: [matrixX, matrixY, matrixZ],
        tablePos: [tableX, tableY, tableZ],
        column
      });
    });
    
    return positions;
  }, [allTasks, columns, tasks, taskToColumnMap]);

  return (
    <>
      {/* Column Labels for Kanban View */}
      {columns.map((column, index) => (
        <Text
          key={`column-${column.id}`}          position={[(index - columns.length / 2) * 3, 4, 0]}
          fontSize={0.3}
          color="#666"
          anchorX={0}
          anchorY="middle"
        >
          {column.title}
        </Text>
      ))}
        {/* Quadrant Labels for Matrix View */}
      <Text position={[2, 0.5, 2]} fontSize={0.2} color="#666" anchorX={0}>Do First</Text>
      <Text position={[-2, 0.5, 2]} fontSize={0.2} color="#666" anchorX={0}>Schedule</Text>
      <Text position={[2, 0.5, -2]} fontSize={0.2} color="#666" anchorX={0}>Delegate</Text>
      <Text position={[-2, 0.5, -2]} fontSize={0.2} color="#666" anchorX={0}>Eliminate</Text>
      
      {/* Axis Labels */}
      <Text position={[0, 0, 4]} fontSize={0.15} color="#888" anchorX={0}>IMPORTANT</Text>
      <Text position={[0, 0, -4]} fontSize={0.15} color="#888" anchorX={0}>NOT IMPORTANT</Text>
      <Text position={[4, 0, 0]} fontSize={0.15} color="#888" anchorX={0}>URGENT</Text>
      <Text position={[-4, 0, 0]} fontSize={0.15} color="#888" anchorX={0}>NOT URGENT</Text>        {/* Tasks */}
      {taskPositions.map(({ task, kanbanPos, matrixPos, tablePos, column }) => (
        <Task3D
          key={task.id}
          task={task}
          kanbanPos={kanbanPos}
          matrixPos={matrixPos}
          tablePos={tablePos}
          column={column}
          viewMode={viewMode}
        />
      ))}
      
      {/* Grid Floor */}
      <gridHelper args={[20, 20, '#333', '#222']} position={[0, -1, 0]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
    </>
  );
};

export const TaskSpaceView3D: React.FC<TaskSpaceView3DProps> = ({ tasks, columns }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'matrix' | 'table' | 'free'>('kanban');
  const [error, setError] = useState<string | null>(null);

  // Calculate task positions based on their column and status
  const taskComponents = useMemo(() => {
    const result: JSX.Element[] = [];
    try {
      Object.entries(tasks).forEach(([columnId, columnTasks], columnIndex) => {
        const column = columns.find(c => c.id === columnId);
        if (!column) {
          console.warn('Column not found for tasks:', columnId, columnTasks);
          return;
        }

        columnTasks.forEach((task, taskIndex) => {
          // Kanban view: Tasks are arranged in columns
          const kanbanPos: [number, number, number] = [
            columnIndex * 4 - (columns.length * 2),  // x: spread columns horizontally
            taskIndex * 0.5,                         // y: stack tasks vertically
            0                                        // z: all in same plane
          ];

          // Matrix view: Position based on urgency/importance
          const matrixPos: [number, number, number] = [
            task.urgency ? 4 : -4,     // x: urgent vs not urgent
            0,                         // y: all same height
            task.importance ? 4 : -4   // z: important vs not important
          ];

          // Table view: Tasks in a grid
          const tablePos: [number, number, number] = [
            columnIndex * 2,           // x: columns in grid
            0,                         // y: all same height
            taskIndex * 2              // z: rows in grid
          ];

          result.push(
            <Task3D
              key={task.id}
              task={task}
              kanbanPos={kanbanPos}
              matrixPos={matrixPos}
              tablePos={tablePos}
              column={column}
              viewMode={viewMode}
            />
          );
        });
      });
    } catch (err) {
      console.error('Error creating task components:', err);
      setError(err instanceof Error ? err.message : 'Error creating task components');
    }
    return result;
  }, [tasks, columns, viewMode]);

  if (error) {
    return (
      <div className="absolute top-4 left-4 z-50 bg-red-500 text-white p-4 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant={viewMode === 'kanban' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('kanban')}
        >
          Kanban
        </Button>
        <Button
          variant={viewMode === 'matrix' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('matrix')}
        >
          Matrix
        </Button>
        <Button
          variant={viewMode === 'table' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          Table
        </Button>
      </div>

      <Canvas shadows camera={{ position: [0, 5, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <directionalLight
          position={[0, 8, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        {taskComponents}
        <OrbitControls enableDamping={false} />
        <gridHelper args={[100, 100, '#666666', '#222222']} />
      </Canvas>
    </>
  );
};
