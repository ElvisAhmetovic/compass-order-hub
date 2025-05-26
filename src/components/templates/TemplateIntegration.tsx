
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileImage, Settings } from 'lucide-react';

const TemplateIntegration = () => {
  const navigate = useNavigate();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage size={20} />
          Background Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Create professional proposals using background image templates with precisely positioned editable fields.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/templates')} className="flex items-center gap-2">
            <Settings size={16} />
            Manage Templates
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateIntegration;
