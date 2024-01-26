"use strict";

var username;
var password;
var userId;
var startTime;
var endTime;
var score = 0;
var totalQuestions = 0;
var currentQuestion;
var sessionID;

function showLogin() {
    document.getElementById("login-container").style.display = "block";
    document.getElementById("quiz-container").style.display = "none";
}
function login() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    const enteredUsername = usernameInput.value;
    const enteredPassword = passwordInput.value;

    if (!enteredUsername || !enteredPassword) {
        alert("Please enter both username and password.");
        return;
    }

    console.log('Login attempt with username:', enteredUsername);

    // Send a POST request to the server for authentication
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: enteredUsername, password: enteredPassword }),
    })
    .then(response => {
        if (response.status === 200) {
            // Successful login
            return response.json();
        } else if (response.status === 401) {
            // Invalid username or password
            return response.json(); // Parse JSON response
        } else {
            throw new Error("Internal Server Error");
        }
    })
    .then(data => {
        // Handle successful login response
        if (data && data.userId) {
            userId = data.userId;
            username = enteredUsername; // Set the username


            // Check if createSession is defined before calling it
            if (typeof createSession === 'function') {
                createSession();
            }

            document.getElementById("login-container").style.display = "none";
            document.getElementById("quiz-container").style.display = "block";

            startQuiz();
        } else {
            // Handle invalid username or password
            throw new Error("Invalid username or password");
        }
    })
    .catch(error => {
        // Handle other errors, e.g., show an alert
        alert(error.message);
    });
}

function createSession() {
    fetch("http://localhost:3000/create_session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
    })
    .then(response => response.json())
    .then(data => {
        sessionID = data.session_id;
    })
    .catch(error => console.error("Error creating session:", error));
}

// ... Other functions ...

document.addEventListener("DOMContentLoaded", function () {
    // This function will be executed once the DOM content has loaded

    // Add event listeners after the DOM content has loaded
    document.getElementById("submitAnswerBtn").addEventListener("click", checkAnswer);
    document.getElementById("nextQuestionBtn").addEventListener("click", nextQuestion);
    document.getElementById("finishQuizBtn").addEventListener("click", finishQuiz);

    // Additional initialization or code that depends on the DOM can go here

    // Call the login function here, if needed
    // ...

    // Call createSession here, after it's defined and the DOM is loaded
    createSession();
});

function startQuiz() {
    score = 0;
    totalQuestions = 0;
    startTime = new Date().toISOString();
    nextQuestion();
}

document.addEventListener("DOMContentLoaded", function () {
    // This function will be executed once the DOM content has loaded

    // Add event listeners after the DOM content has loaded
    document.getElementById("submitAnswerBtn").addEventListener("click", checkAnswer);
    document.getElementById("nextQuestionBtn").addEventListener("click", nextQuestion);
    document.getElementById("finishQuizBtn").addEventListener("click", finishQuiz);

    // Additional initialization or code that depends on the DOM can go here
});

// The rest of your existing code

function nextQuestion() {
    var num1 = generateNumber();
    var num2 = generateNumber();
    var operation = generateOperation();

    currentQuestion = {
        question_id: null,
        operation: operation,
        level: generateLevel(),
        operands: [num1, num2]
    };

    document.getElementById("question").innerText = `${num1} ${operation} ${num2} = ?`;

    totalQuestions++;
}

function finishQuiz() {
    endTime = new Date().toISOString();
    var timeTaken = (new Date(endTime) - new Date(startTime)) / 1000;

    recordAttempt()
        .then(() => {
            alert(`Quiz Completed!\nUsername: ${username}\nScore: ${score}/${totalQuestions}\nTime taken: ${timeTaken.toFixed(2)}s`);
            document.getElementById("timer").innerText = `Time: ${timeTaken.toFixed(2)}s`;
        })
        .catch(error => {
            console.error("Error finishing quiz:", error);
        });
}

function generateNumber() {
    var level = Math.floor(Math.random() * 3) + 1;

    switch (level) {
        case 1:
            return Math.floor(Math.random() * 10) + 1;
        case 2:
            return Math.floor(Math.random() * 90) + 10;
        case 3:
            return Math.floor(Math.random() * 900) + 100;
        default:
            return 0;
    }
}

function generateOperation() {
    var operations = ["+", "-", "*", "/"];
    return operations[Math.floor(Math.random() * operations.length)];
}

function generateLevel() {
    return Math.floor(Math.random() * 3) + 1;
}

function checkAnswer() {
    var userAnswer = parseInt(document.getElementById("answer").value);

    var correctAnswer;

    switch (currentQuestion.operation) {
        case "+":
            correctAnswer = currentQuestion.operands[0] + currentQuestion.operands[1];
            break;
        case "-":
            correctAnswer = currentQuestion.operands[0] - currentQuestion.operands[1];
            break;
        case "*":
            correctAnswer = currentQuestion.operands[0] * currentQuestion.operands[1];
            break;
        case "/":
            correctAnswer = currentQuestion.operands[0] / currentQuestion.operands[1];
            break;
        default:
            correctAnswer = 0;
    }

    var isCorrect = userAnswer === correctAnswer;
    score += isCorrect ? 1 : 0;

    recordAttempt(userAnswer, isCorrect);

    document.getElementById("score").innerText = ` ${score}`;

    nextQuestion();
}

function createSession() {
    fetch("http://localhost:3000/create_session", {  // Update the URL here
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
    })
    .then(response => response.json())
    .then(data => {
        sessionID = data.session_id;
    })
    .catch(error => console.error("Error creating session:", error));
}


async function recordAttempt(userAnswer, isCorrect) {
    const attemptData = {
        user_id: userId,
        question_id: currentQuestion ? currentQuestion.question_id : null,
        user_answer: userAnswer,
        is_correct: isCorrect,
        start_time: startTime,
        end_time: endTime
    };

    try {
        const response = await fetch("/record-quiz-attempt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(attemptData),
        });

        const data = await response.json();
        console.log(data.message);
        console.log('Server response:', data); // Add this line

    } catch (error) {
        console.error("Error recording attempt:", error);
        throw error;
    }
}


