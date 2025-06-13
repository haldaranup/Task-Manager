import { parse, format, addDays, addWeeks, setHours, setMinutes } from 'date-fns';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

interface ParsedTask {
  taskName: string;
  assignee: string;
  dueDate: Date;
  priority: 'P1' | 'P2' | 'P3';
}

export function parseTaskInput(input: string): ParsedTask {
  const tokens = tokenizer.tokenize(input.toLowerCase());
  if (!tokens) {
    throw new Error('Invalid input');
  }

  // Extract priority
  const priorityMatch = input.match(/P[1-3]/i);
  const priority = (priorityMatch ? priorityMatch[0].toUpperCase() : 'P3') as 'P1' | 'P2' | 'P3';

  // Extract time
  const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  let hours = 12;
  let minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (timeMatch[3].toLowerCase() === 'pm' && hours !== 12) {
      hours += 12;
    } else if (timeMatch[3].toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
  }

  // Extract date
  let dueDate = new Date();
  dueDate = setHours(dueDate, hours);
  dueDate = setMinutes(dueDate, minutes);

  if (input.toLowerCase().includes('tomorrow')) {
    dueDate = addDays(dueDate, 1);
  } else if (input.toLowerCase().includes('next week')) {
    dueDate = addWeeks(dueDate, 1);
  } else {
    // Try to parse specific date formats
    const dateFormats = [
      'd MMMM',
      'd MMM',
      'MMMM d',
      'MMM d',
      'd MMMM yyyy',
      'd MMM yyyy'
    ];

    for (const dateFormat of dateFormats) {
      try {
        const parsedDate = parse(input, dateFormat, new Date());
        if (parsedDate.toString() !== 'Invalid Date') {
          dueDate = parsedDate;
          dueDate = setHours(dueDate, hours);
          dueDate = setMinutes(dueDate, minutes);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Extract assignee (usually a proper noun after the task)
  const words = input.split(' ');
  let taskName = '';
  let assignee = '';
  let foundAssignee = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.toLowerCase() === 'by' || word.toLowerCase() === 'at') {
      foundAssignee = true;
      continue;
    }

    if (!foundAssignee) {
      taskName += (taskName ? ' ' : '') + word;
    } else if (!word.match(/P[1-3]/i) && !word.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)) {
      assignee = word;
      break;
    }
  }

  // Clean up task name
  taskName = taskName.replace(/\s+/g, ' ').trim();
  if (taskName.endsWith('by') || taskName.endsWith('at')) {
    taskName = taskName.slice(0, -2).trim();
  }

  return {
    taskName,
    assignee,
    dueDate,
    priority
  };
} 