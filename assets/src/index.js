import { createRoot } from '@wordpress/element';
import './style.css';

function App() {
    return (
        <main className="slate-upfit-planner-shell">
            <header className="slate-upfit-planner-header">
                <p className="slate-upfit-planner-eyebrow">Slate Dealer Portal</p>
                <h1>Commercial Van Upfit Planner</h1>
                <p>Plugin scaffold ready for the Claude planner UI migration.</p>
            </header>
        </main>
    );
}

const root = document.getElementById('slate-upfit-planner-root');

if (root) {
    createRoot(root).render(<App />);
}
