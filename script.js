// Correctly import from the Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBb6OANTAhNAGk9e039n-7jiBtN8MgZ4uM",
  authDomain: "gantt-chart-project-fb.firebaseapp.com",
  projectId: "gantt-chart-project-fb",
  storageBucket: "gantt-chart-project-fb.firebasestorage.app",
  messagingSenderId: "1059828755338",
  appId: "1:1059828755338:web:11c0f418b9e7e3ee3ab673"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const allModules = ['Core HR', 'Workforce Planning', 'Compensation', 'Time & Attendance', 'Talent', 'Hiring', 'Learning', 'UK Payroll', 'Sandbox'];
const moduleColors = {
    'Core HR': 'bg-sky-500',
    'Workforce Planning': 'bg-violet-500',
    'Compensation': 'bg-amber-500',
    'Time & Attendance': 'bg-emerald-500',
    'Talent': 'bg-rose-500',
    'Hiring': 'bg-blue-500',
    'Learning': 'bg-indigo-500',
    'UK Payroll': 'bg-fuchsia-500',
    'Sandbox': 'bg-slate-500',
    'Performance': 'bg-pink-500' // Kept for legacy if needed
};


let state = {
    tasks: [],
    milestones: [],
    totalWeeks: 12
};
let dbRef;
let userId;

// --- DOM ELEMENTS ---
const moduleListEl = document.getElementById('module-list');
const ganttContainerEl = document.getElementById('gantt-chart-container');
const weeksInputEl = document.getElementById('total-weeks-input');
const detailPanel = document.getElementById('detail-panel');
const detailPanelOverlay = document.getElementById('detail-panel-overlay');
const detailPanelTitle = document.getElementById('detail-panel-title');
const detailPanelContent = document.getElementById('detail-panel-content');
const detailPanelClose = document.getElementById('detail-panel-close');


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', init);

async function init() {
    document.getElementById('app-id-display').textContent = firebaseConfig.appId;
    setupEventListeners();
    renderModules();
    await setupAuthAndListeners();
}

async function setupAuthAndListeners() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            document.getElementById('user-id-display').textContent = userId;
            dbRef = doc(db, 'artifacts', firebaseConfig.appId, 'public', 'data', 'gantt', 'state');

            onSnapshot(dbRef, (docSnap) => {
                if (docSnap.exists() && docSnap.data().tasks) {
                    const savedState = docSnap.data();
                    const defaultTasks = getInitialTasks();
                
                    // Merge saved tasks with templates to ensure details are always present
                    state.tasks = savedState.tasks.map(savedTask => {
                        const template = defaultTasks.find(t => t.name === savedTask.name);
                        // Combine template with saved data, letting saved data override defaults
                        return template ? { ...template,
                            ...savedTask
                        } : savedTask;
                    });
                
                    state.milestones = savedState.milestones || [];
                    state.totalWeeks = savedState.totalWeeks || 12;

                } else {
                    console.log("No document found or empty tasks. Creating with default detailed state.");
                    state.tasks = getInitialTasks();
                    state.milestones = [];
                    saveState(); 
                }
                render();
            }, (error) => {
                console.error("Firestore snapshot error:", error);
                showInfoModal('Connection Error', 'Could not load project data.');
            });
        }
    });

    try {
        await signInAnonymously(auth);
    } catch(error) {
        console.error("Authentication failed:", error);
        document.getElementById('user-id-display').textContent = 'Auth Error';
        showInfoModal('Authentication Error', 'Could not sign in to the collaboration service.');
    }
}

