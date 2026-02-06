import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { todoAPI } from '../../services/api';
import type { Todo, ApiError } from '../../types';
import { AxiosError } from 'axios';
import TodoForm from './TodoForm';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState('');
  const deleteConfirmRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Close delete confirmation when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking the delete button itself or the tooltip
      if (
        (deleteButtonRef.current && deleteButtonRef.current.contains(target)) ||
        (deleteConfirmRef.current && deleteConfirmRef.current.contains(target))
      ) {
        return;
      }

      setShowDeleteConfirm(false);
    };

    if (showDeleteConfirm) {
      // Use a small timeout to avoid conflicts with the button click
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDeleteConfirm]);

  const handleToggleComplete = async () => {
    // Optimistic update: immediately update the UI before the API call
    const optimisticTodo = { ...todo, completed: !todo.completed };
    onUpdate(optimisticTodo);
    setError('');

    try {
      // Make the API call
      const updated = await todoAPI.update(todo.id, {
        completed: !todo.completed,
      });
      // Update with the actual server response
      onUpdate(updated);
    } catch (err) {
      // Revert the optimistic update on error
      onUpdate(todo);
      const axiosError = err as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.error ||
        'Failed to update todo. Please try again.'
      );
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await todoAPI.delete(todo.id);
      onDelete(todo.id);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.error ||
        'Failed to delete todo. Please try again.'
      );
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdate = (updatedTodo: Todo) => {
    onUpdate(updatedTodo);
    setIsEditing(false);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-soft-red bg-soft-red/10 border-soft-red/20';
    if (priority >= 5) return 'text-soft-yellow bg-soft-yellow/10 border-soft-yellow/20';
    return 'text-soft-green bg-soft-green/10 border-soft-green/20';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-neutral-900 mb-5">Edit Todo</h3>
        <TodoForm
          todo={todo}
          onSuccess={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-smooth p-5 group">
      {error && (
        <div className="rounded-lg bg-soft-red/10 border border-soft-red/20 p-3 mb-3">
          <p className="text-xs text-soft-red font-medium">{error}</p>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Compact Checkbox */}
        <div className="flex-shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggleComplete}
            className="w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-100 border-2 border-neutral-300 rounded-md cursor-pointer transition-smooth"
          />
        </div>

        {/* Content - Clickable to expand */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Title with Priority inline */}
          <div className="flex items-start gap-2 mb-0.5">
            <h3
              className={`text-base font-semibold leading-tight flex-1 ${
                todo.completed
                  ? 'text-neutral-400 line-through'
                  : 'text-neutral-900'
              }`}
            >
              {todo.title}
            </h3>
            {todo.priority > 0 && (
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold border flex-shrink-0 ${getPriorityColor(
                  todo.priority
                )}`}
              >
                P{todo.priority}
              </span>
            )}
          </div>

          {/* Date directly under title - always visible */}
          {todo.due_date && (
            <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(todo.due_date)}</span>
            </div>
          )}

          {/* Description - only when expanded */}
          {isExpanded && todo.description && (
            <div
              className={`text-sm mt-2 leading-relaxed animate-slide-down prose prose-sm max-w-none border border-neutral-200 rounded-lg p-3 bg-neutral-50 ${
                todo.completed ? 'text-neutral-400 prose-neutral-400' : 'text-neutral-600'
              }`}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="my-1">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold my-1">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold my-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
                  code: ({ children }) => <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                  pre: ({ children }) => <pre className="bg-neutral-100 p-2 rounded my-1 overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-neutral-300 pl-2 my-1 italic">{children}</blockquote>,
                  a: ({ children, href }) => <a href={href} className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {todo.description}
              </ReactMarkdown>
            </div>
          )}

          {/* Additional details when expanded */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 animate-slide-down">
              <div className="flex items-center gap-4">
                <span>Created {formatDate(todo.created_at)}</span>
                {todo.updated_at && todo.updated_at !== todo.created_at && (
                  <span>Updated {formatDate(todo.updated_at)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Icon Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-smooth"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete Button with Tooltip */}
          <div className="relative">
            <button
              ref={deleteButtonRef}
              onClick={showDeleteConfirm ? handleDeleteConfirm : handleDeleteClick}
              disabled={isDeleting}
              className={`p-1.5 rounded-lg transition-smooth disabled:opacity-50 ${
                showDeleteConfirm
                  ? 'text-white bg-soft-red hover:bg-red-600'
                  : 'text-neutral-400 hover:text-soft-red hover:bg-red-50'
              }`}
              title={showDeleteConfirm ? 'Click to delete' : 'Delete'}
            >
              {isDeleting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : showDeleteConfirm ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>

            {/* Tooltip */}
            {showDeleteConfirm && !isDeleting && (
              <div ref={deleteConfirmRef} className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-soft-red text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg animate-slide-down">
                Click to confirm delete
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-soft-red rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
