import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo">CODE MITRA</div>
        <button className="sign-in" onClick={() => navigate('/signin')}>
          Sign in
        </button>
      </nav>
      <div className="main-content">
        <h1>The best way to learn creative CS</h1>
        <p>Start your journey of learning to Create, Program and Build with Code Mitra</p>
        <button className="start-btn">Start Learning</button>
      </div>
      <div className="categories">
        <div className="category">Creative CS</div>
        <div className="category">Problem Solving</div>
        <div className="category">Guided Learning</div>
        <div className="category">Design Thinking</div>
      </div>
    </div>
  );
};

export default LandingPage;