function getInitialTasks() {
    let idCounter = Date.now();
    const now = () => idCounter++;
    return [
        { id: now(), name: 'Project Kick-off', start: 0, duration: 1, color: 'bg-green-500', children: [], isExpanded: false },
        { 
            id: now(), name: 'Core HR', start: 1, duration: 4, color: moduleColors['Core HR'], isExpanded: false,
            children: [
                { id: now(), name: 'Onboarding Workflow Setup', start: 1, duration: 2, color: 'bg-sky-400' },
                { id: now(), name: 'Custom Fields Configuration', start: 2, duration: 2, color: 'bg-sky-400' },
                { id: now(), name: 'Employee Data Import', start: 3, duration: 2, color: 'bg-sky-400' },
            ],
            details: {
                title: 'Core HR Implementation',
                sections: [
                    {
                        heading: 'Bob 101 (Required)',
                        content: "This stage covers the initial configuration that sets you up for long-term success. It includes standard data fields, common permission groups, time off templates, and more."
                    },
                    {
                        heading: 'Data structure and migration',
                        content: "We will work with you to define your data structure and seamlessly import your data into Bob. This includes planning your data structure to support key business needs with a strategic mindset into your growth plans and focus. Providing hands-on support on data migration, including people and payroll data, we will ensure you have a sound foundation to build on."
                    },
                    {
                        heading: 'Permissions and system settings',
                        content: 'Should you require customization of user roles and role permissions to support organizational needs, we will work with you to help you define and configure it. This may include site or department-specific settings.'
                    },
                    {
                        heading: 'Bob 102 (Based on project goals)',
                        content: 'This second stage covers customized configuration workshops to meet your specific organizational needs and get maximum value from Bob.'
                    },
                    {
                        heading: 'Time off',
                        content: 'Country-specific templates are available in Bob. To meet unique time off needs, we will work through specific use cases to ensure policies are correctly built and assigned to the correct employees. This also includes hands-on support for time off data migration.'
                    },
                    {
                        heading: 'Flows and task lists',
                        content: "Flows and task lists are the backbone of manager and employee self-service. We will consult on and co-build organizational flows and task lists that support your operations needs. This may include employee onboarding, offboarding, self-service and data update processes."
                    },
                    {
                        heading: 'Analytics and dashboards',
                        content: 'While Bob has many preconfigured dashboards and reports, we will consult on custom report configuration and report scheduling to meet the analytic needs of your business.'
                    },
                    {
                        heading: 'Docs',
                        content: "This workshop focuses on document management, including utilizing Bob's eSign functionality."
                    },
                    {
                        heading: 'Job Catalog',
                        content: "This workshop covers attribute settings, field review, values creation, and mass import of your current job catalog. It does NOT cover recommendation or creation of a job catalog for your company."
                    }
                ]
            }
        },
        {
            id: now(), name: 'Workforce Planning', start: 2, duration: 7, color: moduleColors['Workforce Planning'], children: [], isExpanded: false,
            details: {
                title: 'Workforce Planning Workshops',
                sections: [
                    { heading: 'People Data', content: "Review of your current People data to support optimization for HiBob’s Workforce Planning Modules." },
                    { heading: 'Job Catalog', content: "Support in the creation of Bob’s job catalog, assigning attributes to each job, and importing your job catalog." },
                    { heading: 'Positions', content: "Manage positions in Bob, aligning them to the job catalog and linking them to your current employee structure, including To Be Hired (TBH) positions." },
                    { heading: 'Automation', content: "Integrate Bob’s WFP elements with Core HR processes like new hire flows, and support setup of Greenhouse ATS integration." },
                    { heading: 'Planning Events', content: "Workshop for setting up your first workforce planning event in Bob, including scope, planners, and permissions." },
                    { heading: 'Analytics', content: "Track & measure your KPIs, review planned positions, and compare them with your recruitment pipeline." }
                ]
            }
        },
        { 
            id: now(), name: 'Compensation', start: 3, duration: 5, color: moduleColors['Compensation'], isExpanded: false,
            children: [
                { id: now(), name: 'Compensation Benchmarking', start: 3, duration: 2, color: 'bg-amber-400' },
                { id: now(), name: 'Salary Structure Setup', start: 5, duration: 2, color: 'bg-amber-400' },
                { id: now(), name: 'Bonus Plan Configuration', start: 6, duration: 2, color: 'bg-amber-400' },
            ],
            details: {
                title: 'Compensation Workshops',
                sections: [
                    { heading: 'Data Import', content: 'Ensuring that your people and payroll data supports your strategy within compensation and the relevant metrics are available to make data based decisions.' },
                    { heading: 'Event Enablement', content: 'Workshops focused on setting up your compensation event, including components, participants vs eligibility, budgets, and benchmarking.' },
                    { heading: 'Compensation Bands', content: 'Also known as salary bands, this allows you to set the minimum, mid, and maximum amount a company will pay someone.' },
                    { heading: 'Worksheet Management', content: 'Utilizing Hibob’s compensation management for both admin and manager views to support end-user enablement and usability, including running and closing an event.' }
                ]
            }
        },
        {
            id: now(), name: 'Time & Attendance', start: 4, duration: 4, color: moduleColors['Time & Attendance'], children: [], isExpanded: false,
            details: {
                title: 'Time & Attendance Workshops',
                sections: [
                    { heading: 'People Data & Discovery', content: "Review of your current People data and setup of Time & Attendance reporting requirements." },
                    { heading: 'Time & Attendance Cycles', content: "Enablement and solutionizing on set up of T&A cycles, including required approval flow processes." },
                    { heading: 'Project Tracking', content: "Use Project tracking to create projects and tasks and assign employees to gain insights into where resource time is being used." },
                    { heading: 'Clock Integration (Optional)', content: "Set up and open a Clock Integration within HiBob." }
                ]
            }
        },
        {
            id: now(), name: 'Talent', start: 5, duration: 3, color: moduleColors['Talent'], children: [], isExpanded: false,
            details: {
                title: 'Talent Workshops',
                sections: [
                    { heading: 'Performance Reviews', content: 'Create & develop a seamless way to deliver qualitative performance reviews, including self, manager, peer, and upward feedback.' },
                    { heading: 'Goals', content: 'Inspire productivity by setting goals to keep everyone on track and aligned, empowering managers to motivate and drive outcomes.' },
                    { heading: '1on1s', content: 'Support a dialogue between employees and managers with regular 1-on-1 check-ins to create a culture of ongoing feedback.' },
                    { heading: 'Surveys', content: 'Empower leaders to make informed decisions by using company surveys to understand sentiment and guide action plans.' },
                    { heading: 'Talent Groups', content: 'Helps admins and managers support culture initiatives by nominating and identifying employees based on their interactions.' }
                ]
            }
        },
        {
            id: now(), name: 'Hiring', start: 6, duration: 6, color: moduleColors['Hiring'], children: [], isExpanded: false,
            details: {
                title: 'Hiring Workshops',
                sections: [
                    { heading: 'Data Import', content: "Hands-on support with data import process for job openings and candidate details." },
                    { heading: 'Hiring Settings', content: "Overview and configuration of settings, permissions, hiring roles, fields (offer, candidate, job), approval flows, and templates." },
                    { heading: 'Job Openings & Candidate Management', content: "Enablement on Job opening structure, process, and candidate flow in the hiring pipeline." },
                    { heading: 'Integrations & Job Marketing', content: "Guidance and support on Job Marketing and Integrations, with step-by-step setup guides for career pages, calendars, job boards, and emails." },
                    { heading: 'Hiring Analytics', content: "Uncover key analysis of your hiring process to support visibility of your Hiring KPIs with tailored reports." }
                ]
            }
        },
        {
            id: now(), name: 'Learning', start: 7, duration: 5, color: moduleColors['Learning'], children: [], isExpanded: false,
            details: {
                title: 'Learning Workshops',
                sections: [
                    { heading: 'Learning Fundamentals', content: "Set up permissions across your organization, allowing key stakeholders visibility to HiBob learning and outcomes." },
                    { heading: 'Training Catalog', content: "Set up learning courses (via integration partners or manually) to align with your business options. Grant provider access and set up categories, tags, and filters." },
                    { heading: 'Course Assignment & Progression', content: "Assign courses from your training catalog to your employees and empower your managers to monitor their learning journey." }
                ]
            }
        },
        {
            id: now(), name: 'UK Payroll', start: 8, duration: 4, color: moduleColors['UK Payroll'], children: [], isExpanded: false,
            details: {
                title: 'Payroll Hub Workshops',
                sections: [
                    { heading: 'Discovery', content: "Review and understand your payroll cycles, reporting requirements and current employee data to support Payroll Hub Implementation." },
                    { heading: 'Payroll Hub Integration', content: "Workshop and build your first Hibob payroll hub report configuration, including field mapping, data upload, and cycle setup." },
                    { heading: 'Validation', content: "Review and run payroll in parallel with Bob to validate data flows between Bob and your payroll solution." }
                ]
            }
        }
    ];
}


