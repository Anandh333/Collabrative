import {
    closestCorners,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { STATUS_LABELS } from '../../utils/constants';
import TaskCard from './TaskCard';

// Sortable task item wrapper
const SortableTaskItem = ({ task, onEdit, onDelete, onStatusChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        isDragging={isDragging}
      />
    </div>
  );
};

// Kanban column
const KanbanColumn = ({ title, status, tasks, onEdit, onDelete, onStatusChange }) => {
  const statusColors = {
    'todo': 'bg-gray-500',
    'in-progress': 'bg-blue-500',
    'review': 'bg-yellow-500',
    'completed': 'bg-green-500'
  };

  return (
    <div className="flex-1 min-w-[280px] bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        <SortableContext
          items={tasks.map(t => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <SortableTaskItem
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskList = ({
  tasks,
  view = 'kanban',
  onEdit,
  onDelete,
  onStatusChange,
  onDragEnd
}) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      const activeTask = tasks.find(t => t._id === active.id);
      
      if (activeTask && onDragEnd) {
        onDragEnd(active.id, over.id);
      }
    }
  };

  // Group tasks by status for Kanban view
  const groupedTasks = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'review': tasks.filter(t => t.status === 'review'),
    'completed': tasks.filter(t => t.status === 'completed')
  };

  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  if (view === 'kanban') {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <KanbanColumn
              key={status}
              title={label}
              status={status}
              tasks={groupedTasks[status]}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onEdit={onEdit}
              onDelete={onDelete}
              showActions={false}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard
          key={task._id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;