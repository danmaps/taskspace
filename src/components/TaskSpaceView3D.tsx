import React, { useRef, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Task } from './KanbanBoard';
import { Column } from '@/integrations/supabase/types';
import * as THREE from 'three';

interface TaskSpaceView3DProps {
  tasks: Record<string, Task[]>;
  columns: Column[];
}

interface TaskSpaceView3DRef {
  setKanbanView: () => void;
  setMatrixView: () => void;
}

interface TaskCubeProps {
  task: Task;
  position: [number, number, number];
  column: Column;
  onHover: (task: Task | null, column: Column | null) => void;
}

const TaskCube: React.FC<TaskCubeProps> = ({ task, position, column, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);
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
        onPointerOver={() => onHover(task, column)}
        onPointerOut={() => onHover(null, null)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[getCubeSize(), getCubeSize(), getCubeSize()]} />
        <meshStandardMaterial
          color={getTaskColor()}
          transparent
          opacity={0.8}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
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
    </group>
  );
};
const CameraController = forwardRef<{ setKanbanView: () => void; setMatrixView: () => void }, {}>((props, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  const animateCamera = (targetPosition: THREE.Vector3, targetLookAt: THREE.Vector3) => {
    if (!controlsRef.current) return;

    const duration = 1500; // Animation duration in ms
    const startTime = Date.now();
    const startPosition = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, eased);
      controlsRef.current.target.lerpVectors(startTarget, targetLookAt, eased);
      controlsRef.current.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };
  useImperativeHandle(ref, () => ({
    setKanbanView: () => {
      // Side view to see columns sequence along Z-axis
      const targetPosition = new THREE.Vector3(-25, 8, 0);
      const targetLookAt = new THREE.Vector3(0, 0, 0);
      animateCamera(targetPosition, targetLookAt);
    },
    setMatrixView: () => {
      // Front view to see urgency/importance matrix
      const targetPosition = new THREE.Vector3(0, 8, 25);
      const targetLookAt = new THREE.Vector3(0, 0, 0);
      animateCamera(targetPosition, targetLookAt);
    }
  }));

  return (
    <OrbitControls 
      ref={controlsRef}
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
  );
});

const TaskSpace3D: React.FC<TaskSpaceView3DProps & {
  onHover: (task: Task | null, column: Column | null) => void;
}> = ({ tasks, columns, onHover }) => {
  const taskCubes = useMemo(() => {
    const cubes: JSX.Element[] = [];
    const columnSpacing = 10;
    Object.entries(tasks).forEach(([columnId, columnTasks]) => {
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      const columnIndex = columns.findIndex(col => col.id === columnId);
      const baseX = (columnIndex - (columns.length - 1) / 2) * columnSpacing;
      columnTasks.forEach((task, taskIndex) => {
        const z = baseX;
        const x = task.urgency ? 3 : -3;
        const y = task.importance ? 3 : -3;
        const tasksInSameQuadrant = columnTasks.filter(t => t.urgency === task.urgency && t.importance === task.importance);
        const sequenceIndex = tasksInSameQuadrant.findIndex(t => t.id === task.id);
        const cubeSize = 1.5 + (task.title.length > 30 ? 0.3 : 0) + (task.description ? 0.2 : 0) + (task.tags && task.tags.length > 0 ? 0.1 : 0);
        const sequenceOffset = (sequenceIndex - (tasksInSameQuadrant.length - 1) / 2) * cubeSize;
        const finalPosition: [number, number, number] = [x, y, z + sequenceOffset];
        cubes.push(
          <TaskCube
            key={task.id}
            task={task}
            position={finalPosition}
            column={column}
            onHover={onHover}
          />
        );
      });
    });
    return cubes;
  }, [tasks, columns, onHover]);
  return (
    <>
      {/* Updated Axis Labels for new positioning */}
      <Text position={[5, 0, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="middle">
        URGENT
      </Text>
      <Text position={[-5, 0, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="middle">
        NOT URGENT
      </Text>
      
      <Text position={[0, 5, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="middle">
        IMPORTANT
      </Text>
      <Text position={[0, -5, 0]} fontSize={1.0} color="#888" anchorX="center" anchorY="middle">
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
            anchorY="middle"
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

export const TaskSpaceView3D = forwardRef<TaskSpaceView3DRef, TaskSpaceView3DProps>(({ tasks, columns }, ref) => {
  const cameraControlsRef = useRef<{ setKanbanView: () => void; setMatrixView: () => void }>(null);
  const [hoveredTask, setHoveredTask] = useState<{ task: Task; column: Column } | null>(null);
  useImperativeHandle(ref, () => ({
    setKanbanView: () => cameraControlsRef.current?.setKanbanView(),
    setMatrixView: () => cameraControlsRef.current?.setMatrixView()
  }));
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas 
        shadows 
        camera={{ position: [-12, 10, 12], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #0f0f23, #000)', width: '100%', height: '100%' }}
      >
        <TaskSpace3D tasks={tasks} columns={columns} onHover={(t, c) => t && c ? setHoveredTask({ task: t, column: c }) : setHoveredTask(null)} />
        <CameraController ref={cameraControlsRef} />
      </Canvas>
      {hoveredTask && (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: 32,
          transform: 'translateY(-50%)',
          zIndex: 1000,
          background: 'rgba(15,15,35,0.98)',
          color: 'white',
          borderRadius: 12,
          boxShadow: '0 4px 32px #0008',
          padding: 24,
          minWidth: 280,
          maxWidth: 340,
          pointerEvents: 'auto',
        }}>
          <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>{hoveredTask.task.title}</h3>
          <p style={{ fontSize: 13, color: '#ccc', marginBottom: 8 }}>{hoveredTask.column.title}</p>
          {hoveredTask.task.description && (
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>{hoveredTask.task.description}</p>
          )}
          <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 6 }}>
            <span style={{ padding: '2px 6px', borderRadius: 4, background: hoveredTask.task.urgency ? '#dc2626' : '#444' }}>
              {hoveredTask.task.urgency ? 'Urgent' : 'Not Urgent'}
            </span>
            <span style={{ padding: '2px 6px', borderRadius: 4, background: hoveredTask.task.importance ? '#ca8a04' : '#444' }}>
              {hoveredTask.task.importance ? 'Important' : 'Not Important'}
            </span>
          </div>
          {hoveredTask.task.assignee && (
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Assigned: {hoveredTask.task.assignee}</p>
          )}
          {hoveredTask.task.dueDate && (
            <p style={{ fontSize: 12, color: '#aaa' }}>Due: {hoveredTask.task.dueDate}</p>
          )}
          {hoveredTask.task.tags && hoveredTask.task.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {hoveredTask.task.tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 11, background: '#2563eb', color: 'white', borderRadius: 4, padding: '2px 6px' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