function saveState() {
    if (!dbRef) return;
    setDoc(dbRef, state, { merge: true }).catch(error => {
        console.error("Error saving state:", error);
        showInfoModal('Save Error', 'Could not save changes to the project.');
    });
}

// --- RENDERING ---

function render() {
    if (!ganttContainerEl) return;
    renderModules(); // <-- ADD THIS LINE
    weeksInputEl.value = state.totalWeeks;
    renderGanttChart();
}

function renderModules() {
    moduleListEl.innerHTML = '';
    allModules.forEach(mod => {
        const id = `mod-${mod.replace(/\s+/g, '-')}`;
        const label = document.createElement('label');
        label.htmlFor = id;
        label.className = 'cursor-pointer';
        label.innerHTML = `<input type="checkbox" id="${id}" value="${mod}" class="hidden peer"><span class="peer-checked:bg-blue-100 peer-checked:text-blue-700 px-4 py-2 rounded-full border border-slate-300 transition-colors">${mod}</span>`;
        moduleListEl.appendChild(label);
    });
}

function renderGanttChart() {
    ganttContainerEl.innerHTML = ''; 

    const table = document.createElement('table');
    table.className = 'w-full border-collapse';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th class="sticky left-0 bg-white w-56 p-3 text-left font-semibold border-b z-20">Task</th>`;
    for (let i = 1; i <= state.totalWeeks; i++) {
        headerRow.innerHTML += `<th class="p-3 text-slate-500 font-medium border-b border-l text-sm">W${i}</th>`;
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    (state.tasks || []).forEach((task, index) => {
        renderTaskRowRecursive(task, 0, tbody, index);
    });
    table.appendChild(tbody);
    ganttContainerEl.appendChild(table);
    
    setupGanttEventListeners();
    
    requestAnimationFrame(() => {
         ganttContainerEl.querySelectorAll('.gantt-bar').forEach(adjustBarText);
    });
}

function renderTaskRowRecursive(task, level, tbody, index) {
    const tr = document.createElement('tr');
    tr.dataset.taskId = task.id;
    if (task.details) {
        tr.classList.add('cursor-pointer', 'hover:bg-slate-50');
    }
    
    const isParent = task.children && task.children.length > 0;

    if (level === 0) {
        tr.dataset.index = index;
        tr.draggable = true;
    }

    const nameCell = document.createElement('td');
    nameCell.className = 'sticky left-0 bg-white p-3 border-b border-r';
    nameCell.style.paddingLeft = `${0.75 + level * 1.5}rem`;
    
    const nameContainer = document.createElement('div');
    nameContainer.className = 'task-name-container';
    
    if (level === 0) nameContainer.innerHTML += `<span class="reorder-handle">⠿</span>`;
    else nameContainer.innerHTML += `<span class="w-4 inline-block"></span>`;
    
    if (isParent) {
        const iconClass = task.isExpanded ? 'toggle-expand is-expanded' : 'toggle-expand';
        const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${iconClass}"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        nameContainer.innerHTML += icon;
    } else if (level > 0) {
         nameContainer.innerHTML += `<span class="w-4 inline-block ml-2"></span>`;
    }

    nameContainer.innerHTML += `<span class="font-medium">${task.name}</span>`;
    nameCell.appendChild(nameContainer);
    tr.appendChild(nameCell);

    const ganttCell = document.createElement('td');
    ganttCell.colSpan = state.totalWeeks;
    ganttCell.className = 'relative p-0 border-b';
    ganttCell.style.height = '60px';

    for (let i = 0; i < state.totalWeeks; i++) {
        const gridLine = document.createElement('div');
        gridLine.className = 'absolute top-0 bottom-0 border-l';
        gridLine.style.left = `calc(${i / state.totalWeeks} * 100%)`;
        ganttCell.appendChild(gridLine);
    }

    const bar = createGanttBar(task);
    ganttCell.appendChild(bar);

    const taskMilestones = (state.milestones || []).filter(ms => ms.taskId == task.id);
    taskMilestones.forEach(ms => {
        const star = document.createElement('div');
        star.className = 'milestone-symbol';
        star.dataset.milestoneId = ms.id;
        star.style.left = `calc(${(ms.week - 0.5) / state.totalWeeks} * 100%)`;
        star.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="#a16207" stroke-width="1"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
            <span class="milestone-tooltip">${ms.label}</span>
        `;
        ganttCell.appendChild(star);
    });

    tr.appendChild(ganttCell);
    tbody.appendChild(tr);

    if (isParent && task.isExpanded) {
        task.children.forEach(childTask => {
            renderTaskRowRecursive(childTask, level + 1, tbody);
        });
    }
}

