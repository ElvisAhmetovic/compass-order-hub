
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Heart, Star, Zap, Coffee, Award, Smile } from "lucide-react";

const ENCOURAGEMENT_MESSAGES = [
  {
    message: "Keep crushing it, team! 🚀 Your hard work is making a difference!",
    icon: <Zap className="h-4 w-4" />,
    color: "text-blue-600"
  },
  {
    message: "Stay positive and keep pushing forward! ✨ You've got this!",
    icon: <Star className="h-4 w-4" />,
    color: "text-yellow-600"
  },
  {
    message: "Take a deep breath and remember: you're doing amazing! 💪",
    icon: <Heart className="h-4 w-4" />,
    color: "text-red-500"
  },
  {
    message: "Coffee break reminder: recharge and come back stronger! ☕",
    icon: <Coffee className="h-4 w-4" />,
    color: "text-orange-600"
  },
  {
    message: "Every order completed is a victory! Celebrate the small wins! 🎉",
    icon: <Award className="h-4 w-4" />,
    color: "text-purple-600"
  },
  {
    message: "Stay chill, stay focused, and let's make today awesome! 😎",
    icon: <Smile className="h-4 w-4" />,
    color: "text-green-600"
  },
  {
    message: "Teamwork makes the dream work! Together we're unstoppable! 🤝",
    icon: <Heart className="h-4 w-4" />,
    color: "text-pink-600"
  },
  {
    message: "Progress over perfection! Every step forward counts! 📈",
    icon: <Star className="h-4 w-4" />,
    color: "text-indigo-600"
  },
  {
    message: "Remember: you're building something amazing, one order at a time! 🏗️",
    icon: <Zap className="h-4 w-4" />,
    color: "text-cyan-600"
  },
  {
    message: "Keep calm and carry on! You're handling everything like pros! 🧘‍♀️",
    icon: <Smile className="h-4 w-4" />,
    color: "text-teal-600"
  }
];

const TeamEncouragement: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => 
          prev === ENCOURAGEMENT_MESSAGES.length - 1 ? 0 : prev + 1
        );
        setIsVisible(true);
      }, 300);
    }, 12000); // Change message every 12 seconds

    return () => clearInterval(interval);
  }, []);

  const currentMessage = ENCOURAGEMENT_MESSAGES[currentMessageIndex];

  return (
    <Card className={`p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-70'}`}>
      <div className="flex items-center gap-3">
        <div className={`${currentMessage.color} flex-shrink-0`}>
          {currentMessage.icon}
        </div>
        <p className="text-sm font-medium text-gray-700 flex-1">
          {currentMessage.message}
        </p>
        <div className="flex gap-1">
          {ENCOURAGEMENT_MESSAGES.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentMessageIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TeamEncouragement;
