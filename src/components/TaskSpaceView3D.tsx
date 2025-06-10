import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Html } from '@react-three/drei';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { RotateCcw, Grid3X3, Columns } from 'lucide-react';
import * as THREE from 'three';

interface TaskSpaceView3DProps {
  tasks: Record<string, Task[]>;
  columns: Column[];
}

interface Task3DProps {
  task: Task;
  kanbanPos: [number, number, number];
  matrixPos: [number, number, number];
  column?: Column;
  viewMode: 'kanban' | 'matrix' | 'free';
}

const Task3D: React.FC<Task3DProps> = ({ task, kanbanPos, matrixPos, column, viewMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Animate between kanban and matrix positions
  useFrame((state) => {
    if (groupRef.current) {
      const targetPos = viewMode === 'matrix' ? matrixPos : kanbanPos;
      groupRef.current.position.lerp(new THREE.Vector3(...targetPos), 0.05);
    }
    
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getTaskColor = () => {
    if (task.urgency && task.importance) return '#ef4444'; // red
    if (!task.urgency && task.importance) return '#eab308'; // yellow  
    if (task.urgency && !task.importance) return '#f97316'; // orange
    return '#6b7280'; // gray
  };
  return (
    <group ref={groupRef} position={kanbanPos}>
      <Box
        ref={meshRef}
        args={[1.5, 0.2, 1]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={getTaskColor()} 
          transparent 
          opacity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </Box><Text
        position={[0, 0.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX={0}
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
      >
        {task.title}
      </Text>      {column && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.08}
          color="#aaa"
          anchorX={0}
          anchorY="middle"
        >
          {column.title}
        </Text>
      )}
      
      {hovered && (
        <Html position={[0, 0.8, 0]} center>
          <div className="bg-black/80 text-white p-2 rounded-lg max-w-48 text-sm">
            <div className="font-semibold">{task.title}</div>
            {task.description && (
              <div className="text-xs opacity-80 mt-1">{task.description}</div>
            )}
            <div className="flex gap-1 mt-1">
              {task.urgency && (
                <span className="bg-red-500/20 text-red-300 px-1 rounded text-xs">Urgent</span>
              )}
              {task.importance && (
                <span className="bg-yellow-500/20 text-yellow-300 px-1 rounded text-xs">Important</span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const CameraController: React.FC<{ 
  viewMode: 'kanban' | 'matrix' | 'free';
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

const TaskSpace3D: React.FC<TaskSpaceView3DProps & { viewMode: 'kanban' | 'matrix' | 'free' }> = ({ tasks, columns, viewMode }) => {
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
    const positions: Array<{ task: Task; kanbanPos: [number, number, number]; matrixPos: [number, number, number]; column?: Column }> = [];
    
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
      
      positions.push({
        task,
        kanbanPos: [kanbanX, kanbanY, kanbanZ],
        matrixPos: [matrixX, matrixY, matrixZ],
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
      <Text position={[-4, 0, 0]} fontSize={0.15} color="#888" anchorX={0}>NOT URGENT</Text>
        {/* Tasks */}
      {taskPositions.map(({ task, kanbanPos, matrixPos, column }) => (
        <Task3D
          key={task.id}
          task={task}
          kanbanPos={kanbanPos}
          matrixPos={matrixPos}
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
  const [viewMode, setViewMode] = useState<'kanban' | 'matrix' | 'free'>('free');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleViewChange = (newMode: 'kanban' | 'matrix' | 'free') => {
    if (isAnimating || newMode === viewMode) return;
    setIsAnimating(true);
    setViewMode(newMode);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-2 p-4 border-b">
        <h2 className="text-lg font-semibold">3D Task Space</h2>
        <div className="flex gap-2 ml-auto">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('kanban')}
            disabled={isAnimating}
          >
            <Columns className="w-4 h-4 mr-1" />
            Kanban View
          </Button>
          <Button
            variant={viewMode === 'matrix' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('matrix')}
            disabled={isAnimating}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Matrix View
          </Button>
          <Button
            variant={viewMode === 'free' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('free')}
            disabled={isAnimating}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Free View
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-800">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >          <CameraController 
            viewMode={viewMode} 
            onViewChange={() => setIsAnimating(false)}
          />
          <TaskSpace3D tasks={tasks} columns={columns} viewMode={viewMode} />
        </Canvas>
      </div>

      {/* Info Panel */}
      <div className="p-4 bg-muted/50 border-t">
        <div className="text-sm text-muted-foreground">
          <div className="font-medium mb-1">3D Task Space Prototype</div>
          <div>
            <strong>Kanban View:</strong> Tasks arranged by columns (workflow stages)
          </div>
          <div>
            <strong>Matrix View:</strong> Tasks positioned by urgency (X) and importance (Z)
          </div>
          <div>
            <strong>Free View:</strong> Explore the 3D space freely
          </div>
          <div className="mt-2 text-xs">
            <strong>Colors:</strong> 
            <span className="text-red-400 ml-1">Red (Urgent + Important)</span>
            <span className="text-yellow-400 ml-1">Yellow (Important)</span>
            <span className="text-orange-400 ml-1">Orange (Urgent)</span>
            <span className="text-gray-400 ml-1">Gray (Neither)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
