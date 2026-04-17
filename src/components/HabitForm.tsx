import { useState } from 'react';
import { Habit } from '@/lib/types';
import { EMOJIS } from '@/lib/constants';
import { createHabit, updateHabit, deleteHabit } from '@/lib/habits';
import { useAuth } from '@/contexts/AuthContext';

interface HabitFormProps {
  onClose: () => void;
  onSuccess: () => void;
  existingHabit?: Habit;
}

export default function HabitForm({ onClose, onSuccess, existingHabit }: HabitFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(existingHabit?.name || '');
  const [icon, setIcon] = useState(existingHabit?.icon || EMOJIS[0]);
  const [category, setCategory] = useState<'positive' | 'negative'>(existingHabit?.category || 'positive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!existingHabit;

  const handleRequestClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await updateHabit(user.uid, existingHabit.id, {
          name: name.trim(),
          icon,
          category
        });
      } else {
        await createHabit(user.uid, {
          name: name.trim(),
          icon,
          category,
          order: Date.now() // Simple ordering
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save habit.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !existingHabit) return;
    const confirm = window.confirm('Are you sure you want to delete this habit?');
    if (!confirm) return;

    setLoading(true);
    try {
      await deleteHabit(user.uid, existingHabit.id);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete habit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
    >
      <div className="modal-content relative">
        <div className="modal-handle"></div>
        <button 
          onClick={handleRequestClose}
          className="absolute top-4 right-4 p-2 text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          ✕
        </button>

        <h2 className="mb-6">{isEditing ? 'Edit Habit' : 'New Habit'}</h2>

        {error && (
          <div className="p-3 mb-6 bg-[var(--danger-light)] text-[var(--danger)] rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="input-group">
            <label className="input-label">Habit Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 10 pages"
              className="input"
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label mb-2">Category</label>
            <div className="flex bg-[var(--muted)] p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setCategory('positive')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  category === 'positive' 
                    ? 'bg-[var(--card)] shadow-sm text-[var(--success)]' 
                    : 'text-[var(--muted-fg)] hover:text-[var(--fg)]'
                }`}
              >
                Good Habit
              </button>
              <button
                type="button"
                onClick={() => setCategory('negative')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  category === 'negative' 
                    ? 'bg-[var(--card)] shadow-sm text-[var(--danger)]' 
                    : 'text-[var(--muted-fg)] hover:text-[var(--fg)]'
                }`}
              >
                Bad Habit
              </button>
            </div>
            <p className="text-xs text-[var(--muted-fg)] mt-1 ml-1">
              {category === 'positive' ? 'Things you want to do (e.g. Exercise)' : 'Things you want to avoid (e.g. Smoke)'}
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Icon</label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-1 rounded-md transition-transform hover:scale-110 ${
                    icon === emoji ? 'bg-[var(--border)] ring-2 ring-[var(--ring)]' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              type="submit" 
              className="btn btn-primary flex-1 btn-lg"
              disabled={loading}
            >
              {loading ? <span className="spinner w-5 h-5 border-2"></span> : (isEditing ? 'Save Changes' : 'Create Habit')}
            </button>
            
            {isEditing && (
              <button 
                type="button" 
                onClick={handleDelete}
                className="btn btn-danger-outline btn-lg px-5"
                disabled={loading}
                title="Delete Habit"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
