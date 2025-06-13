import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

export interface ITask extends Document {
  taskName: string;
  assignee: string;
  dueDate: Date;
  priority: 'P1' | 'P2' | 'P3';
  status: TaskStatusType;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Validation schema using Zod
export const taskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required').max(200, 'Task name is too long'),
  assignee: z.string().min(1, 'Assignee is required').max(100, 'Assignee name is too long'),
  dueDate: z.date().min(new Date(), 'Due date must be in the future'),
  priority: z.enum(['P1', 'P2', 'P3']),
  status: z.enum([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED]),
  description: z.string().max(1000, 'Description is too long').optional(),
  tags: z.array(z.string().max(50)).optional()
});

const mongooseSchema = new Schema<ITask>({
  taskName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  assignee: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  dueDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3'],
    default: 'P3'
  },
  status: {
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.PENDING
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
mongooseSchema.index({ dueDate: 1 });
mongooseSchema.index({ priority: 1 });
mongooseSchema.index({ status: 1 });
mongooseSchema.index({ assignee: 1 });
mongooseSchema.index({ tags: 1 });

export const Task = mongoose.model<ITask>('Task', mongooseSchema); 