
import { supabase } from '@/integrations/supabase/client';
import { FontSettings } from '@/components/templates/FontSelector';

export interface TemplateField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'calculated';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultValue?: string;
  calculation?: string;
  required: boolean;
  fontSettings: FontSettings;
}

export interface BackgroundTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  fields: TemplateField[];
  width: number;
  height: number;
  globalFontSettings: FontSettings;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const templateService = {
  async saveTemplate(template: BackgroundTemplate): Promise<{ data: BackgroundTemplate | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Save or update the main template
      const templateData = {
        id: template.id || undefined,
        user_id: user.id,
        name: template.name,
        background_image: template.backgroundImage,
        width: template.width,
        height: template.height,
        global_font_settings: template.globalFontSettings,
      };

      let savedTemplate;
      if (template.id && template.id !== '') {
        // Update existing template
        const { data, error } = await supabase
          .from('background_templates')
          .update(templateData)
          .eq('id', template.id)
          .select()
          .single();
        
        if (error) throw error;
        savedTemplate = data;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('background_templates')
          .insert(templateData)
          .select()
          .single();
        
        if (error) throw error;
        savedTemplate = data;
      }

      // Delete existing fields for this template
      if (template.id) {
        await supabase
          .from('template_fields')
          .delete()
          .eq('template_id', savedTemplate.id);
      }

      // Save all fields
      if (template.fields.length > 0) {
        const fieldsData = template.fields.map(field => ({
          template_id: savedTemplate.id,
          field_type: field.type,
          label: field.label,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          default_value: field.defaultValue,
          calculation: field.calculation,
          required: field.required,
          font_settings: field.fontSettings,
        }));

        const { error: fieldsError } = await supabase
          .from('template_fields')
          .insert(fieldsData);

        if (fieldsError) throw fieldsError;
      }

      // Return the complete template with fields
      return { data: await this.getTemplate(savedTemplate.id), error: null };
    } catch (error) {
      console.error('Error saving template:', error);
      return { data: null, error: error.message };
    }
  },

  async getTemplate(templateId: string): Promise<BackgroundTemplate | null> {
    try {
      const { data: template, error: templateError } = await supabase
        .from('background_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const { data: fields, error: fieldsError } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at');

      if (fieldsError) throw fieldsError;

      const templateFields: TemplateField[] = fields.map(field => ({
        id: field.id,
        type: field.field_type as TemplateField['type'],
        label: field.label,
        x: Number(field.x),
        y: Number(field.y),
        width: Number(field.width),
        height: Number(field.height),
        defaultValue: field.default_value,
        calculation: field.calculation,
        required: field.required,
        fontSettings: field.font_settings as FontSettings,
      }));

      return {
        id: template.id,
        name: template.name,
        backgroundImage: template.background_image,
        width: template.width,
        height: template.height,
        globalFontSettings: template.global_font_settings as FontSettings,
        fields: templateFields,
        userId: template.user_id,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      };
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  },

  async getUserTemplates(): Promise<BackgroundTemplate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: templates, error } = await supabase
        .from('background_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get templates with their fields
      const templatesWithFields = await Promise.all(
        templates.map(async (template) => {
          const { data: fields } = await supabase
            .from('template_fields')
            .select('*')
            .eq('template_id', template.id)
            .order('created_at');

          const templateFields: TemplateField[] = (fields || []).map(field => ({
            id: field.id,
            type: field.field_type as TemplateField['type'],
            label: field.label,
            x: Number(field.x),
            y: Number(field.y),
            width: Number(field.width),
            height: Number(field.height),
            defaultValue: field.default_value,
            calculation: field.calculation,
            required: field.required,
            fontSettings: field.font_settings as FontSettings,
          }));

          return {
            id: template.id,
            name: template.name,
            backgroundImage: template.background_image,
            width: template.width,
            height: template.height,
            globalFontSettings: template.global_font_settings as FontSettings,
            fields: templateFields,
            userId: template.user_id,
            createdAt: template.created_at,
            updatedAt: template.updated_at,
          };
        })
      );

      return templatesWithFields;
    } catch (error) {
      console.error('Error getting user templates:', error);
      return [];
    }
  },

  async deleteTemplate(templateId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('background_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: error.message };
    }
  },
};
