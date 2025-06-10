import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X, Edit2 } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  showEditIcon?: boolean;
  maxLength?: number;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  className = '',
  placeholder = 'Enter text...',
  multiline = false,
  showEditIcon = false,
  maxLength
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    
    return (
      <div className="flex items-center gap-2">
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isLoading}
          className={`${className} ${multiline ? 'resize-none' : ''}`}
          rows={multiline ? 3 : undefined}
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group cursor-pointer ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      {showEditIcon && (
        <Edit2 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline" />
      )}
    </div>
  );
};
