import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { generateOnboardingSuggestions } from '../lib/groq';
import { X, Sparkles, UserCircle, Users, HandHeart } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  // Role selection
  const [selectedRole, setSelectedRole] = useState(userData?.role || '');

  // Form data
  const [name, setName] = useState(userData?.displayName || user?.displayName || '');
  const [location, setLocation] = useState(userData?.location || '');
  const [bio, setBio] = useState(userData?.bio || '');
  
  // Can Help (Helper) specific
  const [skills, setSkills] = useState(userData?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [expertise, setExpertise] = useState(userData?.expertise || []);
  const [availability, setAvailability] = useState(userData?.availability || 'flexible');
  
  // Need Help (Seeker) specific
  const [interests, setInterests] = useState(userData?.interests || []);
  const [helpNeeds, setHelpNeeds] = useState(userData?.helpNeeds || []);
  const [currentChallenges, setCurrentChallenges] = useState(userData?.currentChallenges || '');
  
  const skillSuggestions = [
    'React', 'Python', 'Design', 'HTML/CSS', 'Git', 'Figma', 
    'Writing', 'Data Analysis', 'UI/UX', 'Node.js', 'JavaScript', 'Career Guidance',
    'Machine Learning', 'Mobile Development', 'Project Management', 'Marketing'
  ];

  const helpCategories = [
    'Career Advice', 'Code Review', 'Bug Fixes', 'Learning Path', 
    'Portfolio Review', 'Interview Prep', 'Project Help', 'General Guidance'
  ];

  const availabilityOptions = [
    { value: 'flexible', label: 'Flexible' },
    { value: 'weekdays', label: 'Weekdays Only' },
    { value: 'weekends', label: 'Weekends Only' },
    { value: 'evenings', label: 'Evenings Only' }
  ];

  useEffect(() => {
    if (step === 3 && skills.length > 0 && !aiSuggestions) {
      fetchAiSuggestions();
    }
  }, [step, skills]);

  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    const result = await generateOnboardingSuggestions(skills);
    setAiSuggestions(result);
    setAiLoading(false);
  };

  const addSkill = (skill) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleNext = () => {
    // Validation for each step
    if (step === 1 && !selectedRole) {
      alert('Please select a role to continue');
      return;
    }
    if (step === 2 && !name.trim()) {
      alert('Please enter your name to continue');
      return;
    }
    if (step === 3 && (selectedRole === 'helper' || selectedRole === 'both')) {
      if (skills.length === 0) {
        alert('Please select at least one skill to continue');
        return;
      }
      if (expertise.length === 0) {
        alert('Please select at least one area of expertise to continue');
        return;
      }
    }
    if (step === 4 && (selectedRole === 'seeker' || selectedRole === 'both')) {
      if (interests.length === 0) {
        alert('Please select at least one interest to continue');
        return;
      }
      if (helpNeeds.length === 0) {
        alert('Please select at least one help need to continue');
        return;
      }
    }

    const totalSteps = getTotalSteps();
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    console.log('handleComplete called');
    setLoading(true);
    try {
      console.log('Updating user profile...');
      const updateData = {
        displayName: name,
        location,
        bio,
        role: selectedRole,
        onboardingDone: true,
        updatedAt: serverTimestamp(),
        // Common fields
        trustScore: userData?.trustScore || 50,
        contributions: userData?.contributions || 0,
        badges: userData?.badges || []
      };

      // Role-specific fields
      if (selectedRole === 'helper' || selectedRole === 'both') {
        updateData.skills = skills;
        updateData.expertise = expertise;
        updateData.availability = availability;
        updateData.rating = userData?.rating || 0;
        updateData.ratingCount = userData?.ratingCount || 0;
        updateData.helpedCount = userData?.helpedCount || 0;
      }

      if (selectedRole === 'seeker' || selectedRole === 'both') {
        updateData.interests = interests;
        updateData.helpNeeds = helpNeeds;
        updateData.currentChallenges = currentChallenges;
        updateData.requestsCount = userData?.requestsCount || 0;
      }

      console.log('Update data:', updateData);
      await updateDoc(doc(db, 'users', user.uid), updateData);
      console.log('Profile updated successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Error: ' + (err.message || 'Failed to complete onboarding'));
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role-specific data
  const addHelpNeed = (need) => {
    if (need && !helpNeeds.includes(need)) {
      setHelpNeeds([...helpNeeds, need]);
    }
  };

  const removeHelpNeed = (needToRemove) => {
    setHelpNeeds(helpNeeds.filter(n => n !== needToRemove));
  };

  const toggleExpertise = (item) => {
    if (expertise.includes(item)) {
      setExpertise(expertise.filter(i => i !== item));
    } else {
      setExpertise([...expertise, item]);
    }
  };

  const getTotalSteps = () => {
    if (selectedRole === 'both') return 5;
    return 4;
  };

  const getCurrentStepDisplay = () => {
    if (selectedRole === 'both') {
      if (step === 3) return 3; // Helper specific
      if (step === 4) return 4; // Seeker specific
      if (step === 5) return 5; // Summary
      return step;
    }
    return step;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Choose your role
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              How do you want to use the platform? You can change this later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {/* Need Help Option */}
              <button
                onClick={() => setSelectedRole('seeker')}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: selectedRole === 'seeker' ? '2px solid var(--teal)' : '2px solid var(--border)',
                  background: selectedRole === 'seeker' ? 'var(--teal-light)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: selectedRole === 'seeker' ? 'var(--teal)' : 'var(--teal-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedRole === 'seeker' ? 'white' : 'var(--teal)'
                  }}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      I Need Help
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Post requests and get help from the community
                    </p>
                  </div>
                </div>
              </button>

              {/* Can Help Option */}
              <button
                onClick={() => setSelectedRole('helper')}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: selectedRole === 'helper' ? '2px solid var(--teal)' : '2px solid var(--border)',
                  background: selectedRole === 'helper' ? 'var(--teal-light)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: selectedRole === 'helper' ? 'var(--teal)' : 'var(--teal-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedRole === 'helper' ? 'white' : 'var(--teal)'
                  }}>
                    <HandHeart size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      I Can Help
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Help others and build your reputation
                    </p>
                  </div>
                </div>
              </button>

              {/* Both Option */}
              <button
                onClick={() => setSelectedRole('both')}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: selectedRole === 'both' ? '2px solid var(--teal)' : '2px solid var(--border)',
                  background: selectedRole === 'both' ? 'var(--teal-light)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: selectedRole === 'both' ? 'var(--teal)' : 'var(--teal-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedRole === 'both' ? 'white' : 'var(--teal)'
                  }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Both
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Give and receive help in the community
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button 
              className="btn-primary"
              onClick={handleNext}
              style={{ width: '100%' }}
            >
              Continue
            </button>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Who are you?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Let's start with the basics. This helps others understand who they're helping.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Location
              </label>
              <input
                type="text"
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or Remote"
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Bio
              </label>
              <textarea
                className="textarea-field"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                rows={4}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-outline"
                onClick={handleBack}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button 
                className="btn-primary"
                onClick={handleNext}
                style={{ flex: 1 }}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 3:
        // Role-specific step 3
        if (selectedRole === 'seeker' || (selectedRole === 'both' && step === 3)) {
          return (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                What help do you need?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Select the categories of help you're looking for.
              </p>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: 'var(--text-muted)'
                }}>
                  HELP CATEGORIES
                </label>
                <div className="suggestion-chips">
                  {helpCategories.map((category) => (
                    <button
                      key={category}
                      className={`suggestion-chip ${helpNeeds.includes(category) ? 'selected' : ''}`}
                      onClick={() => {
                        if (helpNeeds.includes(category)) {
                          removeHelpNeed(category);
                        } else {
                          addHelpNeed(category);
                        }
                      }}
                      style={{
                        background: helpNeeds.includes(category) ? 'var(--teal-light)' : undefined,
                        borderColor: helpNeeds.includes(category) ? 'var(--teal)' : undefined,
                        color: helpNeeds.includes(category) ? 'var(--teal)' : undefined
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: 'var(--text-secondary)'
                }}>
                  Current Challenges
                </label>
                <textarea
                  className="textarea-field"
                  value={currentChallenges}
                  onChange={(e) => setCurrentChallenges(e.target.value)}
                  placeholder="Describe any current challenges you're facing..."
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-outline"
                  onClick={handleBack}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button 
                  className="btn-primary"
                  onClick={selectedRole === 'both' ? handleNext : handleComplete}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : selectedRole === 'both' ? 'Continue' : 'Complete'}
                </button>
              </div>
            </div>
          );
        } else {
          // Can Help flow - Skills
          return (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                Your skills & expertise
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                What can you help others with? Add skills that represent your expertise.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <div className="chip-container">
                  {skills.map((skill) => (
                    <span key={skill} className="chip">
                      {skill}
                      <button 
                        className="chip-remove"
                        onClick={() => removeSkill(skill)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="chip-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(skillInput.trim());
                      }
                    }}
                    placeholder={skills.length === 0 ? "Type skill and press Enter..." : ""}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: 'var(--text-muted)'
                }}>
                  SUGGESTED SKILLS
                </label>
                <div className="suggestion-chips">
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      className={`suggestion-chip ${skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => addSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: 'var(--text-secondary)'
                }}>
                  Availability
                </label>
                <select
                  className="input-field"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  {availabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-outline"
                  onClick={handleBack}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button 
                  className="btn-primary"
                  onClick={selectedRole === 'helper' ? handleComplete : handleNext}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : selectedRole === 'helper' ? 'Complete' : 'Continue'}
                </button>
              </div>
            </div>
          );
        }

      case 4:
        if (selectedRole === 'both') {
          // Both flow - show helper AI suggestions
          return (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                Helper Profile - Skills & Expertise
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                What can you help others with?
              </p>

              <div style={{ marginBottom: '20px' }}>
                <div className="chip-container">
                  {skills.map((skill) => (
                    <span key={skill} className="chip">
                      {skill}
                      <button 
                        className="chip-remove"
                        onClick={() => removeSkill(skill)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="chip-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(skillInput.trim());
                      }
                    }}
                    placeholder={skills.length === 0 ? "Type skill and press Enter..." : ""}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: 'var(--text-muted)'
                }}>
                  SUGGESTED SKILLS
                </label>
                <div className="suggestion-chips">
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      className={`suggestion-chip ${skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => addSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-outline"
                  onClick={handleBack}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleNext}
                  style={{ flex: 1 }}
                >
                  Continue
                </button>
              </div>
            </div>
          );
        } else {
          // Summary for single roles
          return renderSummary();
        }

      case 5:
        // Both flow - seeker needs
        if (selectedRole === 'both') {
          return (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                Seeker Profile - What help do you need?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Select the categories of help you're looking for.
              </p>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: 'var(--text-muted)'
                }}>
                  HELP CATEGORIES
                </label>
                <div className="suggestion-chips">
                  {helpCategories.map((category) => (
                    <button
                      key={category}
                      className={`suggestion-chip ${helpNeeds.includes(category) ? 'selected' : ''}`}
                      onClick={() => {
                        if (helpNeeds.includes(category)) {
                          removeHelpNeed(category);
                        } else {
                          addHelpNeed(category);
                        }
                      }}
                      style={{
                        background: helpNeeds.includes(category) ? 'var(--teal-light)' : undefined,
                        borderColor: helpNeeds.includes(category) ? 'var(--teal)' : undefined,
                        color: helpNeeds.includes(category) ? 'var(--teal)' : undefined
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-outline"
                  onClick={handleBack}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleComplete}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </div>
          );
        }
        return renderSummary();

      default:
        return renderSummary();
    }
  };

  const renderSummary = () => {
    const isSeeker = selectedRole === 'seeker' || selectedRole === 'both';
    const isHelper = selectedRole === 'helper' || selectedRole === 'both';
    
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          All set!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Here's a summary of your profile. You can always update this later.
        </p>

        <div className="white-card" style={{ padding: '28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div className="avatar avatar-teal" style={{ width: '60px', height: '60px', fontSize: '20px' }}>
              {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{name}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{location || 'Remote'}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              ROLE
            </label>
            <span className="badge badge-teal">
              {selectedRole === 'both' ? 'Helper & Seeker' : selectedRole === 'helper' ? 'Helper' : 'Seeker'}
            </span>
          </div>

          {isHelper && skills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                SKILLS
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.map((skill) => (
                  <span key={skill} className="badge badge-teal" style={{ fontSize: '12px' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isSeeker && helpNeeds.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                LOOKING FOR HELP WITH
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {helpNeeds.map((need) => (
                  <span key={need} className="badge badge-tag" style={{ fontSize: '12px' }}>
                    {need}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          className="btn-primary"
          onClick={handleComplete}
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Enter the platform →'}
        </button>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="white-card" style={{ padding: '48px' }}>
            {/* Step Indicator - Dynamic based on role */}
            <div className="step-indicator">
              {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
                <div 
                  key={s}
                  className={`step-dot ${s === getCurrentStepDisplay() ? 'active' : s < getCurrentStepDisplay() ? 'completed' : ''}`}
                />
              ))}
            </div>

            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
