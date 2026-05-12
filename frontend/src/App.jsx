import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, ChevronRight, Brain, Lightbulb, FileText, Download, RefreshCcw, Loader2, CheckCircle2, Gamepad2, Target, Video, Search, Code2, ExternalLink, ArrowLeft, BriefcaseBusiness, Award, Send, MessageSquare, Camera, ShieldAlert, Users
} from 'lucide-react';
import './index.css';

const API_BASE = 'careerforge-agent-production.up.railway.app';

const App = () => {
  // --- WIZARD STATES ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const [userData, setUserData] = useState({
    name: '', degree: '', skills: '', interests: '', tried: ''
  });

  const [results, setResults] = useState({
    roleFit: [], chosenRole: '', jobOpenings: {}, skillGap: '', projectIdea: '', resume: '', interviewPrep: [], targetJob: null
  });

  const [quiz, setQuiz] = useState({ active: false, questions: [], currentIdx: 0, score: 0, showResults: false, answers: {} });
  const [draftModal, setDraftModal] = useState({ isOpen: false, content: '', loading: false });
  const [codeLab, setCodeLab] = useState({ active: false, problem: '', code: '', language: 'javascript', result: null, loading: false, showResult: false });
  const [proctoredTest, setProctoredTest] = useState({ active: false, company: '', monitoring: true, warnings: 0, status: 'initializing' });

  // --- FLOATING CHATBOT STATES ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'agent', content: 'CareerForge Agent online. Ask me to generate challenges, quizzes, or roadmaps!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const addLog = (msg) => {
    console.log(`[ORCHESTRATOR]: ${msg}`);
  };

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  // --- API ACTIONS ---
  const startAssessment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMsg('Initializing Neural Skill Mapping (RAG)...');
    try {
      const res = await axios.post(`${API_BASE}/role-fit/`, userData);
      const parsedRoles = Array.isArray(res.data.roles) ? res.data.roles : JSON.parse(res.data.roles).roles;
      setResults({ ...results, roleFit: parsedRoles });
      setStep(2);
    } catch (err) {
      setResults({ ...results, roleFit: [{ "title": "Software Engineer", "match": "90%", "reason": "System fallback due to LLM timeout." }] });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = async (roleObj) => {
    const role = typeof roleObj === 'string' ? roleObj : roleObj.title;
    setLoading(true);
    setLoadingMsg(`Scraping live job APIs for ${role}...`);
    try {
      setResults(prev => ({ ...prev, chosenRole: role }));
      const res = await axios.post(`${API_BASE}/job-openings/`, { role, degree: userData.degree });
      const rawData = res.data;
      const parsedJobs = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      setResults(prev => ({ ...prev, jobOpenings: parsedJobs.categories || parsedJobs || {} }));
      setStep(2.5);
    } catch (err) {
      setResults(prev => ({ ...prev, jobOpenings: { "Immediate Priority": [{ "role": role, "company": "Tech Corp (Fallback)", "links": [{ "platform": "LinkedIn", "url": "https://linkedin.com" }] }] } }));
      setStep(2.5);
    } finally {
      setLoading(false);
    }
  };

  const proceedToSkillGap = async (targetJob = null) => {
    setLoading(true);
    const roleName = targetJob ? targetJob.role : results.chosenRole;
    const companyName = targetJob ? targetJob.company : '';
    setLoadingMsg(`Agent: Orchestrating targeted prep for ${companyName || roleName}...`);
    try {
      const [skillRes, prepRes] = await Promise.all([
        axios.post(`${API_BASE}/skill-gap/`, { role: roleName, degree: userData.degree, skills: userData.skills, company: companyName }),
        axios.post(`${API_BASE}/interview-prep/`, { role: roleName, company: companyName })
      ]);
      setResults(prev => ({ ...prev, skillGap: skillRes.data.result, interviewPrep: prepRes.data.videos, targetJob: targetJob }));
      setStep(3);
    } catch (err) {
      alert('Error fetching targeted prep.');
    } finally {
      setLoading(false);
    }
  };

  const getProjectIdea = async () => {
    setLoading(true);
    setLoadingMsg('Mining Open-Source Market Trends (RAG)...');
    try {
      const res = await axios.post(`${API_BASE}/project-idea/`, { role: results.chosenRole, skills: userData.skills, interests: userData.interests });
      setResults({ ...results, projectIdea: res.data.result });
      setStep(4);
    } catch (err) {
      alert('Error fetching project idea.');
    } finally {
      setLoading(false);
    }
  };

  const getResume = async () => {
    setLoading(true);
    setLoadingMsg('Fetching Modern ATS Scanning Patterns (RAG)...');
    try {
      const res = await axios.post(`${API_BASE}/resume/`, { name: userData.name, degree: userData.degree, skills: userData.skills, role: results.chosenRole, project_idea: results.projectIdea });
      setResults({ ...results, resume: res.data.result });
      setStep(5);
    } catch (err) {
      alert('Error fetching resume.');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    setLoadingMsg('Generating Technical Assessment...');
    try {
      const res = await axios.post(`${API_BASE}/technical-quiz/`, { role: results.chosenRole });
      const questions = res.data.questions || res.data.quiz || [];
      setQuiz({ ...quiz, questions, active: true, currentIdx: 0, score: 0, showResults: false });
    } catch (err) {
      alert('Error generating quiz.');
    } finally {
      setLoading(false);
    }
  };

  const getNewProblem = async () => {
    setCodeLab(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.post(`${API_BASE}/get-problem/`, { role: results.chosenRole });
      setCodeLab(prev => ({ ...prev, problem: res.data, loading: false }));
    } catch (err) {
      alert('Error fetching challenge.');
      setCodeLab(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRunCode = async () => {
    setCodeLab({ ...codeLab, loading: true });
    try {
      const res = await axios.post(`${API_BASE}/run-code/`, { code: codeLab.code, language: codeLab.language, problem: codeLab.problem });
      setCodeLab(prev => ({ ...prev, result: res.data, loading: false }));
    } catch (err) {
      alert('Error evaluating code.');
      setCodeLab(prev => ({ ...prev, loading: false }));
    }
  };

  const startProctoredTest = (companyName) => {
    setProctoredTest({ active: true, company: companyName, monitoring: true, warnings: 0, status: 'live' });
  };

  const handleAutoDraft = async (job) => {
    setDraftModal({ isOpen: true, loading: true, content: '' });
    try {
      const res = await axios.post(`${API_BASE}/draft-application/`, { name: userData.name, skills: userData.skills, role: job.role, company: job.company });
      setDraftModal({ isOpen: true, loading: false, content: res.data.result });
    } catch (err) {
      setDraftModal({ isOpen: false, loading: false, content: '' });
    }
  };

  // --- CHAT ACTION HANDLER ---
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chat-orchestrator/`, { history: newMessages, user_state: userData });
      const data = res.data;
      setChatMessages(prev => [...prev, { role: 'agent', content: data.reply }]);

      // Agent Action Routing
      if (data.action === 'ROADMAP' && data.artifact_data) {
        setResults(prev => ({ ...prev, skillGap: data.artifact_data.skill_gap, interviewPrep: data.artifact_data.videos }));
        setStep(3);
      } else if (data.action === 'CODELAB' && data.artifact_data) {
        setCodeLab({ active: true, problem: data.artifact_data.problem, code: '', language: 'python', result: null, loading: false });
      } else if (data.action === 'PROJECT' && data.artifact_data) {
        setResults(prev => ({ ...prev, projectIdea: data.artifact_data.project }));
        setStep(4);
      } else if (data.action === 'QUIZ' && data.artifact_data) {
        setQuiz({ active: true, questions: data.artifact_data.questions, currentIdx: 0, score: 0, showResults: false });
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', content: 'Connection to orchestrator lost.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadResume = () => {
    if (!results.resume) return;
    const resumeText = `${results.resume.name}\n${results.resume.role}\n\nSUMMARY\n${results.resume.summary}\n\nTECHNICAL SKILLS\n${results.resume.skills?.join(', ')}\n\nPROJECTS\n${results.resume.projects?.map(p => `${p.title}\nTech: ${p.tech_stack}\n${p.bullets?.map(b => `- ${b}`).join('\n')}`).join('\n\n')}`;
    const element = document.createElement("a");
    const file = new Blob([resumeText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${userData.name.replace(' ', '_')}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const reset = () => {
    setStep(1);
    setUserData({ name: '', degree: '', skills: '', interests: '', tried: '' });
    setResults({ roleFit: [], chosenRole: '', jobOpenings: {}, skillGap: '', projectIdea: '', resume: '', interviewPrep: [], targetJob: null });
  };

  // --- HELPERS ---
  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') || line.match(/^[A-Z\s]+:/)) return <h4 key={index} style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{line.replace(/\*\*/g, '')}</h4>;
      if (line.startsWith('-') || line.startsWith('*')) return <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', color: '#ccc' }}>{line.substring(1).trim()}</li>;
      return <p key={index} style={{ marginBottom: '1rem', color: '#ccc' }}>{line}</p>;
    });
  };

  const goBack = () => setStep(step - 1);

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>

      {/* GLOBAL LOADING OVERLAY */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={60} color="var(--primary-color)" />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '0.5rem' }}>Agent Thinking...</h2>
            <p style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.9rem' }}>{loadingMsg}</p>
          </motion.div>
        </motion.div>
      )}

      {/* WIZARD HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            <Rocket style={{ verticalAlign: 'middle', marginRight: '10px' }} color="#6C63FF" />
            CareerForge <span className="gradient-text">AI</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Autonomous Agentic Pipeline for Proactive Builders.</p>
        </motion.div>
      </header>

      {/* WIZARD LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '2rem', alignItems: 'start' }}>

        {/* Main Panel */}
        <motion.div key={step} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-card" style={{ minHeight: '600px', margin: 0 }}>

          {step === 1 && (
            <form onSubmit={startAssessment}>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search color="var(--primary-color)" /> Profile Initialization</h2>
              <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div><label>Full Name</label><input type="text" name="name" value={userData.name} onChange={handleInputChange} placeholder="John Doe" required /></div>
                <div><label>Highest Degree / Major</label><input type="text" name="degree" value={userData.degree} onChange={handleInputChange} placeholder="B.Tech Computer Science" required /></div>
                <div><label>Core Technical Skills (comma separated)</label><input type="text" name="skills" value={userData.skills} onChange={handleInputChange} placeholder="Python, React, AWS" required /></div>
                <div><label>Key Interests / Passions</label><input type="text" name="interests" value={userData.interests} onChange={handleInputChange} placeholder="AI, Distributed Systems" /></div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', background: 'linear-gradient(90deg, #6C63FF, #FF00E5)', color: 'white', fontWeight: 'bold' }}>Initialize Agentic Evaluation</button>
            </form>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target color="var(--primary-color)" /> Top Market Matches</h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {results.roleFit.map((role, i) => (
                  <div key={i} className="result-box" style={{ margin: 0, cursor: 'pointer', border: '1px solid #1a1a1a' }} onClick={() => selectRole(role)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{role.title}</h3>
                      <span style={{ background: 'var(--primary-color)', color: 'black', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{role.match} MATCH</span>
                    </div>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: 0 }}>{role.reason}</p>
                  </div>
                ))}
              </div>
              <button onClick={goBack} style={{ marginTop: '1.5rem', background: '#333' }}><ArrowLeft size={16} /> Back</button>
            </div>
          )}

          {step === 2.5 && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Verified Job Openings (Direct Forms)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {Object.entries(results.jobOpenings || {}).map(([cat, jobs]) => (
                  <div key={cat} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '1rem', padding: '1rem' }}>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', textAlign: 'center', borderBottom: '1px solid #222' }}>{cat}</h4>
                    {jobs.map((j, i) => (
                      <div key={i} style={{ background: '#111', padding: '0.8rem', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{j.company}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>{j.role}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleAutoDraft(j)} style={{ flex: 1, fontSize: '0.7rem', background: 'transparent', border: '1px dashed #333', color: '#888' }}>Auto-Draft</button>
                          <button onClick={() => proceedToSkillGap(j)} style={{ flex: 1, fontSize: '0.7rem', background: 'var(--primary-color)', color: 'black', fontWeight: '900' }}>Target Prep</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={goBack} style={{ background: '#333', flex: 1 }}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => proceedToSkillGap()} style={{ border: '1px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', flex: 2 }}>General Interview Prep <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary-color)' }}>{results.targetJob ? `${results.targetJob.company} Targeted Analysis` : 'Strategic Roadmap'}</h2>
              </div>
              <div className="result-box" style={{ minHeight: '400px', margin: 0, padding: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                  <CheckCircle2 size={24} color="var(--primary-color)" />
                  <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>Strategic Logic Audit</h3>
                </div>
                <div style={{ fontSize: '1rem', lineHeight: '1.8' }}>{formatText(results.skillGap)}</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button onClick={goBack} style={{ background: '#333', flex: 1 }}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setStep(3.5)} style={{ flex: 2, background: 'var(--primary-color)', color: 'black', fontWeight: '900' }}>Next: AI Masterclass <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 3.5 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary-color)' }}>{results.targetJob ? `${results.targetJob.company} AI Masterclass` : 'AI Masterclass'}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {results.interviewPrep.slice(0, 1).map((vid, i) => (
                  <div key={i} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <iframe width="100%" height="450" src={`https://www.youtube.com/embed/${vid.video_id}?autoplay=0`} frameBorder="0" allowFullScreen></iframe>
                    <div style={{ padding: '2rem' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1rem' }}>{vid.topic}</div>
                      <p style={{ fontSize: '1rem', color: '#ccc', lineHeight: '1.6' }}>{vid.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                <button onClick={() => setStep(3)} style={{ background: '#333', flex: 1 }}><ArrowLeft size={16} /> Back</button>
                <button onClick={generateQuiz} style={{ flex: 1, background: 'linear-gradient(90deg, #6C63FF, #FF00E5)', color: 'white' }}>Take Quiz</button>
                <button onClick={() => { getNewProblem(); setCodeLab({ ...codeLab, active: true }); }} style={{ flex: 1, background: '#111', border: '1px solid #333' }}>Code Lab</button>
                <button onClick={getProjectIdea} style={{ flex: 1, background: 'var(--primary-color)', color: 'black', fontWeight: 'bold' }}>Generate Project</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lightbulb color="var(--primary-color)" /> Project Architecture</h2>
              <div className="result-box" style={{ margin: 0 }}>{formatText(results.projectIdea)}</div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={goBack} style={{ background: '#333', flex: 1 }}><ArrowLeft size={16} /> Back</button>
                <button onClick={getResume} style={{ flex: 2, background: 'linear-gradient(90deg, #6C63FF, #FF00E5)', color: 'white', fontWeight: 'bold' }}>Generate Final Resume <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText color="var(--primary-color)" /> Market-Ready Resume</h2>
              <div className="result-box" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                  <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{results.resume.name}</h1>
                  <h3 style={{ color: '#ccc', margin: '0.5rem 0' }}>{results.resume.role}</h3>
                </div>
                <p style={{ marginBottom: '1.5rem', color: '#ccc' }}>{results.resume.summary}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={reset} style={{ background: '#333', flex: 1 }}><RefreshCcw size={16} /> Start Over</button>
                <button onClick={downloadResume} style={{ flex: 2, background: 'var(--primary-color)', color: 'black', fontWeight: 'bold' }}><Download size={18} /> Export TXT</button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Status Panel */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Session Context</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: userData.name ? '#0f0' : '#444' }}></div><span style={{ fontSize: '0.9rem', color: userData.name ? 'white' : '#666' }}>User Profile</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: results.chosenRole ? '#0f0' : '#444' }}></div><span style={{ fontSize: '0.9rem', color: results.chosenRole ? 'white' : '#666' }}>Role: {results.chosenRole || 'Pending'}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: results.skillGap ? '#0f0' : '#444' }}></div><span style={{ fontSize: '0.9rem', color: results.skillGap ? 'white' : '#666' }}>RAG Engine Active</span></div>
          </div>

          {step > 1 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Quick Actions</h4>
              <button onClick={() => { getNewProblem(); setCodeLab({ ...codeLab, active: true }); }} style={{ width: '100%', marginBottom: '0.8rem', background: 'transparent', border: '1px solid #333', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Code2 size={16} color="var(--primary-color)" /> Open Code Lab</button>
              {results.chosenRole && <button onClick={generateQuiz} style={{ width: '100%', marginBottom: '0.8rem', background: 'transparent', border: '1px solid #333', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Gamepad2 size={16} color="#0f0" /> Technical Assessment</button>}
              <button onClick={() => startProctoredTest('Elite Corporate Client')} style={{ width: '100%', background: 'linear-gradient(90deg, #ff0055, #ffcc00)', color: 'black', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '900' }}><Camera size={16} /> Enter Proctored Exam</button>
            </div>
          )}
        </div>
      </div>

      {/* Code Lab Full-Screen Overlay */}
      {codeLab.active && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 3000, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--primary-color)', margin: 0 }}><Code2 style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Frontier Code Lab</h2>
            <button onClick={() => setCodeLab({ ...codeLab, active: false })} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>

          {codeLab.loading && !codeLab.problem ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={60} color="var(--primary-color)" /></div>
          ) : (
            <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
              {/* Left: Problem */}
              <div style={{ flex: '0.4', background: '#0a0a0a', border: '1px solid #222', borderRadius: '1rem', padding: '2rem', overflowY: 'auto' }}>
                {codeLab.problem && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>{codeLab.problem.title}</h2>
                      <span style={{ color: '#ffcc00', border: '1px solid #ffcc00', padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', fontWeight: 'bold' }}>{codeLab.problem.difficulty}</span>
                    </div>
                    <p style={{ color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', marginBottom: '2rem' }}>{codeLab.problem.description}</p>
                  </>
                )}
              </div>
              {/* Right: Code */}
              <div style={{ flex: '0.6', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <iframe frameBorder="0" src={`https://onecompiler.com/embed/${codeLab.language}?hideLanguageSelection=true&code=${encodeURIComponent(codeLab.problem?.starter_code?.[codeLab.language] || '')}`} style={{ flex: 1, borderRadius: '1rem', border: '1px solid #222' }}></iframe>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <textarea value={codeLab.code} onChange={e => setCodeLab({ ...codeLab, code: e.target.value })} placeholder="Paste final solution here for AI Audit..." style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '0.5rem', padding: '1rem', color: '#0f0', fontFamily: 'monospace', height: '60px' }} />
                  <button onClick={handleRunCode} style={{ background: 'var(--primary-color)', color: 'black', fontWeight: 'bold', width: '150px' }}>{codeLab.loading ? <Loader2 className="animate-spin" /> : 'Audit Logic'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Logic Report Overlay */}
          <AnimatePresence>
            {codeLab.result && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ position: 'absolute', bottom: '4rem', right: '4rem', width: '450px', background: '#0a0a0a', border: '2px solid var(--primary-color)', padding: '2rem', borderRadius: '1rem', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>Logic Report</h3>
                  <button onClick={() => setCodeLab({ ...codeLab, result: null })} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>Score: {codeLab.result.score}/100</div>
                <p style={{ color: '#ccc', fontSize: '0.9rem' }}>{codeLab.result.review}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Draft Modal */}
      {draftModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setDraftModal({ isOpen: false, content: '', loading: false })} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>×</button>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Agentic Application Draft</h2>
            {draftModal.loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}><Loader2 className="animate-spin" size={40} color="var(--primary-color)" /></div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', color: '#ccc', background: '#0a0a0a', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #1a1a1a', fontSize: '0.95rem' }}>{draftModal.content}</div>
            )}
          </div>
        </div>
      )}

      {/* --- FLOATING CHATBOT COMPONENT --- */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 5000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} style={{ width: '380px', height: '500px', background: '#050505', border: '1px solid #222', borderRadius: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ background: '#111', padding: '1rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                  <Brain size={18} /> CareerForge Copilot
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.role === 'user' ? '#1a1a1a' : 'rgba(108, 99, 255, 0.1)', padding: '0.8rem 1rem', borderRadius: '1rem', borderBottomRightRadius: m.role === 'user' ? '0' : '1rem', borderBottomLeftRadius: m.role === 'agent' ? '0' : '1rem', border: m.role === 'agent' ? '1px solid rgba(108, 99, 255, 0.3)' : '1px solid #333' }}>
                    <div style={{ fontSize: '0.9rem', color: m.role === 'user' ? '#fff' : '#ccc', lineHeight: '1.4' }}>{m.content}</div>
                  </div>
                ))}
                {chatLoading && <div style={{ color: 'var(--primary-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 className="animate-spin" size={14} /> Agent orchestrating...</div>}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChatMessage} style={{ padding: '1rem', borderTop: '1px solid #222', background: '#0a0a0a', display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Copilot..." disabled={chatLoading} style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '0.8rem', borderRadius: '0.5rem', color: 'white', outline: 'none' }} />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} style={{ background: 'var(--primary-color)', border: 'none', width: '3rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Send size={16} color="black" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setIsChatOpen(!isChatOpen)} style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #FF00E5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(108, 99, 255, 0.5)', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
          {isChatOpen ? <span style={{ fontSize: '2rem', color: 'white' }}>×</span> : <MessageSquare size={28} color="white" />}
        </button>
      </div>

      {/* PROCTORED TEST OVERLAY */}
      {proctoredTest.active && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 6000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#0a0a0a', borderBottom: '1px solid #222', padding: '1rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ color: '#ff0055', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                <div style={{ width: '10px', height: '10px', background: '#ff0055', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                LIVE_PROCTORING_ACTIVE
              </div>
              <div style={{ color: '#555', fontSize: '0.8rem' }}>|</div>
              <div style={{ color: 'white', fontWeight: 'bold' }}>CLIENT_INVITATIONAL: {proctoredTest.company}</div>
            </div>
            <button onClick={() => setProctoredTest({ ...proctoredTest, active: false })} style={{ background: 'transparent', border: 'none', color: '#444', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '1px', background: '#111' }}>
            {/* Exam Content */}
            <div style={{ flex: 1, background: '#030303', padding: '3rem', overflowY: 'auto' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Corporate Technical Gatekeeper</h1>
                <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '2.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>Phase 1: Technical Logic & Architecture</h3>
                  <p style={{ color: '#888', marginBottom: '2rem' }}>Answer the following high-stakes architectural question to unlock the HR round with <strong>{proctoredTest.company}</strong>.</p>

                  <div style={{ padding: '2rem', background: '#050505', border: '1px solid #111', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem' }}>You are designing a real-time proctoring engine that must process 10,000 video streams simultaneously. How would you architect the anomaly detection layer to ensure sub-second latency?</p>
                    <textarea placeholder="Describe your architectural approach here..." style={{ height: '200px', background: '#000', color: 'var(--success)', fontFamily: 'JetBrains Mono', fontSize: '1.1rem' }} />
                  </div>
                </div>
                <button style={{ width: '100%', background: 'var(--primary-color)', color: 'black', height: '4rem', fontSize: '1.2rem' }}>Submit for Client Review</button>
              </div>
            </div>

            {/* Proctoring Sidebar */}
            <div style={{ width: '350px', background: '#0a0a0a', borderLeft: '1px solid #222', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '0.5rem', border: '2px solid #ff0055', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(255,0,85,0.2)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: '#ff0055', fontSize: '0.6rem', fontWeight: 'bold' }}>CAM_01</div>
                <Camera size={48} color="#111" />
                <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,0,85,0.1)', pointerEvents: 'none' }}></div>
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Anomaly Detection Log</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--success)', fontSize: '0.8rem' }}>
                    <ShieldCheck size={16} /> <span>Biometric verification complete.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--success)', fontSize: '0.8rem' }}>
                    <ShieldCheck size={16} /> <span>Gaze tracking initialized.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', color: '#ffcc00', fontSize: '0.8rem' }}>
                    <ShieldAlert size={16} /> <span>Unusual keyboard pattern detected.</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#050505', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #111' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '1rem' }}>Partner Eligibility</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <Users size={20} color="var(--primary-color)" />
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>3 Clients currently watching.</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#555' }}>Complete this test with a score {'>'} 90% to trigger an automatic HR round invite.</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
