"use strict";

document.getElementById("SignUp-form").addEventListener("submit", function (event) {
    event.preventDefault();

    // Get the new username and password input values
    var newUsername = document.getElementById("new-username").value;
    var newPassword = document.getElementById("new-password").value;

    // Perform validation
    if (validateSignupInput(newUsername, newPassword)) {
        // Perform additional signup logic (e.g., send data to the server for user creation)
        sendSignupData(newUsername, newPassword);
    }
});

function validateSignupInput(username, password) {
    // Example: Check if the new username is not empty
    if (username.trim() === "") {
        alert("Please enter a valid username.");
        return false;
    }

    // Example: Check if the new password meets certain criteria
    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return false;
    }

    // Add more validation criteria as needed

    return true;  // All validations passed
}

function sendSignupData(username, password) {
    fetch("/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.text())
    .then(data => {
        // Handle the server response here if needed
        alert(data); // Show a message indicating successful signup
        window.location.href = "index.html"; // Redirect to the main page
    })
    .catch(error => console.error("Error:", error));
}
