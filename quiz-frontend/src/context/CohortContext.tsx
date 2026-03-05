import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';

export interface Topic {
  _id: string; 
  title: string;
  description: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  solvedQuestions: number;
  subTopics: string[];
}

interface CohortContextType {
  activeCohort: string;
  setActiveCohort: (cohort: string) => void;
  cohortData: Record<string, Topic[]>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const CohortContext = createContext<CohortContextType | undefined>(undefined);

export const CohortProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCohort, setActiveCohort] = useState('');
  const [cohortData, setCohortData] = useState<Record<string, Topic[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useUser();
  const refreshData = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:5000/api/quiz/dashboard/${user._id}`);
      const result = await response.json();
      
      if (result.success) {
        setCohortData(result.data);
        
        const availableCohorts = Object.keys(result.data);
        if (availableCohorts.length > 0 && !activeCohort) {
          setActiveCohort(availableCohorts[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch cohorts from backend:", error);
    }
  }, [user, activeCohort]);
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    refreshData().finally(() => setIsLoading(false));
  }, [user, refreshData]);

  return (
    <CohortContext.Provider value={{ activeCohort, setActiveCohort, cohortData, isLoading, refreshData }}>
      {children}
    </CohortContext.Provider>
  );
};

export const useCohort = () => {
  const context = useContext(CohortContext);
  if (context === undefined) {
    throw new Error('useCohort must be used within a CohortProvider');
  }
  return context;
};