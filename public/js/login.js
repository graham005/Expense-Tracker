document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form')
    

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('clicked')
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');


        try{
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers:  {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if(!response.ok) {
                authMsg.textContent = "Invalid email or password!"
            } else {
                authMsg.textContent = "Login successfull"
                window.location.href = 'dashboard.html'
            }

        } catch (err) {
            authMsg.textContent = 'An error occured'
        }
    })

})