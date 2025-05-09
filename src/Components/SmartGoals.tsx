import React, { useState, useEffect } from "react";
import "./SmartGoals.css";
import { FaPlus } from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import { Save } from "lucide-react";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

interface SmartGoalProps {
  onBack: () => void;
}

function AddGoalModal({ isOpen, onClose, onSave, category, goalToEdit, onEdit }) {
  const [goal, setGoal] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    if (goalToEdit) {
      setGoal(goalToEdit.goal || "");
      setTextColor(goalToEdit.textColor || "#000000");
      setBgColor(goalToEdit.bgColor || "#ffffff");
    } else {
      setGoal("");
      setTextColor("#000000");
      setBgColor("#ffffff");
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (goalToEdit) {
      onEdit({ ...goalToEdit, goal, textColor, bgColor });
    } else {
      onSave({ goal, textColor, bgColor });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content bg-light">
        <h2>
          {goalToEdit ? "Edit Goal" : `New Goal for "${category.charAt(0).toUpperCase() + category.slice(1)}"`}
        </h2>
        <label>
          Goal:
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>
        <label>
          Text Color:
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </label>
        <label>
          Background Color:
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </label>
        <div className="modal-buttons">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

function SaveModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content bg-light">
        <h2>Save SMART Goals</h2>
        <label>
          Name:
        <input type="text"></input>
        </label>
        <div className="modal-buttons">
          <button className="btn" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SmartGoals(OnBack: SmartGoalProps) {
  const { onBack } = OnBack;
  const [goals, setGoals] = useState({
    specific: [],
    measurable: [],
    achievable: [],
    relevant: [],
    timeBound: [],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("");
  const [goalToEdit, setGoalToEdit] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const openModal = (category, goal = null) => {
    setCurrentCategory(category);
    setGoalToEdit(goal);
    setModalOpen(true);
  };

  const addGoal = (category, newGoal) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [category]: [...prevGoals[category], newGoal],
    }));
  };

  const editGoal = (category, updatedGoal) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [category]: prevGoals[category].map((goal) =>
        goal === goalToEdit ? updatedGoal : goal
      ),
    }));
    setGoalToEdit(null);
  };

  const deleteGoal = (category, goalToDelete) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [category]: prevGoals[category].filter((goal) => goal !== goalToDelete),
    }));
  };

  return (
    <React.Fragment>
      <div className="smart-goals-container">
        <div className="flex-header">
          <IoIosArrowBack className="back-btn text-black" size={30} onClick={onBack} />
          <span className="title">SMART goals</span>
          <Save className="save text-black" size={30} onClick={() => setShowSaveModal(true)} />
        </div>

        {["specific", "measurable", "achievable", "relevant", "timeBound"].map(
          (category) => (
            <div key={category} className={`goal ${category}`}>
              <button
                className="plus-btn"
                id={category}
                onClick={() => openModal(category)}
              >
                <FaPlus size="20" />
              </button>
              <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              <div className="goal-list">
                {goals[category].map((goal, index) => (
                  <div
                    key={index}
                    className="goal-item"
                    style={{
                      color: goal.textColor,
                      backgroundColor: goal.bgColor,
                    }}
                  >
                    {goal.goal}
                    <FaEdit
                      className="edit-icon"
                      size={20}
                      onClick={() => openModal(category, goal)}
                    />
                    <MdDelete
                      className="delete-icon"
                      size={20}
                      onClick={() => deleteGoal(category, goal)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <AddGoalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(newGoal) => addGoal(currentCategory, newGoal)}
        onEdit={(updatedGoal) => editGoal(currentCategory, updatedGoal)}
        category={currentCategory}
        goalToEdit={goalToEdit}
      />

      <SaveModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </React.Fragment>
  );
}
