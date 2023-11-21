document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const passwordField = document.getElementById('register_Password');
    const confirmPasswordField = document.getElementById('register_conPassword');

    form.addEventListener('submit', function (event) {
        if (passwordField.value !== confirmPasswordField.value) {
            event.preventDefault(); 
            alert('Password and Confirm Password must match');
        }
    });
});