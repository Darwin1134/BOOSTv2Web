import React, { useState, useEffect } from "react";
import { Button, Modal, Form, FormCheck } from "react-bootstrap";
import "./ToDoList.css";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";
import ExpBar from "./exp-notif-cal.tsx";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";

interface Task {
  id: string;
  title: string;
  description: string;
  tags: string[];
  dueDate: Date | null;
  checklist: { text: string; checked: boolean }[];
  progress: number;
  timeLeft: string;
  completed: boolean;
  createdAt: Timestamp | null;
  priority: string;
  estimatedTime: string;
  status: string;
  userId: string;
}

const FcTodoList: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [user, setUser] = useState<firebase.User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    id: "",
    title: "",
    description: "",
    tags: [],
    dueDate: null,
    checklist: [],
    progress: 0,
    timeLeft: "",
    completed: false,
    createdAt: null,
    priority: "",
    estimatedTime: "",
    status: "pending",
    userId: "",
  });
  const [modalContent, setModalContent] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const [dueDateError, setDueDateError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((userAuth) => {
      setUser(userAuth);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setError(null);
      if (user) {
        try {
          const q = query(
            collection(db, "users", user.uid, "todolist"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const fetchedTasks: Task[] = [];
          querySnapshot.forEach((doc) => {
            fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
          });
          setTasks(fetchedTasks);
        } catch (error) {
          setError("Error fetching tasks. Please try again later.");
          console.error("Error fetching tasks:", error);
        }
      }
    };

    fetchTasks();
  }, [user]);

  const handleShow = (title: string, description: string) => {
    setShowModal(true);
    setModalContent({ title, description });
  };

  const handleClose = () => setShowModal(false);

  const handleAddTaskShow = () => setShowAddTaskModal(true);
  const handleAddTaskClose = () => {
    setShowAddTaskModal(false);
    setNewTask({
      id: "",
      title: "",
      description: "",
      tags: [],
      dueDate: null,
      checklist: [],
      progress: 0,
      timeLeft: "",
      completed: false,
      createdAt: null,
      priority: "",
      estimatedTime: "",
      status: "pending",
      userId: "",
    });
    setDueDateError(false);
    setError(null);
  };

  const handleAddTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "tags") {
      setNewTask((prev) => ({ ...prev, tags: value.split(",") }));
    } else {
      setNewTask((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddChecklist = () => {
    setNewTask((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { text: "", checked: false }],
    }));
  };

  const handleAddTask = async () => {
    setError(null);
    try {
      if (!user) return;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (newTask.dueDate) {
        const dueDate = new Date(newTask.dueDate);
        dueDate.setUTCHours(0, 0, 0, 0);
        if (dueDate < today) {
          setDueDateError(true);
          return;
        }
      }

      const newTaskWithId = {
        ...newTask,
        id: uuidv4(),
        createdAt: serverTimestamp(),
        timeLeft: calculateTimeLeft(newTask.dueDate),
        userId: user.uid,
        status: "pending",
      };

      await setDoc(
        doc(db, "users", user.uid, "todolist", newTaskWithId.id),
        newTaskWithId
      );
      
      const q = query(
        collection(db, "users", user.uid, "todolist"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const updatedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        updatedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(updatedTasks);
      
      handleAddTaskClose();
      
    } catch (error) {
      setError("Error adding task. Please try again later.");
      console.error("Error adding task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setError(null);
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "todolist", id));
      } catch (error) {
        setError("Error deleting task. Please try again later.");
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleTaskComplete = async (task: Task) => {
    setError(null);
    if (user && task.id) {
      try {
        const updatedTask = { ...task, completed: true, status: "completed" };
        await updateDoc(
          doc(db, "users", user.uid, "todolist", task.id),
          updatedTask
        );
      } catch (error) {
        setError("Error completing task. Please try again later.");
        console.error("Error completing task:", error);
      }
    }
  };

  const formatDate = (date: Date | null | Timestamp): string => {
    if (!date) return "";
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return dateObj.toLocaleDateString();
  };

  const calculateTimeLeft = (dueDate: Date | null): string => {
    if (!dueDate) return "";
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (minutes < 0) return "Overdue";
    return `${minutes} Min Left`;
  };

  const renderTaskCard = (task: Task) => (
    <div className="pb-3" key={task.id}>
      <div className="card p-3" style={{ width: "22rem" }}>
        <div className="d-flex align-items-center">
          <span className="badge bg-success mr-auto ">{task.timeLeft}</span>
          <FaEdit size={35} style={{ cursor: "pointer" }} className="p-2" />
          <MdDelete
            onClick={() => handleDeleteTask(task.id)}
            size={22}
            style={{ cursor: "pointer" }}
          />
        </div>
        <h5 className="mt-2">{task.title}</h5>
        <p className="text-muted">{task.description}</p>
        <span className="badge bg-light text-dark text-wrap">
          {task.priority}
        </span>
        <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded">
          <div className="d-flex align-items-center">
            <span>
              <FaCalendarAlt size={20} className="me-2" />
              {formatDate(task.dueDate)}
            </span>
          </div>
          <div className="d-flex align-items-center">
            <span>Estimated Time: {task.estimatedTime}</span>
          </div>
        </div>

        {task.status !== "completed" && (
          <FormCheck
            type="checkbox"
            label="Complete"
            checked={task.completed}
            onChange={() => handleTaskComplete(task)}
          />
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="pt-5 ps-3">Board</h2>
      <div className="board-container flex gap-4">
        <div className="task-column">
          <span className="icons col-sm-auto">
            <svg height={13} width={10}>
              <circle fill="blue" cx={5} cy={5} r={5} />
            </svg>
          </span>
          <span className="ps-2 fw-medium text col-sm-auto">On Progress</span>

          <svg height="2%" width="100%" className="mb-4 mt-2">
            <line x1="0" y1="10" x2="100%" y2="10" id="custom-line1" />
          </svg>
          {tasks
            .filter((task) => task.status === "onProgress")
            .map(renderTaskCard)}
        </div>
        <div className="task-column">
          <span className="icons col-sm-auto">
            <svg height={13} width={10}>
              <circle fill="yellow" cx={5} cy={5} r={5} />
            </svg>
          </span>
          <span className="ps-2 fw-medium text col-sm-auto">Pending</span>

          <svg height="2%" width="100%" className="mb-4 mt-2">
            <line x1="0" y1="10" x2="100%" y2="10" id="custom-line2" />
          </svg>
          {tasks
            .filter((task) => task.status === "pending")
            .map(renderTaskCard)}
        </div>
        <div className="task-column">
          <div className="row">
            <span className="icons col-sm-auto">
              <svg height={13} width={10}>
                <circle fill="green" cx={5} cy={5} r={5} />
              </svg>
            </span>
            <span className="ps-2 fw-medium text col-sm-auto">Completed</span>
          </div>
          <svg height="2%" width="100%" className="mb-4 mt-2">
            <line x1="0" y1="10" x2="100%" y2="10" id="custom-line3" />
          </svg>
          {tasks
            .filter((task) => task.status === "completed")
            .map(renderTaskCard)}
        </div>
      </div>
      <button className="add-task" onClick={handleAddTaskShow}>
        + Add Task
      </button>

      <Modal
        show={showAddTaskModal}
        onHide={handleAddTaskClose}
        centered
        className="add-task-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="taskTitle">Title</Form.Label>
              <Form.Control
                type="text"
                id="taskTitle"
                name="title"
                value={newTask.title}
                onChange={handleAddTaskChange}
                placeholder="Enter task title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="taskDescription">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                id="taskDescription"
                name="description"
                value={newTask.description}
                onChange={handleAddTaskChange}
                placeholder="Enter task description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="taskTags">Tags (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                id="taskTags"
                name="tags"
                value={newTask.tags.join(",")}
                onChange={handleAddTaskChange}
                placeholder="Enter tags"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="taskDueDate">Due Date</Form.Label>
              <DatePicker
                id="taskDueDate"
                selected={newTask.dueDate}
                onChange={(date) =>
                  setNewTask((prev) => ({ ...prev, dueDate: date }))
                }
                name="dueDate"
              />
              {dueDateError && (
                <p className="text-danger">Due date cannot be in the past.</p>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="taskPriority">Priority</Form.Label>
              <Form.Control
                type="text"
                id="taskPriority"
                name="priority"
                value={newTask.priority}
                onChange={handleAddTaskChange}
                placeholder="Enter priority (e.g., High, Medium, Low)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="taskEstimatedTime">
                Estimated Time
              </Form.Label>
              <Form.Control
                type="text"
                id="taskEstimatedTime"
                name="estimatedTime"
                value={newTask.estimatedTime}
                onChange={handleAddTaskChange}
                placeholder="Enter estimated time (e.g., 1 hour, 30 minutes)"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Checklist</Form.Label>
              {newTask.checklist.map((item, index) => (
                <div key={index} className="mb-2">
                  <FormCheck
                    type="checkbox"
                    id={`checklist-${index}`}
                    label={
                      <Form.Control
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updatedChecklist = [...newTask.checklist];
                          updatedChecklist[index].text = e.target.value;
                          setNewTask((prev) => ({
                            ...prev,
                            checklist: updatedChecklist,
                          }));
                        }}
                      />
                    }
                    checked={item.checked}
                    onChange={(e) => {}}
                    name={index.toString()}
                  />
                </div>
              ))}
              <Button variant="link" onClick={handleAddChecklist}>
                Add Checklist Item
              </Button>
            </Form.Group>
            {error && <p className="text-danger">{error}</p>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAddTaskClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAddTask}>
            Add Task
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FcTodoList;
