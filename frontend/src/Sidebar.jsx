import "./Sidebar.css";

function Sidebar() {
    return (
        <section className="Sidebar">
            
            <button className="button">
                <img src="src/assets/chatgptLogo.jpg" alt="GPT LOGO" className="logo"></img>
                <i className="fa-solid fa-pen-to-square"></i>
            </button>
            
            <ul className="History">
                <li>thread1</li>
                <li>thread2</li>
                <li>thread3</li>
                <li>thread4</li>
            </ul>
            
            <div className="Sign">
                <p>By Sayoni &hearts;</p>
            </div>
        </section>
    )
}

export default Sidebar; 