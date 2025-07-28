
import { Button } from "@/components/ui/button";
import { Save, X, AlertCircle } from "lucide-react";

interface EditModeHeaderProps {
  isSaving: boolean;
  hasErrors: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const EditModeHeader = ({ isSaving, hasErrors, onSave, onCancel }: EditModeHeaderProps) => {
  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">Editing Mode</p>
        <p className="text-sm text-blue-600">
          {hasErrors 
            ? "Please fix the company name before saving" 
            : "Make your changes and click Save to update the order"
          }
        </p>
      </div>
      {hasErrors && (
        <AlertCircle className="h-5 w-5 text-destructive" />
      )}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => {
            console.log('=== SAVE BUTTON CLICKED ===');
            console.log('isSaving:', isSaving);
            console.log('hasErrors:', hasErrors);
            onSave();
          }} 
          disabled={isSaving || hasErrors}
          className="min-w-[80px]"
        >
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditModeHeader;