function createGanttBar(task) {
    const bar = document.createElement('div');
    bar.className = `gantt-bar text-white ${task.color} transition-all duration-150`;
    bar.style.left = `calc(${task.start / state.totalWeeks} * 100%)`;
    bar.style.width = `calc(${task.duration / state.totalWeeks} * 100%)`;
    bar.dataset.taskId = task.id;
    
    const barLabel = document.createElement('span');
    barLabel.className = 'gantt-bar-label';
    barLabel.textContent = task.name;
    bar.appendChild(barLabel);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task-btn';
    deleteBtn.innerHTML = `&times;`;
    deleteBtn.dataset.taskId = task.id;
    bar.appendChild(deleteBtn);

    const leftHandle = document.createElement('div');
    leftHandle.className = 'resize-handle resize-handle-left';
    bar.appendChild(leftHandle);
    
    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle resize-handle-right';
    bar.appendChild(rightHandle);

    return bar;
}

function adjustBarText(bar) {
    const barLabel = bar.querySelector('.gantt-bar-label');
    if (!barLabel) return;
    const MIN_SCALE = 0.5;
    const PADDING = 45;
    barLabel.style.transform = 'scale(1)';
    const textWidth = barLabel.scrollWidth;
    const availableWidth = bar.clientWidth - PADDING;
    if (textWidth <= availableWidth) {
        barLabel.style.visibility = 'visible';
        barLabel.style.transform = 'scale(1)';
        return;
    }
    const scale = availableWidth / textWidth;
    if (scale < MIN_SCALE) {
        barLabel.style.visibility = 'hidden';
    } else {
        barLabel.style.visibility = 'visible';
        barLabel.style.transform = `scale(${scale})`;
    }
}

