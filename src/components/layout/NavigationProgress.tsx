import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";

const NavigationProgress = () => {
  const location = useLocation();
  const isFetching = useIsFetching();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start progress on route change or data fetching
    if (isFetching > 0) {
      setIsVisible(true);
      setProgress(30);
      
      const timer = setTimeout(() => setProgress(60), 100);
      const timer2 = setTimeout(() => setProgress(80), 300);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    } else if (isVisible) {
      // Complete the progress
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isFetching, isVisible]);

  // Also trigger on route changes
  useEffect(() => {
    setIsVisible(true);
    setProgress(30);
    
    const timer1 = setTimeout(() => setProgress(70), 50);
    const timer2 = setTimeout(() => setProgress(100), 150);
    const timer3 = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: progress > 0 ? '0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary))' : 'none'
        }}
      />
    </div>
  );
};

export default NavigationProgress;
