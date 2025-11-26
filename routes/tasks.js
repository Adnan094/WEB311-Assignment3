const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Show all tasks
router.get("/", async (req, res) => {
  const tasks = await Task.find({ userId: req.session.user.userId });
  res.render("tasks", { tasks });
});

// Add Task Form
router.get("/add", (req, res) => {
  res.render("task_form", { task: null });
});

// Create Task
router.post("/add", async (req, res) => {
  const { title, description, status } = req.body;

  await Task.create({
    title,
    description,
    status,
    userId: req.session.user.userId,
  });

  res.redirect("/tasks");
});

// Edit Task Form
router.get("/edit/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  res.render("task_form", { task });
});

// Update Task
router.put("/edit/:id", async (req, res) => {
  const { title, description, status } = req.body;

  await Task.findByIdAndUpdate(req.params.id, {
    title,
    description,
    status,
  });

  res.redirect("/tasks");
});

// Delete Task
router.delete("/delete/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.redirect("/tasks");
});

module.exports = router;