// --- EVENT LISTENERS & UTILS ---

function findTaskById(tasks, taskId) {
    for (const task of tasks) {
        if (task.id == taskId) return task;
        if (task.children) {
            const found = findTaskById(task.children, taskId);
            if (found) return found;
        }
    }
    return null;
}

function openDetailPanel(task) {
    if (!task.details) return; 

    detailPanelTitle.textContent = task.details.title;
    detailPanelContent.innerHTML = ''; 

    task.details.sections.forEach(section => {
        const sectionEl = document.createElement('div');
        sectionEl.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">${section.heading}</h3>
            <p class="text-slate-600">${section.content}</p>
        `;
        detailPanelContent.appendChild(sectionEl);
    });

    detailPanel.classList.add('is-open');
    detailPanelOverlay.classList.add('is-open');
}

function closeDetailPanel() {
    detailPanel.classList.remove('is-open');
    detailPanelOverlay.classList.remove('is-open');
}


function setupEventListeners() {
    document.getElementById('update-timeline-btn').addEventListener('click', handleUpdateTimeline);
    document.getElementById('add-btn').addEventListener('click', handleAddModules);
    
    document.getElementById('add-milestone-btn').addEventListener('click', () => handleOpenMilestoneModal());
    document.getElementById('cancel-milestone-btn').addEventListener('click', handleCloseMilestoneModal);
    document.getElementById('save-milestone-btn').addEventListener('click', handleSaveMilestone);
    document.getElementById('delete-milestone-btn').addEventListener('click', handleDeleteMilestone);
    
    detailPanelClose.addEventListener('click', closeDetailPanel);
    detailPanelOverlay.addEventListener('click', closeDetailPanel);
    
    ganttContainerEl.addEventListener('click', (e) => {
        const milestoneSymbol = e.target.closest('.milestone-symbol');
        if (milestoneSymbol) {
            handleOpenMilestoneModal(milestoneSymbol.dataset.milestoneId);
            return;
        }

        const toggleBtn = e.target.closest('.toggle-expand');
        if (toggleBtn) {
            const taskId = toggleBtn.closest('tr').dataset.taskId;
            handleToggleExpand(taskId);
            return; 
        }

        const taskRow = e.target.closest('tr[data-task-id]');
        if(taskRow){
            const taskId = taskRow.dataset.taskId;
            const task = findTaskById(state.tasks, taskId);
            if (task && task.details) {
                openDetailPanel(task);
            }
        }
    });
}

function setupGanttEventListeners() {
    ganttContainerEl.querySelectorAll('.gantt-bar').forEach(bar => bar.addEventListener('mousedown', handleDragStart));
    ganttContainerEl.querySelectorAll('.delete-task-btn').forEach(btn => btn.addEventListener('click', handleDeleteTask));
    ganttContainerEl.querySelectorAll('tr[draggable="true"]').forEach(tr => {
        tr.addEventListener('dragstart', handleReorderStart);
        tr.addEventListener('dragover', handleReorderOver);
        tr.addEventListener('dragleave', handleReorderLeave);
        tr.addEventListener('drop', handleReorderDrop);
    });
}

// --- MODAL HANDLERS ---
function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    modal.querySelector('#confirmation-title').textContent = title;
    modal.querySelector('#confirmation-message').textContent = message;
    const buttonsContainer = modal.querySelector('#confirmation-buttons');
    buttonsContainer.innerHTML = `
        <button id="confirm-cancel" class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-5 rounded-lg transition-colors">Cancel</button>
        <button id="confirm-ok" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors">Confirm</button>
    `;
    modal.classList.remove('hidden');

    document.getElementById('confirm-ok').onclick = () => {
        onConfirm();
        hideConfirmationModal();
    };
    document.getElementById('confirm-cancel').onclick = hideConfirmationModal;
}

function showInfoModal(title, message) {
    const modal = document.getElementById('confirmation-modal');
    modal.querySelector('#confirmation-title').textContent = title;
    modal.querySelector('#confirmation-message').textContent = message;
    const buttonsContainer = modal.querySelector('#confirmation-buttons');
    buttonsContainer.innerHTML = `<button id="info-ok" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors">OK</button>`;
    modal.classList.remove('hidden');
    document.getElementById('info-ok').onclick = hideConfirmationModal;
}

function hideConfirmationModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
}

// --- MAIN HANDLER FUNCTIONS ---

function handleToggleExpand(taskId) {
    const task = findTaskById(state.tasks, taskId);
    if (task && task.children) {
        task.isExpanded = !task.isExpanded;
        saveState();
    }
}

function handleUpdateTimeline() {
    const newWeeks = parseInt(weeksInputEl.value);
    if (isNaN(newWeeks) || newWeeks < 4 || newWeeks > 52) {
        showInfoModal('Invalid Input', 'Please enter a number of weeks between 4 and 52.');
        weeksInputEl.value = state.totalWeeks;
        return;
    }
    state.totalWeeks = newWeeks;
    const updateAndConstrain = (tasks) => {
        (tasks || []).forEach(t => {
            if (t.start >= state.totalWeeks) {
                t.start = state.totalWeeks - 1;
                t.duration = 1;
            } else if (t.start + t.duration > state.totalWeeks) {
                t.duration = state.totalWeeks - t.start;
            }
            if (t.children) updateAndConstrain(t.children);
        });
    };
    updateAndConstrain(state.tasks);
    saveState();
}

/**
 * FIXED-BUG: Correctly adds modules by finding the full task object from templates.
 */
function handleAddModules() {
    const selected = moduleListEl.querySelectorAll('input:checked');
    if (selected.length === 0) return;
    
    const allDefinedTasks = getInitialTasks(); // Get all task templates

    selected.forEach(cb => {
        const name = cb.value;
        
        // Check if a task with this name already exists in the current state
        const taskExists = state.tasks.some(task => task.name === name);

        if (!taskExists) {
            // Find the full task definition from our templates
            const taskTemplate = allDefinedTasks.find(t => t.name === name);
            if (taskTemplate) {
                 // Deep copy the template to avoid reference issues when modifying
                 const newTask = JSON.parse(JSON.stringify(taskTemplate)); 
                 
                 // Assign a new, unique ID for this instance
                 newTask.id = Date.now() + Math.random(); 
                 
                 if(!state.tasks) state.tasks = [];
                 state.tasks.push(newTask);
            }
        }
        
        // Reset the checkbox UI
        cb.checked = false;
        cb.parentElement.querySelector('span').classList.remove('bg-blue-100', 'text-blue-700');
    });
    
    saveState(); // Save the updated state to Firestore
}


function handleOpenMilestoneModal(milestoneId = null) {
    const modal = document.getElementById('milestone-modal');
    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('milestone-id');
    const labelInput = document.getElementById('milestone-label-input');
    const weekInput = document.getElementById('milestone-week-input');
    const deleteBtn = document.getElementById('delete-milestone-btn');
    const taskSelect = document.getElementById('milestone-task-select');

    taskSelect.innerHTML = '';
    (state.tasks || []).forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.name;
        taskSelect.appendChild(option);
    });

    if (milestoneId) {
        const milestone = (state.milestones || []).find(m => m.id == milestoneId);
        if(milestone) {
            title.textContent = 'Edit Milestone';
            idInput.value = milestone.id;
            labelInput.value = milestone.label;
            weekInput.value = milestone.week;
            taskSelect.value = milestone.taskId;
            deleteBtn.classList.remove('hidden');
        }
    } else {
        title.textContent = 'Add Milestone';
        idInput.value = '';
        labelInput.value = '';
        weekInput.value = '';
        deleteBtn.classList.add('hidden');
    }
    weekInput.max = state.totalWeeks;
    modal.classList.remove('hidden');
}

