import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const demoUsers = [
  {
    uid: 'ayesha-demo-001',
    email: 'ayesha@demo.com',
    displayName: 'Ayesha Khan',
    location: 'Karachi',
    trustScore: 100,
    skills: ['Figma', 'UI UX', 'HTML CSS', 'Career Guidance'],
    role: 'helper',
    contributions: 15,
    badges: ['Design Pro', 'Mentor'],
    onboardingDone: true
  },
  {
    uid: 'hassan-demo-002',
    email: 'hassan@demo.com',
    displayName: 'Hassan Ali',
    location: 'Lahore',
    trustScore: 88,
    skills: ['JavaScript', 'React', 'Git'],
    role: 'helper',
    contributions: 12,
    badges: ['Code Rescuer', 'Bug Hunter'],
    onboardingDone: true
  },
  {
    uid: 'sara-demo-003',
    email: 'sara@demo.com',
    displayName: 'Sara Noor',
    location: 'Remote',
    trustScore: 74,
    skills: ['Python', 'Data Analysis'],
    role: 'both',
    contributions: 8,
    badges: ['Data Wizard'],
    onboardingDone: true
  }
];

const demoRequests = [
  {
    title: 'Need help making my portfolio responsive before demo day',
    description: 'Before demo day I need to make sure my portfolio works on mobile devices. Currently having issues with CSS grid layouts and responsive images.',
    category: 'Web Development',
    urgency: 'High',
    status: 'solved',
    tags: ['HTML/CSS', 'Responsive', 'Portfolio'],
    authorId: 'sara-demo-003',
    authorName: 'Sara Noor',
    authorLocation: 'Remote',
    helpers: [
      { uid: 'hassan-demo-002', name: 'Hassan Ali', skills: ['JavaScript', 'React', 'Git'], trustScore: 88 }
    ],
    helperCount: 1
  },
  {
    title: 'Looking for Figma feedback on a volunteer event poster',
    description: 'Created a poster for our upcoming coding workshop. Need feedback on typography and color choices before printing. Want to make sure it looks professional and eye-catching.',
    category: 'Design',
    urgency: 'Medium',
    status: 'open',
    tags: ['Figma', 'Poster', 'Design Review'],
    authorId: 'ayesha-demo-001',
    authorName: 'Ayesha Khan',
    authorLocation: 'Karachi',
    helpers: [],
    helperCount: 0
  },
  {
    title: 'Need mock interview support for internship applications',
    description: 'Preparing for frontend developer internship interviews. Looking for someone to do mock technical interviews with me and provide feedback on my answers and approach.',
    category: 'Career',
    urgency: 'Low',
    status: 'solved',
    tags: ['Interview Prep', 'Career', 'Frontend'],
    authorId: 'sara-demo-003',
    authorName: 'Sara Noor',
    authorLocation: 'Remote',
    helpers: [
      { uid: 'hassan-demo-002', name: 'Hassan Ali', skills: ['JavaScript', 'React'], trustScore: 88 },
      { uid: 'ayesha-demo-001', name: 'Ayesha Khan', skills: ['Career Guidance'], trustScore: 100 }
    ],
    helperCount: 2
  },
  {
    title: 'Help understanding React useEffect hooks',
    description: 'Struggling with useEffect dependency arrays and cleanup functions. Need someone to walk me through best practices and common patterns.',
    category: 'Web Development',
    urgency: 'Medium',
    status: 'open',
    tags: ['React', 'JavaScript', 'Hooks'],
    authorId: 'hassan-demo-002',
    authorName: 'Hassan Ali',
    authorLocation: 'Lahore',
    helpers: [],
    helperCount: 0
  }
];

export const seedDatabase = async () => {
  try {
    // Check if requests collection already has data
    const requestsSnapshot = await getDocs(collection(db, 'requests'));
    if (requestsSnapshot.size > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    console.log('Seeding database with demo data...');

    // Add demo users
    for (const user of demoUsers) {
      await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('Added demo users');

    // Add demo requests
    for (const request of demoRequests) {
      await addDoc(collection(db, 'requests'), {
        ...request,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('Added demo requests');

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};
