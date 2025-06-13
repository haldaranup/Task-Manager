# Task-Manager

Objective
Develop a web application that allows users to input task descriptions in natural language, and automatically extract the following structured information:

Task Name

Assignee

Due Date & Time

Priority (default is P3 if not specified)

Parsed tasks should be displayed in a structured, editable UI.

🗣️ Input Examples (Natural Language)
arduino
Copy
Edit
"Finish landing page Aman by 11pm 20th June"
"Call client Rajeev tomorrow 5pm"
"Prepare slides Anup P1 by Friday 10am"
🧠 AI/Parser Expected Output
Task Name	Assigned To	Due Date/Time	Priority
Finish landing page	Aman	11:00 PM, 20 June	P3
Call client	Rajeev	5:00 PM, tomorrow	P3
Prepare slides	Anup	10:00 AM, Friday	P1

Notes for Parser Logic:

If priority is not mentioned → default to P3

Assignee is usually a proper noun following the task name

Due date/time might be in various formats:

"tomorrow 5pm"

"20th June 11pm"

"Friday at 3pm"

Task name ends just before assignee or "by" clause

✅ Functional Requirements
1. Natural Language Task Input
Input field where users type free-form tasks

Example placeholder: e.g., "Submit report Riya by 4pm Friday"

2. Task Parsing (AI or rule-based)
Extract task name, assignee, due date/time, and priority

Display parsed results in structured format

3. Display Parsed Task (UI)
Task board or list view

Columns:

Task

Assigned To

Due Date/Time

Priority

4. Inline Task Editing
Users can click and edit any field (task name, assignee, etc.)

Save or cancel changes