function handleCloseMilestoneModal() {
    document.getElementById('milestone-modal').classList.add('hidden');
}

function handleSaveMilestone() {
    const id = document.getElementById('milestone-id').value;
    const taskId = document.getElementById('milestone-task-select').value;
    const label = document.getElementById('milestone-label-input').value.trim();
    const week = parseInt(document.getElementById('milestone-week-input').value);

    if (!label || !taskId || isNaN(week) || week < 1 || week > state.totalWeeks) {
        showInfoModal('Invalid Input', `Please select a module and provide a valid label and week number (1-${state.totalWeeks}).`);
        return;
    }

    if (!state.milestones) state.milestones = [];
    
    if (id) {
        const index = state.milestones.findIndex(m => m.id == id);
        if(index > -1) state.milestones[index] = { ...state.milestones[index], label, week, taskId };
    } else {
        state.milestones.push({ id: Date.now(), label, week, taskId });
    }
    saveState();
    handleCloseMilestoneModal();
}

function handleDeleteMilestone() {
    const id = document.getElementById('milestone-id').value;
    if(!id) return;
    showConfirmationModal('Delete Milestone?', 'Are you sure? This action cannot be undone.', () => {
        state.milestones = state.milestones.filter(m => m.id != id);
        saveState();
        handleCloseMilestoneModal();
    });
}

