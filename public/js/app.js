const tracker = document.getElementById('tracker');
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const category = document.getElementById('category');
const amount = document.getElementById('amount');
const logoutButton = document.getElementById('logout');

let transactions = [];

//Handle user logout
logoutButton.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = 'index.html';
});

// Fetch transaction from server
async function fetchTransactions() {
    const res = await fetch('http://localhost:3001/api/transactions');
    const data = await res.json();
    transactions = data;
    init();
}

//Add transaction
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (category.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        const transaction = {
            category: category.value,
            amount: +amount.value
        };

        const res = await fetch('http://localhost:3001/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });

        const data = await res.json();
        transactions.push(data);

        addTransactionDOM(data);
        updateValues();

        category.value = '';
        amount.value = '';
    }
});

//Remove transaction by ID
async function removeTransaction(id) {
    await fetch(`http://localhost:3001/api/transactions/${id}`, {
        method: 'DELETE'
    });

    transactions = transactions.filter(transaction => transaction.id !== id);
    init();
}

//Add transaction to DOM list
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('li');
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
        ${transaction.category} <span>${sign}${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    `;

    list.appendChild(item);
}

// Update the balance, income and expense 
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `$${income}`;
    money_minus.innerText = `$${expense}`;
}

// Init app
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
}

fetchTransactions();