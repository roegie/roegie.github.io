document.addEventListener('DOMContentLoaded', () => {
    const fact = document.querySelector('.fact');
    const fetchFact = document.querySelector('.new-fact');
    async function fetchCatFact() {
        try {
            const response = await fetch('https://catfact.ninja/fact');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            fact.textContent = data.fact;
        } catch (error) {
            fact.textContent = 'Error fetching cat fact.';
            console.error('Error:', error);
        }
    }
    fetchFact.addEventListener('click', fetchCatFact);
    fetchCatFact();
});

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.current').classList.remove('current');
        btn.classList.add('current');
    });
});