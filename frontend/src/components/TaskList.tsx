'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Task, UpdateTaskInput, TaskFilters, TaskStatusType } from '@/lib/api/taskApi';
import taskApi, { TaskStatus } from '@/lib/api/taskApi';

const updateTaskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required').max(200, 'Task name is too long'),
  assignee: z.string().min(1, 'Assignee is required').max(100, 'Assignee name is too long'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['P1', 'P2', 'P3']),
  status: z.enum([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED]),
  description: z.string().max(1000, 'Description is too long').optional(),
  tags: z.array(z.string().max(50)).optional()
});

export default function TaskList() {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.getTasks(filters)
  });

  const createTaskMutation = useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTaskInput('');
      setSuccess('Task created successfully');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskInput }) =>
      taskApi.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      setSuccess('Task updated successfully');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatusType }) =>
      taskApi.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSuccess('Task status updated successfully');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSuccess('Task deleted successfully');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema) as any
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskInput.trim()) {
      createTaskMutation.mutate({ input: newTaskInput });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    reset({
      taskName: task.taskName,
      assignee: task.assignee,
      dueDate: format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm"),
      priority: task.priority,
      status: task.status,
      description: task.description,
      tags: task.tags
    });
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatusType) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const onSubmit = (data: UpdateTaskInput) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask._id, updates: data });
    }
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return 'error';
      case 'P2':
        return 'warning';
      case 'P3':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: TaskStatusType) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleCreateTask}>
          <TextField
            fullWidth
            label="Enter task in natural language"
            placeholder="e.g., Submit report Riya by 4pm Friday"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={createTaskMutation.isPending}
          >
            Add Task
          </Button>
        </form>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Box>
          {showFilters && (
            <>
              <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status || ''}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    {Object.values(TaskStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={filters.priority || ''}
                    onChange={handleFilterChange}
                    label="Priority"
                  >
                    <MenuItem value="">All</MenuItem>
                    {['P1', 'P2', 'P3'].map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Search"
                  name="search"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </Box>
            </>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Task
                  <Tooltip title="Sort by task name">
                    <IconButton size="small" onClick={() => handleSortChange('taskName')}>
                      <SortIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Assignee
                  <Tooltip title="Sort by assignee">
                    <IconButton size="small" onClick={() => handleSortChange('assignee')}>
                      <SortIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Due Date
                  <Tooltip title="Sort by due date">
                    <IconButton size="small" onClick={() => handleSortChange('dueDate')}>
                      <SortIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task._id}>
                <TableCell>{task.taskName}</TableCell>
                <TableCell>{task.assignee}</TableCell>
                <TableCell>
                  {format(new Date(task.dueDate), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value as TaskStatusType)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    {Object.values(TaskStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        <Chip
                          label={status}
                          color={getStatusColor(status)}
                          size="small"
                          sx={{ width: '100%' }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditTask(task)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => deleteTaskMutation.mutate(task._id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingTask} onClose={() => setEditingTask(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              fullWidth
              label="Task Name"
              {...register('taskName')}
              error={!!errors.taskName}
              helperText={errors.taskName?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Assignee"
              {...register('assignee')}
              error={!!errors.assignee}
              helperText={errors.assignee?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="Due Date"
              {...register('dueDate')}
              error={!!errors.dueDate}
              helperText={errors.dueDate?.message}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                {...register('priority')}
                label="Priority"
                error={!!errors.priority}
              >
                {['P1', 'P2', 'P3'].map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    <Chip
                      label={priority}
                      color={getPriorityColor(priority)}
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                {...register('status')}
                label="Status"
                error={!!errors.status}
              >
                {Object.values(TaskStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    <Chip
                      label={status}
                      color={getStatusColor(status)}
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateTaskMutation.isPending}
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 