function handleDeleteTask(e) {
    e.stopPropagation();
    const taskId = e.currentTarget.dataset.taskId;
    
    const deleteTaskRecursive = (tasks, id) => {
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id == id) {
                tasks.splice(i, 1);
                return true;
            }
            if (tasks[i].children) {
                if (deleteTaskRecursive(tasks[i].children, id)) {
                    return true;
                }
            }
        }
        return false;
    };

    showConfirmationModal('Delete Task?', 'Are you sure? This will delete the task and all its sub-tasks.', () => {
        if (deleteTaskRecursive(state.tasks, taskId)) {
            state.milestones = (state.milestones || []).filter(ms => findTaskById(state.tasks, ms.taskId));
            saveState();
        }
    });
}

// --- DRAG, RESIZE, REORDER HANDLERS ---
let dragInfo = {};
function handleDragStart(e) {
    if (e.target.classList.contains('resize-handle')) {
        handleResizeStart(e);
        return;
    }
    e.preventDefault();
    const bar = e.currentTarget;
    const taskId = bar.dataset.taskId;
    const task = findTaskById(state.tasks, taskId);
    if (!task) return;

    bar.classList.add('is-dragging');
    const ganttAreaWidth = ganttContainerEl.querySelector('td[colspan]').offsetWidth;
    const weekWidth = ganttAreaWidth / state.totalWeeks;
    
    dragInfo = { task, bar, weekWidth, startX: e.clientX, initialStart: task.start };
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd, { once: true });
}

