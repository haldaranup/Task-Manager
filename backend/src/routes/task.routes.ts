import express, { Request, Response } from 'express';
import { Task, TaskStatus, taskSchema } from '../models/task.model';
import { parseTaskInput } from '../utils/taskParser';
import { z } from 'zod';

const router = express.Router();

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response) => {
  console.error(err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Create a new task from natural language input
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const parsedTask = parseTaskInput(input);
    const task = new Task({
      ...parsedTask,
      status: TaskStatus.PENDING
    });

    // Validate the task using Zod schema
    const validatedTask = taskSchema.parse(task);
    await task.save();

    res.status(201).json(task);
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
});

// Get all tasks with filtering and sorting
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      assignee,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      search,
      tags
    } = req.query;

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (tags) filter.tags = { $in: (tags as string).split(',') };
    if (search) {
      filter.$or = [
        { taskName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(filter)
      .sort(sort)
      .lean();

    res.json(tasks);
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
});

// Update a task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate updates using Zod schema
    const validatedUpdates = taskSchema.partial().parse(updates);
    
    const task = await Task.findByIdAndUpdate(
      id,
      validatedUpdates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
});

// Update task status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(TaskStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
});

// Delete a task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
});

export const taskRoutes = router; 