const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (user) {
    request.user = user;
    return next();
  } else {
    return response.status(404).json({ error: "user not found" });
  }
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  const numberOfUserTodos = user.todos.length;
  const userIsPro = user.pro;

  if (userIsPro || numberOfUserTodos < 10) {
    return next();
  } else {
    return response
      .status(403)
      .json({ error: "It is necessary a pro account to add more todos" });
  }
}

function checksTodoExists(request, response, next) {
  // Complete aqui
  const { username } = request.headers;
  const { id } = request.params;

  // Valida 'id' da tarefa
  if (!validate(id)) {
    return response.status(400).json({ error: "uuid format is invalid}" });
  }

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "user doesn't exist" });
  }

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: "todo not found" });
  }

  if (!validate(todo.id)) {
    return response.status(400).json({ error: "todo uuid is invalid" });
  }

  request.todo = todo;
  request.user = user;
  return next();
}

function findUserById(request, response, next) {
  const { id } = request.params;

  const user = users.find((user) => user.id === id);

  if (user) {
    request.user = user;
    return next();
  } else {
    return response.status(404).json("error: user not found");
  }
}

// ----Adiciona novo usuário----
app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: "Username already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});
// ------------------------------

// ----Obtém usuário a partir de seu 'id'----
app.get("/users/:id", findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});
// ------------------------------------------

// ----Altera status 'pro' para 'true' de um determinado usuário----
app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response
      .status(400)
      .json({ error: "Pro plan is already activated." });
  }

  user.pro = true;

  return response.json(user);
});
// -----------------------------------------------------------------

// ----Obtém 'todos' de um usuário----
app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});
// -----------------------------------

// ----Cria uma tarefa para o usuário----
app.post(
  "/todos",
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const newTodo = {
      id: uuidv4(),
      title,
      deadline: new Date(deadline),
      done: false,
      created_at: new Date(),
    };

    user.todos.push(newTodo);

    return response.status(201).json(newTodo);
  }
);
// ---------------------------------------

// ----Altera/atualiza um 'todo' a partir do seu 'id'----
app.put("/todos/:id", checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});
// ------------------------------------------------------

// ----Altera o status ('done') de uma tarefa para 'true'----
app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});
// -----------------------------------------------------------

// ----Exclui uma tarefa do usuário----
app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { user, todo } = request;

    const todoIndex = user.todos.indexOf(todo);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);
// -------------------------------------

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById,
};