function handleDragMove(e) {
    if (!dragInfo.task) return;
    const dx = e.clientX - dragInfo.startX;
    let newStart = dragInfo.initialStart + Math.round(dx / dragInfo.weekWidth);
    newStart = Math.max(0, Math.min(state.totalWeeks - dragInfo.task.duration, newStart));
    dragInfo.bar.style.left = `calc(${newStart / state.totalWeeks} * 100%)`;
    dragInfo.currentStart = newStart;
}

function handleDragEnd(e) {
    dragInfo.bar.classList.remove('is-dragging');
    if (dragInfo.currentStart !== undefined && dragInfo.currentStart !== dragInfo.task.start) {
        dragInfo.task.start = dragInfo.currentStart;
        saveState();
    }
    dragInfo = {};
    document.removeEventListener('mousemove', handleDragMove);
}

let resizeInfo = {};
function handleResizeStart(e) {
    e.stopPropagation(); e.preventDefault();
    const handle = e.target;
    const bar = handle.closest('.gantt-bar');
    const taskId = bar.dataset.taskId;
    const task = findTaskById(state.tasks, taskId);
    if (!task) return;
    
    const ganttAreaWidth = ganttContainerEl.querySelector('td[colspan]').offsetWidth;
    const weekWidth = ganttAreaWidth / state.totalWeeks;
    
    resizeInfo = { task, bar, weekWidth, isLeft: handle.classList.contains('resize-handle-left'), startX: e.clientX, initialStart: task.start, initialDuration: task.duration };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd, { once: true });
}

function handleResizeMove(e) {
    if (!resizeInfo.task) return;
    const dx = e.clientX - resizeInfo.startX;
    const dWeeks = Math.round(dx / resizeInfo.weekWidth);

    if (resizeInfo.isLeft) {
        let newStart = resizeInfo.initialStart + dWeeks;
        let newDuration = resizeInfo.initialDuration - dWeeks;
        if (newStart < 0 || newDuration < 1) return;
        resizeInfo.task.start = newStart;
        resizeInfo.task.duration = newDuration;
        resizeInfo.bar.style.left = `calc(${newStart / state.totalWeeks} * 100%)`;
        resizeInfo.bar.style.width = `calc(${newDuration / state.totalWeeks} * 100%)`;
    } else {
        let newDuration = resizeInfo.initialDuration + dWeeks;
        if (newDuration < 1 || resizeInfo.task.start + newDuration > state.totalWeeks) return;
        resizeInfo.task.duration = newDuration;
        resizeInfo.bar.style.width = `calc(${newDuration / state.totalWeeks} * 100%)`;
    }
    adjustBarText(resizeInfo.bar);
}

function handleResizeEnd() {
    if (resizeInfo.task) saveState();
    resizeInfo = {};
    document.removeEventListener('mousemove', handleResizeMove);
}

let draggedItem = null;
function handleReorderStart(e) {
    draggedItem = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    setTimeout(() => e.target.classList.add('is-reordering'), 0);
}

function handleReorderOver(e) {
    e.preventDefault();
    const targetRow = e.target.closest('tr[draggable="true"]');
    if (!targetRow || !draggedItem || targetRow === draggedItem) return;
    ganttContainerEl.querySelectorAll('tr').forEach(tr => tr.classList.remove('drop-indicator-top', 'drop-indicator-bottom'));
    const targetRect = targetRow.getBoundingClientRect();
    if (e.clientY < targetRect.top + targetRect.height / 2) {
        targetRow.classList.add('drop-indicator-top');
    } else {
        targetRow.classList.add('drop-indicator-bottom');
    }
}

function handleReorderLeave(e) {
    e.target.closest('tr')?.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
}

function handleReorderDrop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest('tr[draggable="true"]');
    if (!dropTarget || !draggedItem) return;
    
    dropTarget.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
    draggedItem.classList.remove('is-reordering');
    
    const fromIndex = parseInt(draggedItem.dataset.index);
    let toIndex = parseInt(dropTarget.dataset.index);
    
    const targetRect = dropTarget.getBoundingClientRect();
    if (e.clientY > targetRect.top + targetRect.height / 2) toIndex++;
    if (fromIndex < toIndex) toIndex--;

    const [movedItem] = state.tasks.splice(fromIndex, 1);
    state.tasks.splice(toIndex, 0, movedItem);

    draggedItem = null;
    saveState();
}