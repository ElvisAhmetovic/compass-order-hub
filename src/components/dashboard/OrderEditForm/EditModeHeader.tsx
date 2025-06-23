
import { Button } from "@/components/ui/button";
import { Save, X, AlertCircle, Edit } from "lucide-react";
import { UserRole } from "@/types";

interface EditModeHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  hasErrors: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  userRole: UserRole;
}

const EditModeHeader = ({ 
  isEditing, 
  isSaving, 
  hasErrors, 
  onEdit, 
  onSave, 
  onCancel, 
  userRole 
}: EditModeHeaderProps) => {
  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium">Order Details</p>
          <p className="text-sm text-muted-foreground">
            View order information and details
          </p>
        </div>
        {(userRole === "admin" || userRole === "agent") && (
          <Button size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>
    );
  }

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
          onClick={onSave} 
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
