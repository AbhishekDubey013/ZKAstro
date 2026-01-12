import { useState, useEffect } from 'react';

interface RotatingPlaceholderProps {
  examples: string[];
  interval?: number;
  className?: string;
}

export function RotatingPlaceholder({ 
  examples, 
  interval = 3000,
  className = '' 
}: RotatingPlaceholderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % examples.length);
    }, interval);

    return () => clearInterval(timer);
  }, [examples.length, interval]);

  return (
    <span className={className}>
      {examples[currentIndex]}
    </span>
  );
}


