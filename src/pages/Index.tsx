
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          Order Flow Compass
        </h1>
        <p className="text-xl text-muted-foreground">
          Your all-in-one solution for order management and workflow tracking
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" className="text-base">
            <Link to="/login">
              Sign In
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link to="/register">
              Create Account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
