
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileImage } from 'lucide-react';
import BackgroundTemplateEditor from '@/components/templates/BackgroundTemplateEditor';
import TemplateSelector from '@/components/templates/TemplateSelector';

interface BackgroundTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  fields: any[];
  width: number;
  height: number;
}

const Templates = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [editingTemplate, setEditingTemplate] = useState<BackgroundTemplate | null>(null);

  const handleSelectTemplate = (template: BackgroundTemplate) => {
    // Here you would typically navigate to create a new proposal with this template
    console.log('Selected template:', template);
  };

  const handleEditTemplate = (template: BackgroundTemplate) => {
    setEditingTemplate(template);
    setActiveTab('editor');
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setActiveTab('editor');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Template Management</h1>
                <p className="text-gray-600">Create and manage proposal templates with background images</p>
              </div>
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
                <PlusCircle size={16} />
                Create New Template
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <FileImage size={16} />
                  Browse Templates
                </TabsTrigger>
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  Template Editor
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TemplateSelector
                      onSelectTemplate={handleSelectTemplate}
                      onEditTemplate={handleEditTemplate}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="editor" className="mt-6">
                <BackgroundTemplateEditor />
              </TabsContent>
            </Tabs>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Templates;
