import React, { useState } from 'react';
import { todoAPI } from '../../services/api';
import type { Todo, TodoCreateData, TodoUpdateData, ApiError } from '../../types';
import { AxiosError } from 'axios';

interface TodoFormProps {
  todo?: Todo;
  onSuccess: (todo: Todo) => void;
  onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ todo, onSuccess, onCancel }) => {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [priority, setPriority] = useState(todo?.priority || 0);
  const [dueDate, setDueDate] = useState(
    todo?.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : ''
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);

    try {
      const data: TodoCreateData | TodoUpdateData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
      };

      const result = todo
        ? await todoAPI.update(todo.id, data)
        : await todoAPI.create(data);

      onSuccess(result);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const errors = axiosError.response?.data;

      if (errors) {
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return messages;
          })
          .join('. ');
        setError(errorMessages || 'Failed to save todo. Please try again.');
      } else {
        setError('Failed to save todo. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-soft-red/10 border border-soft-red/20 p-3">
          <p className="text-xs text-soft-red font-medium">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-xs font-semibold text-neutral-700 mb-2">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-soft"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-semibold text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-soft resize-none"
          placeholder="Add more details... (optional)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="priority" className="block text-xs font-semibold text-neutral-700 mb-2">
            Priority (0-10)
          </label>
          <input
            id="priority"
            name="priority"
            type="number"
            min="0"
            max="10"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            className="input-soft"
          />
        </div>

        <div>
          <label htmlFor="due-date" className="block text-xs font-semibold text-neutral-700 mb-2">
            Due Date
          </label>
          <input
            id="due-date"
            name="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-soft"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : todo ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TodoForm;
