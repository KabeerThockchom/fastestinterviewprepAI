import React, { useState, useEffect } from 'react';
import './App.css';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_51Oy1DbJJsI9X5jdXNQE1Z5uXkD27M43rDvEVXec7i53AKLA4L68Co1PEKVZ2G0nhCp1I6qa04N2uJpVWGvzRV6GP00Go8e27OM');

function App() {
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobPosting, setJobPosting] = useState(null);
  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loadingTextOptions = [
    'Generating...',
    'Blackmailing the nerds...',
    'Interrogating the recruiters...',
    'Adding a touch of AI nepotism...',
    "Almost there now, don't be impatient...",
    "Hey, it's at least faster than you getting a job...",
  ];
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prevIndex) => (prevIndex + 1) % loadingTextOptions.length);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleRegisterClick = () => {
    setIsRegistered(true);
  };
  const handleRegister = async () => {
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registrationEmail, password: registrationPassword }),
      });
      const data = await response.json();
      if (data.success) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          lineItems: [{ price: 'price_1Oy2P7JJsI9X5jdXO0v7b4gm', quantity: 1 }],
          mode: 'payment',
          successUrl: 'http://localhost:8080/success',
          cancelUrl: 'http://localhost:8080/cancel',
          clientReferenceId: JSON.stringify({ email: registrationEmail, password: registrationPassword }),
          customerEmail: registrationEmail,
        });
        if (error) {
          console.error('Error redirecting to Stripe Checkout:', error);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'jobPosting') {
      setJobPosting(files[0]);
    } else {
      setResume(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    if (jobPosting) {
      formData.append('job_posting', jobPosting);
    }
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }
    formData.append('resume', resume);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setQuestions(data.questions);
      setResumeText(data.resumeText);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (e) => setSelectedQuestion(e.target.value);

  const handleGenerateAnswer = async () => {
    if (!selectedQuestion || !resumeText) return;
    setIsLoading(true);

    try {
      const response = await fetch('/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: selectedQuestion, resume: resumeText }),
      });
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error generating answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <script async src="https://js.stripe.com/v3/buy-button.js"></script>
{!isAuthenticated ? (
  <div className="login-container">
    <h2>Login</h2>
    {!isRegistered ? (
      <>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
        <p>Don't have an account?</p>
        <button onClick={handleRegisterClick}>Register</button>
      </>
    ) : (
      <>
        <input type="email" placeholder="Email" value={registrationEmail} onChange={(e) => setRegistrationEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={registrationPassword} onChange={(e) => setRegistrationPassword(e.target.value)} />
        <stripe-buy-button
  buy-button-id="buy_btn_1Oy2RQJJsI9X5jdXVIcf4EZm"
  publishable-key="pk_live_51Oy1DbJJsI9X5jdXNQE1Z5uXkD27M43rDvEVXec7i53AKLA4L68Co1PEKVZ2G0nhCp1I6qa04N2uJpVWGvzRV6GP00Go8e27OM"
>
</stripe-buy-button>
      </>
    )}
  </div>
      ) : (
        <>
          <header>
            <h1>InterviewPrep.AI</h1>
            <p>Ace your next interview with AI-powered preparation!</p>
            <button onClick={handleLogout}>Logout</button>
          </header>
          <main>
            <section className="upload-section">
              <h2>Upload Your Documents</h2>
              <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-group">
                  <label htmlFor="jobDescription">Job Description:</label>
                  <textarea
                    name="jobDescription"
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter job description"
                    rows={5}
                  ></textarea>
                </div>
                <div className="form-group">
                  <div className="file-upload-wrapper">
                    <input type="file" name="jobPosting" id="jobPosting" className="file-input" onChange={handleFileChange} accept=".pdf" />
                    <label htmlFor="jobPosting" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i> Upload PDF of Job Description
                    </label>
                    {jobPosting && <span className="file-name">{jobPosting.name}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <div className="file-upload-wrapper">
                    <input type="file" name="resume" id="resume" className="file-input" onChange={handleFileChange} accept=".pdf" />
                    <label htmlFor="resume" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i> Upload PDF of Resume
                    </label>
                    {resume && <span className="file-name">{resume.name}</span>}
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {loadingTextOptions[loadingTextIndex]}
                    </>
                  ) : (
                    'Generate Questions'
                  )}
                </button>
              </form>
            </section>
            <section className="questions-section">
              <h2>Practice Questions</h2>
              {questions.length > 0 ? (
                <>
                  <div className="question-select-container">
                    <select value={selectedQuestion} onChange={handleQuestionChange} className="question-select">
                      <option value="">Select a question</option>
                      {questions.map((question, index) => (
                        <option key={index} value={question}>
                          {question}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleGenerateAnswer} className="btn-secondary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> {loadingTextOptions[loadingTextIndex]}
                        </>
                      ) : (
                        'Generate Answer'
                      )}
                    </button>
                  </div>
                  {answer && (
                    <div className="answer-section">
                      <h3>Sample Answer:</h3>
                      <p>{answer}</p>
                    </div>
                  )}
                </>
              ) : (
                <p>No questions generated yet. Upload your documents to get started.</p>
              )}
            </section>
          </main>
          <footer>
            <p>&copy; 2024 InterviewPrep.AI, created by Kabeer Thockchom. Powered by Groq</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;