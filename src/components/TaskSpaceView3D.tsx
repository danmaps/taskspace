import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';
import * as THREE from 'three';

interface TaskSpaceView3DProps {
  tasks: Record<string, Task[]>;
  columns: Column[];
}

interface TaskCubeProps {
  task: Task;
  position: [number, number, number];
  column: Column;
}

const TaskCube: React.FC<TaskCubeProps> = ({ task, position, column }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const getTaskColor = () => {
    if (task.urgency && task.importance) return '#ef4444'; // Red - Do First
    if (!task.urgency && task.importance) return '#eab308'; // Yellow - Schedule
    if (task.urgency && !task.importance) return '#f97316'; // Orange - Delegate
    return '#6b7280'; // Gray - Eliminate
  };
  const getCubeSize = () => {
    // Bigger base size with slight variation based on content
    const baseSize = 1.5;
    const titleLength = task.title.length;
    const hasDescription = !!task.description;
    const hasTags = task.tags && task.tags.length > 0;
    
    return baseSize + (titleLength > 30 ? 0.3 : 0) + (hasDescription ? 0.2 : 0) + (hasTags ? 0.1 : 0);
  };
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[getCubeSize(), getCubeSize(), getCubeSize()]} />
        <meshStandardMaterial
          color={getTaskColor()}
          transparent
          opacity={hovered ? 0.9 : 0.8}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      
      {/* Title text on the cube */}
      <Text
        position={[0, 0, getCubeSize() / 2 + 0.05]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={getCubeSize() * 0.9}
        textAlign="center"
      >
        {task.title}
      </Text>
      
      {hovered && (
        <Html
          position={[0, getCubeSize() / 2 + 0.5, 0]}
          center
          distanceFactor={8}
          occlude
        >
          <div className="bg-black/80 text-white p-3 rounded-lg max-w-xs">
            <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
            <p className="text-xs text-gray-300 mb-2">{column.title}</p>
            {task.description && (
              <p className="text-xs text-gray-400 mb-2">{task.description}</p>
            )}
            <div className="flex gap-1 text-xs">
              <span className={`px-1 rounded ${task.urgency ? 'bg-red-600' : 'bg-gray-600'}`}>
                {task.urgency ? 'Urgent' : 'Not Urgent'}
              </span>
              <span className={`px-1 rounded ${task.importance ? 'bg-yellow-600' : 'bg-gray-600'}`}>
                {task.importance ? 'Important' : 'Not Important'}
              </span>
            </div>
            {task.assignee && (
              <p className="text-xs text-gray-400 mt-1">Assigned: {task.assignee}</p>
            )}
            {task.dueDate && (
              <p className="text-xs text-gray-400">Due: {task.dueDate}</p>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-blue-600 px-1 rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
const TaskSpace3D: React.FC<TaskSpaceView3DProps> = ({ tasks, columns }) => {
  const urgencyRange = 6; // Y-axis range for urgency
  const importanceRange = 6; // Z-axis range for importance
    const taskCubes = useMemo(() => {
    const cubes: JSX.Element[] = [];
    
    // Calculate spacing between columns - tasks should be right next to each other
    const columnSpacing = 10;
    const taskSpacing = 2; // Close spacing between tasks in same column
    
    Object.entries(tasks).forEach(([columnId, columnTasks]) => {
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      const columnIndex = columns.findIndex(col => col.id === columnId);
      const baseX = (columnIndex - (columns.length - 1) / 2) * columnSpacing;
      
      columnTasks.forEach((task, taskIndex) => {
        // Z-axis: Column position (sequence in workflow)
        const z = baseX;
          // X-axis: Urgency (urgent tasks to the right, not urgent to the left)
        const x = task.urgency ? 3 : -3;
        
        // Y-axis: Importance (important tasks higher up, not important lower down)
        const y = task.importance ? 3 : -3;
        
        // Position tasks in sequence within their quadrant
        const tasksInSameQuadrant = columnTasks.filter(t => 
          t.urgency === task.urgency && t.importance === task.importance
        );
        const sequenceIndex = tasksInSameQuadrant.findIndex(t => t.id === task.id);
        
        // Get cube size for this task to calculate proper spacing
        const cubeSize = 1.5 + (task.title.length > 30 ? 0.3 : 0) + 
                        (task.description ? 0.2 : 0) + 
                        (task.tags && task.tags.length > 0 ? 0.1 : 0);
        
        // Make cubes touch by spacing them exactly one cube size apart
        const sequenceOffset = (sequenceIndex - (tasksInSameQuadrant.length - 1) / 2) * cubeSize;
        
        const finalPosition: [number, number, number] = [
          x,
          y,
          z + sequenceOffset
        ];
        
        cubes.push(
          <TaskCube
            key={task.id}
            task={task}
            position={finalPosition}
            column={column}
          />
        );
      });
    });
    
    return cubes;
  }, [tasks, columns]);  return (
    <>
      {/* Updated Axis Labels for new positioning */}
      <Text position={[5, 0, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="center">
        URGENT
      </Text>
      <Text position={[-5, 0, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="center">
        NOT URGENT
      </Text>
      
      <Text position={[0, 5, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="center">
        IMPORTANT
      </Text>
      <Text position={[0, -5, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="center">
        NOT IMPORTANT
      </Text>      {/* Column Labels along Z-axis */}
      {columns.map((column, index) => {
        const zPosition = (index - (columns.length - 1) / 2) * 10;
        return (
          <Text
            key={`column-${column.id}`}
            position={[0, -6, zPosition]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={0.8}
            color="#aaa"
            anchorX="center"
            anchorY="center"
          >
            {column.title}
          </Text>
        );
      })}
      
      {/* Task cubes */}
      {taskCubes}
      
      {/* Clean lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.0} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.4} />
    </>
  );
};

export const TaskSpaceView3D: React.FC<TaskSpaceView3DProps> = ({ tasks, columns }) => {
  return (
    <Canvas 
      shadows 
      camera={{ position: [20, 15, 20], fov: 60 }}
      style={{ background: 'linear-gradient(to bottom, #0f0f23, #000)' }}
    >
      <TaskSpace3D tasks={tasks} columns={columns} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI}
        minDistance={8}
        maxDistance={80}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
